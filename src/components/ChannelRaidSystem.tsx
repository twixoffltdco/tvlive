import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Zap, Search, Users, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChannelRaidSystemProps {
  channelId: string;
  isOwner: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  thumbnail_url: string | null;
  channel_type: string;
  viewer_count: number;
}

const ChannelRaidSystem = ({ channelId, isOwner }: ChannelRaidSystemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [raidMessage, setRaidMessage] = useState("Рейд! Присоединяйтесь к каналу!");
  const [activeRaid, setActiveRaid] = useState<{ target_title: string; target_id: string } | null>(null);

  useEffect(() => {
    // Listen for incoming raids
    const channel = supabase
      .channel(`raid-${channelId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "channel_raids",
        filter: `target_channel_id=eq.${channelId}`,
      }, (payload: any) => {
        toast({
          title: "🎉 Рейд!",
          description: `Канал начал рейд на ваш канал! +${payload.new.viewer_count || 0} зрителей`,
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [channelId]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from("channels")
      .select("id, title, thumbnail_url, channel_type, viewer_count")
      .neq("id", channelId)
      .ilike("title", `%${searchQuery}%`)
      .eq("is_hidden", false)
      .limit(10);
    setResults(data || []);
    setSearching(false);
  };

  const startRaid = async (target: SearchResult) => {
    if (!user) return;

    // Get current viewer count
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("channel_viewers")
      .select("*", { count: "exact", head: true })
      .eq("channel_id", channelId)
      .gte("last_seen", fiveMinutesAgo);

    const { error } = await supabase.from("channel_raids").insert({
      source_channel_id: channelId,
      target_channel_id: target.id,
      initiated_by: user.id,
      viewer_count: count || 0,
      message: raidMessage,
    });

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }

    setActiveRaid({ target_title: target.title, target_id: target.id });
    setIsOpen(false);
    toast({
      title: "🚀 Рейд запущен!",
      description: `Зрители перенаправлены на "${target.title}"`,
    });
  };

  if (!isOwner) return null;

  return (
    <div className="space-y-3">
      {activeRaid && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">Рейд активен</p>
                <p className="text-xs text-muted-foreground">Целевой канал: {activeRaid.target_title}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.open(`/channel/${activeRaid.target_id}`, '_blank')}>
              <ArrowRight className="w-4 h-4 mr-1" /> Перейти
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Zap className="w-4 h-4" /> Рейд
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Запустить рейд
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Найти канал для рейда</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Название канала..."
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searching}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Сообщение рейда</Label>
              <Input
                value={raidMessage}
                onChange={(e) => setRaidMessage(e.target.value)}
                placeholder="Сообщение для зрителей..."
                className="mt-1"
              />
            </div>

            {results.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.map((ch) => (
                  <Card key={ch.id} className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => startRaid(ch)}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {ch.thumbnail_url ? (
                          <img src={ch.thumbnail_url} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Users className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{ch.title}</p>
                          <p className="text-xs text-muted-foreground">{ch.viewer_count || 0} зрителей</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Zap className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChannelRaidSystem;
