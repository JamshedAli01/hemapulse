CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- ENUM TYPES
-- =========================================================

CREATE TYPE user_role AS ENUM (
    'ADMIN',
    'REQUESTER',
    'DONOR',
    'HOSPITAL'
);

CREATE TYPE blood_group AS ENUM (
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-'
);

CREATE TYPE request_status AS ENUM (
    'PENDING',
    'VERIFIED',
    'MATCHING',
    'FULFILLED',
    'CANCELLED',
    'EXPIRED'
);

CREATE TYPE request_urgency AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

CREATE TYPE notification_channel AS ENUM (
    'IN_APP',
    'EMAIL',
    'SMS'
);

CREATE TYPE notification_status AS ENUM (
    'PENDING',
    'SENT',
    'FAILED',
    'READ'
);

CREATE TYPE donor_response_status AS ENUM (
    'ACCEPTED',
    'DECLINED'
);

CREATE TYPE donation_status AS ENUM (
    'SCHEDULED',
    'CONFIRMED',
    'CANCELLED'
);

CREATE TYPE confirmation_method AS ENUM (
    'MANUAL',
    'HOSPITAL',
    'QR'
);


-- =========================================================
-- USERS
-- /api/auth/register
-- /api/auth/login
-- /api/auth/me
-- =========================================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    phone VARCHAR(30),

    password_hash TEXT NOT NULL,

    role user_role NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email
    ON users(email);

CREATE INDEX idx_users_role
    ON users(role);


-- =========================================================
-- DONORS
-- /api/donors
-- =========================================================

