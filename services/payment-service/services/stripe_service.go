package services

import (
	"context"
	"fmt"

	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/paymentintent"
	"go.uber.org/zap"

	"github.com/cloudshop/payment-service/config"
	"github.com/cloudshop/payment-service/models"
	"github.com/cloudshop/payment-service/utils"
)

// StripeService handles Stripe payment gateway integration
type StripeService struct {
	config *config.Config
	logger *zap.Logger
}

// NewStripeService creates a new Stripe service
func NewStripeService(cfg *config.Config, logger *zap.Logger) *StripeService {
	if cfg.StripeSecretKey != "" {
		stripe.Key = cfg.StripeSecretKey
	}
	return &StripeService{
		config: cfg,
		logger: logger,
	}
}

// ProcessPayment processes a payment through Stripe
func (s *StripeService) ProcessPayment(ctx context.Context, payment *models.Payment) (string, error) {
	if s.config.StripeSecretKey == "" {
		return "", fmt.Errorf("Stripe secret key not configured")
	}

	// Parse amount (Stripe uses cents)
	amountFloat, err := utils.ParseAmount(payment.Amount)
	if err != nil {
		return "", fmt.Errorf("invalid amount: %w", err)
	}

	amountCents := int64(amountFloat * 100)

	// Create payment intent
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(amountCents),
		Currency: stripe.String(payment.Currency),
		Metadata: map[string]string{
			"order_id":  payment.OrderID.String(),
			"payment_id": payment.ID.String(),
		},
	}

	// Add payment method if available in metadata
	if paymentMethodID, ok := payment.Metadata["payment_method_id"].(string); ok {
		params.SetPaymentMethod(paymentMethodID)
		params.SetConfirmationMethod(stripe.String(string(stripe.PaymentIntentConfirmationMethodAutomatic)))
		params.SetConfirm(stripe.Bool(true))
	}

	intent, err := paymentintent.New(params)
	if err != nil {
		s.logger.Error("Stripe payment intent creation failed",
			zap.Error(err),
			zap.String("payment_id", payment.ID.String()),
		)
		return "", fmt.Errorf("stripe payment failed: %w", err)
	}

	// Check payment intent status
	if intent.Status == stripe.PaymentIntentStatusSucceeded {
		return intent.ID, nil
	}

	if intent.Status == stripe.PaymentIntentStatusRequiresPaymentMethod ||
		intent.Status == stripe.PaymentIntentStatusRequiresConfirmation {
		// Payment requires additional action (3D Secure, etc.)
		// In a real implementation, you'd return the client secret for frontend confirmation
		return intent.ID, fmt.Errorf("payment requires additional authentication")
	}

	return intent.ID, fmt.Errorf("payment status: %s", intent.Status)
}

// VerifyWebhookSignature verifies Stripe webhook signature
func (s *StripeService) VerifyWebhookSignature(payload []byte, signature string) (bool, *stripe.Event) {
	if s.config.StripeWebhookSecret == "" {
		s.logger.Warn("Stripe webhook secret not configured, skipping signature verification")
		return true, nil // In development, allow without verification
	}

	event, err := stripe.ConstructEvent(payload, signature, s.config.StripeWebhookSecret)
	if err != nil {
		s.logger.Error("Stripe webhook signature verification failed", zap.Error(err))
		return false, nil
	}

	return true, &event
}

// ProcessWebhookEvent processes a Stripe webhook event
func (s *StripeService) ProcessWebhookEvent(event *stripe.Event) (string, *models.PaymentStatus, error) {
	switch event.Type {
	case "payment_intent.succeeded":
		if paymentIntent, ok := event.Data.Object.(*stripe.PaymentIntent); ok {
			status := models.PaymentStatusSucceeded
			return paymentIntent.ID, &status, nil
		}
	case "payment_intent.payment_failed":
		if paymentIntent, ok := event.Data.Object.(*stripe.PaymentIntent); ok {
			status := models.PaymentStatusFailed
			return paymentIntent.ID, &status, fmt.Errorf("payment failed: %s", paymentIntent.LastPaymentError.Message)
		}
	case "charge.refunded":
		if charge, ok := event.Data.Object.(*stripe.Charge); ok {
			if charge.PaymentIntent != nil {
				status := models.PaymentStatusRefunded
				return charge.PaymentIntent.ID, &status, nil
			}
		}
	}

	return "", nil, fmt.Errorf("unhandled event type: %s", event.Type)
}

// RefundPayment processes a refund through Stripe
func (s *StripeService) RefundPayment(ctx context.Context, payment *models.Payment, amount *string) (string, error) {
	if payment.ExternalTransactionID == "" {
		return "", fmt.Errorf("payment does not have external transaction ID")
	}

	// Get payment intent
	intent, err := paymentintent.Get(payment.ExternalTransactionID, nil)
	if err != nil {
		return "", fmt.Errorf("failed to get payment intent: %w", err)
	}

	if intent.Charges == nil || len(intent.Charges.Data) == 0 {
		return "", fmt.Errorf("payment intent has no charges")
	}

	chargeID := intent.Charges.Data[0].ID

	// Create refund params
	refundParams := &stripe.RefundParams{
		Charge: stripe.String(chargeID),
	}

	if amount != nil {
		amountFloat, err := utils.ParseAmount(*amount)
		if err != nil {
			return "", fmt.Errorf("invalid refund amount: %w", err)
		}
		amountCents := int64(amountFloat * 100)
		refundParams.Amount = stripe.Int64(amountCents)
	}

	// Create refund
	refund, err := stripe.RefundNew(refundParams)
	if err != nil {
		s.logger.Error("Stripe refund failed",
			zap.Error(err),
			zap.String("payment_id", payment.ID.String()),
		)
		return "", fmt.Errorf("stripe refund failed: %w", err)
	}

	return refund.ID, nil
}


