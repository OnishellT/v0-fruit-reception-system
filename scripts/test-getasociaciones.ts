import { getAsociaciones } from "../lib/actions/asociaciones";

async function testGetAsociaciones() {
  console.log("[v0] Testing getAsociaciones() action function...\n");

  try {
    const result = await getAsociaciones();

    if (result.error) {
      console.error("❌ Error:", result.error);
      return;
    }

    console.log(`✅ Found ${result.data?.length || 0} asociaciones:\n`);

    result.data?.forEach((asoc) => {
      console.log(`  📋 ${asoc.name} (${asoc.code})`);
      console.log(`     └─ Providers: ${asoc.providers_count}`);
      console.log(`     └─ Created: ${asoc.created_at}`);
      console.log("");
    });

    console.log("✅ Test complete!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testGetAsociaciones();
