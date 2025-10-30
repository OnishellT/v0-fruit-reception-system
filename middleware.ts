import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("user_session")
  const isLoginPage = request.nextUrl.pathname === "/login"
  const isSetupPage = request.nextUrl.pathname === "/setup"
  const isPublicPath = request.nextUrl.pathname === "/" || isLoginPage || isSetupPage

  // If no session and trying to access protected route, redirect to login
  if (!sessionCookie && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // If has session and trying to access login page, redirect to dashboard
  if (sessionCookie && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
