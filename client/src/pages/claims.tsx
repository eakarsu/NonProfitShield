import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, DollarSign, Camera } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ClaimCard from "@/components/insurance/claim-card";

export default function Claims() {
  const { data: claims, isLoading } = useQuery({
    queryKey: ["/api/claims"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "denied": return "bg-red-100 text-red-800";
      case "paid": return "bg-purple-100 text-purple-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-6 bg-slate-200 rounded mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Your Claims</h1>
            <p className="text-slate-600 mt-2">
              Track the status of your insurance claims
            </p>
          </div>
          <Link href="/submit-claim">
            <Button className="bg-primary-500 hover:bg-primary-600">
              <Camera className="mr-2 h-4 w-4" />
              Submit New Claim
            </Button>
          </Link>
        </div>

        {claims && claims.length > 0 ? (
          <div className="space-y-6">
            {claims.map((claim) => (
              <Card key={claim.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        {claim.title}
                      </h3>
                      <p className="text-slate-600 mb-3">{claim.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Submitted {new Date(claim.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {claim.estimatedAmount && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4" />
                            <span>Est. ${parseFloat(claim.estimatedAmount).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(claim.status)}>
                      {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                    </Badge>
                  </div>

                  {/* AI Assessment Summary */}
                  {claim.aiAssessment && (
                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-slate-900 mb-2">AI Assessment</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Damage Type:</span>
                          <div className="font-medium">{claim.aiAssessment.damageType}</div>
                        </div>
                        <div>
                          <span className="text-slate-600">Severity:</span>
                          <div className="font-medium capitalize">{claim.aiAssessment.severity}</div>
                        </div>
                        <div>
                          <span className="text-slate-600">Estimated Cost:</span>
                          <div className="font-medium">${claim.aiAssessment.estimatedCost.total.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-slate-600">Confidence:</span>
                          <div className="font-medium">{Math.round(claim.aiAssessment.confidence * 100)}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Claim Images */}
                  {claim.images && claim.images.length > 0 && (
                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <FileText className="h-4 w-4" />
                        <span>{claim.images.length} image(s) submitted</span>
                      </div>
                    </div>
                  )}

                  {/* Status-specific information */}
                  {claim.status === "approved" && claim.approvedAmount && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="text-green-800 font-medium">
                        Claim Approved: ${parseFloat(claim.approvedAmount).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {claim.status === "paid" && claim.paidAmount && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <div className="text-purple-800 font-medium">
                        Payment Issued: ${parseFloat(claim.paidAmount).toLocaleString()}
                      </div>
                      {claim.paidAt && (
                        <div className="text-purple-600 text-sm mt-1">
                          Paid on {new Date(claim.paidAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No Claims Submitted
              </h3>
              <p className="text-slate-600 mb-6">
                You haven't submitted any insurance claims yet. When you need to file a claim, 
                our AI-powered system will help you get fast, accurate assessments.
              </p>
              <Link href="/submit-claim">
                <Button size="lg">
                  <Camera className="mr-2 h-4 w-4" />
                  Submit Your First Claim
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
