/**
 * 吉祥俄中餐厅 —— 菜单种子数据（临时填充用）
 * 餐厅名称：吉祥（俄中融合风味）
 *
 * 使用方式（Next.js + Prisma + Vercel Postgres 项目）：
 * 1. 将本文件放到项目的 prisma/seed.ts
 * 2. 在 package.json 中添加：
 *    "prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }
 * 3. 执行：npx prisma db seed
 *
 * 说明：
 * - Dish 模型假设字段：name / description / price / category / imageUrl / isAvailable
 * - Tag 模型假设字段：name / color
 * - 菜品与标签为多对多关系（tags 隐式或显式关联表均可，按实际 schema 微调）
 * - imageUrl 暂用占位图，后续由管理员通过 Vercel Blob 上传替换
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** 预设标签（对应 SRS 3.2.2 标签设置，支持自定义颜色） */
const TAGS = [
  { name: '热销', color: '#EF4444' },
  { name: '新品', color: '#22C55E' },
  { name: '素食', color: '#84CC16' },
  { name: '辣', color: '#F97316' },
  { name: '推荐', color: '#3B82F6' },
  { name: '俄式经典', color: '#8B5CF6' },
  { name: '中式经典', color: '#EAB308' },
] as const;

/** 菜单数据：名称 / 描述 / 价格(元) / 分类 / 标签 */
const DISHES: {
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  isAvailable?: boolean;
}[] = [
  // ---------- 汤类 ----------
  {
    name: '罗宋汤（红菜汤）',
    description: '俄式经典红菜头浓汤，配牛腩慢炖，酸甜开胃，附酸奶油与黑面包。',
    price: 28.0,
    category: '汤类',
    tags: ['热销', '俄式经典'],
  },
  {
    name: '奶油蘑菇汤',
    description: '新鲜口蘑与淡奶油熬制，口感丝滑浓郁，撒少许欧芹碎。',
    price: 26.0,
    category: '汤类',
    tags: ['俄式经典', '素食'],
  },
  {
    name: '酸辣汤',
    description: '中式经典酸辣口味，豆腐丝、木耳、蛋花，胡椒香气足。',
    price: 18.0,
    category: '汤类',
    tags: ['中式经典', '辣'],
  },
  // ---------- 俄式主菜 ----------
  {
    name: '俄式烤肉串（Шашлык）',
    description: '大块猪梅花肉炭火烤制，洋葱与香料腌制入味，配烤蔬菜与酸黄瓜。',
    price: 68.0,
    category: '俄式主菜',
    tags: ['热销', '俄式经典', '推荐'],
  },
  {
    name: '俄式炖牛肉（Beef Stroganoff）',
    description: '牛里脊条配酸奶油蘑菇酱汁，可搭配米饭或俄式宽面。',
    price: 62.0,
    category: '俄式主菜',
    tags: ['俄式经典'],
  },
  {
    name: '罐焖牛肉',
    description: '牛肉与土豆、胡萝卜入陶罐慢煨，汤汁浓郁，罐口封酥皮。',
    price: 58.0,
    category: '俄式主菜',
    tags: ['推荐', '俄式经典'],
  },
  {
    name: '基辅鸡卷',
    description: '鸡胸包裹香草黄油，炸至金黄酥脆，切开后黄油流心。',
    price: 52.0,
    category: '俄式主菜',
    tags: ['新品'],
  },
  {
    name: '俄式饺子（Пельмени）',
    description: '西伯利亚风味小水饺，猪肉牛肉双拼馅，配酸奶油或黄油。',
    price: 36.0,
    category: '俄式主菜',
    tags: ['俄式经典'],
  },
  {
    name: '俄式红肠拼盘',
    description: '哈尔滨红肠、茶肠与酸黄瓜、芥末酱拼盘，佐酒佳品。',
    price: 42.0,
    category: '俄式主菜',
    tags: ['热销'],
  },
  // ---------- 中式热菜 ----------
  {
    name: '锅包肉',
    description: '东北名菜，里脊裹糊炸至酥脆，糖醋汁挂匀，外脆里嫩。',
    price: 46.0,
    category: '中式热菜',
    tags: ['热销', '中式经典', '推荐'],
  },
  {
    name: '地三鲜',
    description: '茄子、土豆、青椒过油后红烧，咸香下饭。',
    price: 28.0,
    category: '中式热菜',
    tags: ['素食', '中式经典'],
  },
  {
    name: '酸菜白肉锅',
    description: '东北酸菜与五花肉同炖，汤鲜味浓，配血肠风味更佳。',
    price: 48.0,
    category: '中式热菜',
    tags: ['中式经典'],
  },
  {
    name: '猪肉炖粉条',
    description: '五花肉与红薯粉条小火慢炖，酱香浓郁，家常味道。',
    price: 42.0,
    category: '中式热菜',
    tags: ['中式经典'],
  },
  {
    name: '麻婆豆腐',
    description: '嫩豆腐配牛肉末，麻辣鲜香，花椒香气突出，下饭首选。',
    price: 26.0,
    category: '中式热菜',
    tags: ['辣', '热销'],
  },
  {
    name: '宫保鸡丁',
    description: '鸡腿肉配花生米，糊辣荔枝口，微甜微辣。',
    price: 34.0,
    category: '中式热菜',
    tags: ['辣', '中式经典'],
  },
  {
    name: '糖醋里脊',
    description: '里脊条炸至金黄，裹糖醋汁，酸甜适口，老少皆宜。',
    price: 38.0,
    category: '中式热菜',
    tags: [],
  },
  {
    name: '木须肉',
    description: '鸡蛋、木耳、黄瓜与瘦肉同炒，清爽家常。',
    price: 30.0,
    category: '中式热菜',
    tags: [],
  },
  // ---------- 凉菜小吃 ----------
  {
    name: '俄式沙拉（Оливье）',
    description: '土豆、鸡蛋、酸黄瓜、豌豆配蛋黄酱，俄式节日经典沙拉。',
    price: 24.0,
    category: '凉菜小吃',
    tags: ['俄式经典'],
  },
  {
    name: '鱼子酱薄饼（Блины）',
    description: '俄式薄煎饼配红鱼子酱与酸奶油，咸鲜醇厚。',
    price: 56.0,
    category: '凉菜小吃',
    tags: ['新品', '推荐'],
  },
  {
    name: '拍黄瓜',
    description: '黄瓜拍碎拌蒜蓉、香醋与香油，清爽解腻。',
    price: 14.0,
    category: '凉菜小吃',
    tags: ['素食'],
  },
  {
    name: '大列巴配黄油果酱',
    description: '俄式大列巴切片烤香，配黄油与自制蓝莓果酱。',
    price: 18.0,
    category: '凉菜小吃',
    tags: ['俄式经典', '素食'],
  },
  // ---------- 主食 ----------
  {
    name: '俄式红肠炒饭',
    description: '融合招牌：哈尔滨红肠切丁与鸡蛋、米饭同炒，咸香扑鼻。',
    price: 28.0,
    category: '主食',
    tags: ['热销', '新品'],
  },
  {
    name: '罗宋牛肉面',
    description: '罗宋汤底的手擀面，配炖牛腩块，俄中融合一碗面。',
    price: 32.0,
    category: '主食',
    tags: ['新品', '推荐'],
  },
  {
    name: '葱油拌面',
    description: '小葱熬油拌面，酱香浓郁，简单经典。',
    price: 16.0,
    category: '主食',
    tags: ['素食'],
  },
  {
    name: '小笼包（6只）',
    description: '薄皮多汁，猪肉馅，配姜丝香醋。',
    price: 22.0,
    category: '主食',
    tags: ['热销'],
  },
  // ---------- 甜品饮品 ----------
  {
    name: '蜂蜜蛋糕（Медовик）',
    description: '俄式千层蜂蜜蛋糕，层层奶油夹心，甜而不腻。',
    price: 26.0,
    category: '甜品饮品',
    tags: ['俄式经典', '推荐'],
  },
  {
    name: '格瓦斯（Квас）',
    description: '面包发酵饮品，气泡绵密，微甜麦香，冰镇饮用。',
    price: 12.0,
    category: '甜品饮品',
    tags: ['俄式经典'],
  },
  {
    name: '酸梅汤',
    description: '乌梅、山楂熬制，冰镇消暑解腻。',
    price: 10.0,
    category: '甜品饮品',
    tags: [],
  },
  {
    name: '俄式红茶配柠檬',
    description: '浓红茶配柠檬片与方糖，俄式茶炊传统喝法。',
    price: 12.0,
    category: '甜品饮品',
    tags: [],
  },
];

async function main() {
  console.log('开始填充「吉祥」俄中餐厅菜单数据……');

  // 1. 创建/更新标签
  const tagMap = new Map<string, string>();
  for (const tag of TAGS) {
    const record = await prisma.tag.upsert({
      where: { name: tag.name },
      update: { color: tag.color },
      create: { name: tag.name, color: tag.color },
    });
    tagMap.set(tag.name, record.id);
  }
  console.log(`标签就绪：${TAGS.length} 个`);

  // 2. 创建菜品并关联标签
  let count = 0;
  for (const dish of DISHES) {
    await prisma.dish.create({
      data: {
        name: dish.name,
        description: dish.description,
        price: dish.price,
        category: dish.category,
        imageUrl: null, // 占位：后续由管理员通过 Vercel Blob 上传并回填 URL
        isAvailable: dish.isAvailable ?? true,
        tags: {
          connect: dish.tags.map((t) => ({ id: tagMap.get(t)! })),
        },
      },
    });
    count++;
  }
  console.log(`菜品填充完成：共 ${count} 道，餐厅「吉祥」菜单初始化成功 ✅`);
}

main()
  .catch((e) => {
    console.error('种子数据填充失败：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
