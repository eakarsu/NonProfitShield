import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useSearch } from "wouter";
import { claimSubmissionSchema, type ClaimSubmission } from "@shared/schema";
import { Camera, Upload, X, CheckCircle } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DamageAssessment from "@/components/ai/damage-assessment";
import { claimExamples } from "@/lib/claim-presets";
import type { DamageAssessment as Assessment } from "@shared/claim-assessment";

export default function SubmitClaim() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentData, setAssessmentData] = useState<Assessment | null>(null);
  const [savedClaimId, setSavedClaimId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const active = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const previews = useRef<string[]>([]);
  const fileInput = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.abort();
      previews.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);
  
  const [, setLocation] = useLocation();
  const search = useSearch();
  const examples = useMemo(() => claimExamples(), []);
  const demo = examples.find((example) => example.id === new URLSearchParams(search).get("demo"));
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: policiesData, isLoading: policiesLoading, error: policiesError, refetch: retryPolicies } = useQuery<any>({
    queryKey: ["/api/policies"],
  });
  const policyRows = Array.isArray(policiesData) ? policiesData : policiesData?.data;
  const invalidPolicies = !policiesLoading && !policiesError && !Array.isArray(policyRows);
  const savedPolicies = Array.isArray(policyRows) ? policyRows : [];
  const activePolicies = savedPolicies.filter((policy: any) => policy.status === "active");
  const policyLoadError = policiesError instanceof Error ? policiesError.message : policiesError ? 'Could not load your saved policies.' : invalidPolicies ? 'Saved policies returned an invalid response.' : '';

  const form = useForm<ClaimSubmission>({
    resolver: zodResolver(claimSubmissionSchema),
    defaultValues: {
      title: demo?.title ?? "",
      description: demo?.description ?? "",
      incidentDate: demo?.incidentDate ?? "",
      images: [],
    },
  });

  const selectedPolicyId = form.watch("policyId");
  const selectedPolicy = savedPolicies.find((policy: any) => policy.id === selectedPolicyId);

  const fillExample = (example: ReturnType<typeof claimExamples>[number]) => {
    if (!form.getValues("policyId") && savedPolicies[0]?.id) {
      form.setValue("policyId", savedPolicies[0].id, { shouldValidate: true, shouldDirty: true });
    }
    form.setValue("title", example.title, { shouldValidate: true, shouldDirty: true });
    form.setValue("description", example.description, { shouldValidate: true, shouldDirty: true });
    form.setValue("incidentDate", example.incidentDate, { shouldValidate: true, shouldDirty: true });
    const source = savedPolicies.find((policy: any) => policy.id === (form.getValues("policyId") || savedPolicies[0]?.id));
    setNotice(source
      ? `Example filled from blank. Saved policy #${source.id} is referenced and any prior policy or uploaded photos were preserved. Upload actual damage photos${source.status === "active" ? " before generating." : "; this saved policy is not active, so generation remains unavailable."}`
      : "Example filled from blank. Add a saved active policy and your actual damage photos before generating.");
  };

  useEffect(() => {
    if (demo && !policiesLoading && savedPolicies[0]?.id && !form.getValues("policyId")) {
      form.setValue("policyId", savedPolicies[0].id, { shouldValidate: true, shouldDirty: true });
      setNotice(`Example opened with saved policy #${savedPolicies[0].id} referenced. Review the example and upload only actual damage photos.`);
    }
  }, [demo?.id, policiesLoading, savedPolicies[0]?.id]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length + selectedFiles.length > 10 || files.some((file) => !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) || file.size > 10 * 1024 * 1024)) {
      toast({ title: "Check the photos", description: "Use up to 10 JPEG, PNG, WebP, or GIF photos, each up to 10 MB.", variant: "destructive" });
      return;
    }
    const nextFiles = [...selectedFiles, ...files];
    const nextUrls = [...previewUrls, ...files.map((file) => URL.createObjectURL(file))];
    setSelectedFiles(nextFiles);
    setPreviewUrls(nextUrls);
    previews.current = nextUrls;
    // Only file names are needed for form validation. Actual File objects are
    // submitted as multipart; a preset cannot invent or replace uploaded images.
    form.setValue("images", nextFiles.map((file) => file.name), { shouldValidate: true });
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    const nextFiles = selectedFiles.filter((_, i) => i !== index);
    const nextUrls = previewUrls.filter((_, i) => i !== index);
    setSelectedFiles(nextFiles);
    setPreviewUrls(nextUrls);
    previews.current = nextUrls;
    form.setValue("images", nextFiles.map((file) => file.name), { shouldValidate: true });
  };

  const cancelSubmission = () => {
    active.current?.abort();
    active.current = null;
    setPending(false);
    setNotice("Submission cancelled. Check Claims for any submission that completed before cancellation.");
  };

  const onSubmit = async (data: ClaimSubmission) => {
    if (active.current || !selectedFiles.length) return;
    if (policiesLoading || policyLoadError || !savedPolicies.some((policy: any) => policy.id === data.policyId)) {
      setNotice('Load and select one of your saved policies before generating.');
      return;
    }
    if (!activePolicies.some((policy: any) => policy.id === data.policyId)) {
      setNotice('The selected saved policy is not active. Generation is unavailable until an authorized active policy is selected.');
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setPending(true);
    setNotice("");
    const formData = new FormData();
    formData.append("policyId", String(data.policyId));
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("incidentDate", data.incidentDate);
    selectedFiles.forEach((file) => formData.append("images", file));
    try {
      const response = await fetch("/api/claims", { method: "POST", body: formData, credentials: "include", signal: controller.signal });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof result?.message === "string" ? result.message : "Claim submission failed. Try again.");
      if (!mounted.current || controller.signal.aborted || active.current !== controller) return;
      if (!result?.aiAssessment || !result?.id) throw new Error("The saved claim did not include an assessment. Check Claims before trying again.");
      setAssessmentData(result.aiAssessment);
      setSavedClaimId(result.id);
      setShowAssessment(true);
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      toast({ title: "Claim submitted", description: "The assessment was saved with your claim. Coverage and approval remain subject to review." });
    } catch (error) {
      if (!mounted.current || controller.signal.aborted || active.current !== controller) return;
      setNotice(error instanceof Error ? error.message : "Claim submission failed.");
    } finally {
      if (mounted.current && active.current === controller) {
        active.current = null;
        setPending(false);
      }
    }
  };

  const handleAssessmentComplete = () => {
    setShowAssessment(false);
    queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
    setLocation("/claims");
  };

  if (showAssessment && assessmentData) {
    return (
      <DamageAssessment 
        assessment={assessmentData}
        claimId={savedClaimId ?? undefined}
        onComplete={handleAssessmentComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Submit Insurance Claim</h1>
          <p className="text-xl text-slate-600">
            Upload actual damage photos and claim details for an OpenRouter image assessment
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Claim Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>

            {notice && <p role="status" className="mb-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-800">{notice}</p>}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <section aria-labelledby="claim-demo-title" className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4 sm:p-5">
              <h2 id="claim-demo-title" className="font-semibold text-slate-900">Demo AI — fill the complete claim form</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">Each button fills the claim title, description and incident date and, when blank, references your first saved policy. Review every example detail before generating.</p>
              <div className="my-4 grid gap-2 sm:grid-cols-3">
                {examples.map((example) => <Button key={example.id} type="button" variant="outline" className="h-auto min-h-11 whitespace-normal border-teal-300 bg-white px-3 py-3 text-teal-900 hover:bg-teal-100" disabled={pending} onClick={() => fillExample(example)}>{example.label}</Button>)}
              </div>
              <p className="text-sm font-medium text-slate-800">Still required: upload your own damage photos. Demo AI preserves any selected saved policy and uploaded photos; only an authorized active policy can be submitted.</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">When ready, use Generate with OpenRouter &amp; submit claim below. It sends your reviewed details and actual photographs to OpenRouter and saves a successful assessment.</p>
              {demo && <p className="mt-2 text-sm font-medium text-teal-800">{demo.label} loaded from AI Tools. Review the filled fields below.</p>}
            </section>
                {policiesLoading && <p role="status">Loading your saved policies…</p>}
                {policyLoadError && <div role="alert">{policyLoadError} <Button type="button" variant="outline" onClick={() => void retryPolicies()}>Retry saved policies</Button></div>}
                {!policiesLoading && !policyLoadError && !savedPolicies.length && <p>No saved policies are available. Add an authorized active policy before generating a claim assessment.</p>}
                {!policiesLoading && !policyLoadError && savedPolicies.length > 0 && !activePolicies.length && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Your saved policy records are training drafts. Examples can reference them, but OpenRouter generation and claim submission remain disabled until an authorized active policy exists.</p>}
                {/* Policy Selection */}
                <FormField
                  control={form.control}
                  name="policyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Policy</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} disabled={pending} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose the policy for this claim" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {savedPolicies.map((policy: any) => (
                            <SelectItem key={policy.id} value={policy.id.toString()}>
                              Policy #{policy.id} · {policy.type.charAt(0).toUpperCase() + policy.type.slice(1)} Insurance{" - "}
                              ${parseFloat(policy.coverageAmount).toLocaleString()} Coverage · {String(policy.status).replaceAll("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Basic Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Claim Title</FormLabel>
                        <FormControl>
                          <Input disabled={pending} placeholder="e.g., Auto collision damage" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incidentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Date</FormLabel>
                        <FormControl>
                          <Input disabled={pending} type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea disabled={pending}
                          placeholder="Please describe what happened and the extent of the damage..."
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image Upload */}
                <div className="space-y-4">
                  <FormLabel>Damage Photos</FormLabel>
                  
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-600 mb-2">Upload Damage Photos</p>
                    <p className="text-sm text-slate-500 mb-4">
                      Upload clear photos of the damage from multiple angles (max 10 images)
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      ref={fileInput}
                      disabled={pending}
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button type="button" disabled={pending} onClick={() => fileInput.current?.click()} className="cursor-pointer">
                        Choose Files
                      </Button>
                    </label>
                  </div>

                  {/* Image Previews */}
                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-slate-200"
                          />
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button 
                    type="submit" 
                    className="h-auto min-h-11 whitespace-normal px-3 py-3 sm:flex-1"
                    disabled={pending || policiesLoading || Boolean(policyLoadError) || selectedPolicy?.status !== "active" || selectedFiles.length === 0}
                  >
                    {pending ? (
                      "Analyzing with OpenRouter…"
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Generate with OpenRouter & submit claim
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={pending ? cancelSubmission : () => setLocation("/claims")}>Cancel</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
