/**
 * Common utilities for Qwik server actions
 * These utilities help maintain consistency across all server actions
 */

import type { Cookie } from '@builder.io/qwik-city';

export interface SessionData {
    id: string;
    username: string;
    role: 'admin' | 'operator' | 'viewer';
    fullName?: string;
}

/**
 * Get session from cookie
 */
export function getSessionFromCookie(cookie: Cookie): SessionData | null {
    try {
        const sessionCookie = cookie.get('user_session');
        if (!sessionCookie) return null;

        const session = sessionCookie.json() as SessionData;
        return session;
    } catch (error) {
        console.error('Error parsing session cookie:', error);
        return null;
    }
}

/**
 * Require authentication for server actions
 */
export function requireAuth(cookie: Cookie): SessionData {
    const session = getSessionFromCookie(cookie);
    if (!session) {
        throw new Error('Unauthorized');
    }
    return session;
}

/**
 * Require admin role for server actions
 */
export function requireAdmin(cookie: Cookie): SessionData {
    const session = requireAuth(cookie);
    if (session.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
    }
    return session;
}

/**
 * Standard success response
 */
export function successResponse<T>(data: T, message?: string) {
    return {
        success: true as const,
        data,
        message,
    };
}

/**
 * Standard error response
 */
export function errorResponse(error: unknown, fallbackMessage = 'An error occurred') {
    const message = error instanceof Error ? error.message : fallbackMessage;
    console.error('Server action error:', error);

    return {
        success: false as const,
        error: message,
    };
}

/**
 * Type for standard action response
 */
export type ActionResponse<T> =
    | { success: true; data: T; message?: string }
    | { success: false; error: string };
