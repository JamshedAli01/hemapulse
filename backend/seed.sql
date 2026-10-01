-- ============================================================
-- SMART BLOOD & EMERGENCY DONOR NETWORK
-- HACKATHON DEMO SEED DATA
-- ============================================================
--
-- Demo password for all seeded users:
-- Hackathon@123
--
-- PostgreSQL + pgcrypto required.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- 1. USERS
-- ============================================================

INSERT INTO users
    (name, email, phone, password_hash, role, is_active)
VALUES
    (
        'System Admin',
        'admin@bloodnet.pk',
        '+923001111111',
        crypt('Hackathon@123', gen_salt('bf', 12)),
        'ADMIN',
        TRUE
    ),
    (
        'Ahmed Khan',
        'ahmed.requester@bloodnet.pk',
        '+923002222222',
        crypt('Hackathon@123', gen_salt('bf', 12)),
        'REQUESTER',
        TRUE
    ),
    (
        'Ali Raza',
        'ali.requester@bloodnet.pk',
        '+923003333333',
        crypt('Hackathon@123', gen_salt('bf', 12)),
        'REQUESTER',
        TRUE
    ),
    (
        'Usman Ahmed',
        'usman.donor@bloodnet.pk',
        '+923041111111',
        crypt('Hackathon@123', gen_salt('bf', 12)),
        'DONOR',
        TRUE
    ),
    (
        'Bilal Hussain',
        'bilal.donor@bloodnet.pk',
        '+923042222222',
        crypt('Hackathon@123', gen_salt('bf', 12)),
        'DONOR',
        TRUE
    ),
    (
        'Hamza Ali',
        'hamza.donor@bloodnet.pk',
        '+923043333333',
        crypt('Hackathon@123', gen_salt('bf', 12)),
        'DONOR',
        TRUE
    ),
    (
        'Saad Ahmed',
        'saad.donor@bloodnet.pk',
        '+923044444444',
        crypt('Hackathon@123', gen_salt('bf', 12)),
        'DONOR',
        TRUE
    ),
    (
        'Fahad Khan',
        'fahad.donor@bloodnet.pk',
        '+923045555555',
        crypt('Hackathon@123', gen_salt('bf', 12)),
        'DONOR',
        TRUE
    ),
    (
        'Hassan Raza',
        'hassan.donor@bloodnet.pk',
        '+923046666666',
        crypt('Hackathon@123', gen_salt('bf', 12)),
        'DONOR',
        TRUE
    ),
    (
        'Civil Hospital Admin',
        'hospital@bloodnet.pk',
        '+923047777777',
        crypt('Hackathon@123', gen_salt('bf', 12)),
        'HOSPITAL',
        TRUE
    )
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- 2. DONORS
-- ============================================================

INSERT INTO donors
    (
        user_id,
        blood_group,
        date_of_birth,
        city,
        latitude,
        longitude,
        is_available,
        is_eligible,
        last_donation_date
    )
SELECT
    u.id,
    x.blood_group::blood_group,
    x.date_of_birth::date,
    x.city,
    x.latitude,
    x.longitude,
    x.is_available,
    x.is_eligible,
    x.last_donation_date::date
FROM (
    VALUES
        (
            'usman.donor@bloodnet.pk',
            'O+',
            '1998-05-12',
            'Jamshoro',
            25.4300,
            68.2800,
            TRUE,
            TRUE,
            '2026-06-15'
        ),
        (
            'bilal.donor@bloodnet.pk',
            'A+',
            '1997-09-21',
            'Hyderabad',
            25.3960,
            68.3578,
            TRUE,
            TRUE,
            '2026-07-10'
        ),
        (
            'hamza.donor@bloodnet.pk',
            'B+',
            '1999-02-17',
            'Hyderabad',
            25.4100,
            68.3700,
            TRUE,
            TRUE,
            '2026-05-20'
        ),
        (
            'saad.donor@bloodnet.pk',
            'O-',
            '1996-11-03',
            'Jamshoro',
            25.4250,
            68.2750,
            TRUE,
            TRUE,
            '2026-04-05'
        ),
        (
            'fahad.donor@bloodnet.pk',
            'AB+',
            '1998-12-28',
            'Karachi',
            24.8607,
            67.0011,
            FALSE,
            TRUE,
            '2026-08-01'
        ),
        (
            'hassan.donor@bloodnet.pk',
            'A-',
            '2000-03-14',
            'Hyderabad',
            25.4000,
            68.3600,
            TRUE,
            TRUE,
            '2026-03-22'
        )
) AS x(
    email,
    blood_group,
    date_of_birth,
    city,
    latitude,
    longitude,
    is_available,
    is_eligible,
    last_donation_date
)
JOIN users u ON u.email = x.email
WHERE NOT EXISTS (
    SELECT 1
    FROM donors d
    WHERE d.user_id = u.id
);


