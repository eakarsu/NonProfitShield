import { Link, useLocation } from "wouter";
import { Camera, ClipboardList, ArrowRight, Sparkles } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { claimExamples } from "@/lib/claim-presets";
import { operationsExamples } from "@/lib/operations-presets";

export default function AITools() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-teal-700"><Sparkles className="h-4 w-4" /> AI Tools</div>
          <h1 className="text-3xl font-bold text-slate-900">Prepare, generate and review your AI report</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">Choose a Demo AI button to open a working tool with every editable AI field filled. Review the example, add your actual information, then use its separate Generate button for an OpenRouter response.</p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3"><Camera className="h-6 w-6 text-teal-700" /> Claim photo assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="leading-7 text-slate-600">Assess visible damage in your actual photographs. A successful assessment is saved with your claim and its original submitted details for human review.</p>
              <section aria-labelledby="claim-tool-demo" className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                <h2 id="claim-tool-demo" className="font-semibold text-slate-900">Demo AI — fill all claim AI fields</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">Fills title, description and incident date and references your first saved policy when the form is blank. It preserves an existing policy choice and actual uploads; only an authorized active policy can be submitted.</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {claimExamples().map(example => <Button key={example.id} type="button" variant="outline" className="h-auto min-h-11 whitespace-normal border-teal-300 bg-white px-3 py-3 text-teal-900 hover:bg-teal-100" onClick={() => setLocation(`/submit-claim?demo=${example.id}`)}>{example.label}</Button>)}
                </div>
              </section>
              <div className="flex flex-wrap items-center gap-4">
                <Button asChild><Link href="/submit-claim">Open claim AI <ArrowRight className="h-4 w-4" /></Link></Button>
                <Link href="/claims" className="text-sm font-medium text-teal-800 underline underline-offset-4">View saved claims</Link>
              </div>
              <p className="text-sm leading-6 text-slate-500">Saved claims open in a centered report with readable Copy/Download and supported Edit, Delete and Cancel controls. Coverage and payments remain subject to authorized review.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3"><ClipboardList className="h-6 w-6 text-teal-700" /> Nonprofit operations advisory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="leading-7 text-slate-600">Prepare an evidence-aware operational report about responsibilities, documentation or a handoff. Use your existing native AI workspace account to access its owned report history.</p>
              <section aria-labelledby="operations-tool-demo" className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                <h2 id="operations-tool-demo" className="font-semibold text-slate-900">Demo AI — fill the complete prompt</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">Fills the entire prompt and context. Examples disclose missing records and never grant consent or approval.</p>
                <div className="mt-4 grid gap-2">
                  {operationsExamples.map(example => <Button key={example.id} type="button" variant="outline" className="h-auto min-h-11 whitespace-normal border-teal-300 bg-white px-3 py-3 text-teal-900 hover:bg-teal-100" onClick={() => setLocation(`/ai-operations?demo=${example.id}`)}>{example.label}</Button>)}
                </div>
              </section>
              <Button asChild><Link href="/ai-operations">Open operations AI <ArrowRight className="h-4 w-4" /></Link></Button>
              <p className="text-sm leading-6 text-slate-500">Generate with OpenRouter is available after verified AI workspace sign-in. Cancel stops a pending request. Saved provider evidence stays retained; Edit inputs prepares a new advisory.</p>
            </CardContent>
          </Card>
        </div>

        <aside className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600">
          <h2 className="font-semibold text-slate-900">Available AI services</h2>
          <p className="mt-2">This page opens the supported claim photo assessment and operations advisory. Earlier chatbot, risk-scoring and coverage-recommendation prototypes are unavailable. Organization permissions, program consent, coverage decisions and approval requirements stay in their existing authorized workflows.</p>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
