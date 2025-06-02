import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Home, Shield, Umbrella, CheckCircle } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function Coverage() {
  const coverageTypes = [
    {
      id: "auto",
      title: "Auto Insurance",
      icon: Car,
      description: "Comprehensive protection for your vehicle with AI-powered damage assessment and transparent claims processing.",
      features: [
        "Collision & comprehensive coverage",
        "Liability protection up to $1M",
        "AI damage assessment technology", 
        "24/7 roadside assistance",
        "Rental car coverage",
        "Uninsured motorist protection"
      ],
      startingPrice: "$45/month",
      popular: true
    },
    {
      id: "home",
      title: "Home Insurance",
      icon: Home,
      description: "Complete protection for your home and belongings with member-focused coverage and no profit margins.",
      features: [
        "Dwelling & personal property coverage",
        "Liability protection",
        "Additional living expenses",
        "Natural disaster coverage",
        "Personal belongings protection",
        "Emergency repairs coverage"
      ],
      startingPrice: "$85/month",
      popular: false
    },
    {
      id: "renters",
      title: "Renters Insurance",
      icon: Shield,
      description: "Affordable protection for your personal belongings and liability coverage for renters.",
      features: [
        "Personal property coverage",
        "Liability protection",
        "Additional living expenses",
        "Medical payments coverage",
        "Identity theft protection",
        "Worldwide coverage"
      ],
      startingPrice: "$15/month",
      popular: false
    },
    {
      id: "umbrella",
      title: "Umbrella Policy",
      icon: Umbrella,
      description: "Extra liability protection that goes beyond your standard auto and home insurance limits.",
      features: [
        "Additional liability coverage",
        "Legal defense costs",
        "Worldwide coverage",
        "Personal injury protection",
        "Property damage coverage",
        "Coverage for libel & slander"
      ],
      startingPrice: "$25/month",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">Insurance Coverage Options</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Choose from our comprehensive insurance products designed for modern life. 
            All policies feature transparent pricing, AI-powered claims processing, and member-focused benefits.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {coverageTypes.map((coverage) => {
            const IconComponent = coverage.icon;
            return (
              <Card key={coverage.id} className={`relative ${coverage.popular ? 'ring-2 ring-primary-500' : ''}`}>
                {coverage.popular && (
                  <Badge className="absolute -top-3 left-6 bg-primary-500 text-white">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-primary-600" />
                      </div>
                      <CardTitle className="text-xl">{coverage.title}</CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-600">Starting at</div>
                      <div className="text-2xl font-bold text-slate-900">{coverage.startingPrice}</div>
                    </div>
                  </div>
                  <p className="text-slate-600">{coverage.description}</p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {coverage.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      className="flex-1"
                      onClick={() => window.location.href = "/calculator"}
                    >
                      Get Quote
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = `/coverage/${coverage.id}`}
                    >
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Why Choose Us Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Why Choose Our Insurance?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Member-Owned</h3>
                <p className="text-slate-600">
                  We're a mutual company owned by our members, not shareholders. 
                  Your premiums go toward claims and operations, not profit margins.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-secondary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI-Powered Claims</h3>
                <p className="text-slate-600">
                  Our advanced AI technology provides faster, more accurate damage assessments, 
                  reducing claim processing time and improving your experience.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Transparent Pricing</h3>
                <p className="text-slate-600">
                  No hidden fees or surprise charges. We provide clear, upfront pricing 
                  with the option to pay using traditional methods or Bitcoin.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-slate-600 mb-8">
            Join thousands of members who trust us with their insurance needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="px-8 py-4"
              onClick={() => window.location.href = "/calculator"}
            >
              Calculate Your Premium
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