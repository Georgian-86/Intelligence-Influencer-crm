import { NextResponse, type NextRequest } from "next/server";

// Instagram's CDN sends Cross-Origin-Resource-Policy: same-origin, so its images can't be
// embedded directly. Proxy them through our server (Instagram/Facebook CDN hosts only).
const ALLOWED = [/\.cdninstagram\.com$/i, /\.fbcdn\.net$/i];

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("u");
  let url: URL;
  try {
    url = new URL(raw ?? "");
  } catch {
    return new NextResponse("Bad url", { status: 400 });
  }
  if (url.protocol !== "https:" || !ALLOWED.some((r) => r.test(url.hostname))) {
    return new NextResponse("Host not allowed", { status: 400 });
  }
  const upstream = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }).catch(() => null);
  if (!upstream?.ok || !upstream.headers.get("content-type")?.startsWith("image/")) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type")!,
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
