ALTER TABLE timba_time DROP COLUMN timba_original_id;

-- Note: PostgreSQL does not support removing enum values.
-- To remove 'contraoferta' from timba_estado would require recreating the enum.
