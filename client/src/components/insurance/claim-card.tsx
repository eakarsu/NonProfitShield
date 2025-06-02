import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, FileText } from "lucide-react";
import type { Claim } from "@shared/schema";

interface ClaimCardProps {
  claim: Claim;
}

export default function ClaimCard({ claim }: ClaimCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "denied":
        return "bg-red-100 text-red-800";
      case "paid":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "N/A";
    return parseFloat(amount).toLocaleString();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">{claim.title}</h4>
            <p className="text-sm text-slate-600 mb-2 line-clamp-2">{claim.description}</p>
            
            <div className="flex items-center space-x-4 text-xs text-slate-500">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(claim.submittedAt).toLocaleDateString()}
                </span>
              </div>
              
              {claim.estimatedAmount && (
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-3 w-3" />
                  <span>Est. ${formatCurrency(claim.estimatedAmount)}</span>
                </div>
              )}

              {claim.images && claim.images.length > 0 && (
                <div className="flex items-center space-x-1">
                  <FileText className="h-3 w-3" />
                  <span>{claim.images.length} image(s)</span>
                </div>
              )}
            </div>
          </div>
          
          <Badge className={getStatusColor(claim.status)}>
            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
          </Badge>
        </div>

        {/* AI Assessment Preview */}
        {claim.aiAssessment && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">AI Assessment:</span>
              <span className="font-medium text-slate-700">
                {claim.aiAssessment.damageType} - {claim.aiAssessment.severity}
              </span>
            </div>
          </div>
        )}

        {/* Status-specific information */}
        {claim.status === "approved" && claim.approvedAmount && (
          <div className="mt-3 p-2 bg-green-50 rounded text-xs">
            <span className="text-green-800 font-medium">
              Approved: ${formatCurrency(claim.approvedAmount)}
            </span>
          </div>
        )}

        {claim.status === "paid" && claim.paidAmount && (
          <div className="mt-3 p-2 bg-purple-50 rounded text-xs">
            <span className="text-purple-800 font-medium">
              Paid: ${formatCurrency(claim.paidAmount)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
