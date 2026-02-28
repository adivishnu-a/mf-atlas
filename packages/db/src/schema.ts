import { sql } from "drizzle-orm";
import { text, integer, sqliteTable, real } from "drizzle-orm/sqlite-core";

// ----------------------------------------------------------------------
// Users & Auth.js Authentication Tables
// ----------------------------------------------------------------------

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export const accounts = sqliteTable("accounts", {
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

// ----------------------------------------------------------------------
// MF Atlas specific tables
// ----------------------------------------------------------------------

export const funds = sqliteTable("funds", {
  id: text("id").primaryKey(), // ISIN
  name: text("name").notNull(),
  category: text("category").notNull(),
  amc: text("amc").notNull(),
  kuveraId: text("kuveraId").notNull().unique(), // Scheme code

  // Expanded Metadata from Kuvera Details API
  lump_available: text("lump_available"), // "Y" / "N"
  sip_available: text("sip_available"), // "Y" / "N"
  lump_min: real("lump_min"),
  sip_min: real("sip_min"),
  lock_in_period: integer("lock_in_period"), // in days or months, usually days
  detail_info: text("detail_info"),
  tax_period: integer("tax_period"), // e.g. 365
  small_screen_name: text("small_screen_name"),
  volatility: real("volatility"),
  start_date: text("start_date"),
  fund_type: text("fund_type"), // e.g. "Open Ended"
  fund_category: text("fund_category"), // More granular than generic category
  expense_ratio: real("expense_ratio"),
  expense_ratio_date: text("expense_ratio_date"),
  fund_manager: text("fund_manager"),
  crisil_rating: text("crisil_rating"),
  investment_objective: text("investment_objective"),
  portfolio_turnover: real("portfolio_turnover"),
  aum: real("aum"),
  fund_rating: integer("fund_rating"), // Star rating (1-5)

  // Serialized JSON Strings
  comparison: text("comparison"), // Array of { code, info_ratio }

  // Computed Trailing Returns (Realistic Working Day Interpolation)
  latest_nav: real("latest_nav"),
  latest_nav_date: text("latest_nav_date"),
  return_1d: real("return_1d"),
  return_1w: real("return_1w"),
  return_1m: real("return_1m"),
  return_3m: real("return_3m"),
  return_6m: real("return_6m"),
  return_1y: real("return_1y"),
  return_2y: real("return_2y"),
  return_3y: real("return_3y"),
  return_5y: real("return_5y"),
  return_10y: real("return_10y"),
  return_since_inception: real("return_since_inception"),
});

export const indices = sqliteTable("indices", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  fund_category: text("fund_category"),
  latest_date: text("latest_date"),
  latest_close: real("latest_close"),

  return_1d: real("return_1d"),
  return_1w: real("return_1w"),
  return_1m: real("return_1m"),
  return_3m: real("return_3m"),
  return_6m: real("return_6m"),
  return_1y: real("return_1y"),
  return_2y: real("return_2y"),
  return_3y: real("return_3y"),
  return_5y: real("return_5y"),
  return_10y: real("return_10y"),
});

export const categoryAverages = sqliteTable("category_averages", {
  category: text("category").primaryKey(), // e.g. "Flexi Cap Fund"
  latest_date: text("latest_date"),
  latest_close: real("latest_close"),

  return_1d: real("return_1d"),
  return_1w: real("return_1w"),
  return_1m: real("return_1m"),
  return_3m: real("return_3m"),
  return_6m: real("return_6m"),
  return_1y: real("return_1y"),
  return_2y: real("return_2y"),
  return_3y: real("return_3y"),
  return_5y: real("return_5y"),
  return_10y: real("return_10y"),
  return_since_inception: real("return_since_inception"),
});

export const watchlists = sqliteTable("watchlists", {
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fundId: text("fundId")
    .notNull()
    .references(() => funds.id, { onDelete: "cascade" }),
  addedAt: integer("addedAt", { mode: "timestamp_ms" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
