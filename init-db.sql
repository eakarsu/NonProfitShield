-- Initialize the insurance platform database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

ALTER TABLE sessions ADD CONSTRAINT "session_pkey" PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'active',
    premium_amount DECIMAL(10,2) NOT NULL,
    coverage_amount DECIMAL(12,2) NOT NULL,
    deductible DECIMAL(8,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    vehicle_info JSONB,
    property_info JSONB,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create claims table
CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policy_id INTEGER NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'submitted',
    description TEXT NOT NULL,
    incident_date DATE NOT NULL,
    reported_at TIMESTAMP DEFAULT now(),
    estimated_amount DECIMAL(10,2),
    approved_amount DECIMAL(10,2),
    damage_photos TEXT[],
    ai_assessment JSONB,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policy_id INTEGER REFERENCES policies(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR NOT NULL DEFAULT 'USD',
    payment_method VARCHAR NOT NULL,
    payment_type VARCHAR NOT NULL,
    transaction_id VARCHAR,
    bitcoin_address VARCHAR,
    bitcoin_transaction_hash VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'pending',
    due_date DATE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_policies_user_id ON policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_policy_id ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_policy_id ON payments(policy_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create insurance_user role if it doesn't exist
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'insurance_user') THEN
      CREATE ROLE insurance_user WITH LOGIN PASSWORD 'insurance_password';
   END IF;
END
$$;

-- Insert sample data for demonstration (you can remove this in production)
INSERT INTO users (id, email, first_name, last_name, profile_image_url) VALUES 
('demo-user-1', 'demo@example.com', 'Demo', 'User', 'https://example.com/avatar.jpg')
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO insurance_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO insurance_user;