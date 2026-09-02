import type { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { LogOut, UtensilsCrossed, ClipboardList } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { clearToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const utils = trpc.useUtils();
  const logout = trpc.auth.logout.useMutation({
    onSettled: () => {
      clearToken();
      utils.auth.me.reset();
      navigate("/admin");
    },
  });

  const navItems = [
    { to: "/admin/orders", label: "订单管理", icon: ClipboardList },
    { to: "/admin/menu", label: "菜单管理", icon: UtensilsCrossed },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-[#2b2118] text-[#fcf8ef]">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <span className="font-display text-xl font-black tracking-wide">
            吉祥 <span className="text-xs font-medium tracking-[0.3em] text-[#dfa43d]">管理后台</span>
          </span>
          <nav className="ml-6 flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.to}
                variant="ghost"
                size="sm"
                asChild
                className={
                  location.pathname === item.to
                    ? "bg-white/10 text-[#dfa43d] hover:bg-white/15 hover:text-[#dfa43d]"
                    : "text-[#fcf8ef]/80 hover:bg-white/10 hover:text-[#fcf8ef]"
                }
              >
                <Link to={item.to}>
                  <item.icon className="mr-1 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-[#fcf8ef]/80 hover:bg-white/10 hover:text-[#fcf8ef]"
            onClick={() => logout.mutate()}
          >
            <LogOut className="mr-1 h-4 w-4" />
            退出登录
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
