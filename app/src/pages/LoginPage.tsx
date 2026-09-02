import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useI18n } from "@/lib/i18n";
import { setToken } from "@/lib/auth";
import { CustomerHeader } from "@/components/CustomerHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { t } = useI18n();

  const login = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setToken(data.token);
      utils.auth.me.reset();
      toast.success(t("loginOk"));
      navigate("/");
    },
    onError: (e) => toast.error(e.message),
  });
  const register = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setToken(data.token);
      utils.auth.me.reset();
      toast.success(t("registerOk"));
      navigate("/");
    },
    onError: (e) => toast.error(e.message),
  });

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ email: "", password: "", confirm: "", name: "", phone: "" });

  return (
    <div className="min-h-screen">
      <CustomerHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-display text-center text-3xl font-black tracking-wide">{t("welcome")}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">{t("loginHint")}</p>

        <Tabs defaultValue="login" className="mt-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t("loginTab")}</TabsTrigger>
            <TabsTrigger value="register">{t("registerTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form
              className="mt-6 space-y-4 rounded-2xl border border-border/60 bg-card p-6"
              onSubmit={(e) => {
                e.preventDefault();
                login.mutate(loginForm);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="login-email">{t("email")}</Label>
                <Input
                  id="login-email"
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">{t("password")}</Label>
                <Input
                  id="login-password"
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={login.isPending}>
                {login.isPending ? t("loggingIn") : t("doLogin")}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form
              className="mt-6 space-y-4 rounded-2xl border border-border/60 bg-card p-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (regForm.password.length < 6) {
                  toast.error(t("pwdTooShort"));
                  return;
                }
                if (regForm.password !== regForm.confirm) {
                  toast.error(t("pwdMismatch"));
                  return;
                }
                register.mutate({
                  email: regForm.email,
                  password: regForm.password,
                  name: regForm.name || undefined,
                  phone: regForm.phone || undefined,
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="reg-email">{t("email")} *</Label>
                <Input
                  id="reg-email"
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">{t("name")}</Label>
                  <Input
                    id="reg-name"
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">{t("phoneNumber")}</Label>
                  <Input
                    id="reg-phone"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">{t("passwordRule")} *</Label>
                <Input
                  id="reg-password"
                  type="password"
                  required
                  minLength={6}
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm">{t("confirmPassword")} *</Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  required
                  value={regForm.confirm}
                  onChange={(e) => setRegForm({ ...regForm, confirm: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={register.isPending}>
                {register.isPending ? t("registering") : t("doRegister")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("adminEntry")} <Link to="/admin" className="text-primary underline">{t("adminLink")}</Link>
        </p>
      </main>
    </div>
  );
}
