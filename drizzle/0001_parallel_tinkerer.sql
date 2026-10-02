-- Hand-written migration (task_plan.md §3.8, D31).
-- `drizzle-kit generate` cannot express sequences/triggers, and
-- `drizzle-kit generate` never introspects them afterwards: change these
-- objects only through a new hand-written migration.

-- Display code generator for findings: BPK-{tahun}-{seq}, e.g. BPK-2024-007.
-- Active only when the caller leaves kode_display NULL (the seed supplies its
-- own values). Retries with the next sequence value on a partial-unique clash,
-- so manual inserts and the future XLSX import always get a usable code
-- (numbering may contain gaps; uniqueness among live rows is what matters).
CREATE SEQUENCE IF NOT EXISTS findings_kode_display_seq;

CREATE OR REPLACE FUNCTION set_findings_kode_display() RETURNS trigger AS $$
DECLARE
  candidate text;
BEGIN
  IF NEW.kode_display IS NOT NULL THEN
    RETURN NEW;
  END IF;

  FOR attempt IN 1..100 LOOP
    candidate := 'BPK-' || NEW.tahun::text || '-' ||
                 lpad(nextval('findings_kode_display_seq')::text, 3, '0');
    BEGIN
      -- Simulate the partial unique index in-function so the retry loop can
      -- catch a collision before the statement fails wholesale.
      PERFORM 1
      FROM findings
      WHERE kode_display = candidate AND deleted_at IS NULL;
      IF NOT FOUND THEN
        NEW.kode_display := candidate;
        RETURN NEW;
      END IF;
    END;
  END LOOP;

  RAISE EXCEPTION 'findings_kode_display: could not generate a unique kode_display for tahun %', NEW.tahun;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER findings_kode_display_fill
  BEFORE INSERT ON findings
  FOR EACH ROW
  WHEN (NEW.kode_display IS NULL)
  EXECUTE FUNCTION set_findings_kode_display();
