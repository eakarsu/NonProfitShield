BEGIN;
-- The supported claim endpoints use these existing native shared-schema tables.
-- Add missing storage without replacing records or creating demonstration data.
CREATE TABLE IF NOT EXISTS policies (
  id SERIAL PRIMARY KEY, user_id VARCHAR NOT NULL REFERENCES users(id),
  type VARCHAR NOT NULL, status VARCHAR NOT NULL DEFAULT 'active',
  coverage_amount NUMERIC(10,2) NOT NULL, monthly_premium NUMERIC(10,2) NOT NULL,
  deductible NUMERIC(10,2) NOT NULL, start_date TIMESTAMP NOT NULL, end_date TIMESTAMP,
  vehicle_info JSONB, property_info JSONB, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS policies_native_owner_idx ON policies(user_id);
CREATE TABLE IF NOT EXISTS claims (
  id SERIAL PRIMARY KEY, user_id VARCHAR NOT NULL REFERENCES users(id), policy_id INTEGER NOT NULL REFERENCES policies(id),
  title VARCHAR NOT NULL, description TEXT NOT NULL, status VARCHAR NOT NULL DEFAULT 'submitted',
  estimated_amount NUMERIC(10,2), approved_amount NUMERIC(10,2), paid_amount NUMERIC(10,2),
  images JSONB DEFAULT '[]'::jsonb, ai_assessment JSONB, incident_date TIMESTAMP NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW(), processed_at TIMESTAMP, paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS claims_native_owner_idx ON claims(user_id, submitted_at);
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY, user_id VARCHAR NOT NULL REFERENCES users(id), policy_id INTEGER REFERENCES policies(id),
  claim_id INTEGER REFERENCES claims(id), type VARCHAR NOT NULL, amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR NOT NULL DEFAULT 'USD', payment_method VARCHAR NOT NULL,
  bitcoin_address VARCHAR, bitcoin_tx_id VARCHAR, bitcoin_amount NUMERIC(18,8),
  status VARCHAR NOT NULL DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW(), confirmed_at TIMESTAMP
);
COMMIT;
