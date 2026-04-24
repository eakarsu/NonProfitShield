import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Car, Home } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DataTable, { type Column, type FilterOption } from "@/components/ui/data-table";
import RowDetailDialog from "@/components/ui/row-detail-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function Policies() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedPolicy, setSelectedPolicy] = useState<any | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState("");

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    sortBy,
    sortOrder,
    ...(Object.keys(filters).length > 0 && { filter: JSON.stringify(filters) }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["/api/policies", queryParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/policies?${queryParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch policies");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      setSelectedPolicy(null);
      toast({ title: "Policy deleted" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await apiRequest("POST", "/api/bulk/policies/delete", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      toast({ title: "Policies deleted" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const res = await apiRequest("PUT", `/api/policies/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      setEditingPolicy(null);
      toast({ title: "Policy updated" });
    },
  });

  const columns: Column<any>[] = [
    { key: "id", label: "ID", sortable: true },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.type === "auto" ? (
            <Car className="h-4 w-4 text-primary-500" />
          ) : (
            <Home className="h-4 w-4 text-primary-500" />
          )}
          <span className="capitalize">{item.type}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (item) => (
        <Badge className={statusColors[item.status] || "bg-slate-100 text-slate-800"}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: "coverageAmount",
      label: "Coverage",
      sortable: true,
      render: (item) => `$${parseFloat(item.coverageAmount).toLocaleString()}`,
    },
    {
      key: "monthlyPremium",
      label: "Monthly Premium",
      sortable: true,
      render: (item) => `$${parseFloat(item.monthlyPremium).toFixed(2)}`,
    },
    {
      key: "deductible",
      label: "Deductible",
      sortable: false,
      render: (item) => `$${parseFloat(item.deductible).toLocaleString()}`,
    },
  ];

  const filterOptions: FilterOption[] = [
    {
      key: "type",
      label: "Type",
      options: [
        { value: "auto", label: "Auto" },
        { value: "home", label: "Home" },
      ],
    },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "active", label: "Active" },
        { value: "suspended", label: "Suspended" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
  ];

  const handleExportCsv = () => {
    window.open("/api/export/policies/csv", "_blank");
  };

  const handleExportPdf = () => {
    window.open("/api/export/policies/pdf", "_blank");
  };

  const tableData = data?.data || data || [];
  const total = data?.total || tableData.length;
  const totalPages = data?.totalPages || Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Your Policies</h1>
            <p className="text-slate-600 mt-2">Manage your insurance policies</p>
          </div>
          <Link href="/enrollment">
            <Button className="bg-primary-500 hover:bg-primary-600">
              <Shield className="mr-2 h-4 w-4" />
              Get Coverage
            </Button>
          </Link>
        </div>

        <DataTable
          data={tableData}
          columns={columns}
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          search={search}
          sortBy={sortBy}
          sortOrder={sortOrder}
          filters={filterOptions}
          activeFilters={filters}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
          onSearchChange={(s) => { setSearch(s); setPage(1); }}
          onSortChange={(sb, so) => { setSortBy(sb); setSortOrder(so); }}
          onFilterChange={(key, val) => {
            setFilters((prev) => {
              const next = { ...prev };
              if (val) next[key] = val;
              else delete next[key];
              return next;
            });
            setPage(1);
          }}
          onRowClick={(item) => setSelectedPolicy(item)}
          onBulkDelete={(ids) => bulkDeleteMutation.mutate(ids)}
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
          isLoading={isLoading}
        />
      </div>

      {/* Row Detail Dialog */}
      {selectedPolicy && (
        <RowDetailDialog
          open={!!selectedPolicy}
          onOpenChange={(open) => !open && setSelectedPolicy(null)}
          title={`${selectedPolicy.type.charAt(0).toUpperCase() + selectedPolicy.type.slice(1)} Insurance`}
          subtitle={`Policy #${selectedPolicy.id}`}
          badge={{
            label: selectedPolicy.status.charAt(0).toUpperCase() + selectedPolicy.status.slice(1),
            className: statusColors[selectedPolicy.status] || "bg-slate-100 text-slate-800",
          }}
          fields={[
            { label: "Type", value: selectedPolicy.type.charAt(0).toUpperCase() + selectedPolicy.type.slice(1) },
            { label: "Coverage Amount", value: `$${parseFloat(selectedPolicy.coverageAmount).toLocaleString()}` },
            { label: "Monthly Premium", value: `$${parseFloat(selectedPolicy.monthlyPremium).toFixed(2)}` },
            { label: "Deductible", value: `$${parseFloat(selectedPolicy.deductible).toLocaleString()}` },
            { label: "Start Date", value: selectedPolicy.startDate ? new Date(selectedPolicy.startDate).toLocaleDateString() : "N/A" },
            { label: "End Date", value: selectedPolicy.endDate ? new Date(selectedPolicy.endDate).toLocaleDateString() : "Active" },
            ...(selectedPolicy.vehicleInfo
              ? [
                  { label: "Vehicle", value: `${selectedPolicy.vehicleInfo.year} ${selectedPolicy.vehicleInfo.make} ${selectedPolicy.vehicleInfo.model}` },
                  { label: "VIN", value: selectedPolicy.vehicleInfo.vin },
                  { label: "Mileage", value: `${selectedPolicy.vehicleInfo.mileage?.toLocaleString()} miles` },
                ]
              : []),
            ...(selectedPolicy.propertyInfo
              ? [
                  { label: "Address", value: selectedPolicy.propertyInfo.address },
                  { label: "Year Built", value: selectedPolicy.propertyInfo.yearBuilt?.toString() },
                  { label: "Square Footage", value: `${selectedPolicy.propertyInfo.squareFootage?.toLocaleString()} sq ft` },
                  { label: "Construction", value: selectedPolicy.propertyInfo.constructionType },
                ]
              : []),
          ]}
          onEdit={() => {
            setEditingPolicy(selectedPolicy);
            setEditStatus(selectedPolicy.status);
            setSelectedPolicy(null);
          }}
          onDelete={() => deleteMutation.mutate(selectedPolicy.id)}
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPolicy} onOpenChange={(open) => !open && setEditingPolicy(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Policy #{editingPolicy?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingPolicy(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingPolicy) {
                    updateMutation.mutate({
                      id: editingPolicy.id,
                      updates: { status: editStatus },
                    });
                  }
                }}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
