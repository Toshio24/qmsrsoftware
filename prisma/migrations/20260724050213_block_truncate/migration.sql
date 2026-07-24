-- TRUNCATE bypasses row-level BEFORE UPDATE OR DELETE triggers entirely in
-- Postgres, so the append_only_triggers migration alone doesn't stop someone
-- with table-level privileges from wiping the audit trail via TRUNCATE.
-- Statement-level triggers close that gap using the same guard functions.

CREATE TRIGGER audit_log_no_truncate BEFORE TRUNCATE ON "audit_log"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER e_signatures_no_truncate BEFORE TRUNCATE ON "e_signatures"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();

CREATE TRIGGER user_need_versions_no_truncate BEFORE TRUNCATE ON "user_need_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER design_input_versions_no_truncate BEFORE TRUNCATE ON "design_input_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER design_output_versions_no_truncate BEFORE TRUNCATE ON "design_output_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER risk_item_versions_no_truncate BEFORE TRUNCATE ON "risk_item_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER risk_control_versions_no_truncate BEFORE TRUNCATE ON "risk_control_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER verification_test_versions_no_truncate BEFORE TRUNCATE ON "verification_test_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER validation_test_versions_no_truncate BEFORE TRUNCATE ON "validation_test_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER controlled_document_versions_no_truncate BEFORE TRUNCATE ON "controlled_document_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER supplier_versions_no_truncate BEFORE TRUNCATE ON "supplier_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER supplier_audit_versions_no_truncate BEFORE TRUNCATE ON "supplier_audit_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER capa_versions_no_truncate BEFORE TRUNCATE ON "capa_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER nonconformance_versions_no_truncate BEFORE TRUNCATE ON "nonconformance_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER complaint_versions_no_truncate BEFORE TRUNCATE ON "complaint_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER internal_audit_versions_no_truncate BEFORE TRUNCATE ON "internal_audit_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER management_review_versions_no_truncate BEFORE TRUNCATE ON "management_review_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER training_record_versions_no_truncate BEFORE TRUNCATE ON "training_record_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();
CREATE TRIGGER equipment_versions_no_truncate BEFORE TRUNCATE ON "equipment_versions"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_modification();

CREATE TRIGGER trace_items_no_truncate BEFORE TRUNCATE ON "trace_items"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_delete();
CREATE TRIGGER trace_links_no_truncate BEFORE TRUNCATE ON "trace_links"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_delete();
