import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaidContentGateProps {
  channelId: string;
  channelOwnerId: string;
  isPaidOnly: boolean;
  children: React.ReactNode;
}

const PaidContentGate = ({ channelId, channelOwnerId, isPaidOnly, children }: PaidContentGateProps) => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [user, channelId, isPaidOnly]);

  const checkAccess = async () => {
    // Not paid-only → everyone has access
    if (!isPaidOnly) {
      setHasAccess(true);
      setLoading(false);
      return;
    }

    // Not logged in → no access
    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    // Channel owner always has access
    if (user.id === channelOwnerId) {
      setHasAccess(true);
      setLoading(false);
      return;
    }

    // Check for active premium subscription
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("user_premium_subscriptions")
      .select("id")
      .eq("channel_id", channelId)
      .eq("user_id", user.id)
      .gte("expires_at", now)
      .limit(1);

    setHasAccess(!!data && data.length > 0);
    setLoading(false);
  };

  if (loading) return <>{children}</>;

  if (!hasAccess && isPaidOnly) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20" />
        <div className="relative text-center p-8 max-w-md space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Контент недоступен
          </h3>
          <p className="text-muted-foreground text-sm">
            Эта трансляция доступна только для платных подписчиков канала. Оформите подписку, чтобы получить доступ.
          </p>
          <div className="flex items-center justify-center gap-2 text-primary text-sm font-medium">
            <Crown className="w-4 h-4" />
            Требуется платная подписка
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PaidContentGate;
