
import { db } from '../src/lib/db';
import { receptions, laboratorySamples, qualityEvaluations, desgloseDescuentos } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const receptionId = '92ecd795-a1eb-4853-a4cc-05d26fbd7d2b';

    console.log(`Fetching data for reception: ${receptionId}`);

    const reception = await db.query.receptions.findFirst({
        where: eq(receptions.id, receptionId),
    });

    console.log('Reception:', reception);

    const samples = await db.query.laboratorySamples.findMany({
        where: eq(laboratorySamples.receptionId, receptionId),
    });

    console.log('Samples:', samples);

    const evaluations = await db.query.qualityEvaluations.findMany({
        where: eq(qualityEvaluations.recepcionId, receptionId),
    });

    console.log('Quality Evaluations:', evaluations);

    const discounts = await db.query.desgloseDescuentos.findMany({
        where: eq(desgloseDescuentos.recepcionId, receptionId),
    });

    console.log('Discounts:', discounts);
}

main().catch(console.error).then(() => process.exit(0));
