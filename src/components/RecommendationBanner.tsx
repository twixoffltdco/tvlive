import { useState, useEffect } from "react";
import { X, ExternalLink, Sparkles, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";

const RecommendationBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem("myoinktv_banner_shown");
    if (!shown) {
      setIsVisible(true);
      sessionStorage.setItem("myoinktv_banner_shown", "true");
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const openPlatform = () => {
    window.open("https://my-oink-tv.base44.app", "_blank");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative max-w-lg w-[90%] rounded-2xl border border-border bg-card p-8 shadow-2xl text-center space-y-6">
        {/* Close */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-3 right-3 h-8 w-8"
          onClick={handleClose}
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Tv className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            My Oink TV
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Универсальная платформа для просмотра любимых потоков. Встраивайте прямые эфиры с любых сайтов и смотрите всё в одном месте!
          </p>
        </div>

        {/* CTA */}
        <Button onClick={openPlatform} size="lg" className="w-full gap-2">
          <ExternalLink className="w-4 h-4" />
          Перейти на My Oink TV
        </Button>

        <p className="text-xs text-muted-foreground">
          my-oink-tv.base44.app
        </p>
      </div>
    </div>
  );
};

export default RecommendationBanner;
