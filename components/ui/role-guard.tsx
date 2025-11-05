"use client";

import { ReactNode } from "react";
import { useHasRole, useIsAdmin, useIsOperatorOrAdmin, useIsAuthenticated, type UserRole } from "@/hooks/use-user-session";

interface RoleGuardProps {
  children: ReactNode;
  roles: UserRole | UserRole[];
  fallback?: ReactNode;
  requireAuth?: boolean;
}

/**
 * Component that conditionally renders children based on user roles
 */
export function RoleGuard({ children, roles, fallback = null, requireAuth = true }: RoleGuardProps) {
  const hasRole = useHasRole(roles);
  const isAuthenticated = useIsAuthenticated();

  if (requireAuth && !isAuthenticated) {
    return fallback;
  }

  if (!hasRole) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Component that only renders for admin users
 */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component that renders for operators and admins
 */
export function OperatorOrAdmin({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const isOperatorOrAdmin = useIsOperatorOrAdmin();

  if (!isOperatorOrAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component that renders different content based on user role
 */
export function RoleSwitcher({
  admin,
  operator,
  viewer,
  fallback = null
}: {
  admin?: ReactNode;
  operator?: ReactNode;
  viewer?: ReactNode;
  fallback?: ReactNode;
}) {
  const isAdmin = useIsAdmin();
  const isOperatorOrAdmin = useIsOperatorOrAdmin();

  if (isAdmin && admin) {
    return <>{admin}</>;
  }

  if (isOperatorOrAdmin && !isAdmin && operator) {
    return <>{operator}</>;
  }

  if (!isOperatorOrAdmin && viewer) {
    return <>{viewer}</>;
  }

  return <>{fallback}</>;
}

/**
 * Button that only shows for specific roles
 */
export function RoleButton({
  children,
  roles,
  ...buttonProps
}: {
  children: ReactNode;
  roles: UserRole | UserRole[];
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const hasRole = useHasRole(roles);

  if (!hasRole) {
    return null;
  }

  return <button {...buttonProps}>{children}</button>;
}