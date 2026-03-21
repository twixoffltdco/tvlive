import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Plus, Trash2, Edit, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDateSafely, toDatetimeLocalValue } from "@/lib/dateFormat";

interface ScheduleItem {
  id: string;
  channel_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  source_type: string;
  source_url: string | null;
}

interface ChannelScheduleProps {
  channelId: string;
  isOwner: boolean;
}

const ChannelSchedule = ({ channelId, isOwner }: ChannelScheduleProps) => {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [sourceType, setSourceType] = useState("media");
  const [sourceUrl, setSourceUrl] = useState("");

  useEffect(() => {
    fetchSchedule();
  }, [channelId]);

  const fetchSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from("channel_schedule")
        .select("*")
        .eq("channel_id", channelId)
        .order("start_time", { ascending: true });

      if (error) throw error;
      setSchedule(data || []);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setSourceType("media");
    setSourceUrl("");
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!title || !startTime || !endTime) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("channel_schedule")
          .update({
            title,
            description: description || null,
            start_time: startTime,
            end_time: endTime,
            source_type: sourceType,
            source_url: sourceUrl || null,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Сохранено" });
      } else {
        const { error } = await supabase
          .from("channel_schedule")
          .insert({
            channel_id: channelId,
            title,
            description: description || null,
            start_time: startTime,
            end_time: endTime,
            source_type: sourceType,
            source_url: sourceUrl || null,
          });

        if (error) throw error;
        toast({ title: "Добавлено в расписание" });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchSchedule();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("channel_schedule")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Удалено" });
      fetchSchedule();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description || "");
    setStartTime(toDatetimeLocalValue(item.start_time));
    setEndTime(toDatetimeLocalValue(item.end_time));
    setSourceType(item.source_type || "media");
    setSourceUrl(item.source_url || "");
    setIsDialogOpen(true);
  };

  const formatDateTime = (dateString: string) => formatDateSafely(dateString, "ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Расписание
        </h3>
        {isOwner && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Редактировать" : "Добавить в расписание"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Название *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Название передачи"
                  />
                </div>
                <div>
                  <Label>Описание</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Описание"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Начало *</Label>
                    <Input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Конец *</Label>
                    <Input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Источник</Label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="media">Загруженные медиа</option>
                    <option value="external_url">Внешняя ссылка (MP4/MP3)</option>
                    <option value="m3u8">M3U8 ретрансляция</option>
                  </select>
                </div>
                {(sourceType === "external_url" || sourceType === "m3u8") && (
                  <div>
                    <Label>URL источника</Label>
                    <Input
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder={sourceType === "m3u8" ? "https://...m3u8" : "https://...mp4"}
                    />
                  </div>
                )}
                <Button onClick={handleSubmit} className="w-full">
                  {editingId ? "Сохранить" : "Добавить"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {schedule.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Расписание пока не заполнено</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedule.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-card border border-border rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{item.title}</h4>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {formatDateTime(item.start_time)} - {formatDateTime(item.end_time)}
                  </div>
                  {item.source_url && (
                    <p className="text-xs text-primary mt-1 truncate">
                      {item.source_type === "m3u8" ? "📺 M3U8" : "🔗 URL"}: {item.source_url}
                    </p>
                  )}
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChannelSchedule;
