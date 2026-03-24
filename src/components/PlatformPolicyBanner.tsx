import { ShieldAlert, BadgeAlert, CircleOff } from "lucide-react";

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
  return (
    <section className="border-b border-border bg-muted/40">
      <div className="container mx-auto grid gap-3 px-4 py-3 md:grid-cols-3">
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
    </section>
  );
};

export default PlatformPolicyBanner;
