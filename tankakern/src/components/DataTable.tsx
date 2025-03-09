"use client";
import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";

/**
 * A generic DataTable component built with @tanstack/react-table (v8).
 * This version includes sorting, global filtering, and optional column filtering.
 *
 * Usage example in a parent component:
 *
 *   <DataTable
 *     columns={columnsDefinition}
 *     data={arrayOfRecords}
 *     enableSorting
 *     enableGlobalFilter
 *     enableColumnFilters
 *   />
 *
 * Additional options can be passed via the optional props:
 * - enableSorting?: boolean
 * - enableGlobalFilter?: boolean
 * - enableColumnFilters?: boolean
 */

interface DataTableProps<T extends object> {
  columns: ColumnDef<T, any>[];
  data: T[];
  enableSorting?: boolean;
  enableGlobalFilter?: boolean;
  enableColumnFilters?: boolean;
}

export function DataTable<T extends object>({
  columns,
  data,
  enableSorting = false,
  enableGlobalFilter = false,
  enableColumnFilters = false,
}: DataTableProps<T>) {
  // States for sorting, filtering, etc.
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable<T>({
    data,
    columns,
    state: {
      sorting: enableSorting ? sorting : [],
      globalFilter: enableGlobalFilter ? globalFilter : "",
      columnFilters: enableColumnFilters ? columnFilters : [],
      columnVisibility,
    },
    onSortingChange: enableSorting ? setSorting : undefined,
    onGlobalFilterChange: enableGlobalFilter ? setGlobalFilter : undefined,
    onColumnFiltersChange: enableColumnFilters ? setColumnFilters : undefined,
    onColumnVisibilityChange: setColumnVisibility,

    getCoreRowModel: getCoreRowModel(),
    // Only use these if their respective features are enabled
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel:
      enableGlobalFilter || enableColumnFilters ? getFilteredRowModel() : undefined,
  });

  // A simple global filter input
  // Shown only if enableGlobalFilter is true
  const GlobalFilter = () => {
    if (!enableGlobalFilter) return null;
    return (
      <input
        type="text"
        value={globalFilter || ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search all columns..."
        className="input input-bordered w-full my-2"
      />
    );
  };

  // If we wanted a per-column filter UI, we could add it under each header,
  // but let's keep it minimal and rely on global filter for simplicity.
  // Or if we want column-level filters, let's show a small text box under each header
  // when enableColumnFilters is true.
  const ColumnFilter = ({ column }: { column: any }) => {
    const firstValue = table
      .getPreFilteredRowModel()
      .flatRows[0]?.getValue(column.id);

    const columnFilterValue = column.getFilterValue() as string;
    return typeof firstValue === "number" ? (
      <input
        type="number"
        value={columnFilterValue || ""}
        onChange={(e) => column.setFilterValue(e.target.value)}
        placeholder={`Filter...`}
        className="input input-bordered input-xs w-24"
      />
    ) : (
      <input
        type="text"
        value={columnFilterValue || ""}
        onChange={(e) => column.setFilterValue(e.target.value)}
        placeholder={`Filter...`}
        className="input input-bordered input-xs w-24"
      />
    );
  };

  return (
    <div className="w-full">
      {/* Global Filter */}
      <GlobalFilter />

      <div className="overflow-x-auto">
        <table className="table w-full table-zebra">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th key={header.id} className="text-sm">
                      {/* Sorting toggle area (if sorting is enabled on the column) */}
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            enableSorting && header.column.getCanSort()
                              ? "cursor-pointer select-none flex flex-col gap-1"
                              : ""
                          }
                          onClick={
                            enableSorting && header.column.getCanSort()
                              ? header.column.getToggleSortingHandler()
                              : undefined
                          }
                        >
                          <span className="text-xs font-bold">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                          {/* Show sort icon or direction */}
                          {enableSorting && header.column.getCanSort() ? (
                            <span className="text-[0.6rem]">
                              {{
                                asc: "▲",
                                desc: "▼",
                              }[
                                header.column.getIsSorted() as string
                              ] ?? "↕"}
                            </span>
                          ) : null}
                        </div>
                      )}
                      {/* Column Filter for each column if enabled */}
                      {enableColumnFilters && header.column.getCanFilter() && (
                        <div className="mt-1">
                          <ColumnFilter column={header.column} />
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getAllColumns().length} className="text-center">
                  No data available
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
