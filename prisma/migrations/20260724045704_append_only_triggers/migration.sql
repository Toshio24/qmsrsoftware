-- Defense-in-depth: block UPDATE/DELETE on append-only tables and DELETE on
-- soft-delete-only tables at the database level, regardless of which role or
-- code path issues the statement. The application never needs to do any of
-- this (see src/lib/server/repository/*) — if one of these triggers ever
-- fires, that's a bug (or a bypass attempt) to investigate, not a workflow
-- to relax around.

CREATE FUNCTION prevent_modification() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Table "%" is append-only: % is not permitted', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION prevent_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Table "%" does not allow hard deletes: use a status field instead', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- Fully append-only: audit trail and e-signatures.
CREATE TRIGGER audit_log_no_modify BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER e_signatures_no_modify BEFORE UPDATE OR DELETE ON "e_signatures"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();

-- Fully append-only: every per-type version table (edits insert a new
-- version row instead of changing an existing one).
CREATE TRIGGER user_need_versions_no_modify BEFORE UPDATE OR DELETE ON "user_need_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER design_input_versions_no_modify BEFORE UPDATE OR DELETE ON "design_input_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER design_output_versions_no_modify BEFORE UPDATE OR DELETE ON "design_output_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER risk_item_versions_no_modify BEFORE UPDATE OR DELETE ON "risk_item_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER risk_control_versions_no_modify BEFORE UPDATE OR DELETE ON "risk_control_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER verification_test_versions_no_modify BEFORE UPDATE OR DELETE ON "verification_test_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER validation_test_versions_no_modify BEFORE UPDATE OR DELETE ON "validation_test_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER controlled_document_versions_no_modify BEFORE UPDATE OR DELETE ON "controlled_document_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER supplier_versions_no_modify BEFORE UPDATE OR DELETE ON "supplier_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER supplier_audit_versions_no_modify BEFORE UPDATE OR DELETE ON "supplier_audit_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER capa_versions_no_modify BEFORE UPDATE OR DELETE ON "capa_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER nonconformance_versions_no_modify BEFORE UPDATE OR DELETE ON "nonconformance_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER complaint_versions_no_modify BEFORE UPDATE OR DELETE ON "complaint_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER internal_audit_versions_no_modify BEFORE UPDATE OR DELETE ON "internal_audit_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER management_review_versions_no_modify BEFORE UPDATE OR DELETE ON "management_review_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER training_record_versions_no_modify BEFORE UPDATE OR DELETE ON "training_record_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER equipment_versions_no_modify BEFORE UPDATE OR DELETE ON "equipment_versions"
  FOR EACH ROW EXECUTE FUNCTION prevent_modification();

-- Soft-delete-only: status/version fields get updated, but rows are never
-- hard-deleted.
CREATE TRIGGER trace_items_no_delete BEFORE DELETE ON "trace_items"
  FOR EACH ROW EXECUTE FUNCTION prevent_delete();
CREATE TRIGGER trace_links_no_delete BEFORE DELETE ON "trace_links"
  FOR EACH ROW EXECUTE FUNCTION prevent_delete();
