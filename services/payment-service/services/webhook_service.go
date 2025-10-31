package services

import (
	"context"
	"encoding/json"
	"fmt"

	"go.uber.org/zap"

	"github.com/cloudshop/payment-service/config"
	"github.com/cloudshop/payment-service/models"
	"github.com/cloudshop/payment-service/repository"
	"github.com/google/uuid"
)

// WebhookService handles payment gateway webhooks
type WebhookService struct {
	config      *config.Config
	paymentRepo *repository.PaymentRepository
	auditRepo   *repository.AuditRepository
	stripeService *StripeService
	paypalService *PayPalService
	logger      *zap.Logger
}

// NewWebhookService creates a new webhook service
func NewWebhookService(
	cfg *config.Config,
	paymentRepo *repository.PaymentRepository,
	auditRepo *repository.AuditRepository,
	stripeService *StripeService,
	paypalService *PayPalService,
	logger *zap.Logger,
) *WebhookService {
	return &WebhookService{
		config:        cfg,
		paymentRepo:   paymentRepo,
		auditRepo:     auditRepo,
		stripeService: stripeService,
		paypalService: paypalService,
		logger:        logger,
	}
}

// ProcessWebhook processes an incoming webhook from a payment gateway
func (s *WebhookService) ProcessWebhook(ctx context.Context, req *models.WebhookRequest) error {
	if !s.config.EnableWebhooks {
		s.logger.Warn("Webhooks are disabled")
		return fmt.Errorf("webhooks are disabled")
	}

	// Log webhook receipt (we don't have payment ID yet, so skip audit log)
	if s.config.EnableAuditLog {
		s.logger.Info("Webhook received",
			zap.String("webhook_id", req.ID),
			zap.String("type", req.Type),
			zap.String("gateway", string(req.Gateway)),
		)
	}

	// Process based on gateway
	switch req.Gateway {
	case models.PaymentGatewayStripe:
		return s.processStripeWebhook(ctx, req)
	case models.PaymentGatewayPayPal:
		return s.processPayPalWebhook(ctx, req)
	default:
		return fmt.Errorf("unsupported payment gateway: %s", req.Gateway)
	}
}

// processStripeWebhook processes a Stripe webhook
func (s *WebhookService) processStripeWebhook(ctx context.Context, req *models.WebhookRequest) error {
	// Verify webhook signature
	// Convert to JSON for signature verification
	payloadBytes, err := json.Marshal(req.Data)
	if err != nil {
		return fmt.Errorf("failed to marshal webhook data: %w", err)
	}

	valid, event := s.stripeService.VerifyWebhookSignature(payloadBytes, req.Signature)
	if !valid {
		webhookUUID, _ := uuid.Parse(req.ID)
		s.logAudit(ctx, webhookUUID, models.AuditActionWebhookFailed, "", "", "Webhook signature verification failed", nil, nil)
		return fmt.Errorf("webhook signature verification failed")
	}

	webhookUUID, _ := uuid.Parse(req.ID)
	s.logAudit(ctx, webhookUUID, models.AuditActionWebhookVerified, "", "", "Webhook signature verified", nil, nil)

	if event == nil {
		// In development mode, try to process without full event object
		return s.processStripeWebhookData(ctx, req)
	}

	// Process webhook event
	externalID, status, err := s.stripeService.ProcessWebhookEvent(event)
	if err != nil {
		return err
	}

	// Update payment
	if externalID != "" && status != nil {
		payment, err := s.paymentRepo.GetByExternalTransactionID(ctx, models.PaymentGatewayStripe, externalID)
		if err != nil {
			if err == repository.ErrPaymentNotFound {
				s.logger.Warn("Payment not found for webhook",
					zap.String("external_id", externalID),
					zap.String("event_type", req.Type),
				)
				return nil // Not an error if payment doesn't exist
			}
			return err
		}

		var failureReason *string
		failedStatus := models.PaymentStatusFailed
		if status != nil && *status == failedStatus {
			reason := "Payment failed from webhook"
			failureReason = &reason
		}

		statusCopy := *status
		if err := s.paymentRepo.UpdateStatus(ctx, payment.ID, statusCopy, failureReason); err != nil {
			s.logger.Error("Failed to update payment status from webhook",
				zap.Error(err),
				zap.String("payment_id", payment.ID.String()),
			)
			return err
		}

		s.logAudit(ctx, payment.ID, models.AuditActionPaymentProcessed, "", "", fmt.Sprintf("Payment status updated via webhook: %s", string(statusCopy)), nil, nil)
	}

	return nil
}

