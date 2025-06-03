import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Heart, TrendingUp, Award, Globe } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">About Our Mission</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            We're reimagining insurance as a member-owned mutual company that uses cutting-edge AI technology 
            to provide fair, transparent coverage without the burden of profit margins or hidden fees.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
              <p className="text-lg text-slate-600 max-w-4xl mx-auto leading-relaxed">
                To provide accessible, transparent, and member-focused insurance coverage that leverages 
                artificial intelligence to streamline claims processing while maintaining the human touch 
                where it matters most. We believe insurance should protect people, not profit from them.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Every aspect of our operations is open to our members. From pricing structures 
                  to claims processing, we believe in complete transparency.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-secondary-600" />
                </div>
                <CardTitle>Member-Owned</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  As a mutual company, we're owned by our policyholders, not shareholders. 
                  This means your interests always come first.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  We harness the power of AI and modern technology to make insurance 
                  faster, more accurate, and more accessible for everyone.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How We're Different */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">How We're Different</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Traditional Insurance</h3>
                <ul className="space-y-2 text-slate-600">
                  <li>• Profit-driven shareholder model</li>
                  <li>• Hidden fees and complex pricing</li>
                  <li>• Slow, manual claims processing</li>
                  <li>• Limited payment options</li>
                  <li>• Opaque operations</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Our Approach</h3>
                <ul className="space-y-2 text-slate-600">
                  <li>• Member-owned mutual structure</li>
                  <li>• Transparent, fair pricing</li>
                  <li>• AI-powered instant assessments</li>
                  <li>• Bitcoin and traditional payments</li>
                  <li>• Open financial reporting</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Cost Reduction Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">How AI Reduces Your Insurance Costs</h2>
          <Card className="mb-8">
            <CardContent className="p-8">
              <p className="text-lg text-slate-600 text-center mb-8">
                By leveraging artificial intelligence in underwriting and claims processing, we eliminate inefficiencies 
                that typically cost the insurance industry up to $160 billion over five years. These savings are passed 
                directly to our members through lower premiums.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-primary-600" />
                  <span>Automated Underwriting</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Our AI reduces underwriting time from 3-5 days to just 12.4 minutes for standard policies, 
                  while maintaining high accuracy and comprehensive risk assessment.
                </p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• 70% reduction in data entry time</li>
                  <li>• 31% faster processing for complex policies</li>
                  <li>• Enhanced risk assessment using diverse data sources</li>
                  <li>• Personalized policies and pricing</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-secondary-600" />
                  <span>Intelligent Claims Processing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  AI accelerates claims resolution from weeks to minutes, reducing processing costs by up to 40% 
                  while improving accuracy and fraud detection.
                </p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• 30% reduction in manual labor</li>
                  <li>• 30% faster claims processing by 2025</li>
                  <li>• Enhanced fraud detection capabilities</li>
                  <li>• Reduced inbound call volume</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Real Impact on Your Premiums</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary-600 mb-2">40%</div>
                  <div className="text-sm text-slate-600">Lower claims processing costs</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-secondary-600 mb-2">70%</div>
                  <div className="text-sm text-slate-600">Reduction in data entry time</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">30%</div>
                  <div className="text-sm text-slate-600">Faster claims resolution</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technology */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">Technology That Works For You</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-primary-600" />
                  <span>AI Damage Assessment</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Our advanced computer vision technology analyzes damage photos instantly, 
                  providing accurate assessments that reduce claim resolution from weeks to minutes.
                </p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Instant photo analysis and damage detection</li>
                  <li>• Automated data extraction from documents</li>
                  <li>• Enhanced fraud detection patterns</li>
                  <li>• 24/7 availability with consistent accuracy</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-secondary-600" />
                  <span>Modern Payment Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  We support both traditional payment methods and cryptocurrency, 
                  giving you flexibility in how you pay your premiums.
                </p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Credit/debit cards</li>
                  <li>• Bank transfers</li>
                  <li>• Bitcoin payments</li>
                  <li>• Automatic billing</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Financial Transparency */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Financial Transparency</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600 mb-6 max-w-3xl mx-auto">
              As a mutual company, we publish detailed financial reports showing exactly how your 
              premiums are used. No hidden executive bonuses or shareholder dividends - just 
              transparent operations focused on serving our members.
            </p>
            <Button 
              variant="outline"
              onClick={() => window.location.href = "/financial-reports"}
            >
              View Financial Reports
            </Button>
          </CardContent>
        </Card>

        {/* Join Us */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Join Our Community</h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Become part of a movement that's changing insurance for the better. 
            Experience what member-owned coverage can do for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="px-8 py-4"
              onClick={() => window.location.href = "/calculator"}
            >
              Get Your Quote
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="px-8 py-4"
              onClick={() => window.location.href = "/consultation"}
            >
              Schedule Consultation
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}