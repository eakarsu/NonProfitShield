import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Edit, Brain, DollarSign, Wrench, AlertTriangle } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

interface DamageAssessmentProps {
  assessment: {
    damageType: string;
    severity: "minor" | "moderate" | "major" | "total";
    affectedComponents: string[];
    repairComplexity: "simple" | "moderate" | "complex";
    estimatedCost: {
      parts: number;
      labor: number;
      total: number;
    };
    confidence: number;
    description: string;
    recommendations: string[];
  };
  onComplete: () => void;
}

export default function DamageAssessment({ assessment, onComplete }: DamageAssessmentProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minor":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "major":
        return "bg-orange-100 text-orange-800";
      case "total":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "simple":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "complex":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">AI Damage Assessment Complete</h1>
          <p className="text-xl text-slate-600">
            Our AI has analyzed your damage photos and generated a comprehensive assessment
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                  <Brain className="h-5 w-5 text-secondary-600" />
                </div>
                <span>AI Analysis Results</span>
              </div>
              <Badge className={`${getConfidenceColor(assessment.confidence)} bg-transparent border`}>
                {Math.round(assessment.confidence * 100)}% Confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Assessment Overview */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Damage Assessment</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Damage Type</span>
                    <span className="font-medium text-slate-900">{assessment.damageType}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Severity Level</span>
                    <Badge className={getSeverityColor(assessment.severity)}>
                      {assessment.severity.charAt(0).toUpperCase() + assessment.severity.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Repair Complexity</span>
                    <Badge className={getComplexityColor(assessment.repairComplexity)}>
                      {assessment.repairComplexity.charAt(0).toUpperCase() + assessment.repairComplexity.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Cost Estimation</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Parts</span>
                    <span className="font-medium text-slate-900">
                      ${assessment.estimatedCost.parts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Labor</span>
                    <span className="font-medium text-slate-900">
                      ${assessment.estimatedCost.labor.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-600 font-medium">Total Estimate</span>
                    <span className="font-bold text-xl text-slate-900">
                      ${assessment.estimatedCost.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Affected Components */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Affected Components</h3>
              <div className="flex flex-wrap gap-2">
                {assessment.affectedComponents.map((component, index) => (
                  <Badge key={index} variant="outline" className="bg-slate-50">
                    <Wrench className="h-3 w-3 mr-1" />
                    {component}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Damage Description</h3>
              <p className="text-slate-700 bg-slate-50 rounded-lg p-4">
                {assessment.description}
              </p>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Recommendations</h3>
              <div className="space-y-2">
                {assessment.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-blue-800 text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
              <Button 
                onClick={onComplete}
                className="flex-1 bg-primary-500 hover:bg-primary-600"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve & Submit Claim
              </Button>
              <Button 
                variant="outline"
                onClick={onComplete}
                className="flex-1"
              >
                <Edit className="mr-2 h-4 w-4" />
                Request Manual Review
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Disclaimer */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-slate-600">
                <p className="font-medium mb-1">AI Assessment Disclaimer</p>
                <p>
                  This assessment is generated by artificial intelligence and should be used as an initial estimate. 
                  Final repair costs may vary based on additional factors discovered during inspection. 
                  All claims are subject to policy terms and conditions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
