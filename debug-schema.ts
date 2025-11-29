
import { receptions } from './src/lib/db/schema';
import { getTableColumns } from 'drizzle-orm';

console.log('Receptions:', receptions);
try {
    const columns = getTableColumns(receptions);
    console.log('Columns:', Object.keys(columns));
} catch (e) {
    console.error('Error getting columns:', e);
}
