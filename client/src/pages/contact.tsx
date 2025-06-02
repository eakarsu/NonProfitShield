import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Mail, MapPin, Clock, MessageCircle, HeadphonesIcon } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.enum(["general", "claims", "billing", "technical", "feedback"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contact() {
  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "general",
      message: "",
    },
  });

  const onSubmit = (data: ContactForm) => {
    console.log("Contact form submitted:", data);
    // Here you would typically send the data to your backend
    alert("Thank you for your message! We'll get back to you within 24 hours.");
    form.reset();
  };

  const contactMethods = [
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak with our support team",
      value: "1-800-INSURE-1",
      hours: "Mon-Fri: 8 AM - 8 PM EST",
      color: "primary"
    },
    {
      icon: Mail,
      title: "Email Support", 
      description: "Send us an email",
      value: "support@insuranceplatform.com",
      hours: "Response within 24 hours",
      color: "secondary"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with us online",
      value: "Available on website",
      hours: "Mon-Fri: 9 AM - 6 PM EST",
      color: "green"
    },
    {
      icon: HeadphonesIcon,
      title: "Claims Hotline",
      description: "24/7 claims reporting",
      value: "1-800-CLAIMS-1",
      hours: "Available 24/7",
      color: "red"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">Contact & Support</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            We're here to help! Reach out to our support team for any questions about 
            coverage, claims, or general inquiries.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send Us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general">General Inquiry</SelectItem>
                              <SelectItem value="claims">Claims Support</SelectItem>
                              <SelectItem value="billing">Billing Question</SelectItem>
                              <SelectItem value="technical">Technical Issue</SelectItem>
                              <SelectItem value="feedback">Feedback</SelectItem>
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
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="How can we help you?"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" size="lg">
                    Send Message
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-slate-600" />
                    <div>
                      <div className="font-medium">Headquarters</div>
                      <div className="text-slate-600">123 Insurance Blvd, Suite 100<br />New York, NY 10001</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-slate-600" />
                    <div>
                      <div className="font-medium">Business Hours</div>
                      <div className="text-slate-600">Monday - Friday: 8:00 AM - 8:00 PM EST<br />Saturday: 9:00 AM - 5:00 PM EST</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.location.href = "/claims"}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    File a Claim
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.location.href = "/payment"}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Payment Support
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.location.href = "/consultation"}
                  >
                    <HeadphonesIcon className="mr-2 h-4 w-4" />
                    Schedule Consultation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Methods Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactMethods.map((method, index) => {
            const IconComponent = method.icon;
            const colorClasses = {
              primary: "bg-primary-100 text-primary-600",
              secondary: "bg-secondary-100 text-secondary-600", 
              green: "bg-green-100 text-green-600",
              red: "bg-red-100 text-red-600"
            };

            return (
              <Card key={index}>
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${colorClasses[method.color as keyof typeof colorClasses]}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{method.title}</h3>
                  <p className="text-sm text-slate-600 mb-2">{method.description}</p>
                  <p className="font-medium text-slate-900 mb-1">{method.value}</p>
                  <p className="text-xs text-slate-500">{method.hours}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">How quickly are claims processed?</h4>
                  <p className="text-slate-600 text-sm">Most claims are processed within 24-48 hours using our AI assessment technology.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Can I pay with Bitcoin?</h4>
                  <p className="text-slate-600 text-sm">Yes! We accept Bitcoin payments for premiums and offer traditional payment methods as well.</p>
                </div>
                <div>
                  <h4 className="font-semibent text-slate-900 mb-2">What makes you different from other insurers?</h4>
                  <p className="text-slate-600 text-sm">We're a member-owned mutual company with no profit margins, transparent operations, and AI-powered claims.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">How do I get a quote?</h4>
                  <p className="text-slate-600 text-sm">Use our online calculator for instant estimates or schedule a consultation for personalized quotes.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Is my data secure?</h4>
                  <p className="text-slate-600 text-sm">Yes, we use enterprise-grade encryption and security measures to protect all member data.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Do you offer 24/7 support?</h4>
                  <p className="text-slate-600 text-sm">Our claims hotline is available 24/7. General support is available Monday-Friday 8 AM - 8 PM EST.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}