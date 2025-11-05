"use client";

import { useEffect, useState } from "react";

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface UserSession {
  id: string;
  role: UserRole;
  username: string;
}

/**
 * Hook to get current user session and role from custom cookie
 */
export function useUserSession(): {
  session: UserSession | null;
  loading: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  isViewer: boolean;
} {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        // Fetch session from custom cookie
        const response = await fetch('/api/session', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const sessionData = await response.json();
          setSession(sessionData);
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error('Error getting user session:', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, []);

  return {
    session,
    loading,
    isAdmin: session?.role === 'admin',
    isOperator: session?.role === 'operator',
    isViewer: session?.role === 'viewer',
  };
}

/**
 * Hook to check if user has specific role(s)
 */
export function useHasRole(requiredRoles: UserRole | UserRole[]): boolean {
  const { session } = useUserSession();

  if (!session) return false;

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(session.role);
}

/**
 * Hook for admin-only access
 */
export function useIsAdmin(): boolean {
  return useHasRole('admin');
}

/**
 * Hook for operator or admin access
 */
export function useIsOperatorOrAdmin(): boolean {
  return useHasRole(['operator', 'admin']);
}

/**
 * Hook for any authenticated user
 */
export function useIsAuthenticated(): boolean {
  const { session } = useUserSession();
  return !!session;
}