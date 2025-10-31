package services

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/cloudshop/payment-service/config"
	"github.com/cloudshop/payment-service/models"
	"github.com/cloudshop/payment-service/repository"
)

var (
	ErrInvalidPaymentAmount = errors.New("invalid payment amount")
	ErrPaymentGatewayError  = errors.New("payment gateway error")
	ErrPaymentNotFound     = errors.New("payment not found")
	ErrInvalidStatus        = errors.New("invalid payment status for operation")
	ErrRetryExceeded        = errors.New("maximum retry attempts exceeded")
)

// PaymentService handles payment business logic
type PaymentService struct {
	config            *config.Config
	paymentRepo       *repository.PaymentRepository
	auditRepo         *repository.AuditRepository
	stripeService     *StripeService
	paypalService     *PayPalService
	webhookService    *WebhookService
	refundService     *RefundService
	logger            *zap.Logger
	paymentMutexes    map[uuid.UUID]*sync.Mutex
	mutexMutex        sync.Mutex // Protects paymentMutexes map
}

// NewPaymentService creates a new payment service
func NewPaymentService(
	cfg *config.Config,
	paymentRepo *repository.PaymentRepository,
	auditRepo *repository.AuditRepository,
	stripeService *StripeService,
	paypalService *PayPalService,
	webhookService *WebhookService,
	refundService *RefundService,
	logger *zap.Logger,
) *PaymentService {
	return &PaymentService{
		config:          cfg,
		paymentRepo:     paymentRepo,
		auditRepo:       auditRepo,
		stripeService:   stripeService,
		paypalService:   paypalService,
		webhookService:  webhookService,
		refundService:   refundService,
		logger:          logger,
		paymentMutexes:  make(map[uuid.UUID]*sync.Mutex),
	}
}

// getPaymentMutex returns a mutex for the given payment ID (for concurrency safety)
func (s *PaymentService) getPaymentMutex(paymentID uuid.UUID) *sync.Mutex {
	s.mutexMutex.Lock()
	defer s.mutexMutex.Unlock()

	if mutex, exists := s.paymentMutexes[paymentID]; exists {
		return mutex
	}

	mutex := &sync.Mutex{}
	s.paymentMutexes[paymentID] = mutex
	return mutex
}

// CreatePayment creates a new payment and processes it
func (s *PaymentService) CreatePayment(ctx context.Context, req *models.CreatePaymentRequest, actorID, actorType string, ipAddress, userAgent *string) (*models.Payment, error) {
	// Validate amount
	if req.Amount == "" {
		return nil, ErrInvalidPaymentAmount
	}

	// Create payment record
	payment := &models.Payment{
		ID:                   uuid.New(),
		OrderID:              req.OrderID,
		Amount:               req.Amount,
		Currency:             req.Currency,
		Status:               models.PaymentStatusPending,
		PaymentMethod:        req.PaymentMethod,
		PaymentGateway:       req.PaymentGateway,
		ExternalTransactionID: "",
		Metadata:             req.Metadata,
	}

	// Validate gateway is enabled
	if req.PaymentGateway == models.PaymentGatewayStripe && !s.config.EnableStripe {
		return nil, fmt.Errorf("Stripe gateway is not enabled")
	}
	if req.PaymentGateway == models.PaymentGatewayPayPal && !s.config.EnablePayPal {
		return nil, fmt.Errorf("PayPal gateway is not enabled")
	}

	// Save payment to database
	if err := s.paymentRepo.Create(ctx, payment); err != nil {
		s.logger.Error("Failed to create payment record", zap.Error(err))
		return nil, fmt.Errorf("failed to create payment: %w", err)
	}

	// Log audit entry
	if s.config.EnableAuditLog {
		s.logAudit(ctx, payment.ID, models.AuditActionPaymentCreated, actorID, actorType, "Payment created", ipAddress, userAgent)
	}

	// Process payment asynchronously (in production, use a job queue)
	go s.processPayment(context.Background(), payment)

	return payment, nil
}