-- ============================================================
-- 3. HOSPITALS
-- ============================================================

INSERT INTO hospitals
    (
        name,
        address,
        city,
        phone,
        latitude,
        longitude
    )
SELECT *
FROM (
    VALUES
    (
        'Civil Hospital Hyderabad',
        'Wadhu Wah Road, Hyderabad',
        'Hyderabad',
        '+92221300001',
        25.3960,
        68.3578
    ),
    (
        'Liaquat University Hospital',
        'Jamshoro Road, Hyderabad',
        'Hyderabad',
        '+92221300002',
        25.4040,
        68.3660
    ),
    (
        'Jinnah Medical Center',
        'Main University Road, Karachi',
        'Karachi',
        '+92211300003',
        24.8607,
        67.0011
    )
) AS h(
    name,
    address,
    city,
    phone,
    latitude,
    longitude
)
WHERE NOT EXISTS (
    SELECT 1
    FROM hospitals existing
    WHERE existing.name = h.name
);


-- ============================================================
-- 4. BLOOD REQUESTS
-- ============================================================

-- Critical O- request
INSERT INTO blood_requests
(
    hospital_id,
    created_by_user_id,
    blood_group,
    units_required,
    units_fulfilled,
    required_before,
    description,
    latitude,
    longitude,
    status,
    urgency,
    verified,
    verification_notes,
    verified_at,
    verified_by_user_id
)
SELECT
    h.id,
    u.id,
    'O-',
    3,
    0,
    NOW() + INTERVAL '3 hours',
    'Emergency surgery requires O-negative blood immediately.',
    h.latitude,
    h.longitude,
    'MATCHING',
    'CRITICAL',
    TRUE,
    'Hospital verified emergency requirement.',
    NOW() - INTERVAL '20 minutes',
    admin.id
FROM hospitals h
JOIN users u
    ON u.email = 'ahmed.requester@bloodnet.pk'
JOIN users admin
    ON admin.email = 'admin@bloodnet.pk'
WHERE h.name = 'Civil Hospital Hyderabad'
AND NOT EXISTS (
    SELECT 1
    FROM blood_requests br
    WHERE br.description =
        'Emergency surgery requires O-negative blood immediately.'
);


-- High A+ request
INSERT INTO blood_requests
(
    hospital_id,
    created_by_user_id,
    blood_group,
    units_required,
    units_fulfilled,
    required_before,
    description,
    latitude,
    longitude,
    status,
    urgency,
    verified,
    verification_notes,
    verified_at,
    verified_by_user_id
)
SELECT
    h.id,
    u.id,
    'A+',
    2,
    1,
    NOW() + INTERVAL '8 hours',
    'Patient requires A-positive blood for scheduled surgery.',
    h.latitude,
    h.longitude,
    'MATCHING',
    'HIGH',
    TRUE,
    'Request verified by hospital administration.',
    NOW() - INTERVAL '1 hour',
    admin.id
FROM hospitals h
JOIN users u
    ON u.email = 'ali.requester@bloodnet.pk'
JOIN users admin
    ON admin.email = 'admin@bloodnet.pk'
WHERE h.name = 'Liaquat University Hospital'
AND NOT EXISTS (
    SELECT 1
    FROM blood_requests br
    WHERE br.description =
        'Patient requires A-positive blood for scheduled surgery.'
);


-- Medium B+ request
INSERT INTO blood_requests
(
    hospital_id,
    created_by_user_id,
    blood_group,
    units_required,
    units_fulfilled,
    required_before,
    description,
    latitude,
    longitude,
    status,
    urgency,
    verified
)
SELECT
    h.id,
    u.id,
    'B+',
    2,
    0,
    NOW() + INTERVAL '2 days',
    'B-positive blood required for patient treatment.',
    h.latitude,
    h.longitude,
    'VERIFIED',
    'MEDIUM',
    TRUE
FROM hospitals h
JOIN users u
    ON u.email = 'ahmed.requester@bloodnet.pk'
WHERE h.name = 'Civil Hospital Hyderabad'
AND NOT EXISTS (
    SELECT 1
    FROM blood_requests br
    WHERE br.description =
        'B-positive blood required for patient treatment.'
);


