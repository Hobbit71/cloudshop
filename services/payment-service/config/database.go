package config

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

// Database wraps the pgxpool.Pool
type Database struct {
	Pool *pgxpool.Pool
	log  *zap.Logger
}

// NewDatabase creates a new database connection pool
func NewDatabase(cfg *Config, logger *zap.Logger) (*Database, error) {
	poolConfig, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	poolConfig.MaxConns = int32(cfg.MaxPoolSize)
	poolConfig.MinConns = int32(cfg.MinPoolSize)
	poolConfig.MaxConnLifetime = cfg.MaxConnLifetime
	poolConfig.MaxConnIdleTime = cfg.MaxConnIdleTime

	// Enable prepared statement caching for better performance
	poolConfig.ConnConfig.DefaultQueryExecMode = 3 // pgx.QueryExecModeCacheDescribe

	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	logger.Info("Database connection pool established",
		zap.Int("max_connections", cfg.MaxPoolSize),
		zap.Int("min_connections", cfg.MinPoolSize),
	)

	return &Database{
		Pool: pool,
		log:  logger,
	}, nil
}

// Close closes the database connection pool
func (db *Database) Close() {
	if db.Pool != nil {
		db.Pool.Close()
		db.log.Info("Database connection pool closed")
	}
}

// Health checks the database connection health
func (db *Database) Health(ctx context.Context) error {
	return db.Pool.Ping(ctx)
}

