import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { setToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ username: "", password: "" });

  const login = trpc.auth.adminLogin.useMutation({
    onSuccess: (data) => {
      setToken(data.token);
      utils.auth.me.reset();
      toast.success("欢迎回来，管理员");
      navigate("/admin/orders");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#2b2118] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="font-display text-4xl font-black tracking-widest text-[#fcf8ef]">吉祥</p>
          <p className="mt-2 text-xs tracking-[0.4em] text-[#dfa43d]">餐 厅 管 理 后 台</p>
        </div>
        <form
          className="mt-8 space-y-4 rounded-2xl bg-[#fcf8ef] p-6"
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate(form);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="admin-username">管理员账号</Label>
            <Input
              id="admin-username"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">密码</Label>
            <Input
              id="admin-password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={login.isPending}>
            {login.isPending ? "登录中…" : "登录后台"}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-[#fcf8ef]/60">
          顾客点餐请前往 <Link to="/" className="text-[#dfa43d] underline">餐厅首页</Link>
        </p>
      </div>
    </div>
  );
}
