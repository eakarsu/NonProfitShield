import { useState } from "react";
import { Button } from "@/components/ui/button";
import { damageAssessmentText, assessmentContextChanged, type DamageAssessment } from "@shared/claim-assessment";

export default function AssessmentActions({ assessment, currentClaim }: { assessment: DamageAssessment; currentClaim?: { title: string; description: string; incidentDate: string | Date } }) {
  const [notice, setNotice] = useState("");
  const inputs = assessment.providerReceipt?.submittedInputs;
  const changed = currentClaim ? assessmentContextChanged(assessment, currentClaim) : false;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(damageAssessmentText(assessment, currentClaim));
      setNotice("Assessment copied.");
    } catch { setNotice("Copy is unavailable here. Download the readable report instead."); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([damageAssessmentText(assessment, currentClaim)], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "damage-assessment.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  return <div className="space-y-2">
    {changed === true && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Claim details changed after analysis. This assessment describes the original submitted inputs below.</p>}
    {!inputs && <p className="text-sm text-slate-600">Original claim details were not retained for this older assessment. Current claim details may differ.</p>}
    {inputs && <details className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
      <summary className="cursor-pointer font-medium">Original inputs used for this assessment</summary>
      <dl className="mt-3 space-y-2">
        <div><dt className="font-medium">Claim title</dt><dd>{inputs.title}</dd></div>
        <div><dt className="font-medium">Incident date</dt><dd>{inputs.incidentDate}</dd></div>
        <div><dt className="font-medium">Claim description</dt><dd className="whitespace-pre-wrap">{inputs.description}</dd></div>
      </dl>
    </details>}
    {assessment.providerReceipt && <p className="text-sm text-slate-500">OpenRouter · {assessment.providerReceipt.model} · {new Date(assessment.providerReceipt.generatedAt).toLocaleString()}</p>}
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={copy}>Copy report</Button>
      <Button type="button" variant="outline" onClick={download}>Download report</Button>
    </div>
    {notice && <p role="status" className="text-sm text-slate-600">{notice}</p>}
  </div>;
}
