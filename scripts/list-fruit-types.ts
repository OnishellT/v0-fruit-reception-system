
import { db } from '../src/lib/db';
import { fruitTypes } from '../src/lib/db/schema';

async function main() {
    const types = await db.select().from(fruitTypes);
    console.log('Fruit Types:', types);
}

main().catch(console.error).then(() => process.exit(0));