-- Fulfilled O+ request
INSERT INTO blood_requests
(
    hospital_id,
    created_by_user_id,
    blood_group,
    units_required,
    units_fulfilled,
    required_before,
    description,
    latitude,
    longitude,
    status,
    urgency,
    verified,
    verification_notes,
    verified_at,
    verified_by_user_id,
    fulfilled_at
)
SELECT
    h.id,
    u.id,
    'O+',
    2,
    2,
    NOW() - INTERVAL '1 day',
    'O-positive blood request successfully fulfilled.',
    h.latitude,
    h.longitude,
    'FULFILLED',
    'HIGH',
    TRUE,
    'Hospital verified and request fulfilled.',
    NOW() - INTERVAL '2 days',
    admin.id,
    NOW() - INTERVAL '5 hours'
FROM hospitals h
JOIN users u
    ON u.email = 'ali.requester@bloodnet.pk'
JOIN users admin
    ON admin.email = 'admin@bloodnet.pk'
WHERE h.name = 'Liaquat University Hospital'
AND NOT EXISTS (
    SELECT 1
    FROM blood_requests br
    WHERE br.description =
        'O-positive blood request successfully fulfilled.'
);


-- Cancelled AB+ request
INSERT INTO blood_requests
(
    hospital_id,
    created_by_user_id,
    blood_group,
    units_required,
    units_fulfilled,
    required_before,
    description,
    latitude,
    longitude,
    status,
    urgency,
    verified,
    cancelled_at
)
SELECT
    h.id,
    u.id,
    'AB+',
    1,
    0,
    NOW() + INTERVAL '1 day',
    'AB-positive blood request cancelled by requester.',
    h.latitude,
    h.longitude,
    'CANCELLED',
    'LOW',
    FALSE,
    NOW() - INTERVAL '2 hours'
FROM hospitals h
JOIN users u
    ON u.email = 'ahmed.requester@bloodnet.pk'
WHERE h.name = 'Jinnah Medical Center'
AND NOT EXISTS (
    SELECT 1
    FROM blood_requests br
    WHERE br.description =
        'AB-positive blood request cancelled by requester.'
);


-- Pending A- request
INSERT INTO blood_requests
(
    hospital_id,
    created_by_user_id,
    blood_group,
    units_required,
    units_fulfilled,
    required_before,
    description,
    latitude,
    longitude,
    status,
    urgency,
    verified
)
SELECT
    h.id,
    u.id,
    'A-',
    1,
    0,
    NOW() + INTERVAL '12 hours',
    'A-negative blood requested for emergency patient.',
    h.latitude,
    h.longitude,
    'PENDING',
    'HIGH',
    FALSE
FROM hospitals h
JOIN users u
    ON u.email = 'ali.requester@bloodnet.pk'
WHERE h.name = 'Civil Hospital Hyderabad'
AND NOT EXISTS (
    SELECT 1
    FROM blood_requests br
    WHERE br.description =
        'A-negative blood requested for emergency patient.'
);


-- ============================================================
-- 5. AI REQUEST ANALYSES
-- ============================================================

INSERT INTO ai_request_analyses
(
    request_id,
    description,
    urgency,
    summary,
    is_duplicate,
    duplicate_request_id,
    duplicate_confidence,
    ai_provider,
    ai_model,
    raw_response
)
SELECT
    br.id,
    br.description,
    'CRITICAL',
    'Emergency O-negative blood requirement detected. Immediate donor matching recommended.',
    FALSE,
    NULL,
    0.0300,
    'OpenAI',
    'gpt-5.6',
    jsonb_build_object(
        'urgency', 'CRITICAL',
        'blood_group', 'O-',
        'recommended_action', 'Immediate donor matching'
    )
FROM blood_requests br
WHERE br.description =
    'Emergency surgery requires O-negative blood immediately.'
AND NOT EXISTS (
    SELECT 1
    FROM ai_request_analyses a
    WHERE a.request_id = br.id
);


INSERT INTO ai_request_analyses
(
    request_id,
    description,
    urgency,
    summary,
    is_duplicate,
    duplicate_confidence,
    ai_provider,
    ai_model,
    raw_response
)
SELECT
    br.id,
    br.description,
    'HIGH',
    'A-positive blood is needed for a scheduled surgery. Nearby eligible donors should be contacted.',
    FALSE,
    0.0800,
    'OpenAI',
    'gpt-5.6',
    jsonb_build_object(
        'urgency', 'HIGH',
        'blood_group', 'A+',
        'recommended_action', 'Contact nearby donors'
    )
