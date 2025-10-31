const { chromium } = require("playwright");

/**
 * Reception Creation Test - Working Version
 * Properly interacts with Radix UI selects
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
    log("🚀 Starting Reception Creation Test (Working Version)\n");

    // ========== LOGIN ==========
    await test("Should login successfully", async () => {
      await page.goto("http://localhost:3000/login");
      await page.fill("#username", "admin");
      await page.fill("#password", "admin123");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/dashboard", { timeout: 10000 });
    });

    // ========== CREATE RECEPTION ==========
    log("\n=== CREATING RECEPTION ===", "info");

    const receptionData = {
      truck_plate: `TRK-${timestamp}`,
      total_containers: "10",
      notes: `Test Reception ${timestamp}`,
    };

    await test("Should load reception form", async () => {
      await page.goto("http://localhost:3000/dashboard/reception/new");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
    });

    await test("Should fill truck plate", async () => {
      await page.fill("#truck_plate", receptionData.truck_plate);
    });

    await test("Should fill total containers", async () => {
      await page.fill("#total_containers", receptionData.total_containers);
    });

    await test("Should fill notes", async () => {
      await page.fill("#notes", receptionData.notes);
    });

    await test("Should select provider from dropdown", async () => {
      // Find and click the provider combobox
      const providerTrigger = page.locator('[role="combobox"]').first();
      await providerTrigger.click();
      await page.waitForTimeout(1000);

      // Click on first option from the listbox
      const firstOption = page
        .locator('[role="listbox"] [data-radix-select-item]')
        .first();
      await firstOption.click();
      await page.waitForTimeout(500);
    });

    await test("Should select driver from dropdown", async () => {
      // Find and click the driver combobox (second one)
      const driverCombos = page.locator('[role="combobox"]');
      const count = await driverCombos.count();

      if (count < 2) {
        throw new Error(`Expected at least 2 comboboxes, found ${count}`);
      }

      await driverCombos.nth(1).click();
      await page.waitForTimeout(500);

      // Click on first option
      const options = page.locator("option");
      const optionCount = await options.count();

      if (optionCount < 2) {
        throw new Error(`Expected at least 2 options, found ${optionCount}`);
      }

      await options.nth(1).click();
      await page.waitForTimeout(500);
    });

    await test("Should select fruit type from dropdown", async () => {
      // Find and click the fruit type combobox (third one)
      const fruitCombos = page.locator('[role="combobox"]');
      const count = await fruitCombos.count();

      if (count < 3) {
        throw new Error(`Expected at least 3 comboboxes, found ${count}`);
      }

      await fruitCombos.nth(2).click();
      await page.waitForTimeout(500);

      // Click on first option
      const options = page.locator("option");
      const optionCount = await options.count();

      if (optionCount < 3) {
        throw new Error(`Expected at least 3 options, found ${optionCount}`);
      }

      await options.nth(2).click();
      await page.waitForTimeout(500);
    });

    await test("Should submit reception form", async () => {
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(3000);
    });

    await test("Should verify reception created", async () => {
      const currentUrl = page.url();

      // Check if redirected to reception list
      if (currentUrl.includes("/new")) {
        throw new Error("Still on form page - submission may have failed");
      }

      // Navigate to reception list to verify
      await page.goto("http://localhost:3000/dashboard/reception");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);

      // Look for the reception
      const pageText = await page.textContent("body");
      const found = pageText.includes(receptionData.truck_plate);

      if (!found) {
        throw new Error(
          `Reception with plate ${receptionData.truck_plate} not found`,
        );
      }
    });

    // ========== SUMMARY ==========
    log("\n=== TEST SUMMARY ===", "info");
    log(`Total tests: ${passed + failed}`);
    log(`Passed: ${passed}`, "success");
    log(`Failed: ${failed}`, failed > 0 ? "error" : "success");

    if (failed === 0) {
      log("\n🎉 All reception creation tests passed!", "success");
      log(
        `\n✅ Successfully created reception: ${receptionData.truck_plate}`,
        "success",
      );
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
