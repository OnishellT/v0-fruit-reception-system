import { test, expect } from '@playwright/test';

test.describe('Quality Evaluation Workflow', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('#username', 'admin');
        await page.fill('#password', 'admin123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should register quality evaluation for a reception', async ({ page }) => {
        // 1. Create a Reception first (Simplified flow)
        // We assume entities exist or we create them quickly.
        // To be robust, let's create a new reception with existing entities if possible, or create new ones.
        // For speed, let's try to use existing entities if the select has options, otherwise create.
        // But we can't easily conditionalize in Playwright without complexity.
        // Let's just create a new set of entities to be safe.

        const timestamp = Date.now();
        const providerName = `ProvQ ${timestamp}`;
        const driverName = `DrivQ ${timestamp}`;
        const fruitTypeSubtype = `SubQ ${timestamp}`;
        const truckPlate = `Q-${timestamp.toString().slice(-4)}`;

        // Create Provider
        await page.goto('/dashboard/proveedores/new');
        await page.fill('input[name="code"]', `P-${timestamp}`);
        await page.fill('input[name="name"]', providerName);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard\/proveedores/);

        // Create Driver
        await page.goto('/dashboard/choferes/new');
        await page.fill('input[name="name"]', driverName);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard\/choferes/);

        // Create Fruit Type
        await page.goto('/dashboard/tipos-fruto/new');
        await page.selectOption('select[name="type"]', 'CACAO');
        await page.fill('input[name="subtype"]', fruitTypeSubtype);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard\/tipos-fruto/);

        // Create Reception
        await page.goto('/dashboard/reception/new');
        await page.selectOption('select[name="providerId"]', { label: providerName });
        await page.selectOption('select[name="driverId"]', { label: driverName });
        await page.selectOption('select[name="fruitTypeId"]', { label: `CACAO - ${fruitTypeSubtype}` });
        await page.fill('input[name="truckPlate"]', truckPlate);
        await page.fill('input[name="totalContainers"]', '10');

        // Add Detail
        await expect(page.locator('text=Agregar Pesada')).toBeVisible();
        await page.locator('input[type="number"]').nth(1).fill('10');
        await page.locator('input[type="number"]').nth(2).fill('100');
        await page.click('button:has-text("Agregar Detalle")');
        await page.click('button:has-text("Guardar Recepción")');
        await expect(page).toHaveURL(/\/dashboard\/reception/);

        // 2. Go to Details
        // Click the link for the new reception (it should be at the top or we search for it)
        // The list is ordered by date desc, so it should be first.
        // Or we can filter/search if implemented.
        // Let's click the first reception number link that matches our truck plate row?
        // We can find the row with truck plate and click the link in it.
        const row = page.locator('tr', { hasText: truckPlate });
        await row.locator('a').click();

        // 3. Register Quality
        await expect(page.locator('h1')).toContainText('REC-');
        await page.click('button:has-text("Registrar Calidad")');

        // Fill Modal
        await expect(page.locator('h3', { hasText: 'Evaluación de Calidad' })).toBeVisible();
        await page.fill('input[name="violetas"]', '5.5');
        await page.fill('input[name="humedad"]', '7.2');
        await page.fill('input[name="moho"]', '1.0');
        await page.click('button:has-text("Guardar")');

        // 4. Verify
        // Modal should close
        await expect(page.locator('h3', { hasText: 'Evaluación de Calidad' })).not.toBeVisible();

        // Values should be displayed
        await expect(page.locator('text=5.50%')).toBeVisible();
        await expect(page.locator('text=7.20%')).toBeVisible();
        await expect(page.locator('text=1.00%')).toBeVisible();
    });
});
