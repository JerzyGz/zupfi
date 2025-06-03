import { relations } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestampsColumns = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
};

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  chatTelegramId: integer("chat_telegram_id").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

// // Users table
// export const users = sqliteTable(
//   "users",
//   {
//     id: text("id").primaryKey(),
//     chatTelegramId: integer("chat_telegram_id").unique(),
//     clerkId: text("clerk_id").unique(),
//     userName: text("user_name").unique(),
//     email: text("email"),
//     name: text("name"),
//     lastName: text("last_name"),
//     active: integer("active", { mode: "boolean" }).notNull().default(true),
//     ...timestampsColumns,
//   },
//   /**
//    * Ensure case-insensitive uniqueness for email
//    * @see https://orm.drizzle.team/docs/guides/unique-case-insensitive-email#sqlite
//    * and Partial index because email can be null
//    */
//   (table) => [
//     uniqueIndex("chat_telegram_id").on(table.chatTelegramId),
//     uniqueIndex("clerk_id").on(table.clerkId),
//     uniqueIndex("email_index")
//       .on(table.email)
//       .where(sql`"email" IS NOT NULL`),
//   ]
// );
// Categories table
export const categories = sqliteTable("categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  languageCode: text("language_code").notNull().default("es"),
});

// Expenses table
export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  categoryId: text("category_id")
    .references(() => categories.id)
    .notNull(),
  amount: real("amount").notNull(),
  description: text("description"),
  spentAt: text("spent_at").notNull(),
  ...timestampsColumns,
});

// Goals table
export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  targetAmount: real("target_amount").notNull(),
  period: text("period", { enum: ["weekly", "monthly"] }).notNull(),
  ...timestampsColumns,
});

export const usersRelations = relations(user, ({ many }) => ({
  expenses: many(expenses),
  goals: many(goals),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(user, {
    fields: [expenses.userId],
    references: [user.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(user, {
    fields: [goals.userId],
    references: [user.id],
  }),
}));

// TODO: Move type definitions to their respective feature modules for better code organization and maintainability
export type NewCategory = typeof categories.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type Goal = typeof goals.$inferSelect;
