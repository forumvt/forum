import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["ADMINISTRATOR", "MODERATOR", "USER"]);

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  name: text().notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image")
    .$type<string | null>()
    .default("https://www.subeiros.com/eris-apple.png"),
  role: roleEnum("role").notNull().default("USER"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// ENUM de categorias
export const forumCategoryEnum = pgEnum("forum_category", [
  "GAMING",
  "POLITICA",
  "VALE_TUDO",
]);

// Tabela de fóruns hierárquicos
export const forumTable = pgTable("forum", (t) => ({
  id: t.uuid("id").primaryKey().defaultRandom(),
  // declaramos parentId como coluna, mas sem .references() aqui
  parentId: t.uuid("parent_id").$type<string | null>().default(null),
  category: forumCategoryEnum("category").notNull(),
  title: t.text("title").notNull(),
  slug: t.text("slug").notNull().unique(),
  description: t.text("description").notNull(),
  createdAt: t.timestamp("created_at").notNull().defaultNow(),
}));

// Relações
export const forumRelations = relations(forumTable, ({ one, many }) => ({
  parent: one(forumTable, {
    fields: [forumTable.parentId],
    references: [forumTable.id],
    relationName: "parent_forum",
  }),
  children: many(forumTable, {
    relationName: "parent_forum",
  }),
}));

// Tabela de threads
export const threadTable = pgTable("thread", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  forumId: uuid("forum_id")
    .notNull()
    .references(() => forumTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastPostAt: timestamp("last_post_at").notNull().defaultNow(),
  lastPostUserId: text("last_post_user_id").references(() => userTable.id, {
    onDelete: "set null",
  }),
});

export const threadReadTable = pgTable(
  "thread_read",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threadTable.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at").notNull().defaultNow(),
  },
  (t) => ({
    // garante 1 registro por user + thread
    userThreadUnique: unique().on(t.userId, t.threadId),
  }),
);

export const threadReadRelations = relations(threadReadTable, ({ one }) => ({
  user: one(userTable, {
    fields: [threadReadTable.userId],
    references: [userTable.id],
  }),
  thread: one(threadTable, {
    fields: [threadReadTable.threadId],
    references: [threadTable.id],
  }),
}));

// Tabela de posts
export const postTable = pgTable("post", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => threadTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relações da thread
export const threadRelations = relations(threadTable, ({ one, many }) => ({
  forum: one(forumTable, {
    fields: [threadTable.forumId],
    references: [forumTable.id],
  }),
  user: one(userTable, {
    fields: [threadTable.userId],
    references: [userTable.id],
  }),
  posts: many(postTable),
}));

// Relações do post
export const postRelations = relations(postTable, ({ one }) => ({
  thread: one(threadTable, {
    fields: [postTable.threadId],
    references: [threadTable.id],
  }),
  user: one(userTable, {
    fields: [postTable.userId],
    references: [userTable.id],
  }),
}));

// Auth tables required by BetterAuth Drizzle adapter
export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
});

export const accountTable = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verificationTable = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const notificationTypeEnum = pgEnum("notification_type", [
  "own_thread",
  "viewed_thread",
  "like",
  "reply",
]);

export const notificationTable = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    actorUserId: text("actor_user_id").references(() => userTable.id, {
      onDelete: "set null",
    }),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threadTable.id, { onDelete: "cascade" }),
    postId: uuid("post_id").references(() => postTable.id, {
      onDelete: "set null",
    }),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index("notification_user_created_idx").on(
      t.userId,
      t.createdAt,
    ),
    userReadIdx: index("notification_user_read_idx").on(t.userId, t.readAt),
  }),
);

export const userNotificationPreferenceTable = pgTable(
  "user_notification_preference",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => userTable.id, { onDelete: "cascade" }),
    ownThread: boolean("own_thread").notNull().default(true),
    viewedThread: boolean("viewed_thread").notNull().default(true),
    like: boolean("like").notNull().default(true),
    reply: boolean("reply").notNull().default(true),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
);

export const postLikeTable = pgTable(
  "post_like",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => postTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userPostUnique: unique().on(t.userId, t.postId),
  }),
);

export const threadLikeTable = pgTable(
  "thread_like",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threadTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userThreadUnique: unique().on(t.userId, t.threadId),
  }),
);

export const userSubscriptionTable = pgTable(
  "user_subscription",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriberUserId: text("subscriber_user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    targetUserId: text("target_user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    pairUnique: unique().on(t.subscriberUserId, t.targetUserId),
    subscriberIdx: index("user_subscription_subscriber_idx").on(
      t.subscriberUserId,
    ),
    targetIdx: index("user_subscription_target_idx").on(t.targetUserId),
  }),
);

export const userIgnoreTable = pgTable(
  "user_ignore",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ignorerUserId: text("ignorer_user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    targetUserId: text("target_user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    pairUnique: unique().on(t.ignorerUserId, t.targetUserId),
    ignorerIdx: index("user_ignore_ignorer_idx").on(t.ignorerUserId),
    targetIdx: index("user_ignore_target_idx").on(t.targetUserId),
  }),
);
