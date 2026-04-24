import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, Bitcoin, Camera, Car, Home as HomeIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: policies, isLoading: policiesLoading } = useQuery<any>({
    queryKey: ["/api/policies"],
  });

  const { data: claimsData, isLoading: claimsLoading } = useQuery<any>({
    queryKey: ["/api/claims"],
  });

  const claims = Array.isArray(claimsData) ? claimsData : claimsData?.data || [];
  const recentClaims = claims.slice(0, 3);
  const policyList = Array.isArray(policies) ? policies : policies?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "denied": return "bg-red-100 text-red-800";
      case "paid": return "bg-purple-100 text-purple-800";
      case "active": return "bg-green-100 text-green-800";
      case "suspended": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const isLoading = statsLoading || policiesLoading || claimsLoading;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Dashboard Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
              <div>
                <div className="text-white font-medium">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-slate-400 text-sm">Member since 2024</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Quick Stats - Clickable Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-primary-500"
                onClick={() => setLocation("/policies")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-600">Total Coverage</div>
                      <div className="text-2xl font-bold text-slate-900">
                        ${stats?.totalCoverage?.toLocaleString() || "0"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {stats?.totalPolicies || 0} active policies
                      </div>
                    </div>
                    <Shield className="h-8 w-8 text-primary-500" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-secondary-500"
                onClick={() => setLocation("/claims")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-600">Active Claims</div>
                      <div className="text-2xl font-bold text-slate-900">
                        {stats?.activeClaims || "0"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {stats?.totalClaims || 0} total claims
                      </div>
                    </div>
                    <FileText className="h-8 w-8 text-secondary-500" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-orange-500"
                onClick={() => setLocation("/payment")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-600">Next Premium</div>
                      <div className="text-2xl font-bold text-slate-900">
                        ${stats?.nextPremium || "0"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Due next month</div>
                    </div>
                    <Bitcoin className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/submit-claim">
                    <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white p-4 h-auto justify-between">
                      <div className="flex items-center space-x-3">
                        <Camera className="h-5 w-5" />
                        <span className="font-medium">Submit New Claim</span>
                      </div>
                      <span>→</span>
                    </Button>
                  </Link>

                  <Link href="/enrollment">
                    <Button variant="outline" className="w-full p-4 h-auto justify-between">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5" />
                        <span className="font-medium">Get More Coverage</span>
                      </div>
                      <span>→</span>
                    </Button>
                  </Link>

                  <Link href="/payment">
                    <Button variant="outline" className="w-full p-4 h-auto justify-between">
                      <div className="flex items-center space-x-3">
                        <Bitcoin className="h-5 w-5" />
                        <span className="font-medium">Pay Premium</span>
                      </div>
                      <span>→</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Recent Claims - Clickable rows */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Recent Claims</h3>
                  <Link href="/claims">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>

                {recentClaims.length > 0 ? (
                  <div className="space-y-3">
                    {recentClaims.map((claim: any) => (
                      <Card
                        key={claim.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setLocation("/claims")}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900 text-sm">{claim.title}</h4>
                              <p className="text-xs text-slate-600 line-clamp-1 mt-1">
                                {claim.description}
                              </p>
                            </div>
                            <Badge className={getStatusColor(claim.status) + " ml-2 text-xs"}>
                              {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                            {claim.submittedAt && (
                              <span>{new Date(claim.submittedAt).toLocaleDateString()}</span>
                            )}
                            {claim.estimatedAmount && (
                              <span>
                                Est. ${parseFloat(claim.estimatedAmount).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 mb-4">No claims submitted yet</p>
                      <Link href="/submit-claim">
                        <Button>Submit Your First Claim</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Coverage Overview - Clickable cards */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Your Coverage</h3>
                <Link href="/policies">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {policyList.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {policyList.slice(0, 4).map((policy: any) => (
                    <Card
                      key={policy.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setLocation("/policies")}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {policy.type === "auto" ? (
                              <Car className="h-6 w-6 text-primary-500" />
                            ) : (
                              <HomeIcon className="h-6 w-6 text-primary-500" />
                            )}
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">
                                {policy.type.charAt(0).toUpperCase() + policy.type.slice(1)} Insurance
                              </h3>
                              <p className="text-sm text-slate-600">Policy #{policy.id}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(policy.status)}>
                            {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-sm text-slate-600">Coverage</span>
                            <span className="text-sm font-semibold">
                              ${parseFloat(policy.coverageAmount).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-sm text-slate-600">Premium</span>
                            <span className="text-sm font-semibold">
                              ${parseFloat(policy.monthlyPremium).toFixed(2)}/mo
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-sm text-slate-600">Deductible</span>
                            <span className="text-sm font-semibold">
                              ${parseFloat(policy.deductible).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {policy.vehicleInfo && (
                          <div className="mt-3 pt-3 border-t text-sm text-slate-600">
                            {policy.vehicleInfo.year} {policy.vehicleInfo.make}{" "}
                            {policy.vehicleInfo.model}
                          </div>
                        )}
                        {policy.propertyInfo && (
                          <div className="mt-3 pt-3 border-t text-sm text-slate-600">
                            {policy.propertyInfo.address}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Shield className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-slate-900 mb-2">No Coverage Yet</h4>
                    <p className="text-slate-600 mb-6">
                      Get started with our comprehensive insurance coverage.
                    </p>
                    <Link href="/enrollment">
                      <Button size="lg">Get Coverage</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
