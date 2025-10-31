package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/cloudshop/payment-service/config"
)

// HealthHandler handles health check requests
type HealthHandler struct {
	db     *config.Database
	config *config.Config
	logger *zap.Logger
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(db *config.Database, cfg *config.Config, logger *zap.Logger) *HealthHandler {
	return &HealthHandler{
		db:     db,
		config: cfg,
		logger: logger,
	}
}

// HealthCheck handles GET /health
func (h *HealthHandler) HealthCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	status := gin.H{
		"status":    "ok",
		"service":   h.config.AppName,
		"version":   h.config.AppVersion,
		"timestamp": time.Now().UTC(),
	}

	// Check database connection
	if h.db != nil {
		if err := h.db.Health(ctx); err != nil {
			h.logger.Error("Database health check failed", zap.Error(err))
			status["database"] = "unhealthy"
			c.JSON(http.StatusServiceUnavailable, status)
			return
		}
		status["database"] = "healthy"
	}

	c.JSON(http.StatusOK, status)
}
