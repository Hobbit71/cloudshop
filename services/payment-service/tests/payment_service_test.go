package tests

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"go.uber.org/zap/zaptest"

	"github.com/cloudshop/payment-service/config"
	"github.com/cloudshop/payment-service/models"
	"github.com/cloudshop/payment-service/repository"
	"github.com/cloudshop/payment-service/services"
)

// MockPaymentRepository is a mock implementation of payment repository for testing
type MockPaymentRepository struct {
	payments map[uuid.UUID]*models.Payment
}

func NewMockPaymentRepository() *MockPaymentRepository {
	return &MockPaymentRepository{
		payments: make(map[uuid.UUID]*models.Payment),
	}
}

func (m *MockPaymentRepository) Create(ctx context.Context, payment *models.Payment) error {
	m.payments[payment.ID] = payment
	return nil
}

func (m *MockPaymentRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Payment, error) {
	if payment, exists := m.payments[id]; exists {
		return payment, nil
	}
	return nil, repository.ErrPaymentNotFound
}

func (m *MockPaymentRepository) GetByOrderID(ctx context.Context, orderID uuid.UUID) ([]*models.Payment, error) {
	var payments []*models.Payment
	for _, payment := range m.payments {
		if payment.OrderID == orderID {
			payments = append(payments, payment)
		}
	}
	return payments, nil
}

func (m *MockPaymentRepository) GetByExternalTransactionID(ctx context.Context, gateway models.PaymentGateway, externalID string) (*models.Payment, error) {
	for _, payment := range m.payments {
		if payment.PaymentGateway == gateway && payment.ExternalTransactionID == externalID {
			return payment, nil
		}
	}
	return nil, repository.ErrPaymentNotFound
}

func (m *MockPaymentRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status models.PaymentStatus, failureReason *string) error {
	if payment, exists := m.payments[id]; exists {
		payment.Status = status
		payment.FailureReason = failureReason
		return nil
	}
	return repository.ErrPaymentNotFound
}

func (m *MockPaymentRepository) UpdateExternalTransactionID(ctx context.Context, id uuid.UUID, externalID string) error {
	if payment, exists := m.payments[id]; exists {
		payment.ExternalTransactionID = externalID
		return nil
	}
	return repository.ErrPaymentNotFound
}

func (m *MockPaymentRepository) UpdateMetadata(ctx context.Context, id uuid.UUID, metadata models.Metadata) error {
	if payment, exists := m.payments[id]; exists {
		payment.Metadata = metadata
		return nil
	}
	return repository.ErrPaymentNotFound
}

func (m *MockPaymentRepository) List(ctx context.Context, limit, offset int, status *models.PaymentStatus) ([]*models.Payment, int, error) {
	// Simple implementation for testing
	var payments []*models.Payment
	for _, payment := range m.payments {
		if status == nil || payment.Status == *status {
			payments = append(payments, payment)
		}
	}
	total := len(payments)
	if offset+limit > total {
		return payments[offset:], total, nil
	}
	return payments[offset : offset+limit], total, nil
}

// TestPaymentService_CreatePayment tests payment creation
func TestPaymentService_CreatePayment(t *testing.T) {
	cfg := &config.Config{
		EnableStripe: true,
		EnablePayPal: true,
		EnableAuditLog: false,
	}

	mockRepo := NewMockPaymentRepository()
	mockAuditRepo := &MockAuditRepository{}
	
	logger := zaptest.NewLogger(t)
	stripeService := services.NewStripeService(cfg, logger)
	paypalService := services.NewPayPalService(cfg, logger)
	webhookService := services.NewWebhookService(cfg, mockRepo, mockAuditRepo, stripeService, paypalService, logger)
	refundService := services.NewRefundService(cfg, mockRepo, mockAuditRepo, stripeService, paypalService, logger)

	paymentService := services.NewPaymentService(
		cfg,
		mockRepo,
		mockAuditRepo,
		stripeService,
		paypalService,
		webhookService,
		refundService,
		logger,
	)

	req := &models.CreatePaymentRequest{
		OrderID:        uuid.New(),
		Amount:         "100.00",
		Currency:       "USD",
		PaymentMethod:  models.PaymentMethodCard,
		PaymentGateway: models.PaymentGatewayStripe,
	}

	ctx := context.Background()
	payment, err := paymentService.CreatePayment(ctx, req, "user123", "customer", nil, nil)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if payment == nil {
		t.Fatal("Expected payment to be created")
	}

	if payment.Status != models.PaymentStatusPending {
		t.Errorf("Expected status PENDING, got %s", payment.Status)
	}

	if payment.OrderID != req.OrderID {
		t.Errorf("Expected order ID %s, got %s", req.OrderID, payment.OrderID)
	}
}

// MockAuditRepository is a mock implementation of audit repository for testing
type MockAuditRepository struct {
	logs []*models.AuditLog
}

func (m *MockAuditRepository) Create(ctx context.Context, log *models.AuditLog) error {
	m.logs = append(m.logs, log)
	return nil
}

func (m *MockAuditRepository) GetByPaymentID(ctx context.Context, paymentID uuid.UUID, limit int) ([]*models.AuditLog, error) {
	var logs []*models.AuditLog
	for _, log := range m.logs {
		if log.PaymentID == paymentID {
			logs = append(logs, log)
		}
	}
	return logs, nil
}

