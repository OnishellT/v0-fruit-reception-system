const { chromium } = require("playwright");

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
    log("🚀 Starting Reception Creation - Final Test\n");

    await test("Login", async () => {
      await page.goto("http://localhost:3000/login");
      await page.fill("#username", "admin");
      await page.fill("#password", "admin123");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/dashboard", { timeout: 10000 });
    });

    const receptionData = {
      truck_plate: `TRK-${timestamp}`,
      total_containers: "10",
      notes: `Test ${timestamp}`,
    };

    log("\n=== CREATING RECEPTION ===", "info");

    await test("Load form", async () => {
      await page.goto("http://localhost:3000/dashboard/reception/new");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
    });

    await test("Fill truck plate", async () => {
      await page.fill("#truck_plate", receptionData.truck_plate);
    });

    await test("Fill containers", async () => {
      await page.fill("#total_containers", receptionData.total_containers);
    });

    await test("Fill notes", async () => {
      await page.fill("#notes", receptionData.notes);
    });

    // Provider
    await test("Select provider", async () => {
      const trigger = page.locator('[role="combobox"]').first();
      await trigger.click();
      await page.waitForTimeout(1500);
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();
      if (optionCount === 0) {
        throw new Error("No provider options found");
      }
      await options.first().click();
      await page.waitForTimeout(500);
    });

    // Driver
    await test("Select driver", async () => {
      const triggers = page.locator('[role="combobox"]');
      await triggers.nth(1).click();
      await page.waitForTimeout(1500);
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();
      if (optionCount === 0) {
        throw new Error("No driver options found");
      }
      await options.first().click();
      await page.waitForTimeout(500);
    });

    // Fruit type
    await test("Select fruit type", async () => {
      const triggers = page.locator('[role="combobox"]');
      await triggers.nth(2).click();
      await page.waitForTimeout(1500);
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();
      if (optionCount === 0) {
        throw new Error("No fruit type options found");
      }
      await options.first().click();
      await page.waitForTimeout(1000);
    });

    await test("Add detail", async () => {
      // Fill quantity and weight fields (these appear after selecting fruit type)
      // There are 3 number inputs: total_containers (0), quantity (1), weight_kg (2)
      await page.locator('input[type="number"]').nth(1).fill("10");
      await page.locator('input[type="number"]').nth(2).fill("5.50");
      // Click the "Add Detail" button
      await page.click('button:has-text("Agregar Detalle")');
      await page.waitForTimeout(1000);
    });

    await test("Submit form", async () => {
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);

      // Check for error messages
      const errorText = await page.textContent('[role="alert"]');
      if (errorText && errorText.includes("Error")) {
        throw new Error(`Form submission error: ${errorText}`);
      }
    });

    await test("Verify created", async () => {
      await page.goto("http://localhost:3000/dashboard/reception");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(5000);

      const text = await page.textContent("body");
      if (!text.includes(receptionData.truck_plate)) {
        throw new Error(
          `Reception with plate ${receptionData.truck_plate} not found in list`,
        );
      }
    });

    log("\n=== SUMMARY ===", "info");
    log(`Tests: ${passed + failed}`);
    log(`Passed: ${passed}`, "success");

    if (failed === 0) {
      log(
        "\n🎉 SUCCESS! Created reception:",
        receptionData.truck_plate,
        "success",
      );
      process.exit(0);
    } else {
      log("\n⚠️ Some tests failed", "warning");
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, "error");
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
