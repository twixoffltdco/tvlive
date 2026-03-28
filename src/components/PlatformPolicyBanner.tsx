import { useEffect, useState } from "react";
import { ShieldAlert, BadgeAlert, CircleOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const HIDDEN_BANNER_STORAGE_KEY = "streamlivetv_platform_policy_hidden";

const notices = [
  {
    icon: ShieldAlert,
    title: "Модерация платформы",
    description: "Каналы с нарушением правил платформы, обходом модерации и мусорным контентом скрываются автоматически.",
  },
  {
    icon: BadgeAlert,
    title: "Авторские права",
    description: "Источник SmotrimFilms разрешён только для платного контента. Нарушения приводят к блокировке канала.",
  },
  {
    icon: CircleOff,
    title: "Запрещённая реклама",
    description: "Мы удаляем продвижение 18+, казино, ставок и другого запрещённого контента на всей платформе.",
  },
];

const PlatformPolicyBanner = () => {
  const [isHidden, setIsHidden] = useState(true);

  useEffect(() => {
    const isBannerHidden = localStorage.getItem(HIDDEN_BANNER_STORAGE_KEY) === "true";
    setIsHidden(isBannerHidden);
  }, []);

  const handleHideBanner = () => {
    localStorage.setItem(HIDDEN_BANNER_STORAGE_KEY, "true");
    setIsHidden(true);
  };

  if (isHidden) return null;

  return (
    <section className="border-b border-border bg-muted/40">
      <div className="container mx-auto px-4 py-3">
        <div className="mb-3 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleHideBanner}
            className="h-8 gap-1 text-xs text-muted-foreground"
            aria-label="Скрыть уведомления платформы"
          >
            <X className="h-3.5 w-3.5" />
            Скрыть
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {notices.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-background/90 px-4 py-3 shadow-sm"
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-destructive" />
                <p className="text-sm font-semibold">{title}</p>
              </div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformPolicyBanner;
