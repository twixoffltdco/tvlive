
-- Create deleted_channels table for tracking deleted channels with reason
CREATE TABLE IF NOT EXISTS public.deleted_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_channel_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  deleted_reason text NOT NULL DEFAULT 'Нарушение правил платформы',
  deleted_at timestamptz NOT NULL DEFAULT now(),
  deleted_by uuid
);

ALTER TABLE public.deleted_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deleted channels viewable by everyone" ON public.deleted_channels FOR SELECT USING (true);
CREATE POLICY "Only admins can insert deleted channels" ON public.deleted_channels FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create channel_raids table for raid system
CREATE TABLE IF NOT EXISTS public.channel_raids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  target_channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  initiated_by uuid NOT NULL,
  viewer_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  message text
);

ALTER TABLE public.channel_raids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Raids viewable by everyone" ON public.channel_raids FOR SELECT USING (true);
CREATE POLICY "Channel owners can create raids" ON public.channel_raids FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM channels WHERE channels.id = channel_raids.source_channel_id AND channels.user_id = auth.uid()));
