-- ============================================================
-- Migration: 20260924000006_manual_upi_flow.sql
-- Description: Manual UPI Payment Verification System
-- ============================================================


-- ============================================================
-- SECTION 1: PACKAGE SCHEMA — Add free_months / total_months
-- ============================================================
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS free_months INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_months INTEGER;

-- Backfill total_months for any existing rows that predate this migration
UPDATE public.packages
SET total_months = duration_months + free_months
WHERE total_months IS NULL;

ALTER TABLE public.packages
  ALTER COLUMN total_months SET NOT NULL;


-- ============================================================
-- SECTION 2: SAFE PACKAGE NORMALIZATION + VALIDATION
-- ============================================================
DO $$
DECLARE
    v_monthly_exists BOOLEAN;
    v_one_month_exists BOOLEAN;
    v_missing TEXT[];
    v_pkg_name TEXT;
BEGIN
    -- Check current state of the 1-month package
    SELECT EXISTS(SELECT 1 FROM public.packages WHERE name = 'Monthly')
    INTO v_monthly_exists;

    SELECT EXISTS(SELECT 1 FROM public.packages WHERE name = '1 Month')
    INTO v_one_month_exists;

    -- Handle rename safely
    IF v_monthly_exists AND v_one_month_exists THEN
        RAISE EXCEPTION
            'Both "Monthly" and "1 Month" packages exist. '
            'Manual review required: delete or merge the duplicate '
            'before running this migration.';
    ELSIF v_monthly_exists AND NOT v_one_month_exists THEN
        UPDATE public.packages SET name = '1 Month' WHERE name = 'Monthly';
        RAISE NOTICE 'Renamed package "Monthly" → "1 Month"';
    ELSIF v_one_month_exists THEN
        RAISE NOTICE 'Package "1 Month" already exists, no rename needed';
    END IF;

    -- Apply production commercial values
    UPDATE public.packages SET
        duration_months = 1, free_months = 0, total_months = 1,
        price = 1000, offer = NULL
    WHERE name = '1 Month';

    UPDATE public.packages SET
        duration_months = 3, free_months = 1, total_months = 4,
        price = 3000, offer = 'Save ₹300'
    WHERE name = '3 Months';

    UPDATE public.packages SET
        duration_months = 6, free_months = 4, total_months = 10,
        price = 7000, offer = 'Save ₹1,000'
    WHERE name = '6 Months';

    UPDATE public.packages SET
        duration_months = 12, free_months = 6, total_months = 18,
        price = 10000, offer = 'Save ₹3,000'
    WHERE name = '12 Months';

    -- Validate all four production packages exist
    v_missing := ARRAY[]::TEXT[];
    FOREACH v_pkg_name IN ARRAY ARRAY['1 Month', '3 Months', '6 Months', '12 Months']
    LOOP
        IF NOT EXISTS(SELECT 1 FROM public.packages WHERE name = v_pkg_name) THEN
            v_missing := v_missing || v_pkg_name;
        END IF;
    END LOOP;

    IF array_length(v_missing, 1) > 0 THEN
        RAISE EXCEPTION
            'Missing required production packages: %. '
            'Create them manually or via the seed function before running this migration.',
            array_to_string(v_missing, ', ');
    END IF;

    RAISE NOTICE 'All 4 production packages validated successfully';
END $$;


-- ============================================================
-- SECTION 3: PAYMENT SCHEMA
-- ============================================================
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;

-- membership_id must be nullable: pending payments have no membership yet
ALTER TABLE public.payments
  ALTER COLUMN membership_id DROP NOT NULL;


-- ============================================================
-- SECTION 4: UNIQUE INDEXES
-- ============================================================
-- Drop the old global unique constraint on provider_payment_id
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_provider_payment_id_key;

-- UPI transaction uniqueness: scoped to UPI method only
DROP INDEX IF EXISTS idx_payments_upi_tx;
CREATE UNIQUE INDEX idx_payments_upi_tx
  ON public.payments(provider_payment_id)
  WHERE method = 'upi' AND provider_payment_id IS NOT NULL;

