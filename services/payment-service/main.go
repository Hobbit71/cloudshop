package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/cloudshop/payment-service/config"
	"github.com/cloudshop/payment-service/handlers"
	"github.com/cloudshop/payment-service/middleware"
	"github.com/cloudshop/payment-service/repository"
	"github.com/cloudshop/payment-service/routes"
	"github.com/cloudshop/payment-service/services"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to load configuration: %v\n", err)
		os.Exit(1)
	}

	// Initialize logger
	logger := initLogger(cfg)
	defer logger.Sync()

	logger.Info("Starting Payment Service",
		zap.String("version", cfg.AppVersion),
		zap.String("environment", cfg.Env),
	)

	// Set Gin mode
	if cfg.IsDevelopment() {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize database
	db, err := config.NewDatabase(cfg, logger)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// Initialize repositories
	paymentRepo := repository.NewPaymentRepository(db.Pool, logger)
	auditRepo := repository.NewAuditRepository(db.Pool, logger)

	// Initialize services
	stripeService := services.NewStripeService(cfg, logger)
	paypalService := services.NewPayPalService(cfg, logger)
	webhookService := services.NewWebhookService(
		cfg,
		paymentRepo,
		auditRepo,
		stripeService,
		paypalService,
		logger,
	)
	refundService := services.NewRefundService(
		cfg,
		paymentRepo,
		auditRepo,
		stripeService,
		paypalService,
		logger,
	)
	paymentService := services.NewPaymentService(
		cfg,
		paymentRepo,
		auditRepo,
		stripeService,
		paypalService,
		webhookService,
		refundService,
		logger,
	)

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(db, cfg, logger)
	paymentHandler := handlers.NewPaymentHandler(paymentService, logger)
	webhookHandler := handlers.NewWebhookHandler(paymentService, logger)

	// Initialize rate limiter
	rateLimiter := middleware.NewRateLimiter(
		cfg.RateLimitRequests,
		cfg.RateLimitBurst,
		logger,
	)

	// Setup router
	router := gin.New()
	routes.SetupRoutes(
		router,
		cfg,
		db,
		paymentService,
		healthHandler,
		paymentHandler,
		webhookHandler,
		rateLimiter,
		logger,
	)

	// Create HTTP server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		logger.Info("Starting HTTP server", zap.String("port", cfg.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// Wait for interrupt signal for graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("Server forced to shutdown", zap.Error(err))
	} else {
		logger.Info("Server exited gracefully")
	}
}

// initLogger initializes the zap logger based on configuration
func initLogger(cfg *config.Config) *zap.Logger {
	var logLevel zapcore.Level
	switch cfg.LogLevel {
	case "debug":
		logLevel = zapcore.DebugLevel
	case "info":
		logLevel = zapcore.InfoLevel
	case "warn":
		logLevel = zapcore.WarnLevel
	case "error":
		logLevel = zapcore.ErrorLevel
	default:
		logLevel = zapcore.InfoLevel
	}

	config := zap.NewProductionConfig()
	config.Level = zap.NewAtomicLevelAt(logLevel)
	config.EncoderConfig.TimeKey = "timestamp"
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

	if cfg.LogFormat == "console" || cfg.IsDevelopment() {
		config.Encoding = "console"
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	logger, err := config.Build()
	if err != nil {
		panic(fmt.Sprintf("Failed to initialize logger: %v", err))
	}

	return logger
}

