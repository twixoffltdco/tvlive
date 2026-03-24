import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, Dices, Palette, Code, Shield, Ban, Gift, Tv, Radio, Users, Globe, 
  Sparkles, Bell, Play, Settings, Monitor, Mic, Video, List, Search, Heart,
  ExternalLink, Layers, Lock, Zap, MessageSquare, Clock, Star, Scissors, ShieldAlert, Film
} from "lucide-react";
import { Link } from "react-router-dom";

const Changelog = () => {
  const updates = [
    {
    version: "3.0.2",
      date: "Апрель 2026",
      title: "StreamLiveTV 3.0.2 — Полный переезд на новые резервные домены",
      description: "Полностью рабочая платформа без зависимостей",
      features: [
        { icon: Globe, text: "Переезд с livestudio-creator.lovable.app на новые резервные домены включаяя На Российских серверах" },
      ],
    },
      version: "3.0.1",
      date: "Март 2026",
      title: "StreamLiveTV 3.0.1 — Рейды, модерация, PlayerJS, SmotrimFilms",
      description: "Система рейдов каналов, улучшенная ИИ-модерация, бан-система, исправления PlayerJS и Shorts.",
      features: [
        { icon: Zap, text: "Система рейдов — отправка зрителей на другой канал после очистки медиатеки" },
        { icon: Scissors, text: "Вкладка «Клипы» в ChannelView для владельцев и зрителей" },
        { icon: ShieldAlert, text: "Бан-система аккаунтов с автовыходом и отображением причины блокировки" },
        { icon: Shield, text: "Улучшенная ИИ-модерация: автоудаление фейковых и нарушающих каналов" },
        { icon: Play, text: "PlayerJS: исправлен чёрный экран, поддержка m3u/txt как трансляций с автопереключением" },
        { icon: Film, text: "SmotrimFilms — новый источник, ввод ID Кинопоиска" },
        { icon: Tv, text: "Shorts: исправлена загрузка каналов и воспроизведение, убран автопропуск" },
        { icon: Lock, text: "Embed/Popout: блокировка платного контента для неподписчиков" },
        { icon: Ban, text: "Удалённые каналы: сообщение о причине удаления на всех страницах" },
        { icon: Globe, text: "Обложка канала: поддержка вставки URL изображения" },
      ],
    },
    {
      version: "3.0.0",
      date: "Март 2026",
      title: "StreamLiveTV 3.0.0 Release — Клипы, Open API, PlayerJS, Стабилизация",
      description: "Полноценный Release: Twitch-клипы, открытый API каналов, PlayerJS плеер, баннеры, Y2038 совместимость.",
      features: [
        { icon: Scissors, text: "Клипы каналов (Twitch-стиль) — создание, просмотр, шаринг" },
        { icon: Globe, text: "Open API /public-channels — публичный эндпоинт для внешних сайтов" },
        { icon: Play, text: "PlayerJS CDN — интеграция с OinkTechLtd/cdnplayerjs" },
        { icon: Sparkles, text: "Двойной баннер My Oink TV + Ultra Aggregator (60 сек)" },
        { icon: Shield, text: "Beta → Release: стабилизация всех модулей" },
        { icon: Lock, text: "Y2038 совместимость" },
        { icon: Zap, text: "Shorts: исправлен свайп и непрерывное воспроизведение" },
        { icon: MessageSquare, text: "Чат: серверная блокировка через триггер" },
        { icon: Crown, text: "Платный контент: PaidContentGate с блокировкой" },
      ],
    },
    {
      version: "2.0.1",
      date: "Январь 2026",
      title: "StreamLiveTV 2.0.1: Twitch/YouTube Live, AI Модерация, Торренты",
      features: [
        { icon: Tv, text: "Twitch / YouTube Live — прямой RTMP стриминг через OBS" },
        { icon: Shield, text: "AI модерация каналов (Lovable AI)" },
        { icon: Globe, text: "Улучшенный VPN-прокси" },
        { icon: Play, text: "YouTube плеер — iframe embed" },
        { icon: Layers, text: "Ultra Aggregator — исправлен рендер" },
        { icon: Video, text: "Торрент загрузчик" },
        { icon: Settings, text: "OBS настройки" },
        { icon: Code, text: "Исправлены edge-функции" },
      ],
    },
    {
      version: "2.0.0",
      date: "Январь 2026",
      title: "StreamLiveTV 2.0: Мультисорс, Restream, VPN-прокси",
      features: [
        { icon: Globe, text: "YouTube IFrame Player API" },
        { icon: Layers, text: "Ultra Aggregator" },
        { icon: Video, text: "Источники: YouTube, MP4, M3U8, Ultra Aggregator" },
        { icon: Play, text: "UniversalPlayer" },
        { icon: Lock, text: "VPN-прокси" },
        { icon: Zap, text: "Restream.io интеграция" },
        { icon: Users, text: "Роли канала" },
        { icon: Crown, text: "Ручная выдача подписки" },
        { icon: MessageSquare, text: "Значки подписчиков" },
        { icon: Shield, text: "Исправлены баны" },
      ],
    },
    {
      version: "1.0.0",
      date: "Декабрь 2024",
      title: "Запуск платформы StreamLiveTV",
      features: [
        { icon: Tv, text: "Создание ТВ-каналов с 24/7 вещанием" },
        { icon: Radio, text: "Создание радиостанций" },
        { icon: MessageSquare, text: "Живой чат с эмодзи" },
        { icon: Crown, text: "Система баллов канала" },
        { icon: Users, text: "Подписка на каналы" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-4xl font-bold mb-2">История обновлений</h1>
        <p className="text-muted-foreground mb-8">Все изменения и улучшения платформы StreamLiveTV</p>
        
        <div className="mb-6">
          <Link to="/api-docs" className="text-primary hover:underline flex items-center gap-2">
            <Code className="w-4 h-4" />
            Документация API для партнёров
          </Link>
        </div>

        <div className="space-y-6">
          {updates.map((update, index) => (
            <Card key={update.version} className={index === 0 ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={index === 0 ? "default" : "secondary"} className="text-lg px-3 py-1">v{update.version}</Badge>
                  {index === 0 && (
                    <Badge variant="outline" className="border-primary text-primary">
                      <Sparkles className="w-3 h-3 mr-1" />Новое
                    </Badge>
                  )}
                  <CardTitle className="text-xl">{update.title}</CardTitle>
                </div>
                <CardDescription>{update.date}</CardDescription>
                {update.description && <p className="text-sm text-muted-foreground mt-2">{update.description}</p>}
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {update.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <feature.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Changelog;
