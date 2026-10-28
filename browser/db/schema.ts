// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const preferences = sqliteTable('preferences', {
  userId: text('user_id').primaryKey(), payload: text('payload').notNull(),
  revision: integer('revision').notNull(), updatedAt: text('updated_at').notNull(),
});
// One aggregate, and dispatch IDs solely for durable reporting idempotency.
export const downloadTotals = sqliteTable('download_totals', {
  id: integer('id').primaryKey(), total: integer('total').notNull().default(0),
});
export const downloadDispatches = sqliteTable('download_dispatches', {
  requestId: text('request_id').primaryKey(), count: integer('count').notNull(),
  createdAt: integer('created_at').notNull(),
},table=>[index('download_dispatches_created_at_idx').on(table.createdAt)]);
