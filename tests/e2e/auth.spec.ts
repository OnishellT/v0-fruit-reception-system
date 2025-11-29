import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('#username', 'admin');
        await page.fill('#password', 'admin123');
        await page.click('button[type="submit"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.locator('h1')).toContainText('Bienvenido');
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('#username', 'admin');
        await page.fill('#password', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Should stay on login page and show error
        await expect(page).toHaveURL(/\/login/);
        await expect(page.locator('.text-red-500')).toContainText('Usuario o contraseña incorrectos');
    });

    test('should redirect to login when accessing dashboard without session', async ({ page }) => {
        // Clear cookies to ensure no session
        await page.context().clearCookies();

        await page.goto('/dashboard');

        // Should redirect to login
        await expect(page).toHaveURL(/\/login/);
    });
});