FROM blood_requests br
WHERE br.description =
    'Patient requires A-positive blood for scheduled surgery.'
AND NOT EXISTS (
    SELECT 1
    FROM ai_request_analyses a
    WHERE a.request_id = br.id
);


-- ============================================================
-- 6. REQUEST MATCHES
-- ============================================================

-- O- emergency -> Saad
INSERT INTO request_matches
(
    request_id,
    donor_id,
    distance_km,
    compatibility_score,
    availability_score,
    urgency_score,
    total_score,
    rank,
    radius_km,
    batch_number,
    is_notified
)
SELECT
    br.id,
    d.id,
    1.20,
    100.000,
    100.000,
    100.000,
    100.000,
    1,
    5.000,
    1,
    TRUE
FROM blood_requests br
JOIN donors d
    ON d.blood_group = 'O-'
WHERE br.description =
    'Emergency surgery requires O-negative blood immediately.'
AND NOT EXISTS (
    SELECT 1
    FROM request_matches rm
    WHERE rm.request_id = br.id
      AND rm.donor_id = d.id
);


-- A+ request -> Bilal
INSERT INTO request_matches
(
    request_id,
    donor_id,
    distance_km,
    compatibility_score,
    availability_score,
    urgency_score,
    total_score,
    rank,
    radius_km,
    batch_number,
    is_notified
)
SELECT
    br.id,
    d.id,
    2.10,
    100.000,
    100.000,
    90.000,
    96.500,
    1,
    5.000,
    1,
    TRUE
FROM blood_requests br
JOIN donors d
    ON d.blood_group = 'A+'
WHERE br.description =
    'Patient requires A-positive blood for scheduled surgery.'
AND NOT EXISTS (
    SELECT 1
    FROM request_matches rm
    WHERE rm.request_id = br.id
      AND rm.donor_id = d.id
);


-- A+ request -> Hassan (A-)
INSERT INTO request_matches
(
    request_id,
    donor_id,
    distance_km,
    compatibility_score,
    availability_score,
    urgency_score,
    total_score,
    rank,
    radius_km,
    batch_number,
    is_notified
)
SELECT
    br.id,
    d.id,
    2.50,
    90.000,
    100.000,
    90.000,
    92.000,
    2,
    5.000,
    1,
    TRUE
FROM blood_requests br
JOIN donors d
    ON d.blood_group = 'A-'
WHERE br.description =
    'Patient requires A-positive blood for scheduled surgery.'
AND NOT EXISTS (
    SELECT 1
    FROM request_matches rm
    WHERE rm.request_id = br.id
      AND rm.donor_id = d.id
);


-- B+ request -> Hamza
INSERT INTO request_matches
(
    request_id,
    donor_id,
    distance_km,
    compatibility_score,
    availability_score,
    urgency_score,
    total_score,
    rank,
    radius_km,
    batch_number,
    is_notified
)
SELECT
    br.id,
    d.id,
    3.10,
    100.000,
    100.000,
    70.000,
    90.000,
    1,
    10.000,
    1,
    FALSE
FROM blood_requests br
JOIN donors d
    ON d.blood_group = 'B+'
WHERE br.description =
    'B-positive blood required for patient treatment.'
AND NOT EXISTS (
    SELECT 1
    FROM request_matches rm
    WHERE rm.request_id = br.id
      AND rm.donor_id = d.id
);


-- ============================================================
-- 7. DONOR RESPONSES
-- ============================================================

-- Saad accepts emergency O- request
INSERT INTO donor_responses
(
    request_id,
    donor_id,
    status,
    reason
)
SELECT
    br.id,
    d.id,
    'ACCEPTED',
    'I can reach the hospital immediately.'
FROM blood_requests br
JOIN donors d
    ON d.blood_group = 'O-'
WHERE br.description =
    'Emergency surgery requires O-negative blood immediately.'
AND NOT EXISTS (
    SELECT 1
    FROM donor_responses dr
    WHERE dr.request_id = br.id
      AND dr.donor_id = d.id
);


-- Bilal accepts A+ request
INSERT INTO donor_responses
(
    request_id,
    donor_id,
    status,
    reason
)
SELECT
    br.id,
    d.id,
    'ACCEPTED',
    'Available and ready to donate.'
FROM blood_requests br
JOIN donors d
    ON d.blood_group = 'A+'
WHERE br.description =
    'Patient requires A-positive blood for scheduled surgery.'
