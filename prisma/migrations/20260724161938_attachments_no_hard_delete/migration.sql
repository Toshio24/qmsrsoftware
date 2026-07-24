-- Same treatment as trace_links: soft-delete only, never a hard delete or
-- truncate, using the guard functions already defined in
-- append_only_triggers/migration.sql.

CREATE TRIGGER attachments_no_delete BEFORE DELETE ON "attachments"
  FOR EACH ROW EXECUTE FUNCTION prevent_delete();
CREATE TRIGGER attachments_no_truncate BEFORE TRUNCATE ON "attachments"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_delete();
