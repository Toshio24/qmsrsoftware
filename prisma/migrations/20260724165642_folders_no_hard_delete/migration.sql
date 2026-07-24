-- Same treatment as trace_links/attachments: soft-delete only.
CREATE TRIGGER folders_no_delete BEFORE DELETE ON "folders"
  FOR EACH ROW EXECUTE FUNCTION prevent_delete();
CREATE TRIGGER folders_no_truncate BEFORE TRUNCATE ON "folders"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_delete();
