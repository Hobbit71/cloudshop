package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/cloudshop/payment-service/models"
	"github.com/cloudshop/payment-service/services"
)

// WebhookHandler handles webhook-related HTTP requests
type WebhookHandler struct {
	paymentService *services.PaymentService
	logger         *zap.Logger
}

// NewWebhookHandler creates a new webhook handler
func NewWebhookHandler(paymentService *services.PaymentService, logger *zap.Logger) *WebhookHandler {
	return &WebhookHandler{
		paymentService: paymentService,
		logger:         logger,
	}
}

// ProcessWebhook handles POST /api/v1/payments/webhook
func (h *WebhookHandler) ProcessWebhook(c *gin.Context) {
	// Determine gateway from query parameter or header
	gatewayStr := c.Query("gateway")
	if gatewayStr == "" {
		gatewayStr = c.GetHeader("X-Payment-Gateway")
	}

	var gateway models.PaymentGateway
	switch gatewayStr {
	case "stripe", "STRIPE":
		gateway = models.PaymentGatewayStripe
	case "paypal", "PAYPAL":
		gateway = models.PaymentGatewayPayPal
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing payment gateway"})
		return
	}

	// Read request body
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		h.logger.Error("Failed to read webhook body", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	// Get signature for verification
	signature := c.GetHeader("Stripe-Signature")
	if signature == "" {
		signature = c.GetHeader("Paypal-Signature")
	}

	// Parse webhook data
	var webhookData map[string]interface{}
	if err := c.ShouldBindJSON(&webhookData); err != nil {
		// Try to parse as raw JSON
		if err := json.Unmarshal(body, &webhookData); err != nil {
			h.logger.Error("Failed to parse webhook data", zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook data"})
			return
		}
	}

	// Extract event type
	eventType := ""
	if et, ok := webhookData["type"].(string); ok {
		eventType = et
	} else if et, ok := webhookData["event_type"].(string); ok {
		eventType = et
	}

	webhookReq := &models.WebhookRequest{
		ID:        c.GetHeader("X-Request-ID"),
		Type:      eventType,
		Data:      webhookData,
		Gateway:   gateway,
		Signature: signature,
	}

	if webhookReq.ID == "" {
		// Generate an ID if not provided
		webhookReq.ID = generateWebhookID()
	}

	err = h.paymentService.ProcessWebhook(c.Request.Context(), webhookReq)
	if err != nil {
		h.logger.Error("Failed to process webhook", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process webhook"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Webhook processed successfully"})
}

// Helper function to generate webhook ID (placeholder)
func generateWebhookID() string {
	// In production, use UUID
	return "webhook_" + fmt.Sprintf("%d", time.Now().UnixNano())
}

