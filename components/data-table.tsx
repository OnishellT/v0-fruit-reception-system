"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export type SortDirection = "asc" | "desc" | null;

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchableFields?: string[];
  pageSize?: number;
  title?: string;
  loading?: boolean;
  emptyMessage?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Buscar...",
  searchableFields,
  pageSize = 10,
  title,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  searchValue: controlledSearchValue,
  onSearchChange,
  className,
}: DataTableProps<T>) {
  const [internalSearchValue, setInternalSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortState, setSortState] = useState<{
    column: keyof T | string | null;
    direction: SortDirection;
  }>({
    column: null,
    direction: null,
  });

  const searchValue = controlledSearchValue ?? internalSearchValue;
  const handleSearchChange = onSearchChange ?? setInternalSearchValue;

  // Helper function to get nested property value
  const getNestedValue = (obj: any, path: string): any => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  // Determine searchable fields
  const defaultSearchableFields = useMemo(() => {
    if (searchableFields) return searchableFields;
    return columns
      .filter((col) => col.searchable !== false)
      .map((col) => String(col.key));
  }, [columns, searchableFields]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchValue.trim()) return data;

    const query = searchValue.toLowerCase();
    return data.filter((row) => {
      return defaultSearchableFields.some((key) => {
        const value = getNestedValue(row, key);
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, searchValue, defaultSearchableFields]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Handle nested objects (e.g., 'provider.name')
      if (
        typeof sortState.column === "string" &&
        sortState.column.includes(".")
      ) {
        aValue = getNestedValue(a, sortState.column);
        bValue = getNestedValue(b, sortState.column);
      } else {
        aValue = a[sortState.column as keyof T];
        bValue = b[sortState.column as keyof T];
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) return sortState.direction === "asc" ? -1 : 1;
      if (aStr > bStr) return sortState.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortState]);

  // Paginate sorted data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    setCurrentPage(1); // Reset to first page when sorting

    setSortState((prev) => {
      if (prev.column === column.key) {
        if (prev.direction === "asc") {
          return { column: column.key, direction: "desc" };
        }
        if (prev.direction === "desc") {
          return { column: null, direction: null };
        }
      }
      return { column: column.key, direction: "asc" };
    });
  };

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;
    if (sortState.column !== column.key) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    if (sortState.direction === "asc") {
      return <ArrowUp className="h-4 w-4" />;
    }
    if (sortState.direction === "desc") {
      return <ArrowDown className="h-4 w-4" />;
    }
    return <ArrowUpDown className="h-4 w-4" />;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
        <div className="mb-4">
          <SearchInput
            value={searchValue}
            onChange={(value) => {
              handleSearchChange(value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            placeholder={searchPlaceholder}
          />
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={String(column.key)}
                      className={`${
                        column.align === "right"
                          ? "text-right"
                          : column.align === "center"
                            ? "text-center"
                            : "text-left"
                      } ${column.sortable ? "cursor-pointer hover:bg-muted/50 select-none" : ""} ${column.className || ""}`}
                      onClick={() => column.sortable && handleSort(column)}
                    >
                      <div
                        className={`flex items-center gap-2 ${
                          column.align === "right"
                            ? "justify-end"
                            : column.align === "center"
                              ? "justify-center"
                              : "justify-start"
                        }`}
                      >
                        {column.label}
                        {getSortIcon(column)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center text-muted-foreground"
                    >
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center text-muted-foreground"
                    >
                      {searchValue
                        ? "No se encontraron resultados"
                        : emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((column) => {
                        const value =
                          typeof column.key === "string" &&
                          column.key.includes(".")
                            ? getNestedValue(row, column.key)
                            : row[column.key];

                        return (
                          <TableCell
                            key={String(column.key)}
                            className={`${
                              column.align === "right"
                                ? "text-right"
                                : column.align === "center"
                                  ? "text-center"
                                  : "text-left"
                            } ${column.className || ""}`}
                          >
                            {column.render
                              ? column.render(value, row)
                              : String(value ?? "N/A")}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
              {Math.min(currentPage * pageSize, sortedData.length)} de{" "}
              {sortedData.length} registros
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
