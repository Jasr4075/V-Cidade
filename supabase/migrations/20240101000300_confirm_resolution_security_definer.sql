-- Fix: confirm_resolution() could never actually resolve a report.
--
-- The function is SECURITY INVOKER, so its internal
--   UPDATE reports SET status = 'RESOLVED'
-- was evaluated against RLS. The only UPDATE policy on reports requires the
-- caller to be the report owner, but resolving a report is a *community* action
-- performed by any anonymous user, so the update silently matched 0 rows:
-- the RPC returned true while the report stayed ACTIVE.
--
-- SECURITY DEFINER lets the function perform that one controlled transition;
-- the 3-confirmation threshold is still enforced inside the function body.

CREATE OR REPLACE FUNCTION confirm_resolution(
    p_report_id UUID,
    p_anonymous_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    confirmation_count INTEGER;
    threshold INTEGER := 3;
BEGIN
    -- Insert confirmation if not exists
    INSERT INTO resolution_confirmations (report_id, anonymous_id)
    VALUES (p_report_id, p_anonymous_id)
    ON CONFLICT (report_id, anonymous_id) DO NOTHING;

    -- Count confirmations
    SELECT COUNT(*) INTO confirmation_count
    FROM resolution_confirmations
    WHERE report_id = p_report_id;

    -- Update report status if threshold reached
    IF confirmation_count >= threshold THEN
        UPDATE reports
        SET status = 'RESOLVED', updated_at = NOW()
        WHERE id = p_report_id AND status != 'RESOLVED';
    END IF;

    RETURN confirmation_count >= threshold;
END;
$$;

REVOKE ALL ON FUNCTION confirm_resolution(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION confirm_resolution(UUID, UUID) TO anon, authenticated;
