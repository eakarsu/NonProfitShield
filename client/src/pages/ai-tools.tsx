import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, MessageCircle, ShieldAlert, ListChecks } from "lucide-react";
import Header from "@/components/layout/header";
import { apiRequest } from "@/lib/queryClient";

type AIResult =
  | { ok: true; data: any }
  | { ok: false; error: string }
  | null;

function ResultBlock({ result }: { result: AIResult }) {
  if (!result) return null;
  if (!result.ok) {
    return (
      <Card className="mt-4 border-destructive/40">
        <CardContent className="pt-6 text-destructive text-sm">{result.error}</CardContent>
      </Card>
    );
  }
  const data = result.data;
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary-500" /> Result
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap text-xs bg-slate-50 p-3 rounded-md overflow-auto max-h-[480px]">
          {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

function ClaimsChatbotTab() {
  const [message, setMessage] = useState("");
  const [claimContext, setClaimContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await apiRequest("POST", "/api/ai/claims-chatbot", {
        message,
        claimContext,
      });
      const data = await res.json();
      setResult({ ok: true, data });
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="message">Question</Label>
        <Textarea
          id="message"
          className="mt-1"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Ask about your claim status, what to submit, or coverage details..."
        />
      </div>
      <div>
        <Label htmlFor="claimContext">Claim Context (optional)</Label>
        <Textarea
          id="claimContext"
          className="mt-1"
          value={claimContext}
          onChange={(e) => setClaimContext(e.target.value)}
          rows={3}
          placeholder="Claim number, incident date, type, current status..."
        />
      </div>
      <Button type="submit" disabled={loading || !message.trim()}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
        {loading ? "Sending..." : "Ask"}
      </Button>
      <ResultBlock result={result} />
    </form>
  );
}

function RiskAssessmentTab() {
  const [orgType, setOrgType] = useState("");
  const [staffCount, setStaffCount] = useState("");
  const [annualBudget, setAnnualBudget] = useState("");
  const [activities, setActivities] = useState("");
  const [historicalClaims, setHistoricalClaims] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const payload: any = {
        orgType,
        staffCount: staffCount ? Number(staffCount) : undefined,
        annualBudget: annualBudget ? Number(annualBudget) : undefined,
        activities: activities
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        historicalClaims: historicalClaims ? Number(historicalClaims) : undefined,
      };
      const res = await apiRequest("POST", "/api/ai/risk-assessment", payload);
      const data = await res.json();
      setResult({ ok: true, data });
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="orgType">Organization Type</Label>
          <Input id="orgType" className="mt-1" value={orgType} onChange={(e) => setOrgType(e.target.value)} placeholder="e.g., Youth Services" />
        </div>
        <div>
          <Label htmlFor="staffCount">Staff Count</Label>
          <Input id="staffCount" type="number" className="mt-1" value={staffCount} onChange={(e) => setStaffCount(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="annualBudget">Annual Budget ($)</Label>
          <Input id="annualBudget" type="number" className="mt-1" value={annualBudget} onChange={(e) => setAnnualBudget(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="historicalClaims">Historical Claim Count</Label>
          <Input id="historicalClaims" type="number" className="mt-1" value={historicalClaims} onChange={(e) => setHistoricalClaims(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="activities">Activities (comma separated)</Label>
        <Textarea id="activities" className="mt-1" value={activities} onChange={(e) => setActivities(e.target.value)} rows={3} placeholder="e.g., transportation, after-school, food service" />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldAlert className="h-4 w-4 mr-2" />}
        {loading ? "Assessing..." : "Assess Risk"}
      </Button>
      <ResultBlock result={result} />
    </form>
  );
}

function CoverageRecommendationTab() {
  const [profile, setProfile] = useState(
    JSON.stringify(
      {
        orgType: "Youth Services",
        staffCount: 25,
        annualBudget: 1200000,
        activities: ["transportation", "after-school programs"],
        currentCoverages: ["general liability"],
      },
      null,
      2
    )
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      let parsed: any;
      try {
        parsed = JSON.parse(profile);
      } catch {
        setResult({ ok: false, error: "Profile must be valid JSON" });
        setLoading(false);
        return;
      }
      const res = await apiRequest("POST", "/api/ai/coverage-recommendation", parsed);
      const data = await res.json();
      setResult({ ok: true, data });
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="profile">Organization Profile (JSON)</Label>
        <Textarea
          id="profile"
          className="mt-1 font-mono text-xs"
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          rows={12}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ListChecks className="h-4 w-4 mr-2" />}
        {loading ? "Analyzing..." : "Recommend Coverage"}
      </Button>
      <ResultBlock result={result} />
    </form>
  );
}

export default function AITools() {
  return (
    <div>
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary-500" /> AI Tools
          </h1>
          <p className="text-sm text-slate-600">
            AI-powered claim help, risk assessment, and coverage recommendations.
          </p>
        </div>

        <Tabs defaultValue="chatbot" className="w-full">
          <TabsList>
            <TabsTrigger value="chatbot">Claims Chatbot</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
            <TabsTrigger value="coverage">Coverage Rec.</TabsTrigger>
          </TabsList>
          <TabsContent value="chatbot" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Claims Q&amp;A</CardTitle>
              </CardHeader>
              <CardContent>
                <ClaimsChatbotTab />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="risk" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk Assessment &amp; Premium Prediction</CardTitle>
              </CardHeader>
              <CardContent>
                <RiskAssessmentTab />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="coverage" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Coverage Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <CoverageRecommendationTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
