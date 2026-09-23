-- Migration: 20260923000003_reminder_engine.sql
-- Description: RPC for safely claiming reminders in the reminder engine

CREATE OR REPLACE FUNCTION claim_reminder(
  p_membership_id UUID,
  p_member_id UUID,
  p_reminder_type TEXT
) RETURNS JSONB AS $$
DECLARE
  v_reminder_id UUID;
  v_status TEXT;
BEGIN
  -- Lock the specific row if it exists
  SELECT id, status INTO v_reminder_id, v_status
  FROM public.reminders
  WHERE membership_id = p_membership_id AND reminder_type = p_reminder_type
  FOR UPDATE SKIP LOCKED;

  IF FOUND THEN
    -- Only allow claiming if it previously failed (retry logic)
    IF v_status = 'failed' THEN
      UPDATE public.reminders 
      SET status = 'pending', error_message = NULL, updated_at = NOW() 
      WHERE id = v_reminder_id;
      RETURN jsonb_build_object('success', true, 'reminder_id', v_reminder_id);
    ELSE
      -- It is already pending, sent, or skipped
      RETURN jsonb_build_object('success', false, 'reason', 'already claimed or sent');
    END IF;
  END IF;

  -- If not found, insert a new reminder securely
  INSERT INTO public.reminders (membership_id, member_id, reminder_type, scheduled_for, status, channel)
  VALUES (p_membership_id, p_member_id, p_reminder_type, NOW(), 'pending', 'email')
  RETURNING id INTO v_reminder_id;

  RETURN jsonb_build_object('success', true, 'reminder_id', v_reminder_id);
EXCEPTION WHEN unique_violation THEN
  -- Handle race conditions gracefully
  RETURN jsonb_build_object('success', false, 'reason', 'concurrent insert detected');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
