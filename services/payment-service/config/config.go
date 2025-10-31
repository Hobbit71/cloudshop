package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	// Application
	AppName    string
	AppVersion string
	Port       string
	Env        string
	Debug      bool

	// Database
	DatabaseURL     string
	MaxPoolSize     int
	MinPoolSize     int
	MaxConnLifetime time.Duration
	MaxConnIdleTime time.Duration

	// API
	APIPrefix string

	// Auth
	JWTSecret        string
	AuthServiceURL   string
	JWTTokenExpiry   time.Duration
	JWTRefreshExpiry time.Duration

	// Payment Gateways
	StripeSecretKey      string
	StripeWebhookSecret  string
	PayPalClientID       string
	PayPalClientSecret   string
	PayPalWebhookID      string
	PayPalBaseURL        string
	PayPalMode           string // sandbox or live

	// CORS
	CORSOrigins []string

	// Rate Limiting
	RateLimitEnabled    bool
	RateLimitRequests   int
	RateLimitWindow     time.Duration
	RateLimitBurst      int

	// Retry Configuration
	PaymentRetryMaxAttempts int
	PaymentRetryBackoff     time.Duration

	// Feature Flags
	EnableStripe    bool
	EnablePayPal    bool
	EnableRefunds   bool
	EnableWebhooks  bool
	EnableAuditLog  bool

	// Logging
	LogLevel  string
	LogFormat string

	// Graceful Shutdown
	ShutdownTimeout time.Duration
}

// Load reads configuration from environment variables
func Load() (*Config, error) {
	// Try to load .env file (ignore error if it doesn't exist)
	_ = godotenv.Load()

	cfg := &Config{
		AppName:    getEnv("APP_NAME", "Payment Service"),
		AppVersion: getEnv("APP_VERSION", "1.0.0"),
		Port:       getEnv("PORT", "8081"),
		Env:        getEnv("ENV", "development"),
		Debug:      getEnvAsBool("DEBUG", false),

		DatabaseURL:     getEnv("DATABASE_URL", "postgres://cloudshop:cloudshop@localhost:5432/cloudshop_payments?sslmode=disable"),
		MaxPoolSize:     getEnvAsInt("DB_MAX_POOL_SIZE", 25),
		MinPoolSize:     getEnvAsInt("DB_MIN_POOL_SIZE", 5),
		MaxConnLifetime: getEnvAsDuration("DB_MAX_CONN_LIFETIME", 5*time.Minute),
		MaxConnIdleTime: getEnvAsDuration("DB_MAX_CONN_IDLE_TIME", 1*time.Minute),

		APIPrefix: getEnv("API_PREFIX", "/api/v1"),

		JWTSecret:        getEnv("JWT_SECRET", ""),
		AuthServiceURL:   getEnv("AUTH_SERVICE_URL", "http://localhost:3001"),
		JWTTokenExpiry:   getEnvAsDuration("JWT_TOKEN_EXPIRY", 15*time.Minute),
		JWTRefreshExpiry: getEnvAsDuration("JWT_REFRESH_EXPIRY", 7*24*time.Hour),

		StripeSecretKey:     getEnv("STRIPE_SECRET_KEY", ""),
		StripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET", ""),
		PayPalClientID:      getEnv("PAYPAL_CLIENT_ID", ""),
		PayPalClientSecret:  getEnv("PAYPAL_CLIENT_SECRET", ""),
		PayPalWebhookID:     getEnv("PAYPAL_WEBHOOK_ID", ""),
		PayPalBaseURL:       getEnv("PAYPAL_BASE_URL", "https://api.sandbox.paypal.com"),
		PayPalMode:          getEnv("PAYPAL_MODE", "sandbox"),

		CORSOrigins: getEnvAsSlice("CORS_ORIGINS", []string{"http://localhost:3000", "http://localhost:5173"}),

		RateLimitEnabled:  getEnvAsBool("RATE_LIMIT_ENABLED", true),
		RateLimitRequests: getEnvAsInt("RATE_LIMIT_REQUESTS", 100),
		RateLimitWindow:   getEnvAsDuration("RATE_LIMIT_WINDOW", 15*time.Minute),
		RateLimitBurst:    getEnvAsInt("RATE_LIMIT_BURST", 50),

		PaymentRetryMaxAttempts: getEnvAsInt("PAYMENT_RETRY_MAX_ATTEMPTS", 3),
		PaymentRetryBackoff:      getEnvAsDuration("PAYMENT_RETRY_BACKOFF", 2*time.Second),

		EnableStripe:   getEnvAsBool("ENABLE_STRIPE", true),
		EnablePayPal:   getEnvAsBool("ENABLE_PAYPAL", true),
		EnableRefunds:  getEnvAsBool("ENABLE_REFUNDS", true),
		EnableWebhooks: getEnvAsBool("ENABLE_WEBHOOKS", true),
		EnableAuditLog: getEnvAsBool("ENABLE_AUDIT_LOG", true),

		LogLevel:  getEnv("LOG_LEVEL", "info"),
		LogFormat: getEnv("LOG_FORMAT", "json"),

		ShutdownTimeout: getEnvAsDuration("SHUTDOWN_TIMEOUT", 30*time.Second),
	}

	// Validate required fields
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

// Helper functions for environment variable parsing

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

func getEnvAsSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		return strings.Split(value, ",")
	}
	return defaultValue
}

// IsDevelopment returns true if running in development mode
func (c *Config) IsDevelopment() bool {
	return c.Env == "development"
}

// IsProduction returns true if running in production mode
func (c *Config) IsProduction() bool {
	return c.Env == "production"
}

