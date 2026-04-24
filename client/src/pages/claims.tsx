import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera } from "lucide-react";
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
  submitted: "bg-blue-100 text-blue-800",
  processing: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  paid: "bg-purple-100 text-purple-800",
};

export default function Claims() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [editingClaim, setEditingClaim] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editApprovedAmount, setEditApprovedAmount] = useState("");

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    sortBy,
    sortOrder,
    ...(Object.keys(filters).length > 0 && { filter: JSON.stringify(filters) }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["/api/claims", queryParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/claims?${queryParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/claims/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      setSelectedClaim(null);
      toast({ title: "Claim deleted" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await apiRequest("POST", "/api/bulk/claims/delete", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      toast({ title: "Claims deleted" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/claims/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      setEditingClaim(null);
      toast({ title: "Claim updated" });
    },
  });

  const columns: Column<any>[] = [
    { key: "id", label: "ID", sortable: true },
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (item) => (
        <span className="font-medium text-slate-900 max-w-[200px] truncate block">
          {item.title}
        </span>
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
      key: "estimatedAmount",
      label: "Estimated",
      sortable: true,
      render: (item) =>
        item.estimatedAmount ? `$${parseFloat(item.estimatedAmount).toLocaleString()}` : "N/A",
    },
    {
      key: "incidentDate",
      label: "Incident Date",
      sortable: true,
      render: (item) =>
        item.incidentDate ? new Date(item.incidentDate).toLocaleDateString() : "N/A",
    },
    {
      key: "submittedAt",
      label: "Submitted",
      sortable: false,
      render: (item) =>
        item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : "N/A",
    },
  ];

  const filterOptions: FilterOption[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "submitted", label: "Submitted" },
        { value: "processing", label: "Processing" },
        { value: "approved", label: "Approved" },
        { value: "denied", label: "Denied" },
        { value: "paid", label: "Paid" },
      ],
    },
  ];

  const handleExportCsv = () => {
    window.open("/api/export/claims/csv", "_blank");
  };

  const handleExportPdf = () => {
    window.open("/api/export/claims/pdf", "_blank");
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
            <h1 className="text-3xl font-bold text-slate-900">Your Claims</h1>
            <p className="text-slate-600 mt-2">Track and manage your insurance claims</p>
          </div>
          <Link href="/submit-claim">
            <Button className="bg-primary-500 hover:bg-primary-600">
              <Camera className="mr-2 h-4 w-4" />
              Submit New Claim
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
          onRowClick={(item) => setSelectedClaim(item)}
          onBulkDelete={(ids) => bulkDeleteMutation.mutate(ids)}
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
          isLoading={isLoading}
        />
      </div>

      {/* Row Detail Dialog */}
      {selectedClaim && (
        <RowDetailDialog
          open={!!selectedClaim}
          onOpenChange={(open) => !open && setSelectedClaim(null)}
          title={selectedClaim.title}
          subtitle={`Claim #${selectedClaim.id}`}
          badge={{
            label: selectedClaim.status.charAt(0).toUpperCase() + selectedClaim.status.slice(1),
            className: statusColors[selectedClaim.status] || "bg-slate-100 text-slate-800",
          }}
          fields={[
            { label: "Description", value: selectedClaim.description },
            {
              label: "Incident Date",
              value: selectedClaim.incidentDate
                ? new Date(selectedClaim.incidentDate).toLocaleDateString()
                : "N/A",
            },
            {
              label: "Submitted At",
              value: selectedClaim.submittedAt
                ? new Date(selectedClaim.submittedAt).toLocaleDateString()
                : "N/A",
            },
            {
              label: "Estimated Amount",
              value: selectedClaim.estimatedAmount
                ? `$${parseFloat(selectedClaim.estimatedAmount).toLocaleString()}`
                : "N/A",
            },
            {
              label: "Approved Amount",
              value: selectedClaim.approvedAmount
                ? `$${parseFloat(selectedClaim.approvedAmount).toLocaleString()}`
                : "N/A",
            },
            {
              label: "Paid Amount",
              value: selectedClaim.paidAmount
                ? `$${parseFloat(selectedClaim.paidAmount).toLocaleString()}`
                : "N/A",
            },
            {
              label: "Images",
              value: selectedClaim.images?.length
                ? `${selectedClaim.images.length} image(s) submitted`
                : "None",
            },
          ]}
          onEdit={() => {
            setEditingClaim(selectedClaim);
            setEditStatus(selectedClaim.status);
            setEditApprovedAmount(selectedClaim.approvedAmount || "");
            setSelectedClaim(null);
          }}
          onDelete={() => deleteMutation.mutate(selectedClaim.id)}
        >
          {/* AI Assessment */}
          {selectedClaim.aiAssessment && (
            <div className="bg-slate-50 rounded-lg p-4 mt-4">
              <h4 className="font-medium text-slate-900 mb-3">AI Assessment</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Damage Type:</span>
                  <div className="font-medium">{selectedClaim.aiAssessment.damageType}</div>
                </div>
                <div>
                  <span className="text-slate-500">Severity:</span>
                  <div className="font-medium capitalize">{selectedClaim.aiAssessment.severity}</div>
                </div>
                <div>
                  <span className="text-slate-500">Estimated Cost:</span>
                  <div className="font-medium">
                    ${selectedClaim.aiAssessment.estimatedCost?.total?.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Confidence:</span>
                  <div className="font-medium">
                    {Math.round((selectedClaim.aiAssessment.confidence || 0) * 100)}%
                  </div>
                </div>
              </div>
              {selectedClaim.aiAssessment.recommendations && (
                <div className="mt-3">
                  <span className="text-slate-500 text-sm">Recommendations:</span>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {selectedClaim.aiAssessment.recommendations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </RowDetailDialog>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingClaim} onOpenChange={(open) => !open && setEditingClaim(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Claim #{editingClaim?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Approved Amount</Label>
              <Input
                type="number"
                value={editApprovedAmount}
                onChange={(e) => setEditApprovedAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingClaim(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingClaim) {
                    updateMutation.mutate({
                      id: editingClaim.id,
                      updates: {
                        status: editStatus,
                        ...(editApprovedAmount && { approvedAmount: editApprovedAmount }),
                      },
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
