package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"github.com/cloudshop/payment-service/models"
)

// AuditRepository handles audit log database operations
type AuditRepository struct {
	db  *pgxpool.Pool
	log *zap.Logger
}

// NewAuditRepository creates a new audit repository
func NewAuditRepository(db *pgxpool.Pool, logger *zap.Logger) *AuditRepository {
	return &AuditRepository{
		db:  db,
		log: logger,
	}
}

// Create creates a new audit log entry
func (r *AuditRepository) Create(ctx context.Context, log *models.AuditLog) error {
	query := `
		INSERT INTO audit_logs (
			id, payment_id, action, actor_id, actor_type, details,
			ip_address, user_agent, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at
	`

	log.CreatedAt = time.Now()

	err := r.db.QueryRow(ctx, query,
		log.ID,
		log.PaymentID,
		log.Action,
		log.ActorID,
		log.ActorType,
		log.Details,
		log.IPAddress,
		log.UserAgent,
		log.CreatedAt,
	).Scan(&log.ID, &log.CreatedAt)

	if err != nil {
		r.log.Error("Failed to create audit log", zap.Error(err))
		return fmt.Errorf("failed to create audit log: %w", err)
	}

	return nil
}

// GetByPaymentID retrieves audit logs for a payment
func (r *AuditRepository) GetByPaymentID(ctx context.Context, paymentID uuid.UUID, limit int) ([]*models.AuditLog, error) {
	query := `
		SELECT id, payment_id, action, actor_id, actor_type, details,
		       ip_address, user_agent, created_at
		FROM audit_logs
		WHERE payment_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`

	rows, err := r.db.Query(ctx, query, paymentID, limit)
	if err != nil {
		r.log.Error("Failed to get audit logs by payment ID",
			zap.Error(err),
			zap.String("payment_id", paymentID.String()),
		)
		return nil, fmt.Errorf("failed to get audit logs: %w", err)
	}
	defer rows.Close()

	logs := make([]*models.AuditLog, 0)
	for rows.Next() {
		log := &models.AuditLog{}
		err := rows.Scan(
			&log.ID,
			&log.PaymentID,
			&log.Action,
			&log.ActorID,
			&log.ActorType,
			&log.Details,
			&log.IPAddress,
			&log.UserAgent,
			&log.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan audit log: %w", err)
		}
		logs = append(logs, log)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating audit logs: %w", err)
	}

	return logs, nil
}

