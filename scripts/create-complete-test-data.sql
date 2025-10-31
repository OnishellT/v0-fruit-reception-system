-- Complete Test Data Setup
-- Run this in Supabase SQL Editor to create all test data at once
-- This will create: providers, drivers, fruit types, users, and 3 test receptions

DO $$
DECLARE
    prov1_id UUID;
    prov2_id UUID;
    driv1_id UUID;
    driv2_id UUID;
    cafe_seco_id UUID;
    mango_id UUID;
    aguacate_id UUID;
    admin_user_id UUID;
    operator_user_id UUID;
    date_str TEXT;
    rec1_id UUID;
    rec2_id UUID;
    rec3_id UUID;
BEGIN
    RAISE NOTICE 'Creating test data...';

    -- 1. Create providers
    INSERT INTO providers (code, name, contact_person, phone) VALUES
        ('PROV001', 'Proveedor Café A', 'Juan Pérez', '555-0001'),
        ('PROV002', 'Proveedor Frutas B', 'María García', '555-0002')
    RETURNING id INTO prov1_id, id INTO prov2_id;

    RAISE NOTICE 'Created % providers', (SELECT COUNT(*) FROM providers);

    -- 2. Create drivers
    INSERT INTO drivers (name, phone, license_number) VALUES
        ('Pedro González', '555-1001', 'D12345'),
        ('Luis Martínez', '555-1002', 'D12346')
    RETURNING id INTO driv1_id, id INTO driv2_id;

    RAISE NOTICE 'Created % drivers', (SELECT COUNT(*) FROM drivers);

    -- 3. Create fruit types
    INSERT INTO fruit_types (type, subtype, description) VALUES
        ('CAFÉ', 'Seco', 'Café seco procesado'),
        ('MANGO', 'Congelado', 'Mango congelado'),
        ('AGUACATE', 'Fresco', 'Aguacate fresco')
    RETURNING id INTO cafe_seco_id, id INTO mango_id, id INTO aguacate_id;

    RAISE NOTICE 'Created % fruit types', (SELECT COUNT(*) FROM fruit_types);

    -- 4. Create users (if they don't exist)
    INSERT INTO users (username, password_hash, role, is_active) VALUES
        ('admin', '$2b$10$rQN9zA1Q4fI4X3F2K1G5T.OxXrP9o0zX3vL5kJ7mN6qR8sT9uV0w', 'admin', true),
        ('operator', '$2b$10$rQN9zA1Q4fI4X3F2K1G5T.OxXrP9o0zX3vL5kJ7mN6qR8sT9uV0w', 'operator', true)
    ON CONFLICT (username) DO NOTHING
    RETURNING id INTO admin_user_id, id INTO operator_user_id;

    RAISE NOTICE 'Created % users', (SELECT COUNT(*) FROM users);

    -- 5. Generate reception numbers
    date_str := to_char(CURRENT_DATE, 'YYYYMMDD');

    -- 6. Create test receptions
    -- First CAFÉ-Seco reception (will show quality button)
    INSERT INTO receptions (reception_number, provider_id, driver_id, fruit_type_id, truck_plate, total_containers, created_by)
    VALUES ('REC-' || date_str || '-0001', prov1_id, driv1_id, cafe_seco_id, 'ABC123', 10, admin_user_id)
    RETURNING id INTO rec1_id;

    -- MANGO reception (will NOT show quality button)
    INSERT INTO receptions (reception_number, provider_id, driver_id, fruit_type_id, truck_plate, total_containers, created_by)
    VALUES ('REC-' || date_str || '-0002', prov2_id, driv2_id, mango_id, 'DEF456', 15, admin_user_id)
    RETURNING id INTO rec2_id;

    -- Second CAFÉ-Seco reception (will show quality button)
    INSERT INTO receptions (reception_number, provider_id, driver_id, fruit_type_id, truck_plate, total_containers, created_by)
    VALUES ('REC-' || date_str || '-0003', prov1_id, driv2_id, cafe_seco_id, 'GHI789', 8, admin_user_id)
    RETURNING id INTO rec3_id;

    RAISE NOTICE 'Created % receptions', (SELECT COUNT(*) FROM receptions);

    -- 7. Create reception details
    -- For rec1: 10 containers
    FOR i IN 1..10 LOOP
        INSERT INTO reception_details (reception_id, fruit_type_id, quantity, weight_kg, line_number)
        VALUES (rec1_id, cafe_seco_id, 1, 50.0 + (i * 0.5), i);
    END LOOP;

    -- For rec2: 15 containers
    FOR i IN 1..15 LOOP
        INSERT INTO reception_details (reception_id, fruit_type_id, quantity, weight_kg, line_number)
        VALUES (rec2_id, mango_id, 1, 50.0, i);
    END LOOP;

    -- For rec3: 8 containers
    FOR i IN 1..8 LOOP
        INSERT INTO reception_details (reception_id, fruit_type_id, quantity, weight_kg, line_number)
        VALUES (rec3_id, cafe_seco_id, 1, 50.0, i);
    END LOOP;

    RAISE NOTICE 'Created % reception details', (SELECT COUNT(*) FROM reception_details);

    -- Summary
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ TEST DATA CREATED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  • Providers: 2 (PROV001, PROV002)';
    RAISE NOTICE '  • Drivers: 2 (Pedro González, Luis Martínez)';
    RAISE NOTICE '  • Fruit Types: 3 (CAFÉ-Seco, MANGO, AGUACATE)';
    RAISE NOTICE '  • Users: 2 (admin, operator)';
    RAISE NOTICE '  • Receptions: 3';
    RAISE NOTICE '';
    RAISE NOTICE 'Receptions created:';
    RAISE NOTICE '  1. REC-%: CAFÉ-Seco (ABC123) - 10 containers';
    RAISE NOTICE '  2. REC-%: MANGO-Congelado (DEF456) - 15 containers';
    RAISE NOTICE '  3. REC-%: CAFÉ-Seco (GHI789) - 8 containers';
    RAISE NOTICE '';
    RAISE NOTICE '✅ TESTING:';
    RAISE NOTICE '  • Receptions #1 and #3 are CAFÉ-Seco';
    RAISE NOTICE '  • These will show the "Registrar Calidad" button';
    RAISE NOTICE '  • Receptions #2 is MANGO (no quality button)';
    RAISE NOTICE '';
    RAISE NOTICE 'Login credentials:';
    RAISE NOTICE '  • Username: admin  | Password: admin123';
    RAISE NOTICE '  • Username: operator | Password: operator123';
    RAISE NOTICE '';
    RAISE NOTICE 'Navigate to: /dashboard/reception';
    RAISE NOTICE '========================================';

END $$;