AND NOT EXISTS (
    SELECT 1
    FROM donor_responses dr
    WHERE dr.request_id = br.id
      AND dr.donor_id = d.id
);


-- Hassan declines A+ request
INSERT INTO donor_responses
(
    request_id,
    donor_id,
    status,
    reason
)
SELECT
    br.id,
    d.id,
    'DECLINED',
    'Currently unavailable due to personal commitment.'
FROM blood_requests br
JOIN donors d
    ON d.blood_group = 'A-'
WHERE br.description =
    'Patient requires A-positive blood for scheduled surgery.'
AND NOT EXISTS (
    SELECT 1
    FROM donor_responses dr
    WHERE dr.request_id = br.id
      AND dr.donor_id = d.id
);


-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================

-- Emergency O- notification
INSERT INTO notifications
(
    request_id,
    donor_id,
    recipient_user_id,
    channel,
    status,
    title,
    message,
    sent_at,
    external_message_id
)
SELECT
    br.id,
    d.id,
    u.id,
    'IN_APP',
    'SENT',
    'CRITICAL BLOOD REQUEST',
    'Emergency O-negative blood is urgently required at Civil Hospital Hyderabad.',
    NOW() - INTERVAL '15 minutes',
    'DEMO-INAPP-001'
FROM blood_requests br
JOIN donors d
    ON d.blood_group = 'O-'
JOIN users u
    ON u.id = d.user_id
WHERE br.description =
    'Emergency surgery requires O-negative blood immediately.'
AND NOT EXISTS (
    SELECT 1
    FROM notifications n
    WHERE n.request_id = br.id
      AND n.donor_id = d.id
      AND n.channel = 'IN_APP'
);


-- SMS notification for Bilal
INSERT INTO notifications
(
    request_id,
    donor_id,
    recipient_user_id,
    channel,
    status,
    title,
    message,
    sent_at,
    external_message_id
)
SELECT
    br.id,
    d.id,
    u.id,
    'SMS',
    'SENT',
    'Blood Donation Request',
    'A+ blood is urgently required at Liaquat University Hospital.',
    NOW() - INTERVAL '30 minutes',
    'DEMO-SMS-001'
FROM blood_requests br
JOIN donors d
    ON d.blood_group = 'A+'
JOIN users u
    ON u.id = d.user_id
WHERE br.description =
    'Patient requires A-positive blood for scheduled surgery.'
AND NOT EXISTS (
    SELECT 1
    FROM notifications n
    WHERE n.request_id = br.id
      AND n.donor_id = d.id
      AND n.channel = 'SMS'
);


-- Email notification
INSERT INTO notifications
(
    request_id,
    donor_id,
    recipient_user_id,
    channel,
    status,
    title,
    message,
    sent_at,
    external_message_id
)
SELECT
    br.id,
    d.id,
    u.id,
    'EMAIL',
    'SENT',
    'Blood Donation Request',
    'Your blood group matches an active blood request near you.',
    NOW() - INTERVAL '20 minutes',
    'DEMO-EMAIL-001'
FROM blood_requests br
JOIN donors d
    ON d.blood_group = 'A-'
JOIN users u
    ON u.id = d.user_id
WHERE br.description =
    'Patient requires A-positive blood for scheduled surgery.'
AND NOT EXISTS (
    SELECT 1
    FROM notifications n
    WHERE n.request_id = br.id
      AND n.donor_id = d.id
      AND n.channel = 'EMAIL'
);


-- ============================================================
-- 9. DONATION
-- ============================================================

-- Confirmed donation for fulfilled O+ request
INSERT INTO donations
(
    request_id,
    donor_id,
    units,
    status,
    confirmation_method,
    scheduled_at,
    confirmed_at,
    confirmed_by_user_id
)
SELECT
    br.id,
    d.id,
    1,
    'CONFIRMED',
    'HOSPITAL',
    NOW() - INTERVAL '8 hours',
    NOW() - INTERVAL '5 hours',
    admin.id
FROM blood_requests br
JOIN donors d
    ON d.blood_group = 'O+'
JOIN users admin
    ON admin.email = 'admin@bloodnet.pk'
WHERE br.description =
    'O-positive blood request successfully fulfilled.'
AND NOT EXISTS (
    SELECT 1
    FROM donations dn
    WHERE dn.request_id = br.id
      AND dn.donor_id = d.id
);


-- Scheduled donation for A+ request
INSERT INTO donations
(
    request_id,
    donor_id,
    units,
    status,
    confirmation_method,
    scheduled_at
)
SELECT
    br.id,
    d.id,
    1,
    'SCHEDULED',
    NULL,
    NOW() + INTERVAL '2 hours'
