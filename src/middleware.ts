import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = ["/login", "/signup", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → send to login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    // Role is stored in JWT app_metadata — no DB query needed
    const role: string = (user.app_metadata?.role as string) ?? "student";

    // Logged in → redirect away from auth pages or root to role dashboard
    if ((isPublic && pathname !== "/auth/callback") || pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname =
        role === "admin" ? "/admin" : role === "ci" ? "/ci" : "/student";
      return NextResponse.redirect(url);
    }

    // Role-based route guards
    const isAdminRoute = pathname.startsWith("/admin");
    const isCiRoute = pathname.startsWith("/ci");

    if (isAdminRoute && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "ci" ? "/ci" : "/student";
      return NextResponse.redirect(url);
    }

    if (isCiRoute && role !== "ci" && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/student";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};