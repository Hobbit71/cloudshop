package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"github.com/cloudshop/payment-service/models"
)

var (
	ErrPaymentNotFound = errors.New("payment not found")
	ErrInvalidStatus   = errors.New("invalid payment status")
)

// PaymentRepository handles payment database operations
type PaymentRepository struct {
	db  *pgxpool.Pool
	log *zap.Logger
}

// NewPaymentRepository creates a new payment repository
func NewPaymentRepository(db *pgxpool.Pool, logger *zap.Logger) *PaymentRepository {
	return &PaymentRepository{
		db:  db,
		log: logger,
	}
}

// Create creates a new payment record
func (r *PaymentRepository) Create(ctx context.Context, payment *models.Payment) error {
	query := `
		INSERT INTO payments (
			id, order_id, amount, currency, status, payment_method,
			payment_gateway, external_transaction_id, metadata, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at, updated_at
	`

	now := time.Now()
	payment.CreatedAt = now
	payment.UpdatedAt = now

	err := r.db.QueryRow(ctx, query,
		payment.ID,
		payment.OrderID,
		payment.Amount,
		payment.Currency,
		payment.Status,
		payment.PaymentMethod,
		payment.PaymentGateway,
		payment.ExternalTransactionID,
		payment.Metadata,
		payment.CreatedAt,
		payment.UpdatedAt,
	).Scan(&payment.ID, &payment.CreatedAt, &payment.UpdatedAt)

	if err != nil {
		r.log.Error("Failed to create payment", zap.Error(err))
		return fmt.Errorf("failed to create payment: %w", err)
	}

	return nil
}

// GetByID retrieves a payment by ID
func (r *PaymentRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Payment, error) {
	query := `
		SELECT id, order_id, amount, currency, status, payment_method,
		       payment_gateway, external_transaction_id, metadata, failure_reason,
		       created_at, updated_at
		FROM payments
		WHERE id = $1
	`

	payment := &models.Payment{}
	var failureReason sql.NullString

	err := r.db.QueryRow(ctx, query, id).Scan(
		&payment.ID,
		&payment.OrderID,
		&payment.Amount,
		&payment.Currency,
		&payment.Status,
		&payment.PaymentMethod,
		&payment.PaymentGateway,
		&payment.ExternalTransactionID,
		&payment.Metadata,
		&failureReason,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPaymentNotFound
		}
		r.log.Error("Failed to get payment by ID", zap.Error(err), zap.String("id", id.String()))
		return nil, fmt.Errorf("failed to get payment: %w", err)
	}

	if failureReason.Valid {
		payment.FailureReason = &failureReason.String
	}

	return payment, nil
}

