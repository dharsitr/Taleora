import { createClient } from "@/lib/supabase/server";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const supabase = await createClient();

  const { data: books } = await supabase
    .from("books")
    .select("slug, updated_at")
    .eq("status", "published")
    .eq("is_suspended", false);

  const bookUrls: MetadataRoute.Sitemap = (books || []).map((book) => ({
    url: `${appUrl}/books/${book.slug}`,
    lastModified: book.updated_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: appUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${appUrl}/discover`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${appUrl}/explore`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    ...bookUrls,
  ];
}
