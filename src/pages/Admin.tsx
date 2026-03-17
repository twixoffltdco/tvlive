import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface ReportRow {
  id: string;
  channel_id: string;
  reason: string;
  description: string | null;
  status: string | null;
  created_at: string | null;
  channels: { id: string; title: string; is_hidden: boolean | null; hidden_reason: string | null } | null;
}

interface BannerTemplate {
  id: string;
  title: string;
  html_content: string;
  css_content: string | null;
  js_content: string | null;
  is_active: boolean;
}

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [reasonByReport, setReasonByReport] = useState<Record<string, string>>({});
  const [bulkIds, setBulkIds] = useState("");
  const [bulkReason, setBulkReason] = useState("");
  const [templates, setTemplates] = useState<BannerTemplate[]>([]);
  const [tplForm, setTplForm] = useState({ title: "", html: "", css: "", js: "" });

  const parsedBulkIds = useMemo(
    () => bulkIds.split(/[\n,\s]+/).map((v) => v.trim()).filter(Boolean),
    [bulkIds],
  );

  const checkAccess = async () => {
    if (!user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const [{ data: roleData }, { data: profile }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
    ]);

    const username = profile?.username?.toLowerCase();
    setAllowed(Boolean(roleData) || username === "oinktech");
    setLoading(false);
  };

  const loadReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select("id,channel_id,reason,description,status,created_at,channels(id,title,is_hidden,hidden_reason)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setReports(data as unknown as ReportRow[]);
  };

  const loadTemplates = async () => {
    const { data } = await supabase
      .from("platform_banners")
      .select("id,title,html_content,css_content,js_content,is_active")
      .order("created_at", { ascending: false });
    if (data) setTemplates(data as BannerTemplate[]);
  };

  useEffect(() => {
    void checkAccess();
  }, [user?.id]);

  useEffect(() => {
    if (!allowed) return;
    void loadReports();
    void loadTemplates();
  }, [allowed]);

  const hideByReport = async (row: ReportRow) => {
    const adminReason = reasonByReport[row.id]?.trim();
    if (!adminReason) {
      toast({ title: "Укажите причину администратора", variant: "destructive" });
      return;
    }

    await supabase
      .from("channels")
      .update({
        is_hidden: true,
        hidden_at: new Date().toISOString(),
        hidden_reason: `Жалоба #${row.id}: ${adminReason}`,
      })
      .eq("id", row.channel_id);

    await supabase
      .from("reports")
      .update({
        status: "approved",
        is_verified: true,
        verified_at: new Date().toISOString(),
        admin_note: adminReason,
        moderated_by: user?.id,
        moderated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    toast({ title: "Канал скрыт", description: `Канал скрыт по жалобе #${row.id}` });
    void loadReports();
  };

  const unhideChannel = async (channelId: string) => {
    await supabase
      .from("channels")
      .update({ is_hidden: false, hidden_at: null, hidden_reason: null })
      .eq("id", channelId);
    toast({ title: "Канал восстановлен" });
    void loadReports();
  };

  const bulkHide = async () => {
    if (!parsedBulkIds.length || !bulkReason.trim()) {
      toast({ title: "Укажите список каналов и причину", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("channels")
      .update({
        is_hidden: true,
        hidden_at: new Date().toISOString(),
        hidden_reason: `Скрыто администратором: ${bulkReason.trim()}`,
      })
      .in("id", parsedBulkIds);

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Готово", description: `Скрыто каналов: ${parsedBulkIds.length}` });
    setBulkIds("");
    setBulkReason("");
  };

  const createTemplate = async () => {
    if (!tplForm.title.trim() || !tplForm.html.trim()) {
      toast({ title: "Заполните название и HTML", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("platform_banners").insert({
      title: tplForm.title.trim(),
      html_content: tplForm.html,
      css_content: tplForm.css || null,
      js_content: tplForm.js || null,
      is_active: true,
      created_by: user?.id,
    });

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }

    setTplForm({ title: "", html: "", css: "", js: "" });
    toast({ title: "Шаблон добавлен" });
    void loadTemplates();
  };

  const toggleTemplate = async (tpl: BannerTemplate, isActive: boolean) => {
    await supabase.from("platform_banners").update({ is_active: isActive }).eq("id", tpl.id);
    void loadTemplates();
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from("platform_banners").delete().eq("id", id);
    void loadTemplates();
  };

  if (loading) return <div className="min-h-screen"><Header /><div className="p-6">Загрузка...</div></div>;
  if (!allowed) return <div className="min-h-screen"><Header /><div className="p-6">Доступ запрещён</div></div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader><CardTitle>Жалобы и модерация</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {reports.map((r) => (
              <div key={r.id} className="border rounded-lg p-3 space-y-2">
                <div className="text-sm">Жалоба <b>#{r.id}</b> · {r.reason} · статус: {r.status ?? "pending"}</div>
                <div className="text-sm text-muted-foreground">Канал: {r.channels?.title ?? r.channel_id}</div>
                {r.description && <div className="text-sm">Комментарий: {r.description}</div>}
                <Input
                  placeholder="Причина от администратора"
                  value={reasonByReport[r.id] ?? ""}
                  onChange={(e) => setReasonByReport((prev) => ({ ...prev, [r.id]: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button onClick={() => hideByReport(r)}>Скрыть канал по жалобе</Button>
                  {r.channels?.is_hidden && (
                    <Button variant="outline" onClick={() => unhideChannel(r.channel_id)}>Показать канал</Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Скрыть каналы списком</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Label>ID каналов (через запятую/пробел/новую строку)</Label>
            <Textarea value={bulkIds} onChange={(e) => setBulkIds(e.target.value)} rows={4} />
            <Label>Причина</Label>
            <Input value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} />
            <Button onClick={bulkHide}>Скрыть список ({parsedBulkIds.length})</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Шаблоны баннеров (HTML/CSS/JS)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Название" value={tplForm.title} onChange={(e) => setTplForm((p) => ({ ...p, title: e.target.value }))} />
            <Textarea placeholder="HTML" rows={4} value={tplForm.html} onChange={(e) => setTplForm((p) => ({ ...p, html: e.target.value }))} />
            <Textarea placeholder="CSS" rows={4} value={tplForm.css} onChange={(e) => setTplForm((p) => ({ ...p, css: e.target.value }))} />
            <Textarea placeholder="JS" rows={4} value={tplForm.js} onChange={(e) => setTplForm((p) => ({ ...p, js: e.target.value }))} />
            <Button onClick={createTemplate}>Добавить шаблон</Button>

            <div className="space-y-2 pt-2">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <div className="text-sm">{tpl.title}</div>
                  <div className="flex items-center gap-3">
                    <Switch checked={tpl.is_active} onCheckedChange={(v) => toggleTemplate(tpl, v)} />
                    <Button variant="destructive" size="sm" onClick={() => deleteTemplate(tpl.id)}>Удалить</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