// GetByOrderID retrieves all payments for an order
func (r *PaymentRepository) GetByOrderID(ctx context.Context, orderID uuid.UUID) ([]*models.Payment, error) {
	query := `
		SELECT id, order_id, amount, currency, status, payment_method,
		       payment_gateway, external_transaction_id, metadata, failure_reason,
		       created_at, updated_at
		FROM payments
		WHERE order_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, orderID)
	if err != nil {
		r.log.Error("Failed to get payments by order ID", zap.Error(err), zap.String("order_id", orderID.String()))
		return nil, fmt.Errorf("failed to get payments: %w", err)
	}
	defer rows.Close()

	payments := make([]*models.Payment, 0)
	for rows.Next() {
		payment := &models.Payment{}
		var failureReason sql.NullString

		err := rows.Scan(
			&payment.ID,
			&payment.OrderID,
			&payment.Amount,
			&payment.Currency,
			&payment.Status,
			&payment.PaymentMethod,
			&payment.PaymentGateway,
			&payment.ExternalTransactionID,
			&payment.Metadata,
			&failureReason,
			&payment.CreatedAt,
			&payment.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan payment: %w", err)
		}

		if failureReason.Valid {
			payment.FailureReason = &failureReason.String
		}

		payments = append(payments, payment)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating payments: %w", err)
	}

	return payments, nil
}

// GetByExternalTransactionID retrieves a payment by external transaction ID
func (r *PaymentRepository) GetByExternalTransactionID(ctx context.Context, gateway models.PaymentGateway, externalID string) (*models.Payment, error) {
	query := `
		SELECT id, order_id, amount, currency, status, payment_method,
		       payment_gateway, external_transaction_id, metadata, failure_reason,
		       created_at, updated_at
		FROM payments
		WHERE payment_gateway = $1 AND external_transaction_id = $2
	`

	payment := &models.Payment{}
	var failureReason sql.NullString

	err := r.db.QueryRow(ctx, query, gateway, externalID).Scan(
		&payment.ID,
		&payment.OrderID,
		&payment.Amount,
		&payment.Currency,
		&payment.Status,
		&payment.PaymentMethod,
		&payment.PaymentGateway,
		&payment.ExternalTransactionID,
		&payment.Metadata,
		&failureReason,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPaymentNotFound
		}
		r.log.Error("Failed to get payment by external transaction ID",
			zap.Error(err),
			zap.String("gateway", string(gateway)),
			zap.String("external_id", externalID),
		)
		return nil, fmt.Errorf("failed to get payment: %w", err)
	}

	if failureReason.Valid {
		payment.FailureReason = &failureReason.String
	}

	return payment, nil
}

// UpdateStatus updates the payment status
func (r *PaymentRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status models.PaymentStatus, failureReason *string) error {
	query := `
		UPDATE payments
		SET status = $1, failure_reason = $2, updated_at = NOW()
		WHERE id = $3
	`

	result, err := r.db.Exec(ctx, query, status, failureReason, id)
	if err != nil {
		r.log.Error("Failed to update payment status", zap.Error(err), zap.String("id", id.String()))
		return fmt.Errorf("failed to update payment status: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrPaymentNotFound
	}

	return nil
}

// UpdateExternalTransactionID updates the external transaction ID
func (r *PaymentRepository) UpdateExternalTransactionID(ctx context.Context, id uuid.UUID, externalID string) error {
	query := `
		UPDATE payments
		SET external_transaction_id = $1, updated_at = NOW()
		WHERE id = $2
	`

	result, err := r.db.Exec(ctx, query, externalID, id)
	if err != nil {
		r.log.Error("Failed to update external transaction ID",
			zap.Error(err),
			zap.String("id", id.String()),
			zap.String("external_id", externalID),
		)
		return fmt.Errorf("failed to update external transaction ID: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrPaymentNotFound
	}

	return nil
}

// UpdateMetadata updates the payment metadata
func (r *PaymentRepository) UpdateMetadata(ctx context.Context, id uuid.UUID, metadata models.Metadata) error {
	query := `
		UPDATE payments
		SET metadata = $1, updated_at = NOW()
		WHERE id = $2
	`

	result, err := r.db.Exec(ctx, query, metadata, id)
	if err != nil {
		r.log.Error("Failed to update payment metadata", zap.Error(err), zap.String("id", id.String()))
		return fmt.Errorf("failed to update payment metadata: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrPaymentNotFound
	}

	return nil
}

// List retrieves payments with pagination
func (r *PaymentRepository) List(ctx context.Context, limit, offset int, status *models.PaymentStatus) ([]*models.Payment, int, error) {
	baseQuery := `
		SELECT id, order_id, amount, currency, status, payment_method,
		       payment_gateway, external_transaction_id, metadata, failure_reason,
		       created_at, updated_at
		FROM payments
	`
	countQuery := `SELECT COUNT(*) FROM payments`

	args := []interface{}{}
	argNum := 1

	if status != nil {
		baseQuery += ` WHERE status = $` + fmt.Sprintf("%d", argNum)
		countQuery += ` WHERE status = $` + fmt.Sprintf("%d", argNum)
		args = append(args, *status)
		argNum++
	}

	baseQuery += ` ORDER BY created_at DESC LIMIT $` + fmt.Sprintf("%d", argNum) + ` OFFSET $` + fmt.Sprintf("%d", argNum+1)
	args = append(args, limit, offset)

	// Get total count
	var total int
	err := r.db.QueryRow(ctx, countQuery, args[:len(args)-2]...).Scan(&total)
	if err != nil {
		r.log.Error("Failed to count payments", zap.Error(err))
		return nil, 0, fmt.Errorf("failed to count payments: %w", err)
	}

	// Get payments
	rows, err := r.db.Query(ctx, baseQuery, args...)
	if err != nil {
		r.log.Error("Failed to list payments", zap.Error(err))
		return nil, 0, fmt.Errorf("failed to list payments: %w", err)
	}
	defer rows.Close()

	payments := make([]*models.Payment, 0)
	for rows.Next() {
		payment := &models.Payment{}
		var failureReason sql.NullString

		err := rows.Scan(
			&payment.ID,
			&payment.OrderID,
			&payment.Amount,
			&payment.Currency,
			&payment.Status,
			&payment.PaymentMethod,
			&payment.PaymentGateway,
			&payment.ExternalTransactionID,
			&payment.Metadata,
			&failureReason,
			&payment.CreatedAt,
			&payment.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan payment: %w", err)
		}

		if failureReason.Valid {
			payment.FailureReason = &failureReason.String
		}

		payments = append(payments, payment)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating payments: %w", err)
	}

	return payments, total, nil
}

