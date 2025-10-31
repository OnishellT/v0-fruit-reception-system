const { chromium } = require("playwright");

/**
 * Simple CRUD Create Test - Tests only the CREATE operations
 */

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;
  const timestamp = Date.now();

  const log = (message, status = "info") => {
    const symbols = {
      info: "ℹ️",
      success: "✅",
      error: "❌",
      warning: "⚠️",
      test: "🧪",
    };
    console.log(`${symbols[status]} ${message}`);
  };

  const test = async (name, fn) => {
    try {
      log(`Starting test: ${name}`, "test");
      await fn();
      passed++;
      log(`Test passed: ${name}`, "success");
    } catch (error) {
      failed++;
      log(`Test failed: ${name} - ${error.message}`, "error");
      throw error;
    }
  };

  try {
    log("🚀 Starting CREATE Operations Test Suite\n");

    // ========== LOGIN ==========
    await test("Should login successfully", async () => {
      await page.goto("http://localhost:3000/login");
      await page.fill("#username", "admin");
      await page.fill("#password", "admin123");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/dashboard", { timeout: 10000 });
    });

    // ========== PROVIDERS CREATE ==========
    log("\n=== PROVIDERS CREATE ===", "info");

    const providerData = {
      code: `PROV${timestamp}`,
      name: `Test Provider ${timestamp}`,
      contact: `Test Contact ${timestamp}`,
      phone: "809-555-0001",
      address: "Test Address 123",
    };

    await test("PROVIDERS: Should create new provider", async () => {
      await page.goto("http://localhost:3000/dashboard/proveedores/new");
      await page.waitForLoadState("networkidle");

      await page.fill('input[name="code"]', providerData.code);
      await page.fill('input[name="name"]', providerData.name);
      await page.fill('input[name="contact"]', providerData.contact);
      await page.fill('input[name="phone"]', providerData.phone);
      await page.fill('input[name="address"]', providerData.address);

      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      await page.waitForURL("**/dashboard/proveedores", { timeout: 5000 });
    });

    await test("PROVIDERS: Should find created provider in table", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Wait for database commit
      await page.waitForTimeout(3000);

      // Check current page first
      let providerText = await page.textContent("text=" + providerData.name);

      // If not found, navigate to last page (new records are added at end)
      if (!providerText) {
        // Look for "Last" or "chevrons-right" pagination button
        const lastPageButton = page
          .locator("button")
          .filter({ hasText: /chevrons-right|ChevronsRight|Última|Last/ });
        const buttonCount = await lastPageButton.count();

        if (buttonCount > 0) {
          await lastPageButton.first().click();
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(1000);
          providerText = await page.textContent("text=" + providerData.name);
        }
      }

      if (!providerText) {
        throw new Error(
          "Created provider not found in table (checked all pages)",
        );
      }
    });

    // ========== DRIVERS CREATE ==========
    log("\n=== DRIVERS CREATE ===", "info");

    const driverData = {
      name: `Test Driver ${timestamp}`,
      license_number: `LIC${timestamp}`,
      phone: "809-555-0002",
    };

    await test("DRIVERS: Should create new driver", async () => {
      await page.goto("http://localhost:3000/dashboard/choferes/new");
      await page.waitForLoadState("networkidle");

      await page.fill('input[name="name"]', driverData.name);
      await page.fill(
        'input[name="license_number"]',
        driverData.license_number,
      );
      await page.fill('input[name="phone"]', driverData.phone);

      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      await page.waitForURL("**/dashboard/choferes", { timeout: 5000 });
    });

    await test("DRIVERS: Should find created driver in table", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);

      let driverText = await page.textContent("text=" + driverData.name);

      if (!driverText) {
        const lastPageButton = page
          .locator("button")
          .filter({ hasText: /chevrons-right|ChevronsRight|Última|Last/ });
        if ((await lastPageButton.count()) > 0) {
          await lastPageButton.first().click();
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(1000);
          driverText = await page.textContent("text=" + driverData.name);
        }
      }

      if (!driverText) {
        throw new Error("Created driver not found in table");
      }
    });

    // ========== FRUIT TYPES CREATE ==========
    log("\n=== FRUIT TYPES CREATE ===", "info");

    const fruitTypeData = {
      type: "Coco",
      subtype: `Test Subtype ${timestamp}`,
      description: `Test Description ${timestamp}`,
    };

    await test("FRUIT TYPES: Should create new fruit type", async () => {
      await page.goto("http://localhost:3000/dashboard/tipos-fruto/new");
      await page.waitForLoadState("networkidle");

      // Use selectOption which handles Radix UI Select better
      await page.selectOption('select[name="type"]', "COCOS");

      // Fill subtype
      await page.fill('input[name="subtype"]', fruitTypeData.subtype);

      // Fill description
      await page.fill('input[name="description"]', fruitTypeData.description);

      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      await page.waitForURL("**/dashboard/tipos-fruto", { timeout: 5000 });
    });

    await test("FRUIT TYPES: Should find created fruit type in table", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);

      let fruitText = await page.textContent("text=" + fruitTypeData.subtype);

      if (!fruitText) {
        const lastPageButton = page
          .locator("button")
          .filter({ hasText: /chevrons-right|ChevronsRight|Última|Last/ });
        if ((await lastPageButton.count()) > 0) {
          await lastPageButton.first().click();
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(1000);
          fruitText = await page.textContent("text=" + fruitTypeData.subtype);
        }
      }

      if (!fruitText) {
        throw new Error("Created fruit type not found in table");
      }
    });

    // ========== ASSOCIATIONS CREATE ==========
    log("\n=== ASSOCIATIONS CREATE ===", "info");

    const associationData = {
      code: `ASC${timestamp}`,
      name: `Test Association ${timestamp}`,
      description: `Test Description ${timestamp}`,
    };

    await test("ASSOCIATIONS: Should create new association", async () => {
      await page.goto("http://localhost:3000/dashboard/asociaciones/new");
      await page.waitForLoadState("networkidle");

      await page.fill('input[name="code"]', associationData.code);
      await page.fill('input[name="name"]', associationData.name);
      await page.fill(
        'textarea[name="description"]',
        associationData.description,
      );

      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      await page.waitForURL("**/dashboard/asociaciones", { timeout: 5000 });
    });

    await test("ASSOCIATIONS: Should find created association in table", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);

      let associationText = await page.textContent(
        "text=" + associationData.name,
      );

      if (!associationText) {
        const lastPageButton = page
          .locator("button")
          .filter({ hasText: /chevrons-right|ChevronsRight|Última|Last/ });
        if ((await lastPageButton.count()) > 0) {
          await lastPageButton.first().click();
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(1000);
          associationText = await page.textContent(
            "text=" + associationData.name,
          );
        }
      }

      if (!associationText) {
        throw new Error("Created association not found in table");
      }
    });

    // ========== FINAL REPORT ==========
    log("\n=== TEST SUMMARY ===", "info");
    log(`Total tests: ${passed + failed}`);
    log(`Passed: ${passed}`, "success");
    log(`Failed: ${failed}`, failed > 0 ? "error" : "success");

    if (failed === 0) {
      log("\n🎉 All CREATE tests passed!", "success");
      log("\n✅ Created records in all entities:", "success");
      log(`  - Provider: ${providerData.name}`, "success");
      log(`  - Driver: ${driverData.name}`, "success");
      log(`  - Fruit Type: ${fruitTypeData.subtype}`, "success");
      log(`  - Association: ${associationData.name}`, "success");
      process.exit(0);
    } else {
      log("\n⚠️ Some tests failed", "warning");
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, "error");
    console.error(error.stack);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
