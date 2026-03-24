import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import EnhancedLiveChat from "@/components/EnhancedLiveChat";
import { Lock, AlertTriangle } from "lucide-react";
import UniversalPlayer, { SourceType } from "@/components/UniversalPlayer";
import { PLATFORM_POLICY_TEXT, getChannelModerationReason, shouldBlockChannelAccess } from "@/lib/channelSafety";
import { resolveLiveStreamUrl } from "@/lib/liveStream";
import { getActivePlaybackQueue, getPreferredPlayableMedia } from "@/lib/mediaSchedule";
import { useRealtimeChannelSync } from "@/hooks/useRealtimeChannelSync";

interface Channel {
  id: string;
  title: string;
  channel_type: "tv" | "radio";
  streaming_method: "upload" | "live" | "scheduled";
  mux_playback_id: string | null;
  stream_key: string | null;
  is_live: boolean;
  thumbnail_url: string | null;
  user_id: string;
  paid_only: boolean;
  is_hidden: boolean;
  hidden_reason: string | null;
  description: string | null;
  profiles?: {
    username: string;
  } | null;
}

interface MediaContent {
  id: string;
  title: string;
  file_url: string;
  source_type: string | null;
  is_24_7?: boolean;
  start_time: string | null;
  end_time: string | null;
}

const PopoutPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [mediaContent, setMediaContent] = useState<MediaContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [scheduleTick, setScheduleTick] = useState(() => Date.now());

  const checkAccess = useCallback(async (channelOverride?: Channel | null) => {
    const targetChannel = channelOverride ?? channel;

    if (!targetChannel?.paid_only) {
      setHasAccess(true);
      return;
    }

    if (!user) {
      setHasAccess(false);
      return;
    }

    if (user.id === targetChannel.user_id) {
      setHasAccess(true);
      return;
    }

    const { data } = await supabase
      .from("user_premium_subscriptions")
      .select("id")
      .eq("channel_id", targetChannel.id)
      .eq("user_id", user.id)
      .gte("expires_at", new Date().toISOString())
      .limit(1);

    setHasAccess((data && data.length > 0) || false);
  }, [channel, user]);

  const fetchMedia = useCallback(async (channelOverride?: Channel | null) => {
    const targetChannel = channelOverride ?? channel;

    if (!id || !targetChannel || targetChannel.streaming_method === "live") {
      setMediaContent([]);
      return;
    }

    const { data: mediaData, error: mediaError } = await supabase
      .from("media_content")
      .select("id, title, file_url, source_type, is_24_7, start_time, end_time")
      .eq("channel_id", id)
      .order("created_at", { ascending: false });

    if (mediaError) {
      console.error("Error fetching media:", mediaError);
      return;
    }

    setMediaContent(mediaData || []);
  }, [channel, id]);

  const fetchChannel = useCallback(async () => {
    if (!id) return;

    const { data: channelData, error: channelError } = await supabase
      .from("channels")
      .select("id, title, channel_type, streaming_method, mux_playback_id, stream_key, thumbnail_url, is_live, user_id, paid_only, is_hidden, hidden_reason, description, profiles:user_id(username)")
      .eq("id", id)
      .maybeSingle();

    if (channelError) {
      console.error("Error fetching channel:", channelError);
      return;
    }

    const normalizedChannel = (channelData as Channel | null) ?? null;
    setChannel(normalizedChannel);
    await Promise.all([
      checkAccess(normalizedChannel),
      fetchMedia(normalizedChannel),
    ]);
  }, [checkAccess, fetchMedia, id]);

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      await fetchChannel();
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchChannel, id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = window.setInterval(() => setScheduleTick(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    void checkAccess();
  }, [checkAccess]);

  useRealtimeChannelSync({
    channelId: id,
    viewerId: user?.id,
    refreshChannel: fetchChannel,
    refreshMedia: () => fetchMedia(),
    refreshDeletedChannel: fetchChannel,
    refreshAccess: () => checkAccess(),
  });

  const playableMedia = useMemo(() => getActivePlaybackQueue(mediaContent), [mediaContent, scheduleTick]);
  const preferredMedia = useMemo(() => getPreferredPlayableMedia(mediaContent), [mediaContent, scheduleTick]);

  useEffect(() => {
    if (playableMedia.length === 0) {
      setCurrentIndex(0);
      return;
    }

    if (preferredMedia) {
      const preferredIndex = playableMedia.findIndex((media) => media.id === preferredMedia.id);
      if (preferredIndex !== -1) {
        setCurrentIndex(preferredIndex);
        return;
      }
    }

    setCurrentIndex((prev) => Math.min(prev, playableMedia.length - 1));
  }, [playableMedia, preferredMedia]);

  const handleEnded = () => setCurrentIndex((prev) => (prev + 1) % (playableMedia.length || 1));

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-foreground">Загрузка...</div></div>;
  if (!channel) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-foreground">Канал не найден</p></div>;

  const isBlocked = shouldBlockChannelAccess({
    username: channel.profiles?.username,
    title: channel.title,
    description: channel.description,
    isHidden: channel.is_hidden,
    hiddenReason: channel.hidden_reason,
    paidOnly: channel.paid_only,
    mediaSources: mediaContent.map((media) => ({
      title: media.title,
      sourceType: media.source_type,
      fileUrl: media.file_url,
    })),
  });
  const blockReason = getChannelModerationReason({
    username: channel.profiles?.username,
    title: channel.title,
    description: channel.description,
    isHidden: channel.is_hidden,
    hiddenReason: channel.hidden_reason,
    paidOnly: channel.paid_only,
    mediaSources: mediaContent.map((media) => ({
      title: media.title,
      sourceType: media.source_type,
      fileUrl: media.file_url,
    })),
  });

  if (isBlocked) {
    const ownerMessage = user?.id && user.id === channel.user_id;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-14 h-14 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{ownerMessage ? "Ваш канал был заблокирован" : "Данный канал больше не доступен"}</h2>
          {blockReason && <p className="text-sm text-destructive mb-2">Причина: {blockReason}</p>}
          <p className="text-muted-foreground text-sm">{ownerMessage ? "Канал недоступен в Popout-плеере." : PLATFORM_POLICY_TEXT}</p>
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, Math.max(0, playableMedia.length - 1));
  const currentMedia = playableMedia[safeIndex];
  const liveStreamUrl = resolveLiveStreamUrl({
    channelId: channel.id,
    streamingMethod: channel.streaming_method,
    isLive: channel.is_live,
    muxPlaybackId: channel.mux_playback_id,
  });

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 relative">
        {channel.thumbnail_url && (
          <div className="absolute top-4 right-4 z-20"><img src={channel.thumbnail_url} alt={channel.title} className="w-16 h-16 rounded-full border-2 border-border object-cover shadow-lg" /></div>
        )}
        <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 z-20">
          <span className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />LIVE
        </div>

        {channel.paid_only && !hasAccess ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center p-8">
              <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Данный контент доступен только по подписке</h2>
              <p className="text-muted-foreground text-sm">Оформите подписку на канал для доступа к контенту.</p>
            </div>
          </div>
        ) : channel.streaming_method === "live" && channel.is_live && liveStreamUrl ? (
          <UniversalPlayer
            src={liveStreamUrl}
            sourceType="m3u8"
            title={channel.title}
            channelType={channel.channel_type}
            autoPlay
            poster={channel.thumbnail_url || undefined}
            className="w-full h-full"
          />
        ) : channel.streaming_method === "live" ? (
          <div className="w-full h-full flex items-center justify-center bg-muted/40">
            <div className="text-center px-4">
              <p className="text-lg font-semibold">{channel.title}</p>
              <p className="text-sm text-muted-foreground">Трансляция сейчас офлайн</p>
            </div>
          </div>
        ) : currentMedia ? (
          <UniversalPlayer src={currentMedia.file_url} sourceType={(currentMedia.source_type as SourceType) || "mp4"} channelType={channel.channel_type} autoPlay onEnded={handleEnded} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><p className="text-muted-foreground">Нет контента</p></div>
        )}
      </div>
      <div className="w-80 h-screen border-l border-border bg-background">
        <EnhancedLiveChat channelId={channel.id} channelOwnerId={channel.user_id} />
      </div>
    </div>
  );
};

export default PopoutPlayer;
