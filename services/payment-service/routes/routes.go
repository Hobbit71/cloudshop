package routes

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/cloudshop/payment-service/config"
	"github.com/cloudshop/payment-service/handlers"
	"github.com/cloudshop/payment-service/middleware"
	"github.com/cloudshop/payment-service/services"
)

// SetupRoutes configures all API routes
func SetupRoutes(
	router *gin.Engine,
	cfg *config.Config,
	db *config.Database,
	paymentService *services.PaymentService,
	healthHandler *handlers.HealthHandler,
	paymentHandler *handlers.PaymentHandler,
	webhookHandler *handlers.WebhookHandler,
	rateLimiter *middleware.RateLimiter,
	logger *zap.Logger,
) {
	// Global middleware
	router.Use(middleware.LoggerMiddleware(logger))
	router.Use(middleware.RecoveryMiddleware(logger))
	router.Use(middleware.ErrorMiddleware(logger))
	router.Use(middleware.CORSMiddleware(cfg.CORSOrigins))

	// Apply rate limiting if enabled
	if cfg.RateLimitEnabled {
		router.Use(middleware.RateLimitMiddleware(rateLimiter))
	}

	// Health check endpoint (no auth required)
	router.GET("/health", healthHandler.HealthCheck)

	// API routes
	v1 := router.Group(cfg.APIPrefix)
	{
		// Apply authentication to all payment endpoints except webhooks
		paymentRoutes := v1.Group("/payments")
		{
			paymentRoutes.Use(middleware.AuthMiddleware(cfg, logger))
			
			paymentRoutes.POST("", paymentHandler.CreatePayment)
			paymentRoutes.GET("/:id", paymentHandler.GetPayment)
			paymentRoutes.POST("/:id/refund", paymentHandler.RefundPayment)
			paymentRoutes.POST("/:id/capture", paymentHandler.CapturePayment)
			paymentRoutes.GET("/order/:order_id", paymentHandler.GetPaymentsByOrderID)
		}

		// Webhook endpoint (no auth required, uses signature verification)
		v1.POST("/payments/webhook", webhookHandler.ProcessWebhook)
	}
}