-- Concurrent checkout protection: at most one pending/submitted
-- payment per member per package at any time.
-- Database-level guarantee — no advisory locks needed.
DROP INDEX IF EXISTS idx_payments_pending_checkout;
CREATE UNIQUE INDEX idx_payments_pending_checkout
  ON public.payments(member_id, package_id)
  WHERE status IN ('pending', 'submitted');


-- ============================================================
-- SECTION 5: RPC — create_pending_checkout()
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_pending_checkout(
    p_package_id UUID
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_member_id UUID;
    v_package RECORD;
    v_existing_payment RECORD;
    v_payment_id UUID;
BEGIN
    -- 1. Authenticate
    v_member_id := auth.uid();
    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Load and validate package
    SELECT id, name, duration_months, free_months, total_months, price, active
    INTO v_package
    FROM public.packages
    WHERE id = p_package_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Package not found';
    END IF;

    IF NOT v_package.active THEN
        RAISE EXCEPTION 'Package is not active';
    END IF;

    -- 3. Check for existing pending/submitted payment for same user+package
    SELECT id, amount, status
    INTO v_existing_payment
    FROM public.payments
    WHERE member_id = v_member_id
      AND package_id = p_package_id
      AND status IN ('pending', 'submitted')
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
        RETURN json_build_object(
            'payment_id', v_existing_payment.id,
            'amount', v_existing_payment.amount,
            'package_name', v_package.name,
            'paid_months', v_package.duration_months,
            'free_months', v_package.free_months,
            'total_months', v_package.total_months,
            'existing', true
        );
    END IF;

    -- 4. Insert — the partial unique index idx_payments_pending_checkout
    --    guarantees that concurrent INSERTs will fail with unique_violation
    --    if a duplicate slips past the SELECT in step 3.
    BEGIN
        INSERT INTO public.payments (
            member_id, package_id, amount, currency, package_name,
            provider, status, method, created_by
        ) VALUES (
            v_member_id, p_package_id, v_package.price, 'INR', v_package.name,
            'upi', 'pending', 'upi', v_member_id
        ) RETURNING id INTO v_payment_id;
    EXCEPTION WHEN unique_violation THEN
        -- Another concurrent request won the race — return it
        SELECT id, amount
        INTO v_existing_payment
        FROM public.payments
        WHERE member_id = v_member_id
          AND package_id = p_package_id
          AND status IN ('pending', 'submitted')
        ORDER BY created_at DESC
        LIMIT 1;

        RETURN json_build_object(
            'payment_id', v_existing_payment.id,
            'amount', v_existing_payment.amount,
            'package_name', v_package.name,
            'paid_months', v_package.duration_months,
            'free_months', v_package.free_months,
            'total_months', v_package.total_months,
            'existing', true
        );
    END;

    RETURN json_build_object(
        'payment_id', v_payment_id,
        'amount', v_package.price,
        'package_name', v_package.name,
        'paid_months', v_package.duration_months,
        'free_months', v_package.free_months,
        'total_months', v_package.total_months,
        'existing', false
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_pending_checkout(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_pending_checkout(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_pending_checkout(UUID) TO authenticated;


-- ============================================================
-- SECTION 6: RPC — submit_payment()
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_payment(
    p_payment_id UUID,
    p_upi_transaction_id TEXT,
    p_payment_date TIMESTAMPTZ
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_member_id UUID;
    v_payment RECORD;
    v_trimmed_tx_id TEXT;
BEGIN
    -- 1. Authenticate
    v_member_id := auth.uid();
    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Validate UPI transaction ID
    v_trimmed_tx_id := trim(p_upi_transaction_id);
    IF v_trimmed_tx_id = '' OR length(v_trimmed_tx_id) < 4 THEN
        RAISE EXCEPTION 'Invalid UPI transaction ID';
    END IF;
    IF length(v_trimmed_tx_id) > 100 THEN
        RAISE EXCEPTION 'UPI transaction ID too long';
    END IF;

    -- 3. Validate payment date
    IF p_payment_date > NOW() + INTERVAL '1 day' THEN
        RAISE EXCEPTION 'Payment date cannot be in the future';
    END IF;

    -- 4. Lock and load the payment row
    SELECT * INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;

    -- 5. Ownership check
    IF v_payment.member_id != v_member_id THEN
        RAISE EXCEPTION 'Payment does not belong to this user';
    END IF;

    -- 6. State check
    IF v_payment.status != 'pending' THEN
        RAISE EXCEPTION 'Payment is not in pending state (current: %)', v_payment.status;
    END IF;

    -- 7. Update with UPI proof
    UPDATE public.payments
    SET status = 'submitted',
        provider_payment_id = v_trimmed_tx_id,
        payment_date = p_payment_date,
        updated_at = NOW()
    WHERE id = p_payment_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_payment(UUID, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_payment(UUID, TEXT, TIMESTAMPTZ) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_payment(UUID, TEXT, TIMESTAMPTZ) TO authenticated;


-- ============================================================
-- SECTION 7: RPC — verify_payment()
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_payment(
    p_payment_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_payment RECORD;
    v_package RECORD;
    v_prev_membership RECORD;
    v_start_date TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
    v_next_due_date TIMESTAMPTZ;
    v_membership_id UUID;
BEGIN
    -- 1. Admin authorization
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized: admin role required';
    END IF;

    -- 2. Lock payment row
    SELECT * INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;

    IF v_payment.status != 'submitted' THEN
        RAISE EXCEPTION 'Payment is not in submitted state (current: %)', v_payment.status;
    END IF;

    -- 3. Load package for duration (price comes from payment.amount)
    SELECT * INTO v_package
    FROM public.packages
    WHERE id = v_payment.package_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Associated package not found';
    END IF;

    -- 4. Determine start date
    --    If an active membership ends in the future, chain after it.
    --    DO NOT expire the existing membership.
    v_start_date := NOW();

    SELECT * INTO v_prev_membership
    FROM public.memberships
    WHERE member_id = v_payment.member_id
      AND status IN ('active', 'due_soon', 'due_today')
    ORDER BY end_date DESC
    LIMIT 1;

    IF FOUND AND v_prev_membership.end_date > NOW() THEN
        v_start_date := v_prev_membership.end_date + INTERVAL '1 day';
    END IF;

    -- 5. Calculate dates (preserving existing DB convention)
    --    PostgreSQL: Sep 24 + 1 month = Oct 24. next_due = Oct 25.
    v_end_date := v_start_date + (v_package.total_months || ' months')::INTERVAL;
    v_next_due_date := v_end_date + INTERVAL '1 day';

    -- 6. Create membership atomically with verification
    --    Amount uses payment.amount (price locked at checkout time)
    INSERT INTO public.memberships (
        member_id, package_id, package_name, amount,
        start_date, end_date, next_due_date,
        status, reminder_status,
        created_by, updated_by
    ) VALUES (
        v_payment.member_id, v_package.id, v_package.name, v_payment.amount,
        v_start_date, v_end_date, v_next_due_date,
        'active', 'active',
        auth.uid(), auth.uid()
    ) RETURNING id INTO v_membership_id;

    -- 7. Mark payment verified
    UPDATE public.payments
    SET status = 'verified',
        membership_id = v_membership_id,
        updated_by = auth.uid(),
        updated_at = NOW()
    WHERE id = p_payment_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_payment(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_payment(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.verify_payment(UUID) TO authenticated;


-- ============================================================
-- SECTION 8: RPC — reject_payment()
-- ============================================================
CREATE OR REPLACE FUNCTION public.reject_payment(
    p_payment_id UUID,
    p_reason TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_payment RECORD;
    v_trimmed_reason TEXT;
BEGIN
    -- 1. Admin authorization
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized: admin role required';
    END IF;

    -- 2. Validate reason
    v_trimmed_reason := trim(p_reason);
    IF v_trimmed_reason = '' THEN
        RAISE EXCEPTION 'Rejection reason is required';
    END IF;

    -- 3. Lock and load
    SELECT * INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;

    IF v_payment.status != 'submitted' THEN
        RAISE EXCEPTION 'Payment is not in submitted state (current: %)', v_payment.status;
    END IF;

    -- 4. Mark rejected
    UPDATE public.payments
    SET status = 'rejected',
        rejection_reason = v_trimmed_reason,
        updated_by = auth.uid(),
        updated_at = NOW()
    WHERE id = p_payment_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reject_payment(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reject_payment(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.reject_payment(UUID, TEXT) TO authenticated;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
