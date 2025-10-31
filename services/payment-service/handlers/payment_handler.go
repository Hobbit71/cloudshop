package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/cloudshop/payment-service/models"
	"github.com/cloudshop/payment-service/services"
)

// PaymentHandler handles payment-related HTTP requests
type PaymentHandler struct {
	paymentService *services.PaymentService
	logger         *zap.Logger
}

// NewPaymentHandler creates a new payment handler
func NewPaymentHandler(paymentService *services.PaymentService, logger *zap.Logger) *PaymentHandler {
	return &PaymentHandler{
		paymentService: paymentService,
		logger:         logger,
	}
}

// CreatePayment handles POST /api/v1/payments
func (h *PaymentHandler) CreatePayment(c *gin.Context) {
	var req models.CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid create payment request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	// Extract user info from context (set by auth middleware)
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	
	actorID := ""
	actorType := ""
	if userID != nil {
		if id, ok := userID.(string); ok {
			actorID = id
		}
	}
	if userRole != nil {
		if role, ok := userRole.(string); ok {
			actorType = role
		}
	}

	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	payment, err := h.paymentService.CreatePayment(
		c.Request.Context(),
		&req,
		actorID,
		actorType,
		&ipAddress,
		&userAgent,
	)
	if err != nil {
		h.logger.Error("Failed to create payment", zap.Error(err))
		
		if err == services.ErrInvalidPaymentAmount {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment"})
		return
	}

	c.JSON(http.StatusCreated, models.PaymentResponse{Payment: payment})
}

// GetPayment handles GET /api/v1/payments/{id}
func (h *PaymentHandler) GetPayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	payment, err := h.paymentService.GetPayment(c.Request.Context(), id)
	if err != nil {
		if err == services.ErrPaymentNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
			return
		}
		
		h.logger.Error("Failed to get payment", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve payment"})
		return
	}

	c.JSON(http.StatusOK, models.PaymentResponse{Payment: payment})
}

// GetPaymentsByOrderID handles GET /api/v1/payments/order/{order_id}
func (h *PaymentHandler) GetPaymentsByOrderID(c *gin.Context) {
	orderIDStr := c.Param("order_id")
	orderID, err := uuid.Parse(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	payments, err := h.paymentService.GetPaymentsByOrderID(c.Request.Context(), orderID)
	if err != nil {
		h.logger.Error("Failed to get payments by order ID", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve payments"})
		return
	}

	c.JSON(http.StatusOK, models.PaymentsResponse{
		Payments: payments,
		Total:    len(payments),
	})
}

// RefundPayment handles POST /api/v1/payments/{id}/refund
func (h *PaymentHandler) RefundPayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	var req models.RefundPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Allow empty body for full refund
		req = models.RefundPaymentRequest{}
	}

	// Extract user info from context
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	
	actorID := ""
	actorType := ""
	if userID != nil {
		if uid, ok := userID.(string); ok {
			actorID = uid
		}
	}
	if userRole != nil {
		if role, ok := userRole.(string); ok {
			actorType = role
		}
	}

	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	err = h.paymentService.RefundPayment(
		c.Request.Context(),
		id,
		&req,
		actorID,
		actorType,
		&ipAddress,
		&userAgent,
	)
	if err != nil {
		h.logger.Error("Failed to refund payment", zap.Error(err))
		
		if err == services.ErrPaymentNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
			return
		}
		
		if err == services.ErrInvalidStatus {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to refund payment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment refunded successfully"})
}

// CapturePayment handles POST /api/v1/payments/{id}/capture
func (h *PaymentHandler) CapturePayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	var req models.CapturePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Allow empty body for full capture
		req = models.CapturePaymentRequest{}
	}

	err = h.paymentService.CapturePayment(c.Request.Context(), id, &req)
	if err != nil {
		h.logger.Error("Failed to capture payment", zap.Error(err))
		
		if err == services.ErrPaymentNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to capture payment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment captured successfully"})
}

