import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, DollarSign, Users, Shield, FileText } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function FinancialReports() {
  const reports = [
    {
      year: "2024",
      title: "Annual Financial Report 2024",
      status: "Current",
      type: "Annual Report",
      size: "2.4 MB",
      date: "March 2024"
    },
    {
      year: "2023", 
      title: "Annual Financial Report 2023",
      status: "Complete",
      type: "Annual Report", 
      size: "2.1 MB",
      date: "March 2023"
    },
    {
      year: "2024",
      title: "Q3 2024 Quarterly Report",
      status: "Latest",
      type: "Quarterly",
      size: "1.2 MB", 
      date: "October 2024"
    },
    {
      year: "2024",
      title: "Member Impact Report 2024",
      status: "New",
      type: "Impact Report",
      size: "3.1 MB",
      date: "December 2024"
    }
  ];

  const keyMetrics = [
    {
      icon: Users,
      title: "Total Members",
      value: "12,450",
      change: "+18.5%",
      period: "vs last year"
    },
    {
      icon: DollarSign,
      title: "Claims Paid",
      value: "$8.2M",
      change: "+12.3%",
      period: "this year"
    },
    {
      icon: Shield,
      title: "Coverage Ratio",
      value: "94.2%",
      change: "+2.1%",
      period: "efficiency gain"
    },
    {
      icon: TrendingUp,
      title: "Member Satisfaction",
      value: "4.8/5",
      change: "+0.3",
      period: "rating improvement"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">Financial Reports & Transparency</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            As a member-owned mutual company, we believe in complete financial transparency. 
            Access our detailed reports to see exactly how your premiums are used.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {keyMetrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-primary-600" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {metric.change}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">{metric.value}</div>
                  <div className="text-sm font-medium text-slate-700 mb-1">{metric.title}</div>
                  <div className="text-xs text-slate-500">{metric.period}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Financial Philosophy */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Our Financial Philosophy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Member-Owned</h3>
                <p className="text-slate-600">
                  100% of profits are returned to members through lower premiums, 
                  improved services, or emergency reserves.
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-secondary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Reserve Fund</h3>
                <p className="text-slate-600">
                  We maintain adequate reserves to ensure we can always 
                  pay claims, even during catastrophic events.
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Efficient Operations</h3>
                <p className="text-slate-600">
                  AI technology and streamlined processes keep our 
                  operational costs low, benefiting all members.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Available Reports</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {reports.map((report, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <Badge variant={
                      report.status === 'Current' ? 'default' :
                      report.status === 'Latest' ? 'secondary' :
                      report.status === 'New' ? 'destructive' : 'outline'
                    }>
                      {report.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Type:</span>
                      <span className="font-medium">{report.type}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Published:</span>
                      <span className="font-medium">{report.date}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">File Size:</span>
                      <span className="font-medium">{report.size}</span>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How We Use Your Premiums */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">How We Use Your Premiums</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Premium Allocation</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Claims Payments</span>
                    <span className="font-semibold">68%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{width: '68%'}}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Operating Expenses</span>
                    <span className="font-semibold">18%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-secondary-500 h-2 rounded-full" style={{width: '18%'}}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Reserve Fund</span>
                    <span className="font-semibold">14%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '14%'}}></div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">What This Means</h3>
                <div className="space-y-3 text-slate-600">
                  <p>
                    <strong>Claims Payments:</strong> The majority of your premium goes directly 
                    to paying member claims and benefits.
                  </p>
                  <p>
                    <strong>Operating Expenses:</strong> This covers technology, staff, 
                    customer service, and regulatory compliance.
                  </p>
                  <p>
                    <strong>Reserve Fund:</strong> Maintained for financial stability 
                    and catastrophic event coverage.
                  </p>
                  <p className="font-medium text-slate-900">
                    <strong>0% Profit:</strong> Unlike traditional insurers, we don't 
                    extract profit for shareholders.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Benefits */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Member Benefits from Our Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="h-6 w-6 text-primary-600" />
                </div>
                <h4 className="font-semibold mb-2">Lower Premiums</h4>
                <p className="text-sm text-slate-600">
                  No profit margins mean more competitive rates for the same coverage.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-secondary-600" />
                </div>
                <h4 className="font-semibold mb-2">Voting Rights</h4>
                <p className="text-sm text-slate-600">
                  Members have a say in company decisions and policy changes.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Better Service</h4>
                <p className="text-sm text-slate-600">
                  Focus on member satisfaction rather than shareholder returns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Questions About Our Finances?</h2>
          <p className="text-xl text-slate-600 mb-8">
            We're committed to transparency. Contact us for detailed explanations 
            of any financial information.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => window.location.href = "/contact"}
            >
              <FileText className="mr-2 h-4 w-4" />
              Contact Us
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => window.location.href = "/about"}
            >
              Learn More About Us
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}