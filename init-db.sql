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

-- Create users table with auth fields
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    password VARCHAR,
    role VARCHAR NOT NULL DEFAULT 'member',
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verification_token VARCHAR,
    password_reset_token VARCHAR,
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'active',
    coverage_amount DECIMAL(10,2) NOT NULL,
    monthly_premium DECIMAL(10,2) NOT NULL,
    deductible DECIMAL(10,2) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
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
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'submitted',
    estimated_amount DECIMAL(10,2),
    approved_amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2),
    images JSONB DEFAULT '[]',
    ai_assessment JSONB,
    incident_date TIMESTAMP NOT NULL,
    submitted_at TIMESTAMP DEFAULT now(),
    processed_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policy_id INTEGER REFERENCES policies(id) ON DELETE SET NULL,
    claim_id INTEGER REFERENCES claims(id) ON DELETE SET NULL,
    type VARCHAR NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR NOT NULL DEFAULT 'USD',
    payment_method VARCHAR NOT NULL,
    bitcoin_address VARCHAR,
    bitcoin_tx_id VARCHAR,
    bitcoin_amount DECIMAL(18,8),
    status VARCHAR NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT now(),
    confirmed_at TIMESTAMP
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

-- Add new columns to existing tables if they don't exist (for migrations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password') THEN
        ALTER TABLE users ADD COLUMN password VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR NOT NULL DEFAULT 'member';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_verified') THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_verification_token') THEN
        ALTER TABLE users ADD COLUMN email_verification_token VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_reset_token') THEN
        ALTER TABLE users ADD COLUMN password_reset_token VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_reset_expires') THEN
        ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP;
    END IF;
END
$$;

-- ===========================================
-- SEED DATA (15+ items per entity)
-- Password hash for "Password1!" generated with bcrypt cost 12
-- ===========================================

