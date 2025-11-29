import { db } from '~/lib/db';
import { receptions, providers, drivers, cacaoBatches } from '~/lib/db/schema';
import { ilike, or, eq, desc } from 'drizzle-orm';
import { server$ } from '@builder.io/qwik-city';

export interface SearchResult {
    type: 'reception' | 'provider' | 'driver' | 'batch';
    id: string;
    title: string;
    subtitle: string;
    url: string;
}

export const searchGlobal = server$(async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];

    const searchTerm = `%${query}%`;
    const results: SearchResult[] = [];

    // Search Receptions
    const receptionResults = await db
        .select({
            id: receptions.id,
            number: receptions.receptionNumber,
            date: receptions.receptionDate,
        })
        .from(receptions)
        .where(ilike(receptions.receptionNumber, searchTerm))
        .limit(5)
        .orderBy(desc(receptions.createdAt));

    results.push(...receptionResults.map(r => ({
        type: 'reception' as const,
        id: r.id,
        title: `Recepción #${r.number}`,
        subtitle: new Date(r.date).toLocaleDateString(),
        url: `/dashboard/reception/${r.id}`,
    })));

    // Search Providers
    const providerResults = await db
        .select({
            id: providers.id,
            name: providers.name,
            code: providers.code,
        })
        .from(providers)
        .where(or(
            ilike(providers.name, searchTerm),
            ilike(providers.code, searchTerm)
        ))
        .limit(5);

    results.push(...providerResults.map(p => ({
        type: 'provider' as const,
        id: p.id,
        title: p.name,
        subtitle: `Código: ${p.code}`,
        url: `/dashboard/proveedores/${p.id}`,
    })));

    // Search Drivers
    const driverResults = await db
        .select({
            id: drivers.id,
            name: drivers.name,
            license: drivers.licenseNumber,
        })
        .from(drivers)
        .where(or(
            ilike(drivers.name, searchTerm),
            ilike(drivers.licenseNumber, searchTerm)
        ))
        .limit(5);

    results.push(...driverResults.map(d => ({
        type: 'driver' as const,
        id: d.id,
        title: d.name,
        subtitle: `Licencia: ${d.license || 'N/A'}`,
        url: `/dashboard/choferes/${d.id}`,
    })));

    // Search Batches
    // Note: Batches ID is UUID, so ilike might not work well unless we cast to text or search specific fields
    // For now, let's search by batchType or status if they match
    // Or if the query looks like a date
    const batchResults = await db
        .select({
            id: cacaoBatches.id,
            type: cacaoBatches.batchType,
            status: cacaoBatches.status,
            startDate: cacaoBatches.startDate,
        })
        .from(cacaoBatches)
        .where(ilike(cacaoBatches.batchType, searchTerm))
        .limit(5)
        .orderBy(desc(cacaoBatches.startDate));

    results.push(...batchResults.map(b => ({
        type: 'batch' as const,
        id: b.id,
        title: `Lote ${b.type}`,
        subtitle: `${b.status} - ${new Date(b.startDate).toLocaleDateString()}`,
        url: `/dashboard/batches/${b.id}`,
    })));

    return results;
});
