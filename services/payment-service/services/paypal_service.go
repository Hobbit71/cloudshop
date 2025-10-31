package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"go.uber.org/zap"

	"github.com/cloudshop/payment-service/config"
	"github.com/cloudshop/payment-service/models"
	"github.com/cloudshop/payment-service/utils"
)

// PayPalService handles PayPal payment gateway integration
type PayPalService struct {
	config     *config.Config
	logger     *zap.Logger
	httpClient *http.Client
	accessToken string
	tokenExpiry time.Time
	tokenMutex sync.Mutex
}

var (
	payPalAPISandbox = "https://api.sandbox.paypal.com"
	payPalAPILive    = "https://api.paypal.com"
)

// NewPayPalService creates a new PayPal service
func NewPayPalService(cfg *config.Config, logger *zap.Logger) *PayPalService {
	return &PayPalService{
		config: cfg,
		logger: logger,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// getAccessToken retrieves or refreshes PayPal access token
func (s *PayPalService) getAccessToken(ctx context.Context) (string, error) {
	s.tokenMutex.Lock()
	defer s.tokenMutex.Unlock()

	// Return cached token if still valid
	if s.accessToken != "" && time.Now().Before(s.tokenExpiry) {
		return s.accessToken, nil
	}

	baseURL := payPalAPISandbox
	if s.config.PayPalMode == "live" {
		baseURL = payPalAPILive
	}

	url := fmt.Sprintf("%s/v1/oauth2/token", baseURL)

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBufferString("grant_type=client_credentials"))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.SetBasicAuth(s.config.PayPalClientID, s.config.PayPalClientSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to get access token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("PayPal token request failed: %s", string(body))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
		ExpiresIn   int    `json:"expires_in"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", fmt.Errorf("failed to decode token response: %w", err)
	}

	s.accessToken = tokenResp.AccessToken
	s.tokenExpiry = time.Now().Add(time.Duration(tokenResp.ExpiresIn-60) * time.Second) // Refresh 60s before expiry

	return s.accessToken, nil
}

// ProcessPayment processes a payment through PayPal
func (s *PayPalService) ProcessPayment(ctx context.Context, payment *models.Payment) (string, error) {
	if s.config.PayPalClientID == "" || s.config.PayPalClientSecret == "" {
		return "", fmt.Errorf("PayPal credentials not configured")
	}

	accessToken, err := s.getAccessToken(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get access token: %w", err)
	}

	baseURL := payPalAPISandbox
	if s.config.PayPalMode == "live" {
		baseURL = payPalAPILive
	}

	// Parse amount
	amountFloat, err := utils.ParseAmount(payment.Amount)
	if err != nil {
		return "", fmt.Errorf("invalid amount: %w", err)
	}

	// Create order request
	orderReq := map[string]interface{}{
		"intent": "CAPTURE",
		"purchase_units": []map[string]interface{}{
			{
				"reference_id": payment.OrderID.String(),
				"amount": map[string]interface{}{
					"currency_code": payment.Currency,
					"value":         fmt.Sprintf("%.2f", amountFloat),
				},
			},
		},
		"application_context": map[string]interface{}{
			"return_url": s.config.PayPalBaseURL + "/return",
			"cancel_url": s.config.PayPalBaseURL + "/cancel",
		},
	}

	jsonData, err := json.Marshal(orderReq)
	if err != nil {
		return "", fmt.Errorf("failed to marshal order request: %w", err)
	}

	url := fmt.Sprintf("%s/v2/checkout/orders", baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to create PayPal order: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusCreated {
		s.logger.Error("PayPal order creation failed",
			zap.Int("status_code", resp.StatusCode),
			zap.String("response", string(body)),
			zap.String("payment_id", payment.ID.String()),
		)
		return "", fmt.Errorf("PayPal order creation failed: %s", string(body))
	}

	var orderResp struct {
		ID     string `json:"id"`
		Status string `json:"status"`
	}

	if err := json.Unmarshal(body, &orderResp); err != nil {
		return "", fmt.Errorf("failed to decode order response: %w", err)
	}

	// For PayPal, we need to capture the order after creation
	// In a real implementation, this would be handled through webhooks
	// For now, return the order ID
	return orderResp.ID, nil
}

// CaptureOrder captures a PayPal order
func (s *PayPalService) CaptureOrder(ctx context.Context, orderID string) error {
	accessToken, err := s.getAccessToken(ctx)
	if err != nil {
		return fmt.Errorf("failed to get access token: %w", err)
	}

	baseURL := payPalAPISandbox
	if s.config.PayPalMode == "live" {
		baseURL = payPalAPILive
	}

	url := fmt.Sprintf("%s/v2/checkout/orders/%s/capture", baseURL, orderID)
	req, err := http.NewRequestWithContext(ctx, "POST", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to capture PayPal order: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("PayPal capture failed: %s", string(body))
	}

	return nil
}

// RefundPayment processes a refund through PayPal
func (s *PayPalService) RefundPayment(ctx context.Context, payment *models.Payment, captureID string, amount *string) (string, error) {
	if payment.ExternalTransactionID == "" {
		return "", fmt.Errorf("payment does not have external transaction ID")
	}

	accessToken, err := s.getAccessToken(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get access token: %w", err)
	}

	baseURL := payPalAPISandbox
	if s.config.PayPalMode == "live" {
		baseURL = payPalAPILive
	}

	refundReq := map[string]interface{}{}

	if amount != nil {
		amountFloat, err := utils.ParseAmount(*amount)
		if err != nil {
			return "", fmt.Errorf("invalid refund amount: %w", err)
		}
		refundReq["amount"] = map[string]interface{}{
			"value":         fmt.Sprintf("%.2f", amountFloat),
			"currency_code": payment.Currency,
		}
	}

	jsonData, err := json.Marshal(refundReq)
	if err != nil {
		return "", fmt.Errorf("failed to marshal refund request: %w", err)
	}

	url := fmt.Sprintf("%s/v2/payments/captures/%s/refund", baseURL, captureID)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to refund PayPal payment: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusCreated {
		s.logger.Error("PayPal refund failed",
			zap.Int("status_code", resp.StatusCode),
			zap.String("response", string(body)),
			zap.String("payment_id", payment.ID.String()),
		)
		return "", fmt.Errorf("PayPal refund failed: %s", string(body))
	}

	var refundResp struct {
		ID string `json:"id"`
	}

	if err := json.Unmarshal(body, &refundResp); err != nil {
		return "", fmt.Errorf("failed to decode refund response: %w", err)
	}

	return refundResp.ID, nil
}

// VerifyWebhookSignature verifies PayPal webhook signature
func (s *PayPalService) VerifyWebhookSignature(ctx context.Context, headers map[string]string, body []byte) (bool, map[string]interface{}) {
	if s.config.PayPalWebhookID == "" {
		s.logger.Warn("PayPal webhook ID not configured, skipping signature verification")
		return true, nil // In development, allow without verification
	}

	accessToken, err := s.getAccessToken(ctx)
	if err != nil {
		s.logger.Error("Failed to get access token for webhook verification", zap.Error(err))
		return false, nil
	}

	baseURL := payPalAPISandbox
	if s.config.PayPalMode == "live" {
		baseURL = payPalAPILive
	}

	// PayPal webhook verification
	verifyReq := map[string]interface{}{
		"transmission_id": headers["Paypal-Transmission-Id"],
		"transmission_time": headers["Paypal-Transmission-Time"],
		"cert_url":        headers["Paypal-Cert-Url"],
		"auth_algo":       headers["Paypal-Auth-Algo"],
		"transmission_sig": headers["Paypal-Transmission-Sig"],
		"webhook_id":      s.config.PayPalWebhookID,
		"webhook_event":   json.RawMessage(body),
	}

	jsonData, err := json.Marshal(verifyReq)
	if err != nil {
		s.logger.Error("Failed to marshal webhook verification request", zap.Error(err))
		return false, nil
	}

	url := fmt.Sprintf("%s/v1/notifications/verify-webhook-signature", baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		s.logger.Error("Failed to create webhook verification request", zap.Error(err))
		return false, nil
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		s.logger.Error("PayPal webhook verification request failed", zap.Error(err))
		return false, nil
	}
	defer resp.Body.Close()

	var verifyResp struct {
		VerificationStatus string `json:"verification_status"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&verifyResp); err != nil {
		s.logger.Error("Failed to decode webhook verification response", zap.Error(err))
		return false, nil
	}

	if verifyResp.VerificationStatus != "SUCCESS" {
		s.logger.Warn("PayPal webhook signature verification failed",
			zap.String("status", verifyResp.VerificationStatus),
		)
		return false, nil
	}

	var eventData map[string]interface{}
	if err := json.Unmarshal(body, &eventData); err != nil {
		return false, nil
	}

	return true, eventData
}

