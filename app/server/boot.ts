import app from "./app";
import { env } from "./lib/env";

// 本地生产模式：启动常驻 Node 服务器并托管前端静态文件。
// Vercel 部署不使用本文件（入口是 api/index.ts）。
if (env.isProduction && !process.env.VERCEL) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

export default app;
