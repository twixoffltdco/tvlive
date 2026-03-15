import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tv, Radio, ShieldAlert } from "lucide-react";
import { z } from "zod";

const signUpSchema = z.object({
  username: z.string().min(3, "Имя пользователя должно быть минимум 3 символа").max(50, "Имя пользователя слишком длинное"),
  email: z.string().email("Неверный формат email"),
  password: z.string().min(6, "Пароль должен быть минимум 6 символов").max(100, "Пароль слишком длинный"),
});

const signInSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(1, "Введите пароль"),
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [banMessage, setBanMessage] = useState<string | null>(null);
  const [agreedToLegal, setAgreedToLegal] = useState(false);
  const [agreedToLegalSignIn, setAgreedToLegalSignIn] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkBanAndRedirect(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkBanAndRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkBanAndRedirect = async (userId: string) => {
    const { data: ban } = await supabase
      .from("banned_users")
      .select("reason, rule_code")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (ban) {
      await supabase.auth.signOut();
      setBanMessage(`Ваш аккаунт заблокирован за нарушение правил платформы.\nПричина: ${ban.rule_code || '2.19'} — ${ban.reason || 'запрещён спам каналами и создание фейковых/дублирующих официальных каналов.'}`);
    } else {
      navigate("/");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setBanMessage(null);

    try {
      const validatedData = signUpSchema.parse({ username, email, password });
      if (!agreedToLegal) {
        throw new Error("Для регистрации необходимо принять правила платформы и политику конфиденциальности");
      }

      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: { username: validatedData.username },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) throw new Error("Этот email уже зарегистрирован");
        throw error;
      }

      if (data.user) {
        toast({ title: "Добро пожаловать!", description: "Ваш аккаунт успешно создан. Перенаправляем..." });
        setEmail(""); setPassword(""); setUsername(""); setAgreedToLegal(false);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ title: "Ошибка валидации", description: error.issues[0].message, variant: "destructive" });
      } else {
        toast({ title: "Ошибка регистрации", description: error.message || "Не удалось создать аккаунт", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setBanMessage(null);

    try {
      const validatedData = signInSchema.parse({ email, password });
      if (!agreedToLegalSignIn) {
        throw new Error("Для входа необходимо подтвердить согласие с правилами платформы");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) throw new Error("Неверный email или пароль");
        if (error.message.includes("Email not confirmed")) throw new Error("Email не подтвержден. Проверьте почту.");
        throw error;
      }

      if (data.session) {
        // Ban check happens in onAuthStateChange -> checkBanAndRedirect
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ title: "Ошибка валидации", description: error.issues[0].message, variant: "destructive" });
      } else {
        toast({ title: "Ошибка входа", description: error.message || "Не удалось войти", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  // Show ban screen
  if (banMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/10">
        <div className="w-full max-w-md p-4">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="text-center">
              <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
              <CardTitle className="text-2xl text-destructive">Аккаунт заблокирован</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground whitespace-pre-line">{banMessage}</p>
              <Button variant="outline" onClick={() => setBanMessage(null)}>Попробовать другой аккаунт</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 cyber-grid">
      <div className="w-full max-w-md p-4">
        <div className="text-center mb-8 space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Tv className="w-10 h-10 text-primary animate-pulse" />
            <h1 className="text-4xl font-display font-bold neon-text-primary">StreamLiveTV</h1>
            <Radio className="w-10 h-10 text-secondary animate-pulse" />
          </div>
          <p className="text-muted-foreground">Создай собственный телеканал или радио</p>
        </div>

        <Card className="glass-strong border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-display">Вход в систему</CardTitle>
            <CardDescription>Войдите или создайте новый аккаунт</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signin">Вход</TabsTrigger>
                <TabsTrigger value="signup">Регистрация</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signin">Email</Label>
                    <Input id="email-signin" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signin">Пароль</Label>
                    <Input id="password-signin" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background/50" />
                  </div>
                  <div className="rounded-md border border-border bg-background/30 p-3 text-xs text-muted-foreground space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToLegalSignIn}
                        onChange={(e) => setAgreedToLegalSignIn(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        Подтверждаю согласие с <Link to="/legal#terms" className="text-primary underline">условиями использования</Link> и <Link to="/legal#privacy" className="text-primary underline">политикой конфиденциальности</Link>.
                      </span>
                    </label>
                  </div>

                  <Button type="submit" className="w-full font-semibold" disabled={loading}>{loading ? "Загрузка..." : "Войти"}</Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Имя пользователя</Label>
                    <Input id="username" type="text" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input id="email-signup" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Пароль</Label>
                    <Input id="password-signup" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-background/50" />
                  </div>
                  <div className="rounded-md border border-border bg-background/30 p-3 text-xs text-muted-foreground space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToLegal}
                        onChange={(e) => setAgreedToLegal(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        Я принимаю <Link to="/legal#terms" className="text-primary underline">пользовательское соглашение</Link>, <Link to="/legal#privacy" className="text-primary underline">политику конфиденциальности</Link> и <Link to="/legal#rules" className="text-primary underline">правила платформы</Link>.
                      </span>
                    </label>
                  </div>

                  <Button type="submit" className="w-full font-semibold" disabled={loading}>{loading ? "Создание..." : "Создать аккаунт"}</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