-- Seed Users (18 users: 2 admin, 3 agent, 13 member)
INSERT INTO users (id, email, first_name, last_name, role, email_verified, password) VALUES
('user-admin-1', 'admin@safeguard.com', 'Sarah', 'Johnson', 'admin', true, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-admin-2', 'admin2@safeguard.com', 'Michael', 'Chen', 'admin', true, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-agent-1', 'agent1@safeguard.com', 'Emily', 'Rodriguez', 'agent', true, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-agent-2', 'agent2@safeguard.com', 'David', 'Kim', 'agent', true, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-agent-3', 'agent3@safeguard.com', 'Lisa', 'Thompson', 'agent', true, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-member-1', 'john.doe@email.com', 'John', 'Doe', 'member', true, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-member-2', 'jane.smith@email.com', 'Jane', 'Smith', 'member', true, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-member-3', 'bob.wilson@email.com', 'Bob', 'Wilson', 'member', true, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-member-4', 'alice.brown@email.com', 'Alice', 'Brown', 'member', true, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-member-5', 'charlie.davis@email.com', 'Charlie', 'Davis', 'member', true, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-member-6', 'diana.miller@email.com', 'Diana', 'Miller', 'member', true, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-member-7', 'edward.garcia@email.com', 'Edward', 'Garcia', 'member', true, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-member-8', 'fiona.martinez@email.com', 'Fiona', 'Martinez', 'member', true, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-member-9', 'george.anderson@email.com', 'George', 'Anderson', 'member', false, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-member-10', 'hannah.taylor@email.com', 'Hannah', 'Taylor', 'member', false, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-member-11', 'ivan.thomas@email.com', 'Ivan', 'Thomas', 'member', true, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-member-12', 'julia.jackson@email.com', 'Julia', 'Jackson', 'member', true, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi'),
('user-member-13', 'kevin.white@email.com', 'Kevin', 'White', 'member', false, '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoGk.ij0jy7KdL4GBn1PJDE0ILWdHfKi')
ON CONFLICT (id) DO NOTHING;

-- Seed Policies (20 policies: mix of auto and home)
INSERT INTO policies (user_id, type, status, coverage_amount, monthly_premium, deductible, start_date, vehicle_info, property_info) VALUES
('user-member-1', 'auto', 'active', 50000, 89.50, 1000, '2024-01-15', '{"make":"Toyota","model":"Camry","year":2022,"vin":"1HGBH41JXMN109186","mileage":25000,"primaryUse":"personal"}', NULL),
('user-member-1', 'home', 'active', 350000, 125.00, 2500, '2024-02-01', NULL, '{"address":"123 Oak Street, Austin TX 78701","yearBuilt":2005,"squareFootage":2200,"propertyType":"single_family","constructionType":"frame","roofType":"shingle","hasSecuritySystem":true,"hasFireAlarm":true}'),
('user-member-2', 'auto', 'active', 75000, 112.00, 500, '2024-03-10', '{"make":"Honda","model":"Accord","year":2023,"vin":"2HGFA16598H523456","mileage":12000,"primaryUse":"personal"}', NULL),
('user-member-2', 'auto', 'active', 45000, 78.25, 1000, '2024-04-05', '{"make":"Ford","model":"Escape","year":2021,"vin":"3FAHP0HA1CR123456","mileage":35000,"primaryUse":"business"}', NULL),
('user-member-3', 'home', 'active', 500000, 195.75, 5000, '2024-01-20', NULL, '{"address":"456 Maple Ave, Denver CO 80202","yearBuilt":2015,"squareFootage":3500,"propertyType":"single_family","constructionType":"masonry","roofType":"tile","hasSecuritySystem":true,"hasFireAlarm":true}'),
('user-member-3', 'auto', 'suspended', 30000, 65.00, 1000, '2023-11-01', '{"make":"Chevrolet","model":"Malibu","year":2019,"vin":"4T1BF1FK5CU123456","mileage":55000,"primaryUse":"personal"}', NULL),
('user-member-4', 'auto', 'active', 100000, 145.50, 500, '2024-05-15', '{"make":"Tesla","model":"Model 3","year":2024,"vin":"5YJ3E1EA8NF123456","mileage":5000,"primaryUse":"personal"}', NULL),
('user-member-4', 'home', 'active', 275000, 110.25, 2500, '2024-06-01', NULL, '{"address":"789 Pine Rd, Portland OR 97201","yearBuilt":1998,"squareFootage":1800,"propertyType":"townhouse","constructionType":"frame","roofType":"shingle","hasSecuritySystem":false,"hasFireAlarm":true}'),
('user-member-5', 'auto', 'active', 60000, 95.00, 1000, '2024-02-20', '{"make":"BMW","model":"330i","year":2022,"vin":"WBA8B9G51JNU12345","mileage":18000,"primaryUse":"personal"}', NULL),
('user-member-5', 'home', 'cancelled', 200000, 85.50, 2500, '2023-09-01', NULL, '{"address":"321 Elm St, Seattle WA 98101","yearBuilt":1985,"squareFootage":1500,"propertyType":"condo","constructionType":"concrete","roofType":"flat","hasSecuritySystem":true,"hasFireAlarm":true}'),
('user-member-6', 'auto', 'active', 40000, 72.00, 1500, '2024-07-01', '{"make":"Hyundai","model":"Tucson","year":2023,"vin":"KM8J3CA46NU123456","mileage":8000,"primaryUse":"personal"}', NULL),
('user-member-7', 'home', 'active', 425000, 168.00, 5000, '2024-03-15', NULL, '{"address":"654 Cedar Blvd, Nashville TN 37201","yearBuilt":2010,"squareFootage":2800,"propertyType":"single_family","constructionType":"steel","roofType":"metal","hasSecuritySystem":true,"hasFireAlarm":true}'),
('user-member-8', 'auto', 'active', 55000, 88.75, 1000, '2024-04-20', '{"make":"Mazda","model":"CX-5","year":2023,"vin":"JM3KFBCM5N0123456","mileage":15000,"primaryUse":"pleasure"}', NULL),
('user-member-8', 'home', 'active', 315000, 138.50, 2500, '2024-05-01', NULL, '{"address":"987 Birch Lane, Charlotte NC 28201","yearBuilt":2018,"squareFootage":2400,"propertyType":"single_family","constructionType":"frame","roofType":"shingle","hasSecuritySystem":true,"hasFireAlarm":true}'),
('user-member-9', 'auto', 'active', 35000, 62.50, 2000, '2024-08-01', '{"make":"Subaru","model":"Outback","year":2021,"vin":"4S4BSAFC5M3123456","mileage":42000,"primaryUse":"personal"}', NULL),
('user-member-10', 'auto', 'active', 80000, 118.00, 500, '2024-06-15', '{"make":"Audi","model":"A4","year":2024,"vin":"WAUFFAFL5EA123456","mileage":3000,"primaryUse":"personal"}', NULL),
('user-member-11', 'home', 'active', 600000, 225.00, 5000, '2024-01-01', NULL, '{"address":"159 Walnut Dr, San Francisco CA 94101","yearBuilt":2020,"squareFootage":4000,"propertyType":"single_family","constructionType":"concrete","roofType":"tile","hasSecuritySystem":true,"hasFireAlarm":true}'),
('user-member-12', 'auto', 'suspended', 25000, 55.00, 2000, '2023-12-01', '{"make":"Nissan","model":"Altima","year":2018,"vin":"1N4AL3AP4JC123456","mileage":72000,"primaryUse":"business"}', NULL),
('user-member-12', 'home', 'active', 180000, 78.25, 2500, '2024-09-01', NULL, '{"address":"753 Spruce Ct, Phoenix AZ 85001","yearBuilt":1992,"squareFootage":1400,"propertyType":"condo","constructionType":"masonry","roofType":"flat","hasSecuritySystem":false,"hasFireAlarm":true}'),
('user-member-13', 'auto', 'active', 65000, 98.50, 1000, '2024-10-01', '{"make":"Volkswagen","model":"Tiguan","year":2023,"vin":"3VV2B7AX5NM123456","mileage":9500,"primaryUse":"personal"}', NULL)
ON CONFLICT DO NOTHING;

-- Seed Claims (20 claims with different statuses and AI assessments)
INSERT INTO claims (user_id, policy_id, title, description, status, estimated_amount, approved_amount, paid_amount, incident_date, ai_assessment, images) VALUES
('user-member-1', 1, 'Rear bumper collision damage', 'Hit from behind at a stoplight. Rear bumper cracked, tail lights broken, trunk dented.', 'submitted', 3500, NULL, NULL, '2024-11-15', '{"damageType":"Collision","severity":"moderate","affectedComponents":["rear bumper","tail lights","trunk"],"repairComplexity":"moderate","estimatedCost":{"parts":1500,"labor":2000,"total":3500},"confidence":0.85,"description":"Moderate rear-end collision damage","recommendations":["Replace rear bumper","Replace tail light assembly","Repair trunk dent"]}', '[]'),
('user-member-1', 2, 'Storm damage to roof shingles', 'Heavy hailstorm caused multiple roof shingle cracks and water leak in attic.', 'processing', 8500, NULL, NULL, '2024-10-20', '{"damageType":"Weather","severity":"major","affectedComponents":["roof shingles","attic insulation","gutters"],"repairComplexity":"complex","estimatedCost":{"parts":4000,"labor":4500,"total":8500},"confidence":0.78,"description":"Significant hail damage to roof","recommendations":["Replace damaged shingles","Repair attic insulation","Clean and repair gutters"]}', '[]'),
('user-member-2', 3, 'Windshield crack from debris', 'Rock hit windshield on highway, large crack spanning full width.', 'approved', 800, 750, NULL, '2024-12-01', '{"damageType":"Impact","severity":"minor","affectedComponents":["windshield"],"repairComplexity":"simple","estimatedCost":{"parts":500,"labor":300,"total":800},"confidence":0.92,"description":"Windshield replacement needed","recommendations":["Full windshield replacement"]}', '[]'),
('user-member-2', 4, 'Side mirror knocked off in parking lot', 'Someone sideswiped the car. Driver side mirror completely gone.', 'paid', 450, 400, 400, '2024-09-25', '{"damageType":"Collision","severity":"minor","affectedComponents":["driver side mirror","door paint"],"repairComplexity":"simple","estimatedCost":{"parts":250,"labor":200,"total":450},"confidence":0.9,"description":"Side mirror replacement with minor paint touch-up","recommendations":["Replace mirror assembly","Touch up door paint"]}', '[]'),
('user-member-3', 5, 'Burst pipe flooding in basement', 'Pipe burst during cold snap, flooding basement and damaging drywall and flooring.', 'processing', 12000, NULL, NULL, '2024-12-10', '{"damageType":"Water","severity":"major","affectedComponents":["basement drywall","flooring","electrical","plumbing"],"repairComplexity":"complex","estimatedCost":{"parts":5000,"labor":7000,"total":12000},"confidence":0.75,"description":"Extensive water damage from burst pipe","recommendations":["Water extraction","Replace drywall","Replace flooring","Electrical inspection","Pipe repair"]}', '[]'),
('user-member-3', 6, 'Fender bender at intersection', 'Low speed collision at intersection. Front bumper and headlight damaged.', 'denied', 2200, NULL, NULL, '2024-08-15', '{"damageType":"Collision","severity":"moderate","affectedComponents":["front bumper","headlight","hood"],"repairComplexity":"moderate","estimatedCost":{"parts":1000,"labor":1200,"total":2200},"confidence":0.82,"description":"Front-end collision damage","recommendations":["Replace front bumper","Replace headlight assembly","Inspect hood alignment"]}', '[]'),
('user-member-4', 7, 'Vandalism scratches on Tesla', 'Someone keyed both sides of the car in a parking garage. Deep scratches.', 'submitted', 4800, NULL, NULL, '2025-01-05', '{"damageType":"Vandalism","severity":"moderate","affectedComponents":["driver side panels","passenger side panels","doors"],"repairComplexity":"moderate","estimatedCost":{"parts":1800,"labor":3000,"total":4800},"confidence":0.88,"description":"Extensive keying damage on both sides","recommendations":["Sand and repaint affected panels","Clear coat application"]}', '[]'),
('user-member-4', 8, 'Tree fell on garage during storm', 'Large oak tree fell during windstorm, crushing garage roof and damaging one wall.', 'approved', 18000, 16500, NULL, '2024-11-28', '{"damageType":"Weather","severity":"total","affectedComponents":["garage roof","garage wall","garage door","structural beams"],"repairComplexity":"complex","estimatedCost":{"parts":8000,"labor":10000,"total":18000},"confidence":0.72,"description":"Major structural damage from fallen tree","recommendations":["Tree removal","Roof replacement","Wall reconstruction","Structural inspection"]}', '[]'),
('user-member-5', 9, 'Deer collision on rural road', 'Hit a deer at dusk on country road. Hood crumpled, radiator damaged, airbags deployed.', 'processing', 7500, NULL, NULL, '2024-12-20', '{"damageType":"Collision","severity":"major","affectedComponents":["hood","radiator","grille","airbags","bumper"],"repairComplexity":"complex","estimatedCost":{"parts":3500,"labor":4000,"total":7500},"confidence":0.8,"description":"Major front-end damage from animal collision","recommendations":["Replace hood","Replace radiator","Replace grille","Airbag replacement","Frame inspection"]}', '[]'),
('user-member-6', 11, 'Minor parking lot scrape', 'Scraped against a pillar in parking garage. Paint damage on passenger side.', 'submitted', 900, NULL, NULL, '2025-01-10', '{"damageType":"Collision","severity":"minor","affectedComponents":["passenger door","rear quarter panel"],"repairComplexity":"simple","estimatedCost":{"parts":300,"labor":600,"total":900},"confidence":0.91,"description":"Minor paint scrape damage","recommendations":["Sand and repaint affected area","Apply clear coat"]}', '[]'),
('user-member-7', 12, 'Kitchen fire smoke damage', 'Grease fire in kitchen. Fire contained but smoke damage throughout first floor.', 'approved', 15000, 14000, NULL, '2024-10-05', '{"damageType":"Fire","severity":"major","affectedComponents":["kitchen cabinets","walls","ceiling","flooring","appliances"],"repairComplexity":"complex","estimatedCost":{"parts":7000,"labor":8000,"total":15000},"confidence":0.76,"description":"Smoke and minor fire damage in kitchen area","recommendations":["Replace kitchen cabinets","Repaint walls and ceiling","Deep clean/replace flooring","Replace damaged appliances"]}', '[]'),
('user-member-8', 13, 'Hail damage on car hood and roof', 'Golf ball sized hail dented the hood, roof, and trunk of the car.', 'paid', 5200, 5000, 5000, '2024-07-15', '{"damageType":"Weather","severity":"moderate","affectedComponents":["hood","roof","trunk","paint"],"repairComplexity":"moderate","estimatedCost":{"parts":2000,"labor":3200,"total":5200},"confidence":0.86,"description":"Multiple hail dents across vehicle body","recommendations":["Paintless dent repair","Touch up paint where needed"]}', '[]'),
('user-member-8', 14, 'Window broken by burglary attempt', 'Someone tried to break in through the front window. Glass shattered, frame damaged.', 'submitted', 2800, NULL, NULL, '2025-01-15', '{"damageType":"Vandalism","severity":"moderate","affectedComponents":["front window","window frame","interior wall"],"repairComplexity":"moderate","estimatedCost":{"parts":1200,"labor":1600,"total":2800},"confidence":0.83,"description":"Forced entry damage to window area","recommendations":["Replace window glass","Repair window frame","Patch interior wall damage","Consider security upgrade"]}', '[]'),
('user-member-9', 15, 'Rear-end collision at highway merge', 'Rear-ended while merging onto highway. Trunk crushed, rear lights destroyed.', 'processing', 6000, NULL, NULL, '2024-12-28', '{"damageType":"Collision","severity":"major","affectedComponents":["trunk","rear bumper","tail lights","rear quarter panels"],"repairComplexity":"complex","estimatedCost":{"parts":2800,"labor":3200,"total":6000},"confidence":0.81,"description":"Significant rear-end damage","recommendations":["Replace trunk lid","Replace rear bumper","Replace tail light assemblies","Frame alignment check"]}', '[]'),
('user-member-10', 16, 'Road debris tire and rim damage', 'Hit large debris on highway. Two tires blown out, rims bent, alignment off.', 'approved', 3200, 3000, NULL, '2024-11-05', '{"damageType":"Impact","severity":"moderate","affectedComponents":["front tires","rims","suspension"],"repairComplexity":"moderate","estimatedCost":{"parts":2000,"labor":1200,"total":3200},"confidence":0.87,"description":"Tire and rim damage from road debris","recommendations":["Replace two tires","Replace bent rims","Alignment service","Suspension inspection"]}', '[]'),
('user-member-11', 17, 'Earthquake crack in foundation', 'Recent earthquake caused visible crack in home foundation and shifted door frames.', 'submitted', 25000, NULL, NULL, '2025-01-20', '{"damageType":"Natural disaster","severity":"major","affectedComponents":["foundation","door frames","walls","driveway"],"repairComplexity":"complex","estimatedCost":{"parts":10000,"labor":15000,"total":25000},"confidence":0.7,"description":"Earthquake structural damage","recommendations":["Foundation repair","Realign door frames","Repair wall cracks","Structural engineering assessment"]}', '[]'),
('user-member-12', 18, 'Catalytic converter theft', 'Catalytic converter stolen from car overnight. Cut clean off the exhaust system.', 'paid', 2500, 2300, 2300, '2024-10-30', '{"damageType":"Theft","severity":"moderate","affectedComponents":["catalytic converter","exhaust pipe","heat shields"],"repairComplexity":"moderate","estimatedCost":{"parts":1800,"labor":700,"total":2500},"confidence":0.93,"description":"Catalytic converter theft and exhaust damage","recommendations":["Replace catalytic converter","Repair exhaust pipe","Install anti-theft shield"]}', '[]'),
('user-member-12', 19, 'Water heater leak damage', 'Water heater burst, flooding utility room and adjacent bedroom carpet.', 'processing', 4500, NULL, NULL, '2025-01-08', '{"damageType":"Water","severity":"moderate","affectedComponents":["utility room floor","bedroom carpet","drywall","baseboards"],"repairComplexity":"moderate","estimatedCost":{"parts":2000,"labor":2500,"total":4500},"confidence":0.8,"description":"Water damage from failed water heater","recommendations":["Replace water heater","Replace carpet","Repair drywall","Mold inspection"]}', '[]'),
('user-member-13', 20, 'Hit and run door dent', 'Someone hit the driver door in a parking lot and drove away. Large dent and paint damage.', 'submitted', 1800, NULL, NULL, '2025-02-01', '{"damageType":"Collision","severity":"minor","affectedComponents":["driver door","paint"],"repairComplexity":"moderate","estimatedCost":{"parts":700,"labor":1100,"total":1800},"confidence":0.89,"description":"Hit and run door damage","recommendations":["Repair door dent","Repaint door panel"]}', '[]'),
('user-member-1', 1, 'Front bumper scrape on curb', 'Scraped front bumper while parallel parking. Minor cosmetic damage.', 'submitted', 650, NULL, NULL, '2025-02-10', '{"damageType":"Collision","severity":"minor","affectedComponents":["front bumper"],"repairComplexity":"simple","estimatedCost":{"parts":250,"labor":400,"total":650},"confidence":0.94,"description":"Minor curb scrape damage","recommendations":["Sand and repaint bumper"]}', '[]')
ON CONFLICT DO NOTHING;

-- Seed Payments (20 payments with different statuses and methods)
INSERT INTO payments (user_id, policy_id, claim_id, type, amount, currency, payment_method, bitcoin_address, bitcoin_amount, status, created_at) VALUES
('user-member-1', 1, NULL, 'premium', 89.50, 'USD', 'traditional', NULL, NULL, 'confirmed', '2024-02-01'),
('user-member-1', 1, NULL, 'premium', 89.50, 'USD', 'bitcoin', 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 0.00198889, 'confirmed', '2024-03-01'),
('user-member-1', 2, NULL, 'premium', 125.00, 'USD', 'traditional', NULL, NULL, 'confirmed', '2024-03-01'),
('user-member-2', 3, NULL, 'premium', 112.00, 'USD', 'bitcoin', 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', 0.00248889, 'confirmed', '2024-04-01'),
('user-member-2', 3, NULL, 'premium', 112.00, 'USD', 'traditional', NULL, NULL, 'pending', '2024-05-01'),
('user-member-2', NULL, 4, 'claim_payout', 400.00, 'USD', 'traditional', NULL, NULL, 'confirmed', '2024-10-15'),
('user-member-3', 5, NULL, 'premium', 195.75, 'USD', 'traditional', NULL, NULL, 'confirmed', '2024-02-01'),
('user-member-3', 5, NULL, 'premium', 195.75, 'USD', 'bitcoin', 'tb1qrp33g0q5b5698ahp5jnf5yzjmgcel8tkculhmg', 0.00435000, 'pending', '2024-03-01'),
('user-member-4', 7, NULL, 'premium', 145.50, 'USD', 'traditional', NULL, NULL, 'confirmed', '2024-06-01'),
('user-member-4', 8, NULL, 'premium', 110.25, 'USD', 'traditional', NULL, NULL, 'confirmed', '2024-07-01'),
('user-member-4', NULL, 8, 'claim_payout', 16500.00, 'USD', 'traditional', NULL, NULL, 'pending', '2024-12-20'),
('user-member-5', 9, NULL, 'premium', 95.00, 'USD', 'bitcoin', 'tb1q0sg9rdst255gtldsmcf8rk0764avqy2h2rl9t4', 0.00211111, 'confirmed', '2024-03-01'),
('user-member-6', 11, NULL, 'premium', 72.00, 'USD', 'traditional', NULL, NULL, 'confirmed', '2024-08-01'),
('user-member-7', 12, NULL, 'premium', 168.00, 'USD', 'traditional', NULL, NULL, 'confirmed', '2024-04-01'),
('user-member-7', NULL, 11, 'claim_payout', 14000.00, 'USD', 'traditional', NULL, NULL, 'confirmed', '2024-11-15'),
('user-member-8', 13, NULL, 'premium', 88.75, 'USD', 'traditional', NULL, NULL, 'confirmed', '2024-05-01'),
('user-member-8', NULL, 12, 'claim_payout', 5000.00, 'USD', 'bitcoin', 'tb1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h', 0.11111111, 'confirmed', '2024-08-20'),
('user-member-9', 15, NULL, 'premium', 62.50, 'USD', 'traditional', NULL, NULL, 'failed', '2024-09-01'),
('user-member-10', 16, NULL, 'premium', 118.00, 'USD', 'traditional', NULL, NULL, 'confirmed', '2024-07-01'),
('user-member-12', NULL, 17, 'claim_payout', 2300.00, 'USD', 'traditional', NULL, NULL, 'confirmed', '2024-11-30')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'insurance_user') THEN
      CREATE ROLE insurance_user WITH LOGIN PASSWORD 'insurance_password';
   END IF;
END
$$;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO insurance_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO insurance_user;
