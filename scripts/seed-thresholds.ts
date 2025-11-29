import { db } from '~/lib/db';
import { fruitTypes, qualityThresholds } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';

async function seedThresholds() {
    console.log('Starting threshold seed...');

    // 1. Get all fruit types
    const allFruitTypes = await db.select().from(fruitTypes);
    console.log(`Found ${allFruitTypes.length} fruit types`);

    // 2. Define default thresholds
    const defaults = {
        'CACAO': [
            { metric: 'humedad', threshold: 12.00 },
            { metric: 'moho', threshold: 2.00 },
            { metric: 'violetas', threshold: 1.50 },
            { metric: 'pizarra', threshold: 1.00 },
            { metric: 'pasilla', threshold: 2.00 },
            { metric: 'almendra_blanca', threshold: 0.00 }, // No discount usually, but good to have
        ],
        'CAFE': [
            { metric: 'humedad', threshold: 12.00 },
            { metric: 'broca', threshold: 2.00 },
            { metric: 'negro', threshold: 1.00 },
            { metric: 'vinagre', threshold: 1.00 },
        ],
        'MIEL': [
            { metric: 'humedad', threshold: 18.00 },
        ]
    };

    // 3. Insert thresholds
    for (const ft of allFruitTypes) {
        // Match by type name (case insensitive partial match)
        const typeName = ft.type.toUpperCase();
        let thresholdsToInsert: { metric: string, threshold: number }[] = [];

        if (typeName.includes('CACAO')) {
            thresholdsToInsert = defaults['CACAO'];
        } else if (typeName.includes('CAFE') || typeName.includes('COFFEE')) {
            thresholdsToInsert = defaults['CAFE'];
        } else if (typeName.includes('MIEL') || typeName.includes('HONEY')) {
            thresholdsToInsert = defaults['MIEL'];
        }

        if (thresholdsToInsert.length > 0) {
            console.log(`Inserting ${thresholdsToInsert.length} thresholds for ${ft.type} (${ft.subtype})`);

            for (const t of thresholdsToInsert) {
                try {
                    await db.insert(qualityThresholds).values({
                        fruitTypeId: ft.id,
                        metric: t.metric,
                        thresholdPercent: t.threshold.toString(),
                        enabled: true,
                    }).onConflictDoNothing(); // Skip if exists
                } catch (e) {
                    console.error(`Error inserting ${t.metric} for ${ft.type}:`, e);
                }
            }
        } else {
            console.log(`No defaults found for ${ft.type}`);
        }
    }

    console.log('Seed complete!');
    process.exit(0);
}

seedThresholds().catch(console.error);
