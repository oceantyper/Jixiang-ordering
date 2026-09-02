# 「吉祥俄中餐厅」外卖系统 —— Vercel 上线教程（逐步精确操作）

**适用版本：中俄双语 + 移动端优化版（版本卡片「中俄双语 + 移动端布局优化」）**

本项目已改造为 Vercel 就绪结构，部署时零配置：

- **前端**：静态构建，由 Vercel CDN 托管（`dist/public`）
- **后端**：`api/index.ts` 作为 Serverless Function 处理所有 `/api/*` 请求
- **数据库**：云端 MySQL 8（本教程使用免费的 TiDB Cloud Serverless）

**预计耗时：30–50 分钟。**

---

## 第一步：注册三个账号（均免费）

| 平台 | 网址 | 用途 |
| --- | --- | --- |
| GitHub | https://github.com | 存放代码，Vercel 从这里拉取部署 |
| Vercel | https://vercel.com | 托管网站（用 GitHub 账号直接登录） |
| TiDB Cloud | https://tidbcloud.com | 免费云端 MySQL 兼容数据库 |

> 也可以用其他 MySQL 8 云数据库（阿里云 RDS、PlanetScale 等），连接串格式相同，第三步相应替换。

---

## 第二步：把代码推送到 GitHub

### 2.1 准备代码

1. 在本对话中找到最新版本卡片（「中俄双语 + 移动端布局优化」），点**「下载代码」**得到压缩包。
2. 解压到本地，例如 `~/projects/jixiang-app`。
3. **删除**解压包中的 `node_modules/` 和 `dist/` 文件夹（Vercel 会重新安装构建）。
4. **删除 `.env` 文件**——里面有测试库密码，绝不能传上 GitHub。保留 `.env.example` 作模板。

### 2.2 确认 .gitignore

打开项目根目录 `.gitignore`，确认包含以下行（一般已自带）：

```
node_modules
dist
.env
```

### 2.3 创建 GitHub 仓库

1. 登录 GitHub，点右上角 **「+」→「New repository」**。
2. **Repository name** 填 `jixiang-app`。
3. 选择 **Private**（私有，推荐）。
4. **不要**勾选「Add a README file」等任何初始化选项。
5. 点 **「Create repository」**。

### 2.4 推送代码

在项目目录打开终端，依次执行（把 `你的用户名` 替换为您的 GitHub 用户名）：

```bash
cd ~/projects/jixiang-app
git init
git add .
git commit -m "吉祥俄中餐厅外卖系统（中俄双语版）"
git branch -M main
git remote add origin https://github.com/你的用户名/jixiang-app.git
git push -u origin main
```

> 首次推送会要求登录 GitHub，按提示授权即可。

---

## 第三步：创建云端数据库（TiDB Cloud）

1. 登录 https://tidbcloud.com ，点 **「Create Cluster」**。
2. 选择 **「Serverless」**（免费额度足够）。
3. **Cluster Name** 填 `jixiang`，Region 选离您目标用户近的（如 Singapore / Tokyo）。
4. 点 **「Create」**，等待约 1 分钟集群就绪。
5. 集群页面点右上角 **「Connect」**：
   - **Connect with** 选 `General` 或 `MySQL Client`。
   - 点 Generate 设置数据库密码，**复制保存好**。
   - 记下页面显示的 **HOST**（形如 `gateway01.xxx.tidbcloud.com`）、**PORT**（`4000`）、**USERNAME**（形如 `xxxxx.root`）。
6. 按以下格式拼出您的 `DATABASE_URL`（**照抄格式**，只替换尖括号内容）：

```
mysql://<USERNAME>:<密码>@<HOST>:4000/test?ssl={"rejectUnauthorized":true}
```

示例（供对照格式，不可用）：

```
mysql://3abcXYZ.root:mypassword@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}
```

> `test` 是 TiDB 自带的数据库名，直接用它即可，无需另外建库。

---

## 第四步：在 Vercel 导入并部署

1. 登录 https://vercel.com ，点 **「Add New…」→「Project」**。
2. 在 **Import Git Repository** 列表找到 `jixiang-app`，点 **「Import」**。
   - 列表为空就先点「Adjust GitHub App Permissions」授权 Vercel 访问该仓库。
3. **Configure Project** 页面：
   - **Framework Preset**：选 `Vite`。
   - **Root Directory**：保持 `./` 不变。
   - Build / Output 设置**不用动**——根目录的 `vercel.json` 已配好（构建命令、输出目录、前端路由回退）。
4. 展开 **「Environment Variables」**，**逐个添加以下 4 个变量**（Environment 保持全选）：

| Name | Value |
| --- | --- |
| `DATABASE_URL` | 第三步拼好的完整连接串 |
| `APP_ID` | 任意字符串，例如 `jixiang-vercel` |
| `APP_SECRET` | 任意长随机字符串，例如 `jixiang-secret-8f3k29d` |
| `VITE_APP_ID` | 与 `APP_ID` 相同的值 |

5. 点 **「Deploy」**，等待 1–3 分钟。
6. 出现 🎉 页面即部署成功。点 **「Visit」** 或记下分配的域名，形如：

```
https://jixiang-app-xxxx.vercel.app
```

> 此时打开会显示「菜单加载失败」——数据库表还没建，下一步解决。

---

## 第五步：初始化线上数据库（建表 + 菜单 + 俄语翻译）

在**本地电脑**的项目目录操作（需已安装 Node.js 20+）：

```bash
cd ~/projects/jixiang-app

# 1. 安装依赖（约 1–3 分钟）
npm install
```

