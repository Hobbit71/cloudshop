package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
)

// PaymentStatus represents the status of a payment
type PaymentStatus string

const (
	PaymentStatusPending    PaymentStatus = "PENDING"
	PaymentStatusProcessing PaymentStatus = "PROCESSING"
	PaymentStatusSucceeded  PaymentStatus = "SUCCEEDED"
	PaymentStatusFailed     PaymentStatus = "FAILED"
	PaymentStatusRefunded   PaymentStatus = "REFUNDED"
	PaymentStatusCancelled  PaymentStatus = "CANCELLED"
)

// PaymentMethod represents the method used for payment
type PaymentMethod string

const (
	PaymentMethodCard         PaymentMethod = "CARD"
	PaymentMethodPayPal       PaymentMethod = "PAYPAL"
	PaymentMethodBankTransfer PaymentMethod = "BANK_TRANSFER"
)

// PaymentGateway represents the payment gateway used
type PaymentGateway string

const (
	PaymentGatewayStripe PaymentGateway = "STRIPE"
	PaymentGatewayPayPal PaymentGateway = "PAYPAL"
)

// Payment represents a payment transaction
type Payment struct {
	ID                   uuid.UUID      `json:"id" db:"id"`
	OrderID              uuid.UUID      `json:"order_id" db:"order_id"`
	Amount               string         `json:"amount" db:"amount"` // Using string for decimal precision
	Currency             string         `json:"currency" db:"currency"`
	Status               PaymentStatus  `json:"status" db:"status"`
	PaymentMethod        PaymentMethod  `json:"payment_method" db:"payment_method"`
	PaymentGateway       PaymentGateway `json:"payment_gateway" db:"payment_gateway"`
	ExternalTransactionID string        `json:"external_transaction_id" db:"external_transaction_id"`
	Metadata             Metadata       `json:"metadata,omitempty" db:"metadata"`
	FailureReason        *string        `json:"failure_reason,omitempty" db:"failure_reason"`
	CreatedAt            time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at" db:"updated_at"`
}

// Metadata is a flexible JSON field for storing additional payment data
type Metadata map[string]interface{}

// Value implements the driver.Valuer interface
func (m Metadata) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	return json.Marshal(m)
}

// Scan implements the sql.Scanner interface
func (m *Metadata) Scan(value interface{}) error {
	if value == nil {
		*m = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(bytes, m)
}

// IsTerminal returns true if the payment status is terminal (cannot change)
func (s PaymentStatus) IsTerminal() bool {
	return s == PaymentStatusSucceeded || s == PaymentStatusFailed || s == PaymentStatusCancelled
}

// CanRefund returns true if the payment can be refunded
func (p *Payment) CanRefund() bool {
	return p.Status == PaymentStatusSucceeded
}

// CanRetry returns true if the payment can be retried
func (p *Payment) CanRetry() bool {
	return p.Status == PaymentStatusFailed
}

// CreatePaymentRequest represents a request to create a payment
type CreatePaymentRequest struct {
	OrderID       uuid.UUID      `json:"order_id" binding:"required"`
	Amount        string         `json:"amount" binding:"required"`
	Currency      string         `json:"currency" binding:"required,oneof=USD EUR GBP CAD AUD"`
	PaymentMethod PaymentMethod  `json:"payment_method" binding:"required,oneof=CARD PAYPAL BANK_TRANSFER"`
	PaymentGateway PaymentGateway `json:"payment_gateway" binding:"required,oneof=STRIPE PAYPAL"`
	Metadata      Metadata       `json:"metadata,omitempty"`
}

// RefundPaymentRequest represents a request to refund a payment
type RefundPaymentRequest struct {
	Amount   *string `json:"amount,omitempty"` // If nil, refund full amount
	Reason   *string `json:"reason,omitempty"`
	Metadata Metadata `json:"metadata,omitempty"`
}

// CapturePaymentRequest represents a request to capture a pre-authorized payment
type CapturePaymentRequest struct {
	Amount *string `json:"amount,omitempty"` // If nil, capture full amount
	Metadata Metadata `json:"metadata,omitempty"`
}

// PaymentResponse represents a payment API response
type PaymentResponse struct {
	Payment *Payment `json:"payment"`
}

// PaymentsResponse represents a list of payments API response
type PaymentsResponse struct {
	Payments []*Payment `json:"payments"`
	Total    int        `json:"total"`
}

// WebhookRequest represents a payment gateway webhook payload
type WebhookRequest struct {
	ID       string                 `json:"id"`
	Type     string                 `json:"type"`
	Data     map[string]interface{} `json:"data"`
	Gateway  PaymentGateway         `json:"gateway"`
	Signature string                `json:"signature,omitempty"`
}

