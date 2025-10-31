package utils

import (
	"fmt"
	"strconv"
)

// ParseAmount parses a decimal amount string to float64
func ParseAmount(amountStr string) (float64, error) {
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid amount format: %w", err)
	}
	if amount <= 0 {
		return 0, fmt.Errorf("amount must be greater than zero")
	}
	return amount, nil
}

