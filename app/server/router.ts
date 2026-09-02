import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./authRouter";
import { menuRouter } from "./menuRouter";
import { orderRouter } from "./orderRouter";
import { paymentRouter } from "./paymentRouter";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  menu: menuRouter,
  order: orderRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
