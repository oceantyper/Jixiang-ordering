import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, asc, inArray } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { dishes, tags, dishTags } from "@db/schema";
import { requireAdmin } from "./auth";

const dishInput = z.object({
  name: z.string().min(1, "菜品名称不能为空").max(255),
  nameRu: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
  descriptionRu: z.string().max(2000).optional(),
  price: z.number({ message: "价格必须是数字" }).positive("价格必须大于 0"),
  category: z.string().min(1).max(64).default("其他"),
  isAvailable: z.boolean().default(true),
  tagIds: z.array(z.number().int().positive()).default([]),
});

/** data URL 图片大小限制：2MB 原图 ≈ 2.8MB base64 */
const MAX_IMAGE_DATAURL_LEN = 4_000_000;

async function attachTags(dishList: { id: number }[]) {
  if (dishList.length === 0) return new Map<number, (typeof tags.$inferSelect)[]>();
  const db = getDb();
  const links = await db.query.dishTags.findMany({
    where: inArray(dishTags.dishId, dishList.map((d) => d.id)),
    with: { tag: true },
  });
  const map = new Map<number, (typeof tags.$inferSelect)[]>();
  for (const link of links) {
    const arr = map.get(link.dishId) ?? [];
    arr.push(link.tag);
    map.set(link.dishId, arr);
  }
  return map;
}

async function setDishTags(dishId: number, tagIds: number[]) {
  const db = getDb();
  await db.delete(dishTags).where(eq(dishTags.dishId, dishId));
  if (tagIds.length > 0) {
    await db.insert(dishTags).values(tagIds.map((tagId) => ({ dishId, tagId })));
  }
}

export const menuRouter = createRouter({
  /** 顾客端：已上架菜品（含标签） */
  list: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.query.dishes.findMany({
      where: eq(dishes.isAvailable, true),
      orderBy: [asc(dishes.category), asc(dishes.id)],
    });
    const tagMap = await attachTags(rows);
    return rows.map((d) => ({ ...d, tags: tagMap.get(d.id) ?? [] }));
  }),

  /** 全部标签 */
  tags: publicQuery.query(async () => {
    return getDb().query.tags.findMany({ orderBy: [asc(tags.sort), asc(tags.id)] });
  }),

  // ---------- 管理员 ----------

  /** 管理员：全部菜品（含下架） */
  adminList: publicQuery.query(async ({ ctx }) => {
    await requireAdmin(ctx);
    const db = getDb();
    const rows = await db.query.dishes.findMany({
      orderBy: [asc(dishes.category), asc(dishes.id)],
    });
    const tagMap = await attachTags(rows);
    return rows.map((d) => ({ ...d, tags: tagMap.get(d.id) ?? [] }));
  }),

  createDish: publicQuery.input(dishInput).mutation(async ({ ctx, input }) => {
    await requireAdmin(ctx);
    const db = getDb();
    const [{ id }] = await db
      .insert(dishes)
      .values({
        name: input.name,
        nameRu: input.nameRu ?? null,
        description: input.description ?? null,
        descriptionRu: input.descriptionRu ?? null,
        price: input.price.toFixed(2),
        category: input.category,
        isAvailable: input.isAvailable,
      })
      .$returningId();
    await setDishTags(id, input.tagIds);
    return { id };
  }),

  updateDish: publicQuery
    .input(dishInput.partial().extend({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx);
      const db = getDb();
      const { id, tagIds, ...rest } = input;
      const patch: Record<string, unknown> = {};
      if (rest.name !== undefined) patch.name = rest.name;
      if (rest.nameRu !== undefined) patch.nameRu = rest.nameRu;
      if (rest.description !== undefined) patch.description = rest.description;
      if (rest.descriptionRu !== undefined) patch.descriptionRu = rest.descriptionRu;
      if (rest.price !== undefined) patch.price = rest.price.toFixed(2);
      if (rest.category !== undefined) patch.category = rest.category;
      if (rest.isAvailable !== undefined) patch.isAvailable = rest.isAvailable;
      if (Object.keys(patch).length > 0) {
        await db.update(dishes).set(patch).where(eq(dishes.id, id));
      }
      if (tagIds !== undefined) {
        await setDishTags(id, tagIds);
      }
      return { ok: true };
    }),

  deleteDish: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx);
      const db = getDb();
      await db.delete(dishTags).where(eq(dishTags.dishId, input.id));
      await db.delete(dishes).where(eq(dishes.id, input.id));
      return { ok: true };
    }),

  /**
   * 菜品图片上传（base64 data URL）。
   * 说明：对应 SRS「菜单图片上传」。本平台云数据库持久化存储；
   * 若迁移至 Vercel，可改为 @vercel/blob 上传后回填 URL，接口签名保持不变。
   */
  uploadImage: publicQuery
    .input(
      z.object({
        dishId: z.number().int().positive(),
        dataUrl: z
          .string()
          .regex(/^data:image\/(jpeg|png|webp|gif);base64,/, "仅支持 JPG/PNG/WebP/GIF 图片")
          .max(MAX_IMAGE_DATAURL_LEN, "图片不能超过 2MB"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx);
      const dish = await getDb().query.dishes.findFirst({ where: eq(dishes.id, input.dishId) });
      if (!dish) throw new TRPCError({ code: "NOT_FOUND", message: "菜品不存在" });
      await getDb().update(dishes).set({ imageUrl: input.dataUrl }).where(eq(dishes.id, input.dishId));
      return { ok: true };
    }),

  removeImage: publicQuery
    .input(z.object({ dishId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx);
      await getDb().update(dishes).set({ imageUrl: null }).where(eq(dishes.id, input.dishId));
      return { ok: true };
    }),

  createTag: publicQuery
    .input(
      z.object({
        name: z.string().min(1, "标签名称不能为空").max(64),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#3B82F6"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx);
      const db = getDb();
      const existing = await db.query.tags.findFirst({ where: eq(tags.name, input.name) });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "标签已存在" });
      const [{ id }] = await db.insert(tags).values(input).$returningId();
      return { id };
    }),

  deleteTag: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx);
      const db = getDb();
      await db.delete(dishTags).where(eq(dishTags.tagId, input.id));
      await db.delete(tags).where(eq(tags.id, input.id));
      return { ok: true };
    }),
});
