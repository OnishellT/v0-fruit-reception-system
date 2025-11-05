import { NextResponse, type NextRequest } from "next/server"

async function getUserRole(request: NextRequest): Promise<string | null> {
  try {
    const sessionCookie = request.cookies.get("user_session")

    if (!sessionCookie) {
      return null
    }

    const session = JSON.parse(sessionCookie.value)
    return session.role || null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

function hasRole(userRole: string | null, requiredRoles: string | string[]): boolean {
  if (!userRole) return false
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  return roles.includes(userRole)
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("user_session")
  const isLoginPage = request.nextUrl.pathname === "/login"
  const isSetupPage = request.nextUrl.pathname === "/setup"
  const isPublicPath = request.nextUrl.pathname === "/" || isLoginPage || isSetupPage
  const pathname = request.nextUrl.pathname

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

  // Cash POS Role-Based Access Control
  if (pathname.startsWith('/dashboard/cash-pos/')) {
    const userRole = await getUserRole(request)

    // Admin-only routes
    if (pathname.match(/^\/dashboard\/cash-pos\/(pricing|quality|fruit-types)/)) {
      if (!hasRole(userRole, 'admin')) {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
    }

    // Operator/Admin routes
    else if (pathname.match(/^\/dashboard\/cash-pos\/(receptions|customers)/)) {
      if (!hasRole(userRole, ['operator', 'admin'])) {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
    }

    // All cash routes require authentication
    else if (!userRole) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
