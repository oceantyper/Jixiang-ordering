import { handle } from "hono/vercel";
import app from "../server/app";

/**
 * Vercel Serverless Function 入口：所有 /api/* 请求由 Hono 应用处理。
 * 本地开发 / 自托管不走这里（见 server/boot.ts）。
 */
export default handle(app);
