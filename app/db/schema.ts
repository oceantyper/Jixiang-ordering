import {
  mysqlTable,
  mysqlEnum,
  serial,
  bigint,
  int,
  varchar,
  text,
  mediumtext,
  decimal,
  boolean,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/mysql-core";

/** 顾客用户 */
export const users = mysqlTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    phone: varchar("phone", { length: 32 }),
    status: mysqlEnum("status", ["active", "disabled"]).notNull().default("active"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => ({ emailIdx: index("users_email_idx").on(t.email) }),
);

/** 餐厅管理员（与顾客分离） */
export const admins = mysqlTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin"]).notNull().default("admin"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

/** 登录会话（顾客与管理员共用，userType 区分） */
export const sessions = mysqlTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    token: varchar("token", { length: 128 }).notNull().unique(),
    userType: mysqlEnum("userType", ["customer", "admin"]).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    expiresAt: timestamp("expiresAt").notNull(),
  },
  (t) => ({ tokenIdx: index("sessions_token_idx").on(t.token) }),
);

/** 菜品 */
export const dishes = mysqlTable("dishes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameRu: varchar("nameRu", { length: 255 }),
  description: text("description"),
  descriptionRu: text("descriptionRu"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 64 }).notNull().default("其他"),
  /** 图片：data URL 或外部 URL（管理员上传，≤2MB） */
  imageUrl: mediumtext("imageUrl"),
  isAvailable: boolean("isAvailable").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

/** 标签 */
export const tags = mysqlTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  color: varchar("color", { length: 16 }).notNull().default("#3B82F6"),
  sort: int("sort").notNull().default(0),
});

/** 菜品-标签 多对多关联 */
export const dishTags = mysqlTable(
  "dish_tags",
  {
    dishId: bigint("dishId", { mode: "number", unsigned: true }).notNull(),
    tagId: bigint("tagId", { mode: "number", unsigned: true }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.dishId, t.tagId] }),
    tagIdx: index("dish_tags_tag_idx").on(t.tagId),
  }),
);

/** 订单 */
export const orders = mysqlTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderNo: varchar("orderNo", { length: 32 }).notNull().unique(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    fulfillment: mysqlEnum("fulfillment", ["delivery", "pickup"]).notNull(),
    status: mysqlEnum("status", [
      "pending", // 待确认
      "preparing", // 已确认/备餐中
      "awaiting_pickup", // 待自取
      "delivering", // 配送中
      "completed", // 已完成
      "cancelled", // 已取消
    ])
      .notNull()
      .default("pending"),
    paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid", "refunded"])
      .notNull()
      .default("unpaid"),
    totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
    remark: text("remark"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
    paidAt: timestamp("paidAt"),
  },
  (t) => ({
    userIdx: index("orders_user_idx").on(t.userId),
    statusIdx: index("orders_status_idx").on(t.status),
  }),
);

/** 订单明细（含菜品名称/单价快照） */
export const orderItems = mysqlTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull(),
    dishId: bigint("dishId", { mode: "number", unsigned: true }).notNull(),
    dishName: varchar("dishName", { length: 255 }).notNull(),
    quantity: int("quantity").notNull(),
    unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  },
  (t) => ({ orderIdx: index("order_items_order_idx").on(t.orderId) }),
);

/** 配送地址（外卖订单） */
export const addresses = mysqlTable("addresses", {
  id: serial("id").primaryKey(),
  orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull().unique(),
  contactName: varchar("contactName", { length: 64 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  province: varchar("province", { length: 64 }).notNull(),
  city: varchar("city", { length: 64 }).notNull(),
  district: varchar("district", { length: 64 }).notNull(),
  detail: varchar("detail", { length: 255 }).notNull(),
});

export type User = typeof users.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type Dish = typeof dishes.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Address = typeof addresses.$inferSelect;
