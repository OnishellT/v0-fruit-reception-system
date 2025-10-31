import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function testProvidersWithAsociacion() {
  console.log("[v0] Testing providers with asociacion data...\n");

  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // Test the exact query used in getProviders
    const { data, error } = await supabase
      .from("providers")
      .select(`
        *,
        asociacion:asociaciones(id, code, name)
      `)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      console.error("❌ Error:", error);
      return;
    }

    console.log(`✅ Found ${data?.length || 0} providers:\n`);

    if (!data || data.length === 0) {
      console.log("  No providers found");
      return;
    }

    data.forEach((provider, idx) => {
      console.log(`\n[${idx + 1}] Provider: ${provider.name}`);
      console.log(`  code: ${provider.code}`);
      console.log(`  contact_person: ${provider.contact_person || "(null)"}`);
      console.log(`  phone: ${provider.phone || "(null)"}`);
      console.log(`  asociacion:`);

      if (provider.asociacion) {
        console.log(`    id: ${provider.asociacion.id}`);
        console.log(`    code: ${provider.asociacion.code}`);
        console.log(`    name: ${provider.asociacion.name}`);
      } else {
        console.log(`    (null - no asociacion assigned)`);
      }
    });

    console.log("\n" + "=".repeat(60));
    console.log("[v0] SUMMARY");
    console.log("=".repeat(60));

    const providersWithAsoc = data.filter((p) => p.asociacion);
    console.log(`Total providers: ${data.length}`);
    console.log(`Providers with asociacion: ${providersWithAsoc.length}`);
    console.log(`Providers without asociacion: ${data.length - providersWithAsoc.length}`);

    console.log("\n✅ Test complete!");
    console.log("\nThe proveedores table should now display the asociacion column!");
  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

testProvidersWithAsociacion();
