import { relations } from "drizzle-orm";
import { dishes, tags, dishTags, orders, orderItems, addresses, users } from "./schema";

export const dishesRelations = relations(dishes, ({ many }) => ({
  dishTags: many(dishTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  dishTags: many(dishTags),
}));

export const dishTagsRelations = relations(dishTags, ({ one }) => ({
  dish: one(dishes, { fields: [dishTags.dishId], references: [dishes.id] }),
  tag: one(tags, { fields: [dishTags.tagId], references: [tags.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  address: one(addresses, { fields: [orders.id], references: [addresses.orderId] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  order: one(orders, { fields: [addresses.orderId], references: [orders.id] }),
}));
