-- API quota management table
CREATE TABLE IF NOT EXISTS api_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  merchant_id UUID REFERENCES merchants(id) UNIQUE,
  daily_limit INTEGER DEFAULT 10000,
  monthly_limit INTEGER DEFAULT 300000,
  current_daily_count INTEGER DEFAULT 0,
  current_monthly_count INTEGER DEFAULT 0,
  reset_daily_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
  reset_monthly_at TIMESTAMP WITH TIME ZONE DEFAULT (date_trunc('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_quotas_user_id ON api_quotas(user_id);
CREATE INDEX idx_api_quotas_merchant_id ON api_quotas(merchant_id);
CREATE INDEX idx_api_quotas_reset_daily_at ON api_quotas(reset_daily_at);
CREATE INDEX idx_api_quotas_reset_monthly_at ON api_quotas(reset_monthly_at);