2. 在项目根目录**新建 `.env` 文件**，内容如下（替换为您的 TiDB 连接串）：

```bash
APP_ID=jixiang-vercel
APP_SECRET=jixiang-secret-8f3k29d
VITE_APP_ID=jixiang-vercel
DATABASE_URL=mysql://<USERNAME>:<密码>@<HOST>:4000/test?ssl={"rejectUnauthorized":true}
```

3. 依次执行三条命令：

```bash
# 建表（9 张表，含俄语字段）
npm run db:push
# 出现确认提示时输入 y 回车

# 灌入种子数据：管理员 admin/admin123 + 7 个标签 + 29 道菜品
npx tsx db/seed.ts

# 回填 29 道菜品的俄语名称与描述
npx tsx db/seed-ru.ts
```

看到 `俄语翻译回填完成：29 道菜品` 即全部完成。

> ⚠️ **如果您之前已按旧教程建过库**：不用重建，只需补两条命令——
> ```bash
> npm run db:push        # 自动给 dishes 表加 nameRu / descriptionRu 两列
> npx tsx db/seed-ru.ts  # 回填俄语翻译
> ```

---

## 第六步：上线验证（逐项核对）

打开您的 Vercel 域名，逐项验证：

| 步骤 | 操作 | 预期结果 |
| --- | --- | --- |
| 1 | 打开首页 | 显示「吉祥俄中餐厅」和 29 道菜品 |
| 2 | 点导航栏**最右侧「RU」按钮** | 全站切换俄语：菜名变 Борщ/Гобаожоу、按钮变 В корзину、分类变 Супы 等；再点「中文」切回 |
| 3 | 用手机浏览器（或 DevTools 手机模式）打开首页 | 左侧分类栏 + 右侧菜品 + 底部购物车栏，顶部导航完整不遮挡；俄语模式下 banner 自动收缩 |
| 4 | 注册一个顾客账号 → 加购 → 外卖送上门 → 填地址 → 提交订单 | 提示下单成功，生成订单号 |
| 5 | 我的订单 → 去付款 → 我已完成付款 | 付款状态变「已付款」 |
| 6 | 访问 `https://您的域名/admin`，用 `admin` / `admin123` 登录 | 进入深色管理后台，看到刚才的订单 |
| 7 | 确认接单 → 开始配送 → 完成 | 状态依次流转，顾客端同步更新 |
| 8 | 菜单管理 → 编辑菜品 → 看到「菜品名称（俄语）」输入栏，改个价格 | 保存后顾客端立即生效 |
| 9 | 直接访问 `https://您的域名/admin/menu` 并刷新 | 页面正常（不 404） |

全部通过 = 正式上线成功。

---

## 第七步（强烈建议）：修改管理员密码

默认密码 `admin123` 必须尽快更换。两个办法任选：

- **办法 A（推荐）**：告诉我「加一个修改管理员密码功能」，我加好后您在后台直接改。
- **办法 B（手动）**：在 TiDB Cloud 的 SQL Editor 里更新 `admins` 表的 `passwordHash` 字段（哈希生成方式问我即可）。

---

## 日常更新流程（以后改代码后）

```bash
git add .
git commit -m "描述本次修改"
git push
```

Vercel 检测到推送后 1–3 分钟自动重新部署，**数据库数据不受影响**。

---

## 常见问题排查

| 现象 | 原因与解决 |
| --- | --- |
| 首页「菜单加载失败」 | ① 还没执行第五步建表；② `DATABASE_URL` 拼错（核对用户名/密码/主机/端口 4000）；③ 改完环境变量后需到 **Deployments** 页对最新部署点「⋯」→ **Redeploy** |
| 所有 API 返回 500 | 环境变量缺失。Vercel 项目 → **Deployments** → 最新一条 → **Functions** 标签看日志 |
| 提示 SSL 相关错误 | `DATABASE_URL` 结尾必须是 `?ssl={"rejectUnauthorized":true}`，不能写 `?ssl=true` |
| 部署时 Functions 报错 | 确认下载的是**最新版本**代码（根目录应有 `api/index.ts` 和 `vercel.json`） |
| 管理后台路径刷新 404 | `vercel.json` 缺失或被改动，恢复后重新部署 |
| 俄语菜名不显示 | 没执行 `npx tsx db/seed-ru.ts`，或管理端该菜品的俄语栏为空（会自动回退中文） |
| 手机上看不到左侧分类栏 | 左侧栏只在 <768px 宽度显示，桌面浏览器请用 DevTools 手机模式查看 |
| 想绑定自己的域名 | Vercel → Project → **Settings → Domains** → 输入域名，按提示加 CNAME 记录 |

---

## 说明与提醒

1. **架构**：Vercel 上后端以 Serverless Function 运行，免费版单次执行上限 10 秒，点餐场景绰绰有余。
2. **图片存储**：菜品图片以压缩 base64 存数据库（≤2MB），Vercel 上直接可用；量大后可迁 Vercel Blob，需要时我帮您改。
3. **数据安全**：`.env` 只在本地使用，切勿推送到 GitHub；Vercel 环境变量在控制台加密存储。
4. **线上支付**：`PAYMENT_*` 预留变量和支付接口已就位，接入时告诉我。
5. **数据库升级纪律**：以后凡是代码更新涉及 `db/schema.ts` 变更，部署后都要在本地跑一次 `npm run db:push` 同步线上库结构。

部署中卡在任何一步，把报错截图或文字发给我，我帮您定位。
