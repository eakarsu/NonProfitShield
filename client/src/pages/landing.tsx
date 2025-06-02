import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Brain, Bitcoin, Users, ShieldCheck, Smartphone } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                Community-Driven Insurance for 
                <span className="text-primary-500"> Everyone</span>
              </h1>
              <p className="text-xl text-slate-600 mt-6 leading-relaxed">
                Join our non-profit mutual insurance platform. Fair premiums, transparent claims processing, 
                and AI-powered assessments that put members first.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button 
                  size="lg" 
                  className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 text-lg"
                  onClick={() => window.location.href = "/api/login"}
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Start Your Application
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-slate-300 hover:border-slate-400 text-slate-700 px-8 py-4 text-lg"
                >
                  Calculate Premium
                </Button>
              </div>

              <div className="flex items-center space-x-6 mt-8 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-secondary-500" />
                  <span>No Profit Margins</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-secondary-500" />
                  <span>AI-Powered Claims</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bitcoin className="h-4 w-4 text-secondary-500" />
                  <span>Bitcoin Payments</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <Card className="transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <CardContent className="p-6">
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-600">Your Coverage</span>
                      <span className="bg-secondary-100 text-secondary-800 text-xs px-2 py-1 rounded-full">Active</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">$250,000</div>
                    <div className="text-sm text-slate-500">Home & Auto Combined</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-primary-500" />
                        <span className="font-medium text-slate-700">Home Insurance</span>
                      </div>
                      <span className="text-slate-900 font-semibold">$180,000</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-primary-500" />
                        <span className="font-medium text-slate-700">Auto Insurance</span>
                      </div>
                      <span className="text-slate-900 font-semibold">$70,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose SafeGuard Mutual?</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Experience the future of insurance with our member-focused platform that combines cutting-edge technology with community values.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">AI-Powered Assessment</h3>
                <p className="text-slate-600 leading-relaxed">
                  Upload photos of damage and get instant AI-powered assessments. Faster claims processing with accurate damage evaluation.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-4">
                  <Bitcoin className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Bitcoin Payments</h3>
                <p className="text-slate-600 leading-relaxed">
                  Pay premiums with Bitcoin for enhanced privacy and reduced transaction fees. Embracing the future of digital payments.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary-50 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-secondary-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Member-Owned</h3>
                <p className="text-slate-600 leading-relaxed">
                  As a non-profit mutual, we're owned by our members. No profit margins mean lower premiums and better coverage for you.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <ShieldCheck className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Transparent Claims</h3>
                <p className="text-slate-600 leading-relaxed">
                  Track your claims in real-time with full transparency. Know exactly where your claim stands at every step of the process.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Mobile First</h3>
                <p className="text-slate-600 leading-relaxed">
                  Submit claims, upload photos, and manage your coverage from anywhere with our mobile-optimized platform.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Smart Pricing</h3>
                <p className="text-slate-600 leading-relaxed">
                  Our AI analyzes risk factors to provide fair, personalized pricing. Pay for coverage that matches your actual risk profile.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Join the Future of Insurance?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Get your personalized quote in under 5 minutes. No hidden fees, no profit margins, just fair coverage.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-white hover:bg-slate-50 text-primary-600 px-8 py-4 text-lg"
              onClick={() => window.location.href = "/api/login"}
            >
              Get Your Quote
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-white hover:bg-white hover:text-primary-600 text-white px-8 py-4 text-lg"
            >
              Schedule Consultation
            </Button>
          </div>

          <div className="mt-8 text-blue-100 text-sm">
            <p>✓ No obligations &nbsp;&nbsp;&nbsp; ✓ Instant estimates &nbsp;&nbsp;&nbsp; ✓ Member-owned</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
