package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/cloudshop/payment-service/config"
)

// AuthMiddleware handles JWT authentication
func AuthMiddleware(cfg *config.Config, logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip authentication for health check and webhook endpoints
		path := c.Request.URL.Path
		if path == "/health" || strings.HasPrefix(path, "/api/v1/payments/webhook") {
			c.Next()
			return
		}

		// Extract token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			logger.Warn("Missing authorization header", zap.String("path", path))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization header"})
			c.Abort()
			return
		}

		// Parse Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			logger.Warn("Invalid authorization header format", zap.String("path", path))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		token := parts[1]

		// Verify JWT token
		// In a real implementation, you would:
		// 1. Parse the JWT token
		// 2. Verify the signature using the JWT secret
		// 3. Check expiration
		// 4. Extract user information from claims
		// For now, we'll do a simple validation

		// TODO: Implement proper JWT verification
		// This is a placeholder that checks if token is not empty
		if token == "" {
			logger.Warn("Empty token", zap.String("path", path))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Extract user info from token (placeholder)
		// In production, parse JWT claims to get user ID and role
		userID := extractUserIDFromToken(token) // Placeholder
		userRole := extractUserRoleFromToken(token) // Placeholder

		// Set user info in context
		c.Set("user_id", userID)
		c.Set("user_role", userRole)
		c.Set("token", token)

		c.Next()
	}
}

// extractUserIDFromToken extracts user ID from JWT token (placeholder)
func extractUserIDFromToken(token string) string {
	// TODO: Parse JWT and extract user ID from claims
	// For now, return empty string
	return ""
}

// extractUserRoleFromToken extracts user role from JWT token (placeholder)
func extractUserRoleFromToken(token string) string {
	// TODO: Parse JWT and extract role from claims
	// For now, return empty string
	return ""
}

