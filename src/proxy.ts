import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { canAccessRoute, parseRole, type UserRole } from "@/features/auth/types";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/login");
  const isApiAuth =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/setup");
  const isPublicAsset = pathname.startsWith("/_next");

    if (isApiAuth || isPublicAsset || pathname.startsWith("/api/")) {
      return response;
    }

  if (!user && !isAuthRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (user && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (user && !isAuthRoute) {
    // Prefer app_metadata so Super Admin stays correct if profiles.role is stale.
    const role: UserRole = parseRole(
      user.app_metadata?.role ?? user.user_metadata?.role,
    );

    if (user.user_metadata?.status === "suspended") {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!canAccessRoute(role, pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
