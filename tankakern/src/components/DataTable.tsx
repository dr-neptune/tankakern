"use client";
import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";

/**
 * A generic DataTable component built with @tanstack/react-table (v8).
 * This version includes:
 *   - Sorting
 *   - Pagination (with a page size selector and next/previous buttons)
 *
 * Filtering functionality has been removed.
 *
 * Usage example:
 *
 *  <DataTable
 *    columns={columnsDefinition}
 *    data={arrayOfRecords}
 *    enableSorting
 *  />
 *
 * Additional flag:
 *  - enableSorting?: boolean
 */
interface DataTableProps<T extends object> {
  columns: ColumnDef<T, any>[];
  data: T[];
  enableSorting?: boolean;
}

export function DataTable<T extends object>({
  columns,
  data,
  enableSorting = false,
}: DataTableProps<T>) {
  // State for sorting and pagination
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable<T>({
    data,
    columns,
    state: {
      sorting: enableSorting ? sorting : [],
      columnVisibility,
      pagination,
    },
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="table w-full table-zebra">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSortable = enableSorting && header.column.getCanSort();
                  return (
                    <th key={header.id} className="text-sm">
                      {header.isPlaceholder ? null : (
                        <div
                          className={isSortable ? "cursor-pointer select-none flex flex-col gap-1" : "flex flex-col gap-1"}
                          onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                        >
                          <span className="text-xs font-bold">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {isSortable ? (
                            <span className="text-[0.6rem]">
                              {{
                                asc: "▲",
                                desc: "▼",
                              }[header.column.getIsSorted() as string] ?? "↕"}
                            </span>
                          ) : null}
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

      {/* Pagination */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <button
            className="btn btn-xs"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <button
            className="btn btn-xs"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
        <span className="text-sm">
          Page{" "}
          <strong>
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </strong>
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="select select-bordered select-xs"
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
