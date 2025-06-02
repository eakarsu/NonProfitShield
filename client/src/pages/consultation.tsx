import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Phone, Mail, MessageSquare, Clock } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const consultationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  insuranceType: z.enum(["auto", "home", "both"], {
    required_error: "Please select insurance type",
  }),
  preferredTime: z.enum(["morning", "afternoon", "evening"], {
    required_error: "Please select preferred time",
  }),
  message: z.string().optional(),
});

type ConsultationForm = z.infer<typeof consultationSchema>;

export default function Consultation() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ConsultationForm>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const onSubmit = (data: ConsultationForm) => {
    // In a real app, this would send data to a backend
    console.log("Consultation request:", data);
    setIsSubmitted(true);
    toast({
      title: "Consultation Scheduled",
      description: "We'll contact you within 24 hours to schedule your consultation.",
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-8 w-8 text-secondary-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Consultation Request Received
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              Thank you for your interest in SafeGuard Mutual. Our team will review your request and contact you within 24 hours to schedule your consultation.
            </p>
            
            <div className="bg-white rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-slate-900 mb-4">What happens next?</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600 font-semibold text-xs">1</span>
                  </div>
                  <span>Our insurance specialist will call you to discuss your needs</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600 font-semibold text-xs">2</span>
                  </div>
                  <span>We'll provide personalized coverage recommendations</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600 font-semibold text-xs">3</span>
                  </div>
                  <span>Get your quote and start your application if you're ready</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => window.location.href = "/"}
              size="lg"
              className="bg-primary-500 hover:bg-primary-600"
            >
              Return to Home
            </Button>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Schedule a Consultation</h1>
          <p className="text-xl text-slate-600">
            Speak with one of our insurance specialists to find the perfect coverage for your needs
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Why Schedule a Consultation?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MessageSquare className="h-5 w-5 text-primary-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-slate-900">Personalized Advice</h4>
                    <p className="text-sm text-slate-600">Get recommendations tailored to your specific situation</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-primary-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-slate-900">Expert Guidance</h4>
                    <p className="text-sm text-slate-600">Speak with licensed insurance professionals</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-primary-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-slate-900">No Pressure</h4>
                    <p className="text-sm text-slate-600">Free consultation with no obligation to purchase</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-700">1-800-SAFEGUARD</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-700">support@safeguardmutual.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-700">Mon-Fri 8AM-8PM EST</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Consultation Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Request a Consultation</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="insuranceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Insurance Interest</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select insurance type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="auto">Auto Insurance</SelectItem>
                                <SelectItem value="home">Home Insurance</SelectItem>
                                <SelectItem value="both">Both Auto & Home</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="preferredTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Call Time</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select preferred time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="morning">Morning (8AM-12PM)</SelectItem>
                                <SelectItem value="afternoon">Afternoon (12PM-5PM)</SelectItem>
                                <SelectItem value="evening">Evening (5PM-8PM)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Information (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about your specific insurance needs or any questions you have..."
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" size="lg">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Consultation
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}