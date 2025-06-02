import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Bitcoin, Camera, Upload, CreditCard } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CoverageCard from "@/components/insurance/coverage-card";
import ClaimCard from "@/components/insurance/claim-card";

export default function Home() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: policies, isLoading: policiesLoading } = useQuery({
    queryKey: ["/api/policies"],
  });

  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ["/api/claims"],
  });

  const recentClaims = claims?.slice(0, 3) || [];

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
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
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
        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-600">Total Coverage</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {statsLoading ? "..." : `$${stats?.totalCoverage?.toLocaleString() || "0"}`}
                  </div>
                </div>
                <Shield className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-600">Active Claims</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {statsLoading ? "..." : stats?.activeClaims || "0"}
                  </div>
                </div>
                <FileText className="h-8 w-8 text-secondary-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-600">Next Premium</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {statsLoading ? "..." : `$${stats?.nextPremium || "0"}`}
                  </div>
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

          {/* Recent Claims */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Recent Claims</h3>
              <Link href="/claims">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            
            {claimsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-slate-200 rounded mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recentClaims.length > 0 ? (
              <div className="space-y-3">
                {recentClaims.map((claim) => (
                  <ClaimCard key={claim.id} claim={claim} />
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

        {/* Coverage Overview */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Coverage</h3>
          
          {policiesLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-slate-200 rounded mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : policies && policies.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {policies.map((policy) => (
                <CoverageCard key={policy.id} policy={policy} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-slate-900 mb-2">No Coverage Yet</h4>
                <p className="text-slate-600 mb-6">
                  Get started with our comprehensive insurance coverage. Protect what matters most to you.
                </p>
                <Link href="/enrollment">
                  <Button size="lg">Get Coverage</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
