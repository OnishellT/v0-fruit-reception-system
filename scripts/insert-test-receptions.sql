-- Test Data: Create Sample Receptions
-- Run this in Supabase SQL Editor
-- This creates 3 receptions: 2 CAFÉ-Seco (for testing quality) and 1 MANGO (control)

DO $$
DECLARE
    prov_id UUID;
    driv_id UUID;
    cafe_seco_id UUID;
    mango_id UUID;
    user_id UUID;
    date_str TEXT;
    rec_num1 TEXT;
    rec_num2 TEXT;
    rec_num3 TEXT;
    rec1_id UUID;
    rec2_id UUID;
    rec3_id UUID;
BEGIN
    -- Get IDs
    SELECT id INTO prov_id FROM providers WHERE code = 'PROV001' LIMIT 1;
    SELECT id INTO driv_id FROM drivers WHERE name = 'Pedro González' LIMIT 1;
    SELECT id INTO cafe_seco_id FROM fruit_types WHERE type = 'CAFÉ' AND subtype = 'Seco' LIMIT 1;
    SELECT id INTO mango_id FROM fruit_types WHERE type = 'MANGO' AND subtype = 'Congelado' LIMIT 1;
    SELECT id INTO user_id FROM users WHERE username = 'admin' LIMIT 1;

    -- Generate reception numbers
    date_str := to_char(CURRENT_DATE, 'YYYYMMDD');
    rec_num1 := 'REC-' || date_str || '-0001';
    rec_num2 := 'REC-' || date_str || '-0002';
    rec_num3 := 'REC-' || date_str || '-0003';

    -- Insert 2 CAFÉ-Seco receptions (these will show the quality button)
    INSERT INTO receptions (reception_number, provider_id, driver_id, fruit_type_id, truck_plate, total_containers, created_by)
    VALUES
      (rec_num1, prov_id, driv_id, cafe_seco_id, 'ABC123', 10, user_id),
      (rec_num3, prov_id, driv_id, cafe_seco_id, 'GHI789', 8, user_id)
    RETURNING id INTO rec1_id, id INTO rec3_id;

    -- Insert 1 MANGO reception (this should NOT show quality button)
    INSERT INTO receptions (reception_number, provider_id, driver_id, fruit_type_id, truck_plate, total_containers, created_by)
    VALUES (rec_num2, prov_id, driv_id, mango_id, 'DEF456', 15, user_id)
    RETURNING id INTO rec2_id;

    -- Create reception details with weights
    -- For rec1 (10 containers, ~50kg each = 500kg total)
    FOR i IN 1..10 LOOP
        INSERT INTO reception_details (reception_id, fruit_type_id, quantity, weight_kg, line_number)
        VALUES (rec1_id, cafe_seco_id, 1, 50.0 + (i * 0.5), i);
    END LOOP;

    -- For rec2 (15 containers, ~50kg each = 750kg total)
    FOR i IN 1..15 LOOP
        INSERT INTO reception_details (reception_id, fruit_type_id, quantity, weight_kg, line_number)
        VALUES (rec2_id, mango_id, 1, 50.0, i);
    END LOOP;

    -- For rec3 (8 containers, ~50kg each = 400kg total)
    FOR i IN 1..8 LOOP
        INSERT INTO reception_details (reception_id, fruit_type_id, quantity, weight_kg, line_number)
        VALUES (rec3_id, cafe_seco_id, 1, 50.0, i);
    END LOOP;

    RAISE NOTICE 'Created 3 test receptions successfully!';
    RAISE NOTICE '  - REC-0001: CAFÉ-Seco (10 containers)';
    RAISE NOTICE '  - REC-0002: MANGO (15 containers)';
    RAISE NOTICE '  - REC-0003: CAFÉ-Seco (8 containers)';
    RAISE NOTICE 'The two CAFÉ-Seco receptions will show the quality button!';
END $$;
