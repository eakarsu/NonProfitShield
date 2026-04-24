import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { claimSubmissionSchema, type ClaimSubmission } from "@shared/schema";
import { Camera, Upload, X, CheckCircle } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DamageAssessment from "@/components/ai/damage-assessment";

export default function SubmitClaim() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentData, setAssessmentData] = useState(null);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: policiesData } = useQuery<any>({
    queryKey: ["/api/policies"],
  });
  const policies = Array.isArray(policiesData) ? policiesData : policiesData?.data || [];

  const form = useForm<ClaimSubmission>({
    resolver: zodResolver(claimSubmissionSchema),
    defaultValues: {
      title: "",
      description: "",
      incidentDate: "",
      images: [],
    },
  });

  const claimMutation = useMutation({
    mutationFn: async (data: ClaimSubmission & { files: File[] }) => {
      const formData = new FormData();
      
      // Add form fields
      formData.append("policyId", data.policyId.toString());
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("incidentDate", data.incidentDate);
      
      // Add image files
      data.files.forEach(file => {
        formData.append("images", file);
      });

      const response = await fetch("/api/claims", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Claim Submitted",
        description: "Your claim has been successfully submitted and is being processed.",
      });
      
      // Show AI assessment if available
      if (data.aiAssessment) {
        setAssessmentData(data.aiAssessment);
        setShowAssessment(true);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
        setLocation("/claims");
      }
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length + selectedFiles.length > 10) {
      toast({
        title: "Too Many Files",
        description: "You can upload a maximum of 10 images.",
        variant: "destructive",
      });
      return;
    }

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    
    setSelectedFiles(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    
    // Update form with base64 data URLs for validation
    const reader = new FileReader();
    const promises = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(promises).then(dataUrls => {
      const currentImages = form.getValues("images") || [];
      form.setValue("images", [...currentImages, ...dataUrls]);
    });
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    
    const currentImages = form.getValues("images") || [];
    form.setValue("images", currentImages.filter((_, i) => i !== index));
  };

  const onSubmit = (data: ClaimSubmission) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Images Required",
        description: "Please upload at least one image of the damage.",
        variant: "destructive",
      });
      return;
    }

    claimMutation.mutate({
      ...data,
      policyId: parseInt(data.policyId as any),
      files: selectedFiles,
    });
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
            Upload photos and details of your damage for instant AI assessment
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Policy Selection */}
                <FormField
                  control={form.control}
                  name="policyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Policy</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose the policy for this claim" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {policies?.map((policy: any) => (
                            <SelectItem key={policy.id} value={policy.id.toString()}>
                              {policy.type.charAt(0).toUpperCase() + policy.type.slice(1)} Insurance - 
                              ${parseFloat(policy.coverageAmount).toLocaleString()} Coverage
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
                          <Input placeholder="e.g., Auto collision damage" {...field} />
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
                          <Input type="date" {...field} />
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
                        <Textarea 
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
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button type="button" className="cursor-pointer">
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

                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={claimMutation.isPending || selectedFiles.length === 0}
                  >
                    {claimMutation.isPending ? (
                      "Processing..."
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Submit Claim for AI Analysis
                      </>
                    )}
                  </Button>
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
