package utils

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

// GenerateIdempotencyKey generates an idempotency key from request data
func GenerateIdempotencyKey(orderID, amount, currency string) string {
	data := fmt.Sprintf("%s:%s:%s", orderID, amount, currency)
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// CheckIdempotency checks if a request with the given key has been processed
// This is a placeholder - in production, you'd check against a cache or database
func CheckIdempotency(ctx context.Context, key string) (bool, error) {
	// TODO: Implement idempotency check using Redis or database
	// For now, always return false (not processed)
	return false, nil
}

// StoreIdempotencyKey stores an idempotency key to prevent duplicate processing
func StoreIdempotencyKey(ctx context.Context, key string, ttl int) error {
	// TODO: Implement idempotency storage using Redis or database
	return nil
}

