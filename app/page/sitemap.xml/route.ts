import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://clinicflow.vercel.app";
  const supabase = await createClient();

  // Fetch dynamic doctor/specialist profiles for slug pages
  const { data: doctors } = await supabase
    .from("doctor_profiles")
    .select("doctor_code");

  const urls = (doctors || []).map((doc) => {
    return `
  <url>
    <loc>${baseUrl}/doctor/${doc.doctor_code}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).join("");

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;

  return new NextResponse(sitemapXml.trim(), {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
