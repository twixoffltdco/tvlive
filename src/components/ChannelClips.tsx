import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Scissors, Play, Share2, Trash2, Eye, Clock, Plus } from "lucide-react";

interface Clip {
  id: string;
  title: string;
  clip_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  views: number | null;
  created_at: string;
  user_id: string;
}

interface ChannelClipsProps {
  channelId: string;
  isOwner: boolean;
}

const ChannelClips = ({ channelId, isOwner }: ChannelClipsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [playingClip, setPlayingClip] = useState<Clip | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "views">("date");

  // Create form
  const [clipTitle, setClipTitle] = useState("");
  const [clipUrl, setClipUrl] = useState("");
  const [clipDuration, setClipDuration] = useState(30);

  useEffect(() => {
    fetchClips();
  }, [channelId, sortBy]);

  const fetchClips = async () => {
    const query = supabase
      .from("channel_clips")
      .select("*")
      .eq("channel_id", channelId);

    if (sortBy === "views") {
      query.order("views", { ascending: false });
    } else {
      query.order("created_at", { ascending: false });
    }

    const { data, error } = await query.limit(50);
    if (!error && data) setClips(data as Clip[]);
    setLoading(false);
  };

  const handleCreateClip = async () => {
    if (!user || !clipTitle.trim() || !clipUrl.trim()) {
      toast({ title: "Ошибка", description: "Заполните все поля", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("channel_clips").insert({
      channel_id: channelId,
      user_id: user.id,
      title: clipTitle.trim(),
      clip_url: clipUrl.trim(),
      duration: clipDuration,
    });

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Клип создан!" });
      setClipTitle("");
      setClipUrl("");
      setClipDuration(30);
      setIsCreateOpen(false);
      fetchClips();
    }
  };

  const handleDeleteClip = async (clipId: string) => {
    const { error } = await supabase.from("channel_clips").delete().eq("id", clipId);
    if (!error) {
      toast({ title: "Клип удалён" });
      fetchClips();
    }
  };

  const handleShareClip = (clip: Clip) => {
    const url = `${window.location.origin}/channel/${channelId}?clip=${clip.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Ссылка на клип скопирована" });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:30";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Scissors className="w-5 h-5 text-primary" />
          Клипы ({clips.length})
        </h3>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "views")}
            className="text-sm bg-background border border-border rounded-md px-2 py-1"
          >
            <option value="date">По дате</option>
            <option value="views">По просмотрам</option>
          </select>
          {user && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  Создать клип
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Scissors className="w-5 h-5" />
                    Создать клип
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Название клипа</Label>
                    <Input
                      value={clipTitle}
                      onChange={(e) => setClipTitle(e.target.value)}
                      placeholder="Лучший момент трансляции"
                    />
                  </div>
                  <div>
                    <Label>Ссылка на видео (MP4, M3U8, YouTube)</Label>
                    <Input
                      value={clipUrl}
                      onChange={(e) => setClipUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Длительность (секунды)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={300}
                      value={clipDuration}
                      onChange={(e) => setClipDuration(Number(e.target.value))}
                    />
                  </div>
                  <Button onClick={handleCreateClip} className="w-full">
                    Создать клип
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Clip Player */}
      {playingClip && (
        <Card className="border-primary/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{playingClip.title}</h4>
              <Button size="sm" variant="ghost" onClick={() => setPlayingClip(null)}>✕</Button>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {playingClip.clip_url.includes("youtube.com") || playingClip.clip_url.includes("youtu.be") ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(playingClip.clip_url)}?autoplay=1`}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video
                  src={playingClip.clip_url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clips Grid */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Загрузка клипов...</div>
      ) : clips.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Scissors className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Клипов пока нет</p>
          {user && <p className="text-sm mt-1">Создайте первый клип!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {clips.map((clip) => (
            <Card key={clip.id} className="group hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-3">
                <div
                  className="aspect-video bg-muted rounded-lg mb-2 flex items-center justify-center relative overflow-hidden"
                  onClick={() => setPlayingClip(clip)}
                >
                  {clip.thumbnail_url ? (
                    <img src={clip.thumbnail_url} alt={clip.title} className="w-full h-full object-cover" />
                  ) : (
                    <Play className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                  <Badge className="absolute bottom-1 right-1 text-xs bg-black/70">
                    {formatDuration(clip.duration)}
                  </Badge>
                </div>
                <h4 className="font-medium text-sm truncate">{clip.title}</h4>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Eye className="w-3 h-3" />{clip.views || 0}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />{formatDate(clip.created_at)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleShareClip(clip)}>
                      <Share2 className="w-3 h-3" />
                    </Button>
                    {(isOwner || clip.user_id === user?.id) && (
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDeleteClip(clip.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return match?.[1] || "";
}

export default ChannelClips;
