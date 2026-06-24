ALTER TYPE timba_estado ADD VALUE 'contraoferta';
ALTER TABLE timba_time ADD COLUMN timba_original_id INTEGER REFERENCES timba_time(id) ON DELETE SET NULL;
