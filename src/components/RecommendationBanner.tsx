import { useState, useEffect } from "react";
import { X, ExternalLink, Sparkles, Tv, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const RecommendationBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<"myoinktv" | "ultra_aggregator">("myoinktv");
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const shown = sessionStorage.getItem("streamlivetv_banner_shown");
    if (!shown) {
      setIsVisible(true);
      sessionStorage.setItem("streamlivetv_banner_shown", "true");
    }
  }, []);

  // Auto-close after 60 seconds
  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const switchBanner = () => {
    setCurrentBanner((prev) => (prev === "myoinktv" ? "ultra_aggregator" : "myoinktv"));
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

        {/* Timer */}
        <div className="absolute top-3 left-3 text-xs text-muted-foreground">
          {timeLeft}с
        </div>

        {currentBanner === "myoinktv" ? (
          <>
            {/* MY Oink TV Banner */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Tv className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                MY Oink TV
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Универсальная платформа для просмотра любимых потоков. Встраивайте прямые эфиры с любых сайтов и смотрите всё в одном месте!
              </p>
            </div>
            <Button onClick={() => window.open("https://my-oink-tv.base44.app", "_blank")} size="lg" className="w-full gap-2">
              <ExternalLink className="w-4 h-4" />
              Перейти на MY Oink TV
            </Button>
            <p className="text-xs text-muted-foreground">my-oink-tv.base44.app</p>
          </>
        ) : (
          <>
            {/* Ultra Aggregator Banner */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                <Globe className="w-10 h-10 text-accent" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Ultra Aggregator
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Агрегатор потоков с встроенным плеером. Используйте Ultra Aggregator для просмотра контента с любых источников прямо на StreamLiveTV!
              </p>
            </div>
            <Button onClick={() => window.open("/ultra-aggregator.html", "_blank")} size="lg" variant="secondary" className="w-full gap-2">
              <ExternalLink className="w-4 h-4" />
              Открыть Ultra Aggregator
            </Button>
          </>
        )}

        {/* Switch banner */}
        <Button variant="ghost" size="sm" onClick={switchBanner} className="text-xs text-muted-foreground">
          {currentBanner === "myoinktv" ? "Также: Ultra Aggregator →" : "← Также: MY Oink TV"}
        </Button>
      </div>
    </div>
  );
};

export default RecommendationBanner;
