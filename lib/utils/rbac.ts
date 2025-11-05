/**
 * Role-Based Access Control Middleware for Cash POS
 *
 * Provides middleware functions for enforcing role-based permissions
 * on cash POS routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface UserSession {
  id: string;
  role: UserRole;
  email?: string;
}

/**
 * Extract user session from request
 */
export async function getUserSession(request: NextRequest): Promise<UserSession | null> {
  try {
    const supabase = await createClient();

    // Get the session from Supabase
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    // Extract role from user metadata or app metadata
    const role = session.user.user_metadata?.role ||
                 session.user.app_metadata?.role ||
                 'viewer';

    return {
      id: session.user.id,
      role: role as UserRole,
      email: session.user.email,
    };
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}

/**
 * Check if user has required role(s)
 */
export function hasRole(userRole: UserRole | undefined, requiredRoles: UserRole | UserRole[]): boolean {
  if (!userRole) return false;

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(userRole);
}

/**
 * Middleware for admin-only routes
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const session = await getUserSession(request);

  if (!session || !hasRole(session.role, 'admin')) {
    // Redirect to unauthorized page or dashboard
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard'; // Could create an unauthorized page
    return NextResponse.redirect(url);
  }

  return null; // Allow access
}

/**
 * Middleware for operator/admin routes
 */
export async function requireOperatorOrAdmin(request: NextRequest): Promise<NextResponse | null> {
  const session = await getUserSession(request);

  if (!session || !hasRole(session.role, ['operator', 'admin'])) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return null;
}

/**
 * Middleware for any authenticated user (viewer+)
 */
export async function requireAuthenticated(request: NextRequest): Promise<NextResponse | null> {
  const session = await getUserSession(request);

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return null;
}

/**
 * Cash POS specific route protection
 */
export async function protectCashRoutes(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Admin-only routes
  if (pathname.match(/^\/dashboard\/cash-pos\/(pricing|quality|fruit-types)/)) {
    return requireAdmin(request);
  }

  // Operator/Admin routes
  if (pathname.match(/^\/dashboard\/cash-pos\/(receptions|customers)/)) {
    return requireOperatorOrAdmin(request);
  }

  // Viewer+ routes (any authenticated user)
  if (pathname.startsWith('/dashboard/cash-pos/')) {
    return requireAuthenticated(request);
  }

  return null;
}