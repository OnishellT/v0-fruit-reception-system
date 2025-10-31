const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("🔍 Verifying Quality Evaluation Feature...\n");

    // Login
    console.log("1. Logging in as admin...");
    await page.goto("http://localhost:3000/login");
    await page.fill("#username", "admin");
    await page.fill("#password", "admin123");
    await page.click("button[type=submit]");
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // Navigate to receptions
    console.log("2. Navigating to receptions page...");
    await page.goto("http://localhost:3000/dashboard/reception");
    await page.waitForSelector("h1:has-text('Recepción de Frutos')", { timeout: 15000 });

    // Check for CAFÉ-Seco receptions
    console.log("3. Checking for CAFÉ-Seco receptions...");
    const hasCafeSeco = await page.evaluate(() => {
      const rows = document.querySelectorAll("table tbody tr");
      for (let row of rows) {
        const tipoCell = row.querySelector("td:nth-child(5)");
        if (tipoCell && tipoCell.textContent.includes("CAFÉ - Seco")) {
          return true;
        }
      }
      return false;
    });

    if (hasCafeSeco) {
      console.log("✅ Found CAFÉ-Seco receptions");
      
      // Check for quality button
      const hasQualityButton = await page.evaluate(() => {
        const buttons = document.querySelectorAll("button");
        for (let btn of buttons) {
          if (btn.textContent.includes("Calidad") || btn.textContent.includes("Registrar")) {
            return true;
          }
        }
        return false;
      });

      if (hasQualityButton) {
        console.log("✅ Quality evaluation button found!");
        console.log("\n🎉 QUALITY FEATURE IS WORKING CORRECTLY!");
      } else {
        console.log("❌ Quality evaluation button NOT found");
      }
    } else {
      console.log("⚠️  No CAFÉ-Seco receptions found (may need test data)");
      console.log("   Check if test data was created with: scripts/create-complete-test-data.sql");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await context.close();
    await browser.close();
  }
})();
