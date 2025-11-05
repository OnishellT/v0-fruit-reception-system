'use client';

import { useEffect, useState, useMemo } from 'react';
import { CacaoBatch } from '@/lib/types/cacao';
import { getCacaoBatchesClient } from '@/lib/actions/cacao'; // Changed import
import { BatchesList } from './batches-list';
import { CreateBatchDialog } from './create-batch-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';

interface BatchProgressDashboardProps {
  onBatchUpdated?: () => void;
}

export function BatchProgressDashboard({ onBatchUpdated }: BatchProgressDashboardProps) {
  const [allBatches, setAllBatches] = useState<CacaoBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const fetchedBatches = await getCacaoBatchesClient(); // Changed function call
      setAllBatches(fetchedBatches);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleBatchUpdated = () => {
    fetchBatches();
    onBatchUpdated?.();
  };

  // Filter batches based on status and search term
  const filteredBatches = useMemo(() => {
    let filtered = allBatches;

    // Filter by status - show only active batches unless showCompleted is true or searching
    if (!showCompleted && !searchTerm.trim()) {
      filtered = filtered.filter(batch => batch.status === 'In progress');
    }

    // Filter by search term if provided
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(batch =>
        batch.batch_type.toLowerCase().includes(term) ||
        batch.id.toLowerCase().includes(term) ||
        batch.status.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [allBatches, showCompleted, searchTerm]);

  if (loading) {
    return <div>Cargando lotes...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar lotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showCompleted ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showCompleted ? 'Mostrar Solo Activos' : 'Incluir Completados'}
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredBatches.length} de {allBatches.length} lotes
        {searchTerm && ` (filtrado por: "${searchTerm}")`}
        {!showCompleted && !searchTerm && ' (solo activos)'}
      </div>

      <BatchesList batches={filteredBatches} onBatchUpdated={handleBatchUpdated} />
    </div>
  );
}