// processStripeWebhookData processes Stripe webhook data when full event object is not available
func (s *WebhookService) processStripeWebhookData(ctx context.Context, req *models.WebhookRequest) error {
	// Try to extract payment intent ID from data
	var paymentIntentID string
	if data, ok := req.Data["object"].(map[string]interface{}); ok {
		if id, ok := data["id"].(string); ok {
			paymentIntentID = id
		}
	}

	if paymentIntentID == "" {
		return fmt.Errorf("could not extract payment intent ID from webhook")
	}

	// Determine status based on event type
	var status models.PaymentStatus
	switch req.Type {
	case "payment_intent.succeeded":
		status = models.PaymentStatusSucceeded
	case "payment_intent.payment_failed":
		status = models.PaymentStatusFailed
	case "charge.refunded":
		status = models.PaymentStatusRefunded
	default:
		s.logger.Info("Unhandled Stripe webhook event type", zap.String("type", req.Type))
		return nil
	}

	// Update payment
	payment, err := s.paymentRepo.GetByExternalTransactionID(ctx, models.PaymentGatewayStripe, paymentIntentID)
	if err != nil {
		if err == repository.ErrPaymentNotFound {
			s.logger.Warn("Payment not found for webhook", zap.String("external_id", paymentIntentID))
			return nil
		}
		return err
	}

	var failureReason *string
	if status == models.PaymentStatusFailed {
		reason := "Payment failed from webhook"
		failureReason = &reason
	}

	if err := s.paymentRepo.UpdateStatus(ctx, payment.ID, status, failureReason); err != nil {
		return err
	}

	s.logAudit(ctx, payment.ID, models.AuditActionPaymentProcessed, "", "", fmt.Sprintf("Payment status updated via webhook: %s", string(status)), nil, nil)

	return nil
}

// processPayPalWebhook processes a PayPal webhook
func (s *WebhookService) processPayPalWebhook(ctx context.Context, req *models.WebhookRequest) error {
	// Convert to JSON for signature verification
	_, err := json.Marshal(req.Data)
	if err != nil {
		return fmt.Errorf("failed to marshal webhook data: %w", err)
	}

	// PayPal webhook verification requires headers, which we'd need to pass through
	// For now, we'll process the webhook without full verification in development
	// In production, you'd pass the headers from the HTTP request

	// Extract event type and resource
	eventType := req.Type
	if eventType == "" {
		if et, ok := req.Data["event_type"].(string); ok {
			eventType = et
		}
	}

	s.logger.Info("Processing PayPal webhook",
		zap.String("webhook_id", req.ID),
		zap.String("event_type", eventType),
	)

	// Process based on event type
	var orderID string
	var status models.PaymentStatus

	switch eventType {
	case "PAYMENT.CAPTURE.COMPLETED":
		status = models.PaymentStatusSucceeded
		if resource, ok := req.Data["resource"].(map[string]interface{}); ok {
			if id, ok := resource["id"].(string); ok {
				orderID = id
			}
		}
	case "PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.REFUNDED":
		if eventType == "PAYMENT.CAPTURE.REFUNDED" {
			status = models.PaymentStatusRefunded
		} else {
			status = models.PaymentStatusFailed
		}
		if resource, ok := req.Data["resource"].(map[string]interface{}); ok {
			if id, ok := resource["id"].(string); ok {
				orderID = id
			}
		}
	default:
		s.logger.Info("Unhandled PayPal webhook event type", zap.String("type", eventType))
		return nil
	}

	if orderID == "" {
		return fmt.Errorf("could not extract order ID from PayPal webhook")
	}

	// Update payment
	payment, err := s.paymentRepo.GetByExternalTransactionID(ctx, models.PaymentGatewayPayPal, orderID)
	if err != nil {
		if err == repository.ErrPaymentNotFound {
			s.logger.Warn("Payment not found for PayPal webhook", zap.String("external_id", orderID))
			return nil
		}
		return err
	}

	var failureReason *string
	if status == models.PaymentStatusFailed {
		reason := "Payment failed from PayPal webhook"
		failureReason = &reason
	}

	if err := s.paymentRepo.UpdateStatus(ctx, payment.ID, status, failureReason); err != nil {
		return err
	}

	s.logAudit(ctx, payment.ID, models.AuditActionPaymentProcessed, "", "", fmt.Sprintf("Payment status updated via PayPal webhook: %s", string(status)), nil, nil)

	return nil
}

// logAudit logs an audit entry (helper method)
func (s *WebhookService) logAudit(ctx context.Context, paymentID uuid.UUID, action, actorID, actorType, details string, ipAddress, userAgent *string) {
	if !s.config.EnableAuditLog {
		return
	}

	auditLog := &models.AuditLog{
		ID:        uuid.New(),
		PaymentID: paymentID,
		Action:    action,
		ActorID:   &actorID,
		ActorType: &actorType,
		Details:   details,
		IPAddress: ipAddress,
		UserAgent: userAgent,
	}

	if err := s.auditRepo.Create(ctx, auditLog); err != nil {
		s.logger.Error("Failed to create audit log", zap.Error(err))
	}
}