FROM blood_requests br
JOIN donors d
    ON d.blood_group = 'A+'
WHERE br.description =
    'Patient requires A-positive blood for scheduled surgery.'
AND NOT EXISTS (
    SELECT 1
    FROM donations dn
    WHERE dn.request_id = br.id
      AND dn.donor_id = d.id
);


-- ============================================================
-- 10. QR TOKEN
-- ============================================================

INSERT INTO donation_qr_tokens
(
    donation_id,
    qr_token,
    expires_at,
    used_at
)
SELECT
    dn.id,
    encode(gen_random_bytes(24), 'hex'),
    NOW() + INTERVAL '24 hours',
    NULL
FROM donations dn
JOIN blood_requests br
    ON br.id = dn.request_id
WHERE dn.status = 'SCHEDULED'
  AND br.description =
      'Patient requires A-positive blood for scheduled surgery.'
AND NOT EXISTS (
    SELECT 1
    FROM donation_qr_tokens q
    WHERE q.donation_id = dn.id
);


-- ============================================================
-- 11. UPDATE DONOR AVAILABILITY
-- ============================================================

-- Donor who already donated becomes unavailable
UPDATE donors
SET
    is_available = FALSE,
    updated_at = NOW()
WHERE user_id = (
    SELECT id
    FROM users
    WHERE email = 'usman.donor@bloodnet.pk'
);


-- ============================================================
-- 12. UPDATE MATCH NOTIFICATION STATUS
-- ============================================================

UPDATE request_matches rm
SET is_notified = TRUE
WHERE EXISTS (
    SELECT 1
    FROM notifications n
    WHERE n.request_id = rm.request_id
      AND n.donor_id = rm.donor_id
);


-- ============================================================
-- 13. RESET SEQUENCES
-- ============================================================

SELECT setval(
    pg_get_serial_sequence('users', 'id'),
    COALESCE((SELECT MAX(id) FROM users), 1),
    TRUE
);

SELECT setval(
    pg_get_serial_sequence('donors', 'id'),
    COALESCE((SELECT MAX(id) FROM donors), 1),
    TRUE
);

SELECT setval(
    pg_get_serial_sequence('hospitals', 'id'),
    COALESCE((SELECT MAX(id) FROM hospitals), 1),
    TRUE
);

SELECT setval(
    pg_get_serial_sequence('blood_requests', 'id'),
    COALESCE((SELECT MAX(id) FROM blood_requests), 1),
    TRUE
);

SELECT setval(
    pg_get_serial_sequence('ai_request_analyses', 'id'),
    COALESCE((SELECT MAX(id) FROM ai_request_analyses), 1),
    TRUE
);

SELECT setval(
    pg_get_serial_sequence('request_matches', 'id'),
    COALESCE((SELECT MAX(id) FROM request_matches), 1),
    TRUE
);

SELECT setval(
    pg_get_serial_sequence('donor_responses', 'id'),
    COALESCE((SELECT MAX(id) FROM donor_responses), 1),
    TRUE
);

SELECT setval(
    pg_get_serial_sequence('notifications', 'id'),
    COALESCE((SELECT MAX(id) FROM notifications), 1),
    TRUE
);

SELECT setval(
    pg_get_serial_sequence('donations', 'id'),
    COALESCE((SELECT MAX(id) FROM donations), 1),
    TRUE
);

SELECT setval(
    pg_get_serial_sequence('donation_qr_tokens', 'id'),
    COALESCE((SELECT MAX(id) FROM donation_qr_tokens), 1),
    TRUE
);


COMMIT;


-- ============================================================
-- 14. VERIFICATION
-- ============================================================

SELECT 'users' AS table_name, COUNT(*) AS records FROM users
UNION ALL
SELECT 'donors', COUNT(*) FROM donors
UNION ALL
SELECT 'hospitals', COUNT(*) FROM hospitals
UNION ALL
SELECT 'blood_requests', COUNT(*) FROM blood_requests
UNION ALL
SELECT 'ai_request_analyses', COUNT(*) FROM ai_request_analyses
UNION ALL
SELECT 'request_matches', COUNT(*) FROM request_matches
UNION ALL
SELECT 'donor_responses', COUNT(*) FROM donor_responses
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'donations', COUNT(*) FROM donations
UNION ALL
SELECT 'donation_qr_tokens', COUNT(*) FROM donation_qr_tokens
ORDER BY table_name;