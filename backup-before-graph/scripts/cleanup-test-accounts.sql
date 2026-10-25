-- Deletes ALL test accounts (non-demo humans on +1555 test numbers) and everything they created.
-- npx wrangler d1 execute pointmint-agents-db --remote --file scripts/cleanup-test-accounts.sql --yes
-- Photos live in R2: delete them first (launch-check does this per run), e.g.
--   npx wrangler d1 execute pointmint-agents-db --remote --json --command "SELECT photo_key FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%' AND photo_key IS NOT NULL"
--   npx wrangler r2 object delete pointmint-agents-photos/<photo_key> --remote
DELETE FROM messages WHERE intro_id IN (SELECT id FROM intros WHERE from_human_id IN (SELECT id FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%') OR to_human_id IN (SELECT id FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%'));
DELETE FROM messages WHERE sender_human_id IN (SELECT id FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%') OR recipient_human_id IN (SELECT id FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%');
DELETE FROM intros WHERE from_human_id IN (SELECT id FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%') OR to_human_id IN (SELECT id FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%');
DELETE FROM posts WHERE human_id IN (SELECT id FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%');
DELETE FROM vault_items WHERE human_id IN (SELECT id FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%');
DELETE FROM audit_log WHERE human_id IN (SELECT id FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%') OR agent_id IN (SELECT id FROM agents WHERE human_id IN (SELECT id FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%'));
DELETE FROM sessions WHERE human_id IN (SELECT id FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%');
DELETE FROM agents WHERE human_id IN (SELECT id FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%');
DELETE FROM otp_requests WHERE phone_e164 IN (SELECT phone_e164 FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%');
DELETE FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%';
