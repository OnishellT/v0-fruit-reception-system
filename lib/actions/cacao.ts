'use client';

import { CacaoBatch } from '@/lib/types/cacao';

export async function getCacaoBatchesClient(): Promise<CacaoBatch[]> {
  const response = await fetch('/api/batches', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Ensure fresh data
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch cacao batches');
  }

  return response.json();
}
