import type { ReactNode } from "react";
import { Routes, Route, Navigate, Link } from "react-router";
import { Toaster } from "sonner";
import { trpc } from "@/providers/trpc";
import { getToken } from "@/lib/auth";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminMenuPage from "./pages/AdminMenuPage";

/** 管理员路由守卫：未登录或非管理员则跳转管理登录页 */
function AdminGuard({ children }: { children: ReactNode }) {
  const hasToken = !!getToken();
  const me = trpc.auth.me.useQuery(undefined, { enabled: hasToken, retry: false });

  if (!hasToken) return <Navigate to="/admin" replace />;
  if (me.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">验证身份中…</div>;
  }
  if (me.data?.type !== "admin") return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="font-display text-6xl font-black text-primary">404</p>
      <p className="text-muted-foreground">页面不存在</p>
      <Link to="/" className="text-primary underline">
        返回餐厅首页
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route
          path="/admin/orders"
          element={
            <AdminGuard>
              <AdminOrdersPage />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <AdminGuard>
              <AdminMenuPage />
            </AdminGuard>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </>
  );
}
