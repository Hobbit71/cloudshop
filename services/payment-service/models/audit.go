package models

import (
	"time"

	"github.com/google/uuid"
)

// AuditLog represents an audit log entry for compliance
type AuditLog struct {
	ID          uuid.UUID `json:"id" db:"id"`
	PaymentID   uuid.UUID `json:"payment_id" db:"payment_id"`
	Action      string    `json:"action" db:"action"`
	ActorID     *string   `json:"actor_id,omitempty" db:"actor_id"`
	ActorType   *string   `json:"actor_type,omitempty" db:"actor_type"`
	Details     string    `json:"details" db:"details"` // JSON string
	IPAddress   *string   `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent   *string   `json:"user_agent,omitempty" db:"user_agent"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// AuditActions
const (
	AuditActionPaymentCreated    = "PAYMENT_CREATED"
	AuditActionPaymentProcessed  = "PAYMENT_PROCESSED"
	AuditActionPaymentSucceeded  = "PAYMENT_SUCCEEDED"
	AuditActionPaymentFailed     = "PAYMENT_FAILED"
	AuditActionPaymentRefunded   = "PAYMENT_REFUNDED"
	AuditActionPaymentCaptured   = "PAYMENT_CAPTURED"
	AuditActionWebhookReceived   = "WEBHOOK_RECEIVED"
	AuditActionWebhookVerified   = "WEBHOOK_VERIFIED"
	AuditActionWebhookFailed     = "WEBHOOK_FAILED"
)

