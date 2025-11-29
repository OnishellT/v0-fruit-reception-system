import { test, expect } from '@playwright/test';

test.describe('Reception Workflow', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('#username', 'admin');
        await page.fill('#password', 'admin123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should create entities and a new reception', async ({ page }) => {
        const timestamp = Date.now();
        const providerName = `Provider ${timestamp}`;
        const driverName = `Driver ${timestamp}`;
        const fruitTypeSubtype = `Subtype ${timestamp}`;
        const truckPlate = `ABC-${timestamp.toString().slice(-4)}`;

        // 1. Create Provider
        await page.goto('/dashboard/proveedores/new');
        await page.fill('input[name="code"]', `PROV-${timestamp}`);
        await page.fill('input[name="name"]', providerName);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard\/proveedores/);

        // 2. Create Driver
        await page.goto('/dashboard/choferes/new');
        await page.fill('input[name="name"]', driverName);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard\/choferes/);

        // 3. Create Fruit Type
        await page.goto('/dashboard/tipos-fruto/new');
        await page.selectOption('select[name="type"]', 'CAFÉ');
        await page.fill('input[name="subtype"]', fruitTypeSubtype);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard\/tipos-fruto/);

        // 4. Create Reception
        await page.goto('/dashboard/reception/new');

        // Select Provider (by label text matching)
        const providerSelect = page.locator('select[name="providerId"]');
        await providerSelect.selectOption({ label: providerName });

        // Select Driver
        const driverSelect = page.locator('select[name="driverId"]');
        await driverSelect.selectOption({ label: driverName });

        // Select Fruit Type
        const fruitTypeSelect = page.locator('select[name="fruitTypeId"]');
        // The option text format is "TYPE - SUBTYPE"
        await fruitTypeSelect.selectOption({ label: `CAFÉ - ${fruitTypeSubtype}` });

        await page.fill('input[name="truckPlate"]', truckPlate);
        await page.fill('input[name="totalContainers"]', '10');

        // Add Details
        // Assuming the detail inputs are the first inputs in the details section
        // We can target them by their parent container or order
        // The inputs have labels "Cantidad *" and "Peso (kg) *"

        // Wait for details section to appear (it depends on fruit type selection)
        await expect(page.locator('text=Agregar Pesada')).toBeVisible();

        // Fill detail inputs
        // We can use getByLabel if the labels are correctly associated, but they might not be unique or perfectly associated in the loop
        // Let's use the input inside the grid
        const quantityInput = page.locator('input[type="number"]').nth(1); // 0 is totalContainers, 1 is detail quantity
        const weightInput = page.locator('input[type="number"]').nth(2); // 2 is detail weight

        await quantityInput.fill('10');
        await weightInput.fill('500');

        await page.click('button:has-text("Agregar Detalle")');

        // Verify detail added to table
        await expect(page.locator('table tbody tr')).toHaveCount(1);
        await expect(page.locator('table tbody tr td').nth(1)).toHaveText('10');
        await expect(page.locator('table tbody tr td').nth(2)).toHaveText('500');

        // Submit
        await page.click('button:has-text("Guardar Recepción")');

        // Verify redirect
        await expect(page).toHaveURL(/\/dashboard\/reception/);

        // Verify reception in list
        await expect(page.locator('table')).toContainText(truckPlate);
    });
});
