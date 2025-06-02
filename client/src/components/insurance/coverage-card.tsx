import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Home, Car } from "lucide-react";
import type { Policy } from "@shared/schema";

interface CoverageCardProps {
  policy: Policy;
}

export default function CoverageCard({ policy }: CoverageCardProps) {
  const getIcon = () => {
    switch (policy.type) {
      case "auto":
        return <Car className="h-6 w-6 text-primary-500" />;
      case "home":
        return <Home className="h-6 w-6 text-primary-500" />;
      default:
        return <Shield className="h-6 w-6 text-primary-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-secondary-100 text-secondary-800";
      case "suspended":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const formatCurrency = (amount: string) => {
    return parseFloat(amount).toLocaleString();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {policy.type.charAt(0).toUpperCase() + policy.type.slice(1)} Insurance
              </h3>
              <p className="text-sm text-slate-600">
                Policy #{policy.id}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(policy.status)}>
            {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Coverage Amount</span>
            <span className="font-semibold text-slate-900">
              ${formatCurrency(policy.coverageAmount)}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Monthly Premium</span>
            <span className="font-semibold text-slate-900">
              ${parseFloat(policy.monthlyPremium).toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Deductible</span>
            <span className="font-semibold text-slate-900">
              ${formatCurrency(policy.deductible)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-600">Start Date</span>
            <span className="font-medium text-slate-700">
              {new Date(policy.startDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Additional policy details */}
        {policy.vehicleInfo && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-900 mb-2">Vehicle Information</h4>
            <div className="text-sm text-slate-600">
              {policy.vehicleInfo.year} {policy.vehicleInfo.make} {policy.vehicleInfo.model}
            </div>
          </div>
        )}

        {policy.propertyInfo && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-900 mb-2">Property Information</h4>
            <div className="text-sm text-slate-600">
              {policy.propertyInfo.address}
            </div>
            <div className="text-sm text-slate-500">
              {policy.propertyInfo.squareFootage.toLocaleString()} sq ft • Built {policy.propertyInfo.yearBuilt}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
