package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/cloudshop/payment-service/config"
	"github.com/cloudshop/payment-service/models"
	"github.com/cloudshop/payment-service/repository"
)

// RefundService handles payment refunds
type RefundService struct {
	config        *config.Config
	paymentRepo   *repository.PaymentRepository
	auditRepo     *repository.AuditRepository
	stripeService *StripeService
	paypalService *PayPalService
	logger        *zap.Logger
}

// NewRefundService creates a new refund service
func NewRefundService(
	cfg *config.Config,
	paymentRepo *repository.PaymentRepository,
	auditRepo *repository.AuditRepository,
	stripeService *StripeService,
	paypalService *PayPalService,
	logger *zap.Logger,
) *RefundService {
	return &RefundService{
		config:        cfg,
		paymentRepo:   paymentRepo,
		auditRepo:     auditRepo,
		stripeService: stripeService,
		paypalService: paypalService,
		logger:        logger,
	}
}

// ProcessRefund processes a payment refund
func (s *RefundService) ProcessRefund(
	ctx context.Context,
	paymentID uuid.UUID,
	req *models.RefundPaymentRequest,
	actorID, actorType string,
	ipAddress, userAgent *string,
) error {
	if !s.config.EnableRefunds {
		return fmt.Errorf("refunds are disabled")
	}

	// Get payment
	payment, err := s.paymentRepo.GetByID(ctx, paymentID)
	if err != nil {
		if err == repository.ErrPaymentNotFound {
			return ErrPaymentNotFound
		}
		return err
	}

	// Check if payment can be refunded
	if !payment.CanRefund() {
		return fmt.Errorf("%w: payment with status %s cannot be refunded", ErrInvalidStatus, payment.Status)
	}

	// Process refund based on gateway
	var refundID string
	switch payment.PaymentGateway {
	case models.PaymentGatewayStripe:
		refundID, err = s.stripeService.RefundPayment(ctx, payment, req.Amount)
		if err != nil {
			return fmt.Errorf("Stripe refund failed: %w", err)
		}
	case models.PaymentGatewayPayPal:
		// For PayPal, we need the capture ID which should be in metadata
		captureID := payment.ExternalTransactionID // Assuming this is the capture ID
		if captureID == "" {
			return fmt.Errorf("PayPal capture ID not found")
		}
		refundID, err = s.paypalService.RefundPayment(ctx, payment, captureID, req.Amount)
		if err != nil {
			return fmt.Errorf("PayPal refund failed: %w", err)
		}
	default:
		return fmt.Errorf("unsupported payment gateway for refund: %s", payment.PaymentGateway)
	}

	// Update payment status to refunded
	if err := s.paymentRepo.UpdateStatus(ctx, payment.ID, models.PaymentStatusRefunded, nil); err != nil {
		s.logger.Error("Failed to update payment status to refunded",
			zap.Error(err),
			zap.String("payment_id", payment.ID.String()),
		)
		return err
	}

	// Update metadata with refund information
	metadata := payment.Metadata
	if metadata == nil {
		metadata = make(models.Metadata)
	}
	metadata["refund_id"] = refundID
	metadata["refund_reason"] = req.Reason
	if req.Amount != nil {
		metadata["refund_amount"] = *req.Amount
	} else {
		metadata["refund_amount"] = payment.Amount // Full refund
	}

	if err := s.paymentRepo.UpdateMetadata(ctx, payment.ID, metadata); err != nil {
		s.logger.Error("Failed to update payment metadata with refund info", zap.Error(err))
	}

	// Log audit entry
	s.logAudit(ctx, payment.ID, models.AuditActionPaymentRefunded, actorID, actorType,
		fmt.Sprintf("Payment refunded: %s", refundID), ipAddress, userAgent)

	s.logger.Info("Payment refunded successfully",
		zap.String("payment_id", payment.ID.String()),
		zap.String("refund_id", refundID),
	)

	return nil
}

// logAudit logs an audit entry (helper method)
func (s *RefundService) logAudit(ctx context.Context, paymentID uuid.UUID, action, actorID, actorType, details string, ipAddress, userAgent *string) {
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
