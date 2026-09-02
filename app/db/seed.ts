import { getDb } from "../server/queries/connection";
import { admins, tags, dishes, dishTags } from "./schema";
import { hashPassword } from "../server/auth";

/** 预设标签 */
const TAGS = [
  { name: "热销", color: "#EF4444" },
  { name: "新品", color: "#22C55E" },
  { name: "素食", color: "#84CC16" },
  { name: "辣", color: "#F97316" },
  { name: "推荐", color: "#3B82F6" },
  { name: "俄式经典", color: "#8B5CF6" },
  { name: "中式经典", color: "#EAB308" },
] as const;

/** 「吉祥」俄中餐厅菜单（临时填充数据） */
const DISHES: {
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
}[] = [
  // 汤类
  { name: "罗宋汤（红菜汤）", description: "俄式经典红菜头浓汤，配牛腩慢炖，酸甜开胃，附酸奶油与黑面包。", price: 28, category: "汤类", tags: ["热销", "俄式经典"] },
  { name: "奶油蘑菇汤", description: "新鲜口蘑与淡奶油熬制，口感丝滑浓郁，撒少许欧芹碎。", price: 26, category: "汤类", tags: ["俄式经典", "素食"] },
  { name: "酸辣汤", description: "中式经典酸辣口味，豆腐丝、木耳、蛋花，胡椒香气足。", price: 18, category: "汤类", tags: ["中式经典", "辣"] },
  // 俄式主菜
  { name: "俄式烤肉串（Шашлык）", description: "大块猪梅花肉炭火烤制，洋葱与香料腌制入味，配烤蔬菜与酸黄瓜。", price: 68, category: "俄式主菜", tags: ["热销", "俄式经典", "推荐"] },
  { name: "俄式炖牛肉（Beef Stroganoff）", description: "牛里脊条配酸奶油蘑菇酱汁，可搭配米饭或俄式宽面。", price: 62, category: "俄式主菜", tags: ["俄式经典"] },
  { name: "罐焖牛肉", description: "牛肉与土豆、胡萝卜入陶罐慢煨，汤汁浓郁，罐口封酥皮。", price: 58, category: "俄式主菜", tags: ["推荐", "俄式经典"] },
  { name: "基辅鸡卷", description: "鸡胸包裹香草黄油，炸至金黄酥脆，切开后黄油流心。", price: 52, category: "俄式主菜", tags: ["新品"] },
  { name: "俄式饺子（Пельмени）", description: "西伯利亚风味小水饺，猪肉牛肉双拼馅，配酸奶油或黄油。", price: 36, category: "俄式主菜", tags: ["俄式经典"] },
  { name: "俄式红肠拼盘", description: "哈尔滨红肠、茶肠与酸黄瓜、芥末酱拼盘，佐酒佳品。", price: 42, category: "俄式主菜", tags: ["热销"] },
  // 中式热菜
  { name: "锅包肉", description: "东北名菜，里脊裹糊炸至酥脆，糖醋汁挂匀，外脆里嫩。", price: 46, category: "中式热菜", tags: ["热销", "中式经典", "推荐"] },
  { name: "地三鲜", description: "茄子、土豆、青椒过油后红烧，咸香下饭。", price: 28, category: "中式热菜", tags: ["素食", "中式经典"] },
  { name: "酸菜白肉锅", description: "东北酸菜与五花肉同炖，汤鲜味浓，配血肠风味更佳。", price: 48, category: "中式热菜", tags: ["中式经典"] },
  { name: "猪肉炖粉条", description: "五花肉与红薯粉条小火慢炖，酱香浓郁，家常味道。", price: 42, category: "中式热菜", tags: ["中式经典"] },
  { name: "麻婆豆腐", description: "嫩豆腐配牛肉末，麻辣鲜香，花椒香气突出，下饭首选。", price: 26, category: "中式热菜", tags: ["辣", "热销"] },
  { name: "宫保鸡丁", description: "鸡腿肉配花生米，糊辣荔枝口，微甜微辣。", price: 34, category: "中式热菜", tags: ["辣", "中式经典"] },
  { name: "糖醋里脊", description: "里脊条炸至金黄，裹糖醋汁，酸甜适口，老少皆宜。", price: 38, category: "中式热菜", tags: [] },
  { name: "木须肉", description: "鸡蛋、木耳、黄瓜与瘦肉同炒，清爽家常。", price: 30, category: "中式热菜", tags: [] },
  // 凉菜小吃
  { name: "俄式沙拉（Оливье）", description: "土豆、鸡蛋、酸黄瓜、豌豆配蛋黄酱，俄式节日经典沙拉。", price: 24, category: "凉菜小吃", tags: ["俄式经典"] },
  { name: "鱼子酱薄饼（Блины）", description: "俄式薄煎饼配红鱼子酱与酸奶油，咸鲜醇厚。", price: 56, category: "凉菜小吃", tags: ["新品", "推荐"] },
  { name: "拍黄瓜", description: "黄瓜拍碎拌蒜蓉、香醋与香油，清爽解腻。", price: 14, category: "凉菜小吃", tags: ["素食"] },
  { name: "大列巴配黄油果酱", description: "俄式大列巴切片烤香，配黄油与自制蓝莓果酱。", price: 18, category: "凉菜小吃", tags: ["俄式经典", "素食"] },
  // 主食
  { name: "俄式红肠炒饭", description: "融合招牌：哈尔滨红肠切丁与鸡蛋、米饭同炒，咸香扑鼻。", price: 28, category: "主食", tags: ["热销", "新品"] },
  { name: "罗宋牛肉面", description: "罗宋汤底的手擀面，配炖牛腩块，俄中融合一碗面。", price: 32, category: "主食", tags: ["新品", "推荐"] },
  { name: "葱油拌面", description: "小葱熬油拌面，酱香浓郁，简单经典。", price: 16, category: "主食", tags: ["素食"] },
  { name: "小笼包（6只）", description: "薄皮多汁，猪肉馅，配姜丝香醋。", price: 22, category: "主食", tags: ["热销"] },
  // 甜品饮品
  { name: "蜂蜜蛋糕（Медовик）", description: "俄式千层蜂蜜蛋糕，层层奶油夹心，甜而不腻。", price: 26, category: "甜品饮品", tags: ["俄式经典", "推荐"] },
  { name: "格瓦斯（Квас）", description: "面包发酵饮品，气泡绵密，微甜麦香，冰镇饮用。", price: 12, category: "甜品饮品", tags: ["俄式经典"] },
  { name: "酸梅汤", description: "乌梅、山楂熬制，冰镇消暑解腻。", price: 10, category: "甜品饮品", tags: [] },
  { name: "俄式红茶配柠檬", description: "浓红茶配柠檬片与方糖，俄式茶炊传统喝法。", price: 12, category: "甜品饮品", tags: [] },
];

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // 管理员账号（首次登录后请尽快修改密码）
  await db
    .insert(admins)
    .values({ username: "admin", passwordHash: hashPassword("admin123"), role: "admin" })
    .onDuplicateKeyUpdate({ set: { username: "admin" } });
  console.log("管理员账号就绪：admin / admin123");

  // 标签
  const tagIdByName = new Map<string, number>();
  for (const [i, tag] of TAGS.entries()) {
    await db
      .insert(tags)
      .values({ name: tag.name, color: tag.color, sort: i })
      .onDuplicateKeyUpdate({ set: { color: tag.color, sort: i } });
    const row = await db.query.tags.findFirst({ where: (t, { eq }) => eq(t.name, tag.name) });
    tagIdByName.set(tag.name, row!.id);
  }
  console.log(`标签就绪：${TAGS.length} 个`);

  // 菜品（已存在同名菜品则跳过，保证种子可重复执行）
  let created = 0;
  for (const dish of DISHES) {
    const existing = await db.query.dishes.findFirst({
      where: (d, { eq }) => eq(d.name, dish.name),
    });
    if (existing) continue;
    const [{ id }] = await db
      .insert(dishes)
      .values({
        name: dish.name,
        description: dish.description,
        price: dish.price.toFixed(2),
        category: dish.category,
        imageUrl: null,
        isAvailable: true,
      })
      .$returningId();
    const links = dish.tags
      .map((name) => tagIdByName.get(name))
      .filter((tagId): tagId is number => tagId !== undefined)
      .map((tagId) => ({ dishId: id, tagId }));
    if (links.length > 0) await db.insert(dishTags).values(links);
    created++;
  }
  console.log(`菜品填充完成：新增 ${created} 道（共 ${DISHES.length} 道在种子中）`);
  console.log("Done.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
