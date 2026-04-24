import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit,
  Download,
  FileText,
} from "lucide-react";
import ConfirmationDialog from "./confirmation-dialog";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  filters: FilterOption[];
  activeFilters: Record<string, string>;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onFilterChange: (key: string, value: string) => void;
  onRowClick?: (item: T) => void;
  onBulkDelete?: (ids: number[]) => void;
  onBulkUpdate?: (ids: number[], updates: any) => void;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  idKey?: string;
  isLoading?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  total,
  page,
  limit,
  totalPages,
  search,
  sortBy,
  sortOrder,
  filters,
  activeFilters,
  onPageChange,
  onLimitChange,
  onSearchChange,
  onSortChange,
  onFilterChange,
  onRowClick,
  onBulkDelete,
  onBulkUpdate,
  onExportCsv,
  onExportPdf,
  idKey = "id",
  isLoading,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);

  const allSelected = data.length > 0 && data.every((item) => selectedIds.has(item[idKey]));
  const someSelected = data.some((item) => selectedIds.has(item[idKey]));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((item) => item[idKey])));
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      onSortChange(key, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSortChange(key, "asc");
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedIds.size > 0) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
    }
  };

  const getSortIcon = (key: string) => {
    if (sortBy !== key) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: Search, Filters, Export, Bulk Actions */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={activeFilters[filter.key] || "all"}
            onValueChange={(val) => onFilterChange(filter.key, val === "all" ? "" : val)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label}</SelectItem>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {/* Export buttons */}
        {onExportCsv && (
          <Button variant="outline" size="sm" onClick={onExportCsv}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
        )}
        {onExportPdf && (
          <Button variant="outline" size="sm" onClick={onExportPdf}>
            <FileText className="h-4 w-4 mr-1" />
            PDF
          </Button>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Badge variant="secondary">{selectedIds.size} selected</Badge>
          {onBulkDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
          )}
          {onBulkUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkUpdateDialog(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Update Selected
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            Clear Selection
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                {(onBulkDelete || onBulkUpdate) && (
                  <th className="px-4 py-3 w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-sm font-medium text-slate-600 ${
                      col.sortable ? "cursor-pointer hover:text-slate-900 select-none" : ""
                    }`}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    <div className="flex items-center">
                      {col.label}
                      {col.sortable && getSortIcon(col.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {(onBulkDelete || onBulkUpdate) && (
                      <td className="px-4 py-3">
                        <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div
                          className="h-4 bg-slate-200 rounded animate-pulse"
                          style={{ width: `${60 + Math.random() * 40}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (onBulkDelete || onBulkUpdate ? 1 : 0)}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr
                    key={item[idKey] || idx}
                    className={`border-b hover:bg-slate-50 transition-colors ${
                      onRowClick ? "cursor-pointer" : ""
                    } ${selectedIds.has(item[idKey]) ? "bg-blue-50" : ""}`}
                    onClick={(e) => {
                      // Don't trigger row click when clicking checkbox
                      if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
                      onRowClick?.(item);
                    }}
                  >
                    {(onBulkDelete || onBulkUpdate) && (
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.has(item[idKey])}
                          onCheckedChange={() => toggleSelect(item[idKey])}
                          aria-label={`Select row ${item[idKey]}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-sm">
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
          </span>
          <Select
            value={limit.toString()}
            onValueChange={(val) => onLimitChange(parseInt(val))}
          >
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>per page</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Selected Items"
        description={`Are you sure you want to delete ${selectedIds.size} selected item(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
