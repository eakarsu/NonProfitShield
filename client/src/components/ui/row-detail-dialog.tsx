import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, X } from "lucide-react";
import { useState } from "react";
import ConfirmationDialog from "./confirmation-dialog";

interface DetailField {
  label: string;
  value: React.ReactNode;
}

interface RowDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  badge?: { label: string; className: string };
  fields: DetailField[];
  onEdit?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

export default function RowDetailDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  badge,
  fields,
  onEdit,
  onDelete,
  children,
}: RowDetailDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl">{title}</DialogTitle>
                {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
              </div>
              {badge && (
                <Badge className={badge.className}>{badge.label}</Badge>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {fields.map((field, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm font-medium text-slate-500 sm:w-40 shrink-0">
                  {field.label}
                </span>
                <span className="text-sm text-slate-900 flex-1">{field.value}</span>
              </div>
            ))}

            {children}
          </div>

          {/* Action buttons */}
          {(onEdit || onDelete) && (
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              {onEdit && (
                <Button variant="outline" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete?.();
        }}
      />
    </>
  );
}
