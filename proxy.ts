import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistic check only: real authorisation happens in each page and route handler via lib/auth.
export function proxy(request: NextRequest) {
  if (!request.cookies.get("sata_session")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*"],
};
