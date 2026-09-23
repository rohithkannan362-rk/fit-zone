-- Migration: 20260923000000_initial_schema.sql
-- Description: FitZone Supabase PostgreSQL Database Foundation

-- 1. Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    member_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Member Code Generation
CREATE SEQUENCE public.member_code_seq START 1;

CREATE OR REPLACE FUNCTION generate_member_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.member_code IS NULL OR NEW.member_code = '' THEN
        NEW.member_code := 'FZ' || LPAD(nextval('public.member_code_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_member_code
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_member_code();

-- 5. Packages Table
CREATE TABLE public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    duration_months INT NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    features TEXT[] NOT NULL DEFAULT '{}',
    popular BOOLEAN NOT NULL DEFAULT FALSE,
    offer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Memberships Table (Each row represents ONE billing cycle)
CREATE TABLE public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
    package_name TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    next_due_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, active, due_soon, due_today, overdue, expired
    reminder_status TEXT NOT NULL DEFAULT 'active', -- active, paused
    reminder_paused_until TIMESTAMPTZ,
    reminder_pause_reason TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Payments Table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    package_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_order_id TEXT UNIQUE,
    provider_payment_id TEXT UNIQUE,
    provider_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed, refunded
    method TEXT NOT NULL,
    payment_date TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Reminders Table
CREATE TABLE public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, skipped
    channel TEXT NOT NULL DEFAULT 'email',
    provider_message_id TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Constraint: Each membership (billing cycle) can only have ONE reminder of each type
    UNIQUE (membership_id, reminder_type)
);

-- 9. Settings Table
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_name TEXT NOT NULL,
    gym_address TEXT,
    gym_phone TEXT,
    admin_email TEXT,
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_gateway TEXT NOT NULL DEFAULT 'razorpay',
    reminder_schedule TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Admin Helper Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Add updated_at triggers to all tables
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 13. RLS Policies

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can update their own non-sensitive profile fields" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (
    auth.uid() = id AND 
    -- Prevent users from elevating their role or changing member_code
    (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid())) AND
    (member_code IS NOT DISTINCT FROM (SELECT member_code FROM public.profiles WHERE id = auth.uid()))
);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.is_admin());

-- Packages
CREATE POLICY "Anyone can view packages" ON public.packages FOR SELECT USING (true);
CREATE POLICY "Admins can insert packages" ON public.packages FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update packages" ON public.packages FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete packages" ON public.packages FOR DELETE USING (public.is_admin());

-- Memberships
CREATE POLICY "Users can view their own memberships" ON public.memberships FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "Admins can view all memberships" ON public.memberships FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert memberships" ON public.memberships FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update memberships" ON public.memberships FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete memberships" ON public.memberships FOR DELETE USING (public.is_admin());

-- Payments
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert payments" ON public.payments FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete payments" ON public.payments FOR DELETE USING (public.is_admin());

-- Reminders
CREATE POLICY "Users can view their own reminders" ON public.reminders FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "Admins can view all reminders" ON public.reminders FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert reminders" ON public.reminders FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update reminders" ON public.reminders FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete reminders" ON public.reminders FOR DELETE USING (public.is_admin());

-- Settings
CREATE POLICY "Anyone can view settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert settings" ON public.settings FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update settings" ON public.settings FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete settings" ON public.settings FOR DELETE USING (public.is_admin());

-- 14. Indexes
CREATE INDEX idx_profiles_member_code ON public.profiles(member_code);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_mobile ON public.profiles(mobile);
CREATE INDEX idx_profiles_role ON public.profiles(role);

CREATE INDEX idx_memberships_member_id ON public.memberships(member_id);
CREATE INDEX idx_memberships_package_id ON public.memberships(package_id);
CREATE INDEX idx_memberships_status ON public.memberships(status);
CREATE INDEX idx_memberships_next_due_date ON public.memberships(next_due_date);
CREATE INDEX idx_memberships_reminder_status ON public.memberships(reminder_status);
CREATE INDEX idx_memberships_reminder_paused_until ON public.memberships(reminder_paused_until);

CREATE INDEX idx_payments_member_id ON public.payments(member_id);
CREATE INDEX idx_payments_membership_id ON public.payments(membership_id);
CREATE INDEX idx_payments_package_id ON public.payments(package_id);
CREATE INDEX idx_payments_provider_order_id ON public.payments(provider_order_id);
CREATE INDEX idx_payments_provider_payment_id ON public.payments(provider_payment_id);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX idx_payments_status ON public.payments(status);

CREATE INDEX idx_reminders_member_id ON public.reminders(member_id);
CREATE INDEX idx_reminders_membership_id ON public.reminders(membership_id);
CREATE INDEX idx_reminders_scheduled_for ON public.reminders(scheduled_for);
CREATE INDEX idx_reminders_status ON public.reminders(status);
CREATE INDEX idx_reminders_reminder_type ON public.reminders(reminder_type);

-- End of migration
