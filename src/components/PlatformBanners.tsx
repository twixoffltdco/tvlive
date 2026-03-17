import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformBanner {
  id: string;
  title: string;
  html_content: string;
  css_content: string | null;
  js_content: string | null;
  is_active: boolean;
}

const PlatformBanners = () => {
  const [banners, setBanners] = useState<PlatformBanner[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("platform_banners")
        .select("id,title,html_content,css_content,js_content,is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (data) setBanners(data as PlatformBanner[]);
    };

    void load();
  }, []);

  const cssBundle = useMemo(
    () => banners.map((b) => b.css_content).filter(Boolean).join("\n"),
    [banners],
  );

  useEffect(() => {
    if (!banners.length) return;

    const scripts: HTMLScriptElement[] = [];

    banners.forEach((banner) => {
      if (!banner.js_content) return;
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.dataset.bannerId = banner.id;
      script.text = banner.js_content;
      document.body.appendChild(script);
      scripts.push(script);
    });

    return () => {
      scripts.forEach((script) => script.remove());
    };
  }, [banners]);

  if (!banners.length) return null;

  return (
    <section className="container mx-auto px-4 pt-6 space-y-4">
      {cssBundle && <style>{cssBundle}</style>}
      {banners.map((banner) => (
        <div key={banner.id} data-banner-id={banner.id} dangerouslySetInnerHTML={{ __html: banner.html_content }} />
      ))}
    </section>
  );
};

export default PlatformBanners;
