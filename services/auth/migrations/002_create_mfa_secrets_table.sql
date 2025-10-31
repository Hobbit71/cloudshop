-- Create mfa_secrets table
CREATE TABLE IF NOT EXISTS mfa_secrets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret VARCHAR(255) NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger
CREATE TRIGGER update_mfa_secrets_updated_at BEFORE UPDATE ON mfa_secrets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

