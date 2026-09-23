-- Migration: 20260923000002_atomic_payment_success.sql
-- Description: PostgreSQL RPC for atomic payment webhook processing

CREATE OR REPLACE FUNCTION handle_successful_payment(
    p_provider_order_id TEXT,
    p_provider_payment_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_payment_id UUID;
    v_member_id UUID;
    v_package_id UUID;
    v_package_name TEXT;
    v_amount NUMERIC;
    v_current_status TEXT;
    v_duration_months INT;
    v_active_end_date TIMESTAMPTZ;
    v_start_date TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
    v_next_due_date TIMESTAMPTZ;
    v_membership_id UUID;
BEGIN
    -- 1. Lock the payment row to prevent concurrent webhook processing
    SELECT p.id, p.member_id, p.package_id, p.package_name, p.amount, p.status, pkg.duration_months
    INTO v_payment_id, v_member_id, v_package_id, v_package_name, v_amount, v_current_status, v_duration_months
    FROM public.payments p
    JOIN public.packages pkg ON p.package_id = pkg.id
    WHERE p.provider_order_id = p_provider_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found for order ID %', p_provider_order_id;
    END IF;

    -- 2. Idempotency Check
    IF v_current_status IN ('success', 'failed') THEN
        RETURN jsonb_build_object('status', 'already processed', 'payment_id', v_payment_id);
    END IF;

    -- 3. Calculate Dates for the new membership cycle
    SELECT end_date INTO v_active_end_date
    FROM public.memberships
    WHERE member_id = v_member_id AND status IN ('active', 'paused')
    ORDER BY end_date DESC
    LIMIT 1;

    IF v_active_end_date IS NOT NULL AND v_active_end_date > NOW() THEN
        v_start_date := v_active_end_date + INTERVAL '1 day';
    ELSE
        v_start_date := NOW();
    END IF;

    -- Use PostgreSQL interval addition for accurate month arithmetic
    v_end_date := v_start_date + (v_duration_months || ' months')::INTERVAL;
    v_next_due_date := v_end_date + INTERVAL '1 day';

    -- 4. Create the new membership cycle
    INSERT INTO public.memberships (
        member_id, package_id, package_name, amount, start_date, end_date, next_due_date, status, reminder_status
    )
    VALUES (
        v_member_id, v_package_id, v_package_name, v_amount, v_start_date, v_end_date, v_next_due_date, 'active', 'active'
    )
    RETURNING id INTO v_membership_id;

    -- 5. Update the payment row
    UPDATE public.payments
    SET status = 'success',
        provider_payment_id = p_provider_payment_id,
        membership_id = v_membership_id,
        payment_date = NOW(),
        updated_at = NOW()
    WHERE id = v_payment_id;

    RETURN jsonb_build_object(
        'status', 'processed',
        'payment_id', v_payment_id,
        'membership_id', v_membership_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