CREATE TABLE donors (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL UNIQUE
        REFERENCES users(id)
        ON DELETE CASCADE,

    blood_group blood_group NOT NULL,

    date_of_birth DATE NOT NULL,

    city VARCHAR(150) NOT NULL,

    latitude DOUBLE PRECISION NOT NULL,

    longitude DOUBLE PRECISION NOT NULL,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    is_eligible BOOLEAN NOT NULL DEFAULT TRUE,

    last_donation_date DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donors_blood_group
    ON donors(blood_group);

CREATE INDEX idx_donors_city
    ON donors(city);

CREATE INDEX idx_donors_available
    ON donors(is_available);

CREATE INDEX idx_donors_eligible
    ON donors(is_eligible);

CREATE INDEX idx_donors_location
    ON donors(latitude, longitude);


-- =========================================================
-- HOSPITALS
-- /api/hospitals
-- =========================================================

CREATE TABLE hospitals (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    address TEXT NOT NULL,

    city VARCHAR(150) NOT NULL,

    phone VARCHAR(30),

    latitude DOUBLE PRECISION NOT NULL,

    longitude DOUBLE PRECISION NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hospitals_city
    ON hospitals(city);

CREATE INDEX idx_hospitals_location
    ON hospitals(latitude, longitude);


-- =========================================================
-- BLOOD REQUESTS
-- /api/requests
-- =========================================================

CREATE TABLE blood_requests (
    id BIGSERIAL PRIMARY KEY,

    hospital_id BIGINT NOT NULL
        REFERENCES hospitals(id)
        ON DELETE RESTRICT,

    created_by_user_id BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,

    blood_group blood_group NOT NULL,

    units_required INTEGER NOT NULL
        CHECK (units_required > 0),

    units_fulfilled INTEGER NOT NULL DEFAULT 0
        CHECK (units_fulfilled >= 0),

    required_before TIMESTAMPTZ NOT NULL,

    description TEXT NOT NULL,

    latitude DOUBLE PRECISION NOT NULL,

    longitude DOUBLE PRECISION NOT NULL,

    status request_status NOT NULL DEFAULT 'PENDING',

    urgency request_urgency NOT NULL DEFAULT 'MEDIUM',

    verified BOOLEAN NOT NULL DEFAULT FALSE,

    verification_notes TEXT,

    verified_at TIMESTAMPTZ,

    verified_by_user_id BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,

    cancelled_at TIMESTAMPTZ,

    fulfilled_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (units_fulfilled <= units_required)
);

CREATE INDEX idx_requests_hospital
    ON blood_requests(hospital_id);

CREATE INDEX idx_requests_status
    ON blood_requests(status);

CREATE INDEX idx_requests_blood_group
    ON blood_requests(blood_group);

CREATE INDEX idx_requests_urgency
    ON blood_requests(urgency);

CREATE INDEX idx_requests_required_before
    ON blood_requests(required_before);

CREATE INDEX idx_requests_location
    ON blood_requests(latitude, longitude);


-- =========================================================
-- AI REQUEST ANALYSES
-- /api/ai/analyze-request
-- /api/ai/check-duplicate
-- =========================================================

CREATE TABLE ai_request_analyses (
    id BIGSERIAL PRIMARY KEY,

    request_id BIGINT NOT NULL
        REFERENCES blood_requests(id)
        ON DELETE CASCADE,

    description TEXT NOT NULL,

    urgency request_urgency,

    summary TEXT,

    is_duplicate BOOLEAN,

    duplicate_request_id BIGINT
        REFERENCES blood_requests(id)
        ON DELETE SET NULL,

    duplicate_confidence NUMERIC(5,4),

    ai_provider VARCHAR(100),

    ai_model VARCHAR(150),

    raw_response JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_analysis_request
    ON ai_request_analyses(request_id);

CREATE INDEX idx_ai_duplicate
    ON ai_request_analyses(is_duplicate);


-- =========================================================
-- REQUEST MATCHES
-- /api/matching/{request_id}/run
-- /api/matching/{request_id}
-- =========================================================

CREATE TABLE request_matches (
    id BIGSERIAL PRIMARY KEY,

    request_id BIGINT NOT NULL
        REFERENCES blood_requests(id)
        ON DELETE CASCADE,

    donor_id BIGINT NOT NULL
        REFERENCES donors(id)
        ON DELETE CASCADE,

    distance_km NUMERIC(10,3),

    compatibility_score NUMERIC(6,3),

    availability_score NUMERIC(6,3),

    urgency_score NUMERIC(6,3),

    total_score NUMERIC(6,3),

    rank INTEGER,

    radius_km NUMERIC(10,3),

    batch_number INTEGER,

    is_notified BOOLEAN NOT NULL DEFAULT FALSE,

    matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(request_id, donor_id)
);

CREATE INDEX idx_matches_request
    ON request_matches(request_id);

CREATE INDEX idx_matches_donor
    ON request_matches(donor_id);

CREATE INDEX idx_matches_rank
    ON request_matches(request_id, rank);

CREATE INDEX idx_matches_distance
    ON request_matches(distance_km);


-- =========================================================
-- DONOR RESPONSES
-- /api/responses/{request_id}/accept
-- /api/responses/{request_id}/decline
-- =========================================================

CREATE TABLE donor_responses (
    id BIGSERIAL PRIMARY KEY,

    request_id BIGINT NOT NULL
        REFERENCES blood_requests(id)
        ON DELETE CASCADE,

    donor_id BIGINT NOT NULL
        REFERENCES donors(id)
        ON DELETE CASCADE,

    status donor_response_status NOT NULL,

    reason TEXT,

    responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(request_id, donor_id)
);

CREATE INDEX idx_responses_request
    ON donor_responses(request_id);

CREATE INDEX idx_responses_donor
    ON donor_responses(donor_id);

CREATE INDEX idx_responses_status
    ON donor_responses(status);


-- =========================================================
-- NOTIFICATIONS
-- /api/notifications/{request_id}/send
-- /api/notifications
-- =========================================================

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,

    request_id BIGINT
        REFERENCES blood_requests(id)
        ON DELETE CASCADE,

    donor_id BIGINT
        REFERENCES donors(id)
        ON DELETE CASCADE,

    recipient_user_id BIGINT
        REFERENCES users(id)
        ON DELETE CASCADE,

    channel notification_channel NOT NULL,

    status notification_status NOT NULL DEFAULT 'PENDING',

    title VARCHAR(255),

    message TEXT NOT NULL,

    sent_at TIMESTAMPTZ,

    read_at TIMESTAMPTZ,

    failure_reason TEXT,

    external_message_id VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_request
    ON notifications(request_id);

CREATE INDEX idx_notifications_donor
    ON notifications(donor_id);

CREATE INDEX idx_notifications_recipient
    ON notifications(recipient_user_id);

CREATE INDEX idx_notifications_status
    ON notifications(status);

CREATE INDEX idx_notifications_created
    ON notifications(created_at);


-- =========================================================
-- DONATIONS
-- /api/donations
-- /api/donations/{id}/confirm
-- =========================================================

CREATE TABLE donations (
    id BIGSERIAL PRIMARY KEY,

    request_id BIGINT NOT NULL
        REFERENCES blood_requests(id)
        ON DELETE RESTRICT,

    donor_id BIGINT NOT NULL
        REFERENCES donors(id)
        ON DELETE RESTRICT,

    units INTEGER NOT NULL
        CHECK (units > 0),

    status donation_status NOT NULL DEFAULT 'SCHEDULED',

    confirmation_method confirmation_method,

    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    confirmed_at TIMESTAMPTZ,

    confirmed_by_user_id BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donations_request
    ON donations(request_id);

CREATE INDEX idx_donations_donor
    ON donations(donor_id);

CREATE INDEX idx_donations_status
    ON donations(status);


-- =========================================================
-- DONATION QR TOKENS
-- /api/donations/{id}/qr
-- /api/donations/confirm-qr
-- =========================================================

CREATE TABLE donation_qr_tokens (
    id BIGSERIAL PRIMARY KEY,

    donation_id BIGINT NOT NULL UNIQUE
        REFERENCES donations(id)
        ON DELETE CASCADE,

    qr_token TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ,

    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qr_token
    ON donation_qr_tokens(qr_token);

CREATE INDEX idx_qr_expiry
    ON donation_qr_tokens(expires_at);