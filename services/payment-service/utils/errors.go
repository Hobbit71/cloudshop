package utils

import (
	"errors"
	"net/http"
)

// APIError represents an API error with status code
type APIError struct {
	StatusCode int
	Message    string
	Err        error
}

// Error implements the error interface
func (e *APIError) Error() string {
	if e.Err != nil {
		return e.Err.Error()
	}
	return e.Message
}

// NewAPIError creates a new API error
func NewAPIError(statusCode int, message string, err error) *APIError {
	return &APIError{
		StatusCode: statusCode,
		Message:    message,
		Err:        err,
	}
}

// Common API errors
var (
	ErrBadRequest          = NewAPIError(http.StatusBadRequest, "Bad request", nil)
	ErrUnauthorized        = NewAPIError(http.StatusUnauthorized, "Unauthorized", nil)
	ErrForbidden          = NewAPIError(http.StatusForbidden, "Forbidden", nil)
	ErrNotFound           = NewAPIError(http.StatusNotFound, "Not found", nil)
	ErrInternalServerError = NewAPIError(http.StatusInternalServerError, "Internal server error", nil)
)

// WrapError wraps an error with an API error
func WrapError(err error, apiErr *APIError) *APIError {
	if err == nil {
		return apiErr
	}
	return &APIError{
		StatusCode: apiErr.StatusCode,
		Message:    apiErr.Message,
		Err:        err,
	}
}

// IsAPIError checks if an error is an APIError
func IsAPIError(err error) bool {
	var apiErr *APIError
	return errors.As(err, &apiErr)
}

// GetAPIError extracts APIError from error chain
func GetAPIError(err error) *APIError {
	var apiErr *APIError
	if errors.As(err, &apiErr) {
		return apiErr
	}
	return nil
}

