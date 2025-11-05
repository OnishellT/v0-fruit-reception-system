import { db } from "./lib/db/index.js";
import { cashFruitTypes } from "./lib/db/schema.js";
import { eq } from "drizzle-orm";

async function checkFruitTypes() {
  try {
    const fruitTypes = await db.select().from(cashFruitTypes).where(eq(cashFruitTypes.enabled, true));
    console.log('Fruit types data:');
    fruitTypes.forEach((type, index) => {
      console.log(`${index}: ID=${type.id}, Name='${type.name}', Code='${type.code}'`);
    });

    // Check for duplicates
    const ids = fruitTypes.map(t => t.id);
    const uniqueIds = [...new Set(ids)];
    if (ids.length !== uniqueIds.length) {
      console.log('DUPLICATE IDs FOUND!');
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.log('Duplicate IDs:', [...new Set(duplicates)]);
    } else {
      console.log('All IDs are unique');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkFruitTypes();