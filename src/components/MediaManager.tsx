import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Link, Play, Shuffle } from "lucide-react";
import TorrentUploader from "@/components/TorrentUploader";
import DraggableMediaList from "@/components/DraggableMediaList";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useNotifySubscribers } from "@/hooks/useNotifySubscribers";

interface MediaContent {
  id: string;
  title: string;
  file_url: string;
  file_type: string | null;
  duration: number | null;
  is_24_7: boolean;
  scheduled_at: string | null;
  source_type: string;
  source_url: string | null;
  start_time: string | null;
  end_time: string | null;
}

interface MediaManagerProps {
  channelId: string;
  channelType: "tv" | "radio";
  channelTitle: string;
  storageUsage: number;
  isPaidOnly: boolean;
  onStorageUpdate: () => void;
}

const MYOINKTV_ORIGIN = "https://my-oink-tv.base44.app";

const MediaManager = ({ channelId, channelType, channelTitle, storageUsage, isPaidOnly, onStorageUpdate }: MediaManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { notifySubscribers } = useNotifySubscribers();
  const [mediaContent, setMediaContent] = useState<MediaContent[]>([]);
  const [isAddUrlOpen, setIsAddUrlOpen] = useState(false);
  
  const [urlTitle, setUrlTitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [sourceType, setSourceType] = useState<"youtube" | "mp4" | "m3u8" | "ultra_aggregator" | "myoinktv" | "playerjs" | "smotrimfilms">("mp4");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [kpId, setKpId] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => { fetchMediaContent(); }, [channelId]);

  const fetchMediaContent = async () => {
    try {
      const { data, error } = await supabase.from("media_content").select("*").eq("channel_id", channelId).order("created_at", { ascending: false });
      if (error) throw error;
      setMediaContent((data || []) as MediaContent[]);
    } catch (error) { console.error("Error fetching media:", error); }
  };

  const formatBytes = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(2);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 500 * 1024 * 1024) { toast({ title: "Ошибка", description: "Размер файла не должен превышать 500MB", variant: "destructive" }); return; }
    if (storageUsage + file.size > 5 * 1024 * 1024 * 1024) { toast({ title: "Превышен лимит хранилища", description: "Удалите старые файлы.", variant: "destructive" }); return; }
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("media-uploads").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("media-uploads").getPublicUrl(fileName);
      const { error: insertError } = await supabase.from("media_content").insert({ channel_id: channelId, title: file.name, file_url: data.publicUrl, file_type: file.type, is_24_7: false, source_type: "upload" });
      if (insertError) throw insertError;
      toast({ title: "Успешно", description: "Медиа файл загружен" });
      await notifySubscribers({ channelId, type: "new_content", title: `Новый контент на ${channelTitle}`, message: `Загружен: ${file.name}` });
      fetchMediaContent();
      onStorageUpdate();
      e.target.value = "";
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message || "Не удалось загрузить файл", variant: "destructive" });
    }
  };

  const validateMyOinkTvUrl = (url: string): boolean => {
    if (!url.includes("/embed") && !url.includes("embed?id=")) return false;
    return url.startsWith(MYOINKTV_ORIGIN) || url.startsWith("/embed?id=") || url.includes("my-oink-tv.base44.app");
  };

  const handleAddUrl = async () => {
    let finalUrl = externalUrl;
    let finalTitle = urlTitle;

    // SmotrimFilms: build URL from KP ID
    if (sourceType === "smotrimfilms") {
      const id = kpId.trim() || externalUrl.trim();
      if (!id) {
        toast({ title: "Ошибка", description: "Введите ID Кинопоиска или ссылку", variant: "destructive" });
        return;
      }
      // If just an ID number, build the URL
      if (/^\d+$/.test(id)) {
        finalUrl = `https://smotrimfilms.lovable.app/kp/${id}`;
      } else if (id.includes("smotrimfilms")) {
        finalUrl = id;
      } else {
        finalUrl = `https://smotrimfilms.lovable.app/kp/${id}`;
      }
      if (!finalTitle) finalTitle = `Кинопоиск #${id}`;
    }

    if (!finalTitle || (!finalUrl && sourceType !== "smotrimfilms")) {
      toast({ title: "Ошибка", description: "Заполните название и URL", variant: "destructive" });
      return;
    }

    if (sourceType === "myoinktv" && !validateMyOinkTvUrl(finalUrl)) {
      toast({ title: "Ошибка", description: "Используйте только embed-ссылки MyOinkTV", variant: "destructive" });
      return;
    }

    if (sourceType === "smotrimfilms" && !isPaidOnly) {
      toast({
        title: "Источник запрещён",
        description: "SmotrimFilms можно использовать только на каналах с платным доступом. Иначе канал блокируется за нарушение авторских прав.",
        variant: "destructive",
      });
      return;
    }

    try {
      let fileType = "video/mp4";
      let finalSourceType: string = sourceType;
      
      if (sourceType === "m3u8") fileType = "application/x-mpegURL";
      else if (sourceType === "youtube") fileType = "video/youtube";
      else if (sourceType === "ultra_aggregator") fileType = "text/html";
      else if (sourceType === "myoinktv") fileType = "text/html";
      else if (sourceType === "playerjs") fileType = "text/html";
      else if (sourceType === "smotrimfilms") { fileType = "text/html"; finalSourceType = "smotrimfilms"; }

      const { error } = await supabase.from("media_content").insert({
        channel_id: channelId, title: finalTitle, file_url: finalUrl,
        file_type: fileType, is_24_7: false, source_type: finalSourceType,
        source_url: finalUrl, start_time: startTime || null, end_time: endTime || null,
      });

      if (error) throw error;
      toast({ title: "Добавлено" });
      await notifySubscribers({ channelId, type: "new_content", title: `Новый контент на ${channelTitle}`, message: `Добавлен: ${finalTitle}` });
      setUrlTitle(""); setExternalUrl(""); setStartTime(""); setEndTime(""); setKpId(""); setLogoUrl("");
      setIsAddUrlOpen(false);
      fetchMediaContent();
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  };

  const deleteMedia = async (mediaId: string, fileUrl: string, st: string) => {
    try {
      if (st === "upload") {
        const fileName = fileUrl.split("/").slice(-2).join("/");
        await supabase.storage.from("media-uploads").remove([fileName]);
      }
      const { error } = await supabase.from("media_content").delete().eq("id", mediaId);
      if (error) throw error;
      toast({ title: "Удалено" });
      fetchMediaContent();
      onStorageUpdate();
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  };

  const toggleMedia = async (media: MediaContent) => {
    const { error } = await supabase.from("media_content").update({ is_24_7: !media.is_24_7 }).eq("id", media.id);
    if (!error) {
      if (!media.is_24_7) await notifySubscribers({ channelId, type: "new_stream", title: `${channelTitle} начал трансляцию`, message: `Сейчас в эфире: ${media.title}` });
      fetchMediaContent();
      toast({ title: media.is_24_7 ? "Остановлено" : "Запущено" });
    }
  };

  const activateAllMedia = async () => {
    const { error } = await supabase.from("media_content").update({ is_24_7: true }).eq("channel_id", channelId);
    if (!error) { fetchMediaContent(); toast({ title: "Все файлы добавлены в эфир" }); }
  };

  const shufflePlaylist = async () => {
    if (mediaContent.length < 2) { toast({ title: "Добавьте больше файлов" }); return; }
    const shuffled = [...mediaContent];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const now = new Date();
    for (let i = 0; i < shuffled.length; i++) {
      await supabase.from("media_content").update({ created_at: new Date(now.getTime() - i * 1000).toISOString() }).eq("id", shuffled[i].id);
    }
    fetchMediaContent();
    toast({ title: "Плейлист перемешан" });
  };

  const handleReorder = async (reorderedItems: MediaContent[]) => {
    const now = new Date();
    for (let i = 0; i < reorderedItems.length; i++) {
      await supabase.from("media_content").update({ created_at: new Date(now.getTime() - i * 1000).toISOString() }).eq("id", reorderedItems[i].id);
    }
    setMediaContent(reorderedItems);
    toast({ title: "Порядок обновлён" });
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Использование хранилища:</span>
          <span className="text-sm font-mono">{formatBytes(storageUsage)} / 5.00 GB</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min((storageUsage / (5 * 1024 * 1024 * 1024)) * 100, 100)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="media-upload" className="cursor-pointer">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-semibold mb-1">Загрузить файл</p>
              <p className="text-xs text-muted-foreground">{channelType === "tv" ? "MP4, WebM до 500MB" : "MP3, WAV до 500MB"}</p>
            </div>
          </Label>
          <Input id="media-upload" type="file" accept={channelType === "tv" ? "video/*" : "audio/*"} onChange={handleMediaUpload} className="hidden" />
        </div>

        <Dialog open={isAddUrlOpen} onOpenChange={setIsAddUrlOpen}>
          <DialogTrigger asChild>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
              <Link className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-semibold mb-1">Добавить по URL</p>
              <p className="text-xs text-muted-foreground">YouTube, MP4, M3U8, PlayerJS, SmotrimFilms</p>
            </div>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Добавить внешний источник</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Название</Label>
                <Input value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)} placeholder="Название контента" />
              </div>
              <div>
                <Label>Тип источника</Label>
                <select value={sourceType} onChange={(e) => setSourceType(e.target.value as any)} className="w-full p-2 border rounded-md bg-background">
                  <option value="mp4">MP4/MP3 (прямая ссылка)</option>
                  <option value="m3u8">M3U8 ретрансляция</option>
                  <option value="youtube">YouTube видео</option>
                  <option value="ultra_aggregator">Ultra Aggregator</option>
                  <option value="myoinktv">MyOinkTV (Embed)</option>
                  <option value="playerjs">PlayerJS (m3u / txt / m3u8 плейлист)</option>
                  <option value="smotrimfilms">SmotrimFilms (Кинопоиск)</option>
                </select>
                {sourceType === "playerjs" && (
                  <p className="text-xs text-muted-foreground mt-1">Вставьте прямую ссылку на поток, m3u/txt/m3u8 плейлист. Потоки проигрываются как трансляция с автопереключением.</p>
                )}
                {sourceType === "smotrimfilms" && (
                  <p className="text-xs text-muted-foreground mt-1">Введите ID Кинопоиска или полную ссылку smotrimfilms.lovable.app/kp/ID. Серии переключаются автоматически.</p>
                )}
                {sourceType === "myoinktv" && (
                  <p className="text-xs text-muted-foreground mt-1">Вставьте embed-ссылку: https://my-oink-tv.base44.app/embed?id=...</p>
                )}
              </div>

              {sourceType === "smotrimfilms" ? (
                <div>
                  <Label>ID Кинопоиска</Label>
                  <Input value={kpId} onChange={(e) => setKpId(e.target.value)} placeholder="Например: 435" />
                  <p className="text-xs text-muted-foreground mt-1">Или вставьте полную ссылку ниже</p>
                </div>
              ) : null}

              <div>
                <Label>{sourceType === "smotrimfilms" ? "URL (опционально, если указан ID)" : "URL"}</Label>
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder={
                    sourceType === "m3u8" ? "https://...m3u8" : 
                    sourceType === "youtube" ? "https://youtube.com/watch?v=..." :
                    sourceType === "ultra_aggregator" ? "ultra_aggregator?watch=example.com" :
                    sourceType === "myoinktv" ? "https://my-oink-tv.base44.app/embed?id=..." :
                    sourceType === "playerjs" ? "https://...m3u, .txt, .m3u8 или .mp4" :
                    sourceType === "smotrimfilms" ? "https://smotrimfilms.lovable.app/kp/435" :
                    "https://...mp4"
                  }
                />
              </div>

              {sourceType === "playerjs" && (
                <div>
                  <Label>Логотип (опционально)</Label>
                  <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://...logo.png или загрузите файл" />
                  <p className="text-xs text-muted-foreground mt-1">Ссылка на логотип для отображения в плеере</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div><Label>Время начала (опц.)</Label><Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
                <div><Label>Время конца (опц.)</Label><Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
              </div>
              <Button onClick={handleAddUrl} className="w-full">Добавить</Button>
            </div>
          </DialogContent>
        </Dialog>

        <TorrentUploader channelId={channelId} onTorrentParsed={(files) => { console.log("Parsed torrent files:", files); }} />
      </div>

      {mediaContent.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Медиафайлы ({mediaContent.length}):</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={activateAllMedia} className="gap-1"><Play className="w-3 h-3" />Все в эфир</Button>
              <Button variant="outline" size="sm" onClick={shufflePlaylist} className="gap-1"><Shuffle className="w-3 h-3" />Перемешать</Button>
            </div>
          </div>
          <DraggableMediaList mediaContent={mediaContent} onReorder={handleReorder} onToggle={toggleMedia} onDelete={deleteMedia} />
        </div>
      )}
    </div>
  );
};

export default MediaManager;
