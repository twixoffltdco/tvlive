import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;
    const channelType = url.searchParams.get("type"); // "tv" or "radio"
    const isLive = url.searchParams.get("live"); // "true" or "false"
    const categoryId = url.searchParams.get("category");
    const sortBy = url.searchParams.get("sort") || "viewer_count"; // "viewer_count", "created_at", "title"
    const sortOrder = url.searchParams.get("order") || "desc"; // "asc" or "desc"
    const search = url.searchParams.get("search");

    let query = supabase
      .from("channels")
      .select(`
        id, title, description, thumbnail_url, channel_type, is_live, viewer_count, 
        created_at, updated_at, category_id, paid_only, donation_url,
        profiles:user_id (username, avatar_url)
      `, { count: "exact" })
      .eq("is_hidden", false);

    if (channelType) query = query.eq("channel_type", channelType);
    if (isLive === "true") query = query.eq("is_live", true);
    if (isLive === "false") query = query.eq("is_live", false);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (search) query = query.ilike("title", `%${search}%`);

    const ascending = sortOrder === "asc";
    if (sortBy === "created_at") query = query.order("created_at", { ascending });
    else if (sortBy === "title") query = query.order("title", { ascending });
    else query = query.order("viewer_count", { ascending });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    const channels = (data || []).map((ch: any) => ({
      id: ch.id,
      title: ch.title,
      description: ch.description,
      thumbnail_url: ch.thumbnail_url,
      channel_type: ch.channel_type,
      is_live: ch.is_live,
      viewer_count: ch.viewer_count,
      created_at: ch.created_at,
      updated_at: ch.updated_at,
      category_id: ch.category_id,
      paid_only: ch.paid_only,
      donation_url: ch.donation_url,
      owner: ch.profiles ? {
        username: ch.profiles.username,
        avatar_url: ch.profiles.avatar_url,
      } : null,
    }));

    return new Response(
      JSON.stringify({
        data: channels,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
