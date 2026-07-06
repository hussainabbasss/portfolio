import {
  person as defaultPerson,
  projects as defaultProjects,
  jobs as defaultJobs,
  about as defaultAbout,
  type Project,
  type Job,
} from "@/app/content";

export type SiteContent = {
  person: typeof defaultPerson;
  projects: Project[];
  jobs: Job[];
  about: typeof defaultAbout;
};

export const defaults: SiteContent = {
  person: defaultPerson,
  projects: defaultProjects,
  jobs: defaultJobs,
  about: defaultAbout,
};

export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !url.startsWith("http")) return null;
  return { url: url.replace(/\/$/, ""), key };
}

/**
 * Site content, resolved server-side.
 * Reads the single `site_content` row from Supabase (anon key, RLS
 * read-only) with ISR caching; falls back to the placeholder content
 * in app/content.ts when Supabase isn't configured, the row doesn't
 * exist yet, or the request fails. The public page never breaks
 * because of the backend.
 */
export async function getContent(): Promise<SiteContent> {
  const env = supabaseEnv();
  if (!env) return defaults;
  try {
    const res = await fetch(
      `${env.url}/rest/v1/site_content?id=eq.1&select=data`,
      {
        // New-style publishable keys aren't JWTs — only `apikey` is sent;
        // PostgREST resolves it to the anon role.
        headers: { apikey: env.key },
        next: { revalidate: 300, tags: ["site-content"] },
      },
    );
    if (!res.ok) return defaults;
    const rows: Array<{ data: Partial<SiteContent> }> = await res.json();
    const data = rows?.[0]?.data;
    if (!data) return defaults;
    return {
      person: { ...defaults.person, ...data.person },
      projects: data.projects?.length ? data.projects : defaults.projects,
      jobs: data.jobs?.length ? data.jobs : defaults.jobs,
      about: { ...defaults.about, ...data.about },
    };
  } catch {
    return defaults;
  }
}
