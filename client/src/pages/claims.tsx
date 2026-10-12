import { readableAssessmentValue } from "@shared/claim-assessment";
import AssessmentActions from "@/components/ai/assessment-actions";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
} from "@/components/ui/dialog";


const statusColors: Record<string, string> = {
  training_draft_unsubmitted: "bg-slate-100 text-slate-800",
  submitted: "bg-blue-100 text-blue-800",
  processing: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  paid: "bg-purple-100 text-purple-800",
};

const statusLabel = (status: string) => status
  .replaceAll("_", " ")
  .replace(/^./, (letter) => letter.toUpperCase());

export default function Claims() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [editingClaim, setEditingClaim] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIncidentDate, setEditIncidentDate] = useState("");
  const editRequest = useRef<AbortController | null>(null);
  const deleteRequest = useRef<AbortController | null>(null);
  useEffect(() => () => { editRequest.current?.abort(); deleteRequest.current?.abort(); }, []);
  const cancelEdit = () => { editRequest.current?.abort(); editRequest.current = null; setEditingClaim(null); };
  const closeDetail = () => { deleteRequest.current?.abort(); deleteRequest.current = null; setSelectedClaim(null); };

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    sortBy,
    sortOrder,
    ...(Object.keys(filters).length > 0 && { filter: JSON.stringify(filters) }),
  });

  const { data, isLoading, error: claimsError, refetch: retryClaims } = useQuery({
    queryKey: ["/api/claims", queryParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/claims?${queryParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, controller }: { id: number; controller: AbortController }) => {
      const response = await fetch(`/api/claims/${id}`, { method: "DELETE", credentials: "include", signal: controller.signal });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Claim deletion failed.");
      return data;
    },
    onSuccess: (_data, variables) => {
      if (variables.controller.signal.aborted) return;
      setSelectedClaim(null);
      toast({ title: "Claim deleted" });
    },
    onError: (error, variables) => {
      if (!variables.controller.signal.aborted) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
    onSettled: (_data, _error, variables) => {
      if (deleteRequest.current === variables.controller) deleteRequest.current = null;
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
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
    mutationFn: async ({ id, updates, controller }: { id: number; updates: { title: string; description: string; incidentDate: string }; controller: AbortController }) => {
      const response = await fetch(`/api/claims/${id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates), signal: controller.signal });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Claim editing failed.");
      return data;
    },
    onSuccess: (_data, variables) => {
      if (variables.controller.signal.aborted) return;
      setEditingClaim(null);
      toast({ title: "Claim details updated", description: "The original AI assessment and submitted inputs are retained." });
    },
    onError: (error, variables) => {
      if (!variables.controller.signal.aborted) toast({ title: "Edit failed", description: error.message, variant: "destructive" });
    },
    onSettled: (_data, _error, variables) => {
      if (editRequest.current === variables.controller) editRequest.current = null;
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
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
          {statusLabel(item.status)}
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
        { value: "training_draft_unsubmitted", label: "Training draft — unsubmitted" },
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

  const tableData = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  const invalidPayload = !!data && !Array.isArray(data) && !Array.isArray(data?.data);
  const total = typeof data?.total === "number" ? data.total : tableData.length;
  const totalPages = typeof data?.totalPages === "number" ? data.totalPages : Math.ceil(total / limit);

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
          errorMessage={claimsError instanceof Error ? claimsError.message : claimsError ? "Claims could not be loaded." : invalidPayload ? "Claims returned an invalid response." : undefined}
          onRetry={() => void retryClaims()}
        />
      </div>

      {/* Row Detail Dialog */}
      {selectedClaim && (
        <RowDetailDialog
          open={!!selectedClaim}
          onOpenChange={(open) => !open && closeDetail()}
          title={selectedClaim.title}
          subtitle={`Claim #${selectedClaim.id}`}
          badge={{
            label: statusLabel(selectedClaim.status),
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
            setEditTitle(selectedClaim.title);
            setEditDescription(selectedClaim.description);
            setEditIncidentDate(String(selectedClaim.incidentDate).slice(0, 10));
            setSelectedClaim(null);
          }}
          busy={deleteMutation.isPending}
          onDelete={() => {
            const controller = new AbortController();
            deleteRequest.current = controller;
            deleteMutation.mutate({ id: selectedClaim.id, controller });
          }}
        >
          {/* AI Assessment */}
          {selectedClaim.aiAssessment && (
            <div className="bg-slate-50 rounded-lg p-4 mt-4">
              <h4 className="font-medium text-slate-900 mb-3">AI Assessment</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Damage Type:</span>
                  <div className="font-medium">{readableAssessmentValue(selectedClaim.aiAssessment.damageType)}</div>
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
                  <span className="text-slate-500">Model-reported confidence:</span>
                  <div className="font-medium">
                    {Math.round((selectedClaim.aiAssessment.confidence || 0) * 100)}%
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="text-slate-500">Repair complexity: </span>{selectedClaim.aiAssessment.repairComplexity}</p>
                <p><span className="text-slate-500">Parts / labor: </span>${selectedClaim.aiAssessment.estimatedCost?.parts?.toLocaleString()} / ${selectedClaim.aiAssessment.estimatedCost?.labor?.toLocaleString()}</p>
                <p><span className="text-slate-500">Affected components: </span>{Array.isArray(selectedClaim.aiAssessment.affectedComponents) ? selectedClaim.aiAssessment.affectedComponents.map((value: string) => readableAssessmentValue(value)).join(", ") : "Not reported"}</p>
                <p className="whitespace-pre-wrap">{readableAssessmentValue(selectedClaim.aiAssessment.description)}</p>
              </div>
              {Array.isArray(selectedClaim.aiAssessment.recommendations) && (
                <div className="mt-3">
                  <span className="text-slate-500 text-sm">Recommendations:</span>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {selectedClaim.aiAssessment.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="whitespace-pre-wrap">{readableAssessmentValue(rec)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-4"><AssessmentActions assessment={selectedClaim.aiAssessment} currentClaim={selectedClaim} /></div>
            </div>
          )}
        </RowDetailDialog>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingClaim} onOpenChange={(open) => !open && cancelEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Claim #{editingClaim?.id}</DialogTitle>
            <DialogDescription>Update the claim details. The original image assessment and submitted inputs are retained for review.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label htmlFor="edit-claim-title">Claim title</Label><Input id="edit-claim-title" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} disabled={updateMutation.isPending} maxLength={200} /></div>
            <div><Label htmlFor="edit-claim-date">Incident date</Label><Input id="edit-claim-date" type="date" value={editIncidentDate} onChange={(event) => setEditIncidentDate(event.target.value)} disabled={updateMutation.isPending} /></div>
            <div><Label htmlFor="edit-claim-description">Description</Label><Textarea id="edit-claim-description" value={editDescription} onChange={(event) => setEditDescription(event.target.value)} disabled={updateMutation.isPending} maxLength={15000} rows={5} /></div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingClaim) {
                    const controller = new AbortController();
                    editRequest.current = controller;
                    updateMutation.mutate({
                      id: editingClaim.id, controller,
                      updates: { title: editTitle, description: editDescription, incidentDate: editIncidentDate },
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
