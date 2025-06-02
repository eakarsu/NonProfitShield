import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { autoInsuranceSchema, homeInsuranceSchema, type AutoInsurance, type HomeInsurance } from "@shared/schema";
import { Car, Home, Shield, DollarSign } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function Enrollment() {
  const [insuranceType, setInsuranceType] = useState<"auto" | "home">("auto");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const autoForm = useForm<AutoInsurance>({
    resolver: zodResolver(autoInsuranceSchema),
    defaultValues: {
      type: "auto",
      coverageAmount: "50000",
      deductible: "500",
      vehicleInfo: {
        make: "",
        model: "",
        year: new Date().getFullYear(),
        vin: "",
        mileage: 0,
        primaryUse: "personal",
      },
    },
  });

  const homeForm = useForm<HomeInsurance>({
    resolver: zodResolver(homeInsuranceSchema),
    defaultValues: {
      type: "home",
      coverageAmount: "200000",
      deductible: "1000",
      propertyInfo: {
        address: "",
        yearBuilt: 2000,
        squareFootage: 1500,
        propertyType: "single_family",
        constructionType: "frame",
        roofType: "shingle",
        hasSecuritySystem: false,
        hasFireAlarm: false,
      },
    },
  });

  const enrollmentMutation = useMutation({
    mutationFn: async (data: AutoInsurance | HomeInsurance) => {
      await apiRequest("POST", "/api/policies", data);
    },
    onSuccess: () => {
      toast({
        title: "Policy Created",
        description: "Your insurance policy has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitAuto = (data: AutoInsurance) => {
    enrollmentMutation.mutate(data);
  };

  const onSubmitHome = (data: HomeInsurance) => {
    enrollmentMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Get Insurance Coverage</h1>
          <p className="text-xl text-slate-600">
            Choose the type of coverage that's right for you
          </p>
        </div>

        <Tabs value={insuranceType} onValueChange={(value) => setInsuranceType(value as "auto" | "home")}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="auto" className="flex items-center space-x-2">
              <Car className="h-4 w-4" />
              <span>Auto Insurance</span>
            </TabsTrigger>
            <TabsTrigger value="home" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Home Insurance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5" />
                  <span>Auto Insurance Application</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...autoForm}>
                  <form onSubmit={autoForm.handleSubmit(onSubmitAuto)} className="space-y-6">
                    {/* Coverage Options */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={autoForm.control}
                        name="coverageAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coverage Amount</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select coverage amount" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="25000">$25,000</SelectItem>
                                <SelectItem value="50000">$50,000</SelectItem>
                                <SelectItem value="100000">$100,000</SelectItem>
                                <SelectItem value="250000">$250,000</SelectItem>
                                <SelectItem value="500000">$500,000</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={autoForm.control}
                        name="deductible"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deductible</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select deductible" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="250">$250</SelectItem>
                                <SelectItem value="500">$500</SelectItem>
                                <SelectItem value="1000">$1,000</SelectItem>
                                <SelectItem value="2500">$2,500</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Vehicle Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900">Vehicle Information</h3>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <FormField
                          control={autoForm.control}
                          name="vehicleInfo.make"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Make</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Toyota" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={autoForm.control}
                          name="vehicleInfo.model"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Model</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Camry" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={autoForm.control}
                          name="vehicleInfo.year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Year</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1900" 
                                  max={new Date().getFullYear() + 1}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={autoForm.control}
                          name="vehicleInfo.vin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>VIN (17 characters)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="1HGBH41JXMN109186" 
                                  maxLength={17}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={autoForm.control}
                          name="vehicleInfo.mileage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mileage</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={autoForm.control}
                        name="vehicleInfo.primaryUse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Use</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select primary use" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="personal">Personal</SelectItem>
                                <SelectItem value="business">Business</SelectItem>
                                <SelectItem value="pleasure">Pleasure</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={enrollmentMutation.isPending}
                    >
                      {enrollmentMutation.isPending ? "Creating Policy..." : "Get Auto Coverage"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="home">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Home className="h-5 w-5" />
                  <span>Home Insurance Application</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...homeForm}>
                  <form onSubmit={homeForm.handleSubmit(onSubmitHome)} className="space-y-6">
                    {/* Coverage Options */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={homeForm.control}
                        name="coverageAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coverage Amount</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select coverage amount" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="100000">$100,000</SelectItem>
                                <SelectItem value="200000">$200,000</SelectItem>
                                <SelectItem value="300000">$300,000</SelectItem>
                                <SelectItem value="500000">$500,000</SelectItem>
                                <SelectItem value="1000000">$1,000,000</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={homeForm.control}
                        name="deductible"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deductible</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select deductible" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="500">$500</SelectItem>
                                <SelectItem value="1000">$1,000</SelectItem>
                                <SelectItem value="2500">$2,500</SelectItem>
                                <SelectItem value="5000">$5,000</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Property Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900">Property Information</h3>
                      
                      <FormField
                        control={homeForm.control}
                        name="propertyInfo.address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St, City, State 12345" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-3 gap-4">
                        <FormField
                          control={homeForm.control}
                          name="propertyInfo.yearBuilt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Year Built</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1800" 
                                  max={new Date().getFullYear()}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={homeForm.control}
                          name="propertyInfo.squareFootage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Square Footage</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={homeForm.control}
                          name="propertyInfo.propertyType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Property Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select property type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="single_family">Single Family</SelectItem>
                                  <SelectItem value="condo">Condo</SelectItem>
                                  <SelectItem value="townhouse">Townhouse</SelectItem>
                                  <SelectItem value="multi_family">Multi Family</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={homeForm.control}
                          name="propertyInfo.constructionType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Construction Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select construction type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="frame">Frame</SelectItem>
                                  <SelectItem value="masonry">Masonry</SelectItem>
                                  <SelectItem value="steel">Steel</SelectItem>
                                  <SelectItem value="concrete">Concrete</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={homeForm.control}
                          name="propertyInfo.roofType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Roof Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select roof type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="shingle">Shingle</SelectItem>
                                  <SelectItem value="tile">Tile</SelectItem>
                                  <SelectItem value="metal">Metal</SelectItem>
                                  <SelectItem value="flat">Flat</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={homeForm.control}
                          name="propertyInfo.hasSecuritySystem"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Security System</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Property has a monitored security system
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={homeForm.control}
                          name="propertyInfo.hasFireAlarm"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Fire Alarm System</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Property has a fire alarm system
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={enrollmentMutation.isPending}
                    >
                      {enrollmentMutation.isPending ? "Creating Policy..." : "Get Home Coverage"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
