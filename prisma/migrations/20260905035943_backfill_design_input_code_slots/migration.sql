-- design_input_code_slots was added after some Design Inputs already had
-- "DI-<categoryNumber>.<itemNumber>" codes assigned under the earlier,
-- simpler incrementing-counter scheme. Those items were never registered as
-- occupying a slot, so nextDesignInputCode() (see repository/items.ts) could
-- hand out an already-taken code again, failing on TraceItem.humanCode's
-- unique constraint. Backfill: register every existing Design Input whose
-- code is still in the plain "DI-N.M" form (anything already renamed to
-- "DI-N.M (retired)" on retirement is correctly excluded, since that slot
-- was already freed on purpose).
--
-- ON CONFLICT DO NOTHING makes this safe to run against a database that
-- already has some of these rows (e.g. from an earlier manual backfill).
INSERT INTO "design_input_code_slots" ("categoryNumber", "itemNumber", "traceItemId")
SELECT
  split_part(substring("humanCode" from 4), '.', 1)::int,
  split_part(substring("humanCode" from 4), '.', 2)::int,
  "id"
FROM "trace_items"
WHERE "itemType" = 'DESIGN_INPUT' AND "humanCode" ~ '^DI-[0-9]+\.[0-9]+$'
ON CONFLICT DO NOTHING;
