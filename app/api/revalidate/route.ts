import { revalidatePath, revalidateTag } from "next/cache";
import { supabaseEnv } from "@/lib/data";

/**
 * On-demand cache refresh after an admin save.
 * Auth: the caller's Supabase access token is verified against the
 * project's auth endpoint — only signed-in users can bust the cache.
 */
export async function POST(req: Request) {
  const env = supabaseEnv();
  if (!env) return new Response("Supabase not configured", { status: 503 });

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return new Response("Unauthorized", { status: 401 });

  const res = await fetch(`${env.url}/auth/v1/user`, {
    headers: { apikey: env.key, authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return new Response("Unauthorized", { status: 401 });

  revalidateTag("site-content", "max");
  revalidatePath("/");
  return Response.json({ revalidated: true });
}