// processPayment processes a payment through the appropriate gateway
func (s *PaymentService) processPayment(ctx context.Context, payment *models.Payment) {
	// Lock this payment to prevent concurrent processing
	mutex := s.getPaymentMutex(payment.ID)
	mutex.Lock()
	defer mutex.Unlock()

	// Re-check status (might have been updated)
	currentPayment, err := s.paymentRepo.GetByID(ctx, payment.ID)
	if err != nil {
		s.logger.Error("Failed to get payment for processing", zap.Error(err))
		return
	}

	if currentPayment.Status != models.PaymentStatusPending {
		s.logger.Info("Payment already processed", zap.String("id", payment.ID.String()))
		return
	}

	// Update status to processing
	if err := s.paymentRepo.UpdateStatus(ctx, payment.ID, models.PaymentStatusProcessing, nil); err != nil {
		s.logger.Error("Failed to update payment status to processing", zap.Error(err))
		return
	}

	// Process based on gateway
	var externalID string
	var processErr error

	switch payment.PaymentGateway {
	case models.PaymentGatewayStripe:
		externalID, processErr = s.stripeService.ProcessPayment(ctx, payment)
	case models.PaymentGatewayPayPal:
		externalID, processErr = s.paypalService.ProcessPayment(ctx, payment)
	default:
		processErr = fmt.Errorf("unsupported payment gateway: %s", payment.PaymentGateway)
	}

	if processErr != nil {
		s.logger.Error("Payment processing failed",
			zap.String("payment_id", payment.ID.String()),
			zap.Error(processErr),
		)

		failureReason := processErr.Error()
		if updateErr := s.paymentRepo.UpdateStatus(ctx, payment.ID, models.PaymentStatusFailed, &failureReason); updateErr != nil {
			s.logger.Error("Failed to update payment status to failed", zap.Error(updateErr))
		}

		s.logAudit(ctx, payment.ID, models.AuditActionPaymentFailed, "", "", fmt.Sprintf("Payment failed: %s", processErr.Error()), nil, nil)
		return
	}

	// Update with external transaction ID
	if externalID != "" {
		if err := s.paymentRepo.UpdateExternalTransactionID(ctx, payment.ID, externalID); err != nil {
			s.logger.Error("Failed to update external transaction ID", zap.Error(err))
		}
	}

	// Update status to succeeded
	if err := s.paymentRepo.UpdateStatus(ctx, payment.ID, models.PaymentStatusSucceeded, nil); err != nil {
		s.logger.Error("Failed to update payment status to succeeded", zap.Error(err))
		return
	}

	s.logAudit(ctx, payment.ID, models.AuditActionPaymentSucceeded, "", "", "Payment succeeded", nil, nil)
}

// GetPayment retrieves a payment by ID
func (s *PaymentService) GetPayment(ctx context.Context, id uuid.UUID) (*models.Payment, error) {
	payment, err := s.paymentRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrPaymentNotFound) {
			return nil, ErrPaymentNotFound
		}
		return nil, err
	}
	return payment, nil
}

// GetPaymentsByOrderID retrieves all payments for an order
func (s *PaymentService) GetPaymentsByOrderID(ctx context.Context, orderID uuid.UUID) ([]*models.Payment, error) {
	payments, err := s.paymentRepo.GetByOrderID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	return payments, nil
}

// RetryPayment retries a failed payment
func (s *PaymentService) RetryPayment(ctx context.Context, paymentID uuid.UUID) error {
	payment, err := s.paymentRepo.GetByID(ctx, paymentID)
	if err != nil {
		if errors.Is(err, repository.ErrPaymentNotFound) {
			return ErrPaymentNotFound
		}
		return err
	}

	if !payment.CanRetry() {
		return fmt.Errorf("%w: cannot retry payment with status %s", ErrInvalidStatus, payment.Status)
	}

	// Reset to pending and reprocess
	if err := s.paymentRepo.UpdateStatus(ctx, paymentID, models.PaymentStatusPending, nil); err != nil {
		return err
	}

	// Process payment
	go s.processPayment(context.Background(), payment)

	return nil
}

// ProcessWebhook handles incoming webhook from payment gateway
func (s *PaymentService) ProcessWebhook(ctx context.Context, req *models.WebhookRequest) error {
	return s.webhookService.ProcessWebhook(ctx, req)
}

// RefundPayment processes a payment refund
func (s *PaymentService) RefundPayment(ctx context.Context, paymentID uuid.UUID, req *models.RefundPaymentRequest, actorID, actorType string, ipAddress, userAgent *string) error {
	return s.refundService.ProcessRefund(ctx, paymentID, req, actorID, actorType, ipAddress, userAgent)
}

// CapturePayment captures a pre-authorized payment
func (s *PaymentService) CapturePayment(ctx context.Context, paymentID uuid.UUID, req *models.CapturePaymentRequest) error {
	mutex := s.getPaymentMutex(paymentID)
	mutex.Lock()
	defer mutex.Unlock()

	payment, err := s.paymentRepo.GetByID(ctx, paymentID)
	if err != nil {
		if errors.Is(err, repository.ErrPaymentNotFound) {
			return ErrPaymentNotFound
		}
		return err
	}

	// For now, we'll handle capture through webhooks
	// This is a placeholder for future implementation
	// In reality, capture depends on the gateway implementation

	return fmt.Errorf("capture not yet implemented for gateway: %s", payment.PaymentGateway)
}

// logAudit logs an audit entry (helper method)
func (s *PaymentService) logAudit(ctx context.Context, paymentID uuid.UUID, action, actorID, actorType, details string, ipAddress, userAgent *string) {
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

