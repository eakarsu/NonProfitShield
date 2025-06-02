import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Car, Home, DollarSign, Shield } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const autoCalculatorSchema = z.object({
  vehicleYear: z.number().min(1990).max(new Date().getFullYear() + 1),
  vehicleValue: z.number().min(1000).max(1000000),
  coverageAmount: z.number().min(25000).max(1000000),
  deductible: z.number().min(250).max(5000),
  drivingRecord: z.enum(["excellent", "good", "average", "poor"]),
  annualMileage: z.number().min(1000).max(50000),
});

const homeCalculatorSchema = z.object({
  homeValue: z.number().min(50000).max(5000000),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear()),
  squareFootage: z.number().min(500).max(20000),
  coverageAmount: z.number().min(100000).max(5000000),
  deductible: z.number().min(500).max(10000),
  hasSecuritySystem: z.boolean(),
  hasFireAlarm: z.boolean(),
  constructionType: z.enum(["frame", "masonry", "steel", "concrete"]),
});

type AutoCalculator = z.infer<typeof autoCalculatorSchema>;
type HomeCalculator = z.infer<typeof homeCalculatorSchema>;

export default function Calculator() {
  const [insuranceType, setInsuranceType] = useState<"auto" | "home">("auto");
  const [showResults, setShowResults] = useState(false);
  const [calculatedPremium, setCalculatedPremium] = useState<number>(0);

  const autoForm = useForm<AutoCalculator>({
    resolver: zodResolver(autoCalculatorSchema),
    defaultValues: {
      vehicleYear: new Date().getFullYear(),
      vehicleValue: 25000,
      coverageAmount: 100000,
      deductible: 1000,
      drivingRecord: "good",
      annualMileage: 12000,
    },
  });

  const homeForm = useForm<HomeCalculator>({
    resolver: zodResolver(homeCalculatorSchema),
    defaultValues: {
      homeValue: 300000,
      yearBuilt: 2000,
      squareFootage: 2000,
      coverageAmount: 300000,
      deductible: 1000,
      hasSecuritySystem: false,
      hasFireAlarm: false,
      constructionType: "frame",
    },
  });

  const calculateAutoPremium = (data: AutoCalculator) => {
    let baseRate = data.coverageAmount * 0.0008;
    
    // Age factor
    const vehicleAge = new Date().getFullYear() - data.vehicleYear;
    if (vehicleAge > 10) baseRate += 200;
    else if (vehicleAge > 5) baseRate += 100;
    
    // Value factor
    baseRate += data.vehicleValue * 0.0002;
    
    // Deductible discount
    if (data.deductible >= 2500) baseRate *= 0.85;
    else if (data.deductible >= 1000) baseRate *= 0.9;
    
    // Driving record factor
    switch (data.drivingRecord) {
      case "excellent": baseRate *= 0.8; break;
      case "good": baseRate *= 0.9; break;
      case "average": baseRate *= 1.0; break;
      case "poor": baseRate *= 1.3; break;
    }
    
    // Mileage factor
    if (data.annualMileage > 20000) baseRate *= 1.2;
    else if (data.annualMileage < 5000) baseRate *= 0.85;
    
    return Math.round(baseRate / 12 * 100) / 100; // Monthly premium
  };

  const calculateHomePremium = (data: HomeCalculator) => {
    let baseRate = data.coverageAmount * 0.0006;
    
    // Age factor
    const homeAge = new Date().getFullYear() - data.yearBuilt;
    if (homeAge > 50) baseRate += 300;
    else if (homeAge > 30) baseRate += 150;
    else if (homeAge < 10) baseRate -= 50;
    
    // Size factor
    baseRate += data.squareFootage * 0.1;
    
    // Deductible discount
    if (data.deductible >= 5000) baseRate *= 0.8;
    else if (data.deductible >= 2500) baseRate *= 0.9;
    
    // Safety features
    if (data.hasSecuritySystem) baseRate *= 0.9;
    if (data.hasFireAlarm) baseRate *= 0.95;
    
    // Construction type
    switch (data.constructionType) {
      case "masonry": baseRate *= 0.85; break;
      case "steel": baseRate *= 0.9; break;
      case "concrete": baseRate *= 0.8; break;
      case "frame": baseRate *= 1.0; break;
    }
    
    return Math.round(baseRate / 12 * 100) / 100; // Monthly premium
  };

  const onSubmitAuto = (data: AutoCalculator) => {
    const premium = calculateAutoPremium(data);
    setCalculatedPremium(premium);
    setShowResults(true);
  };

  const onSubmitHome = (data: HomeCalculator) => {
    const premium = calculateHomePremium(data);
    setCalculatedPremium(premium);
    setShowResults(true);
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Your Estimated Premium</h1>
            <p className="text-xl text-slate-600">
              Here's your personalized insurance quote
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="h-8 w-8 text-secondary-600" />
              </div>
              
              <div className="text-4xl font-bold text-slate-900 mb-2">
                ${calculatedPremium}/month
              </div>
              
              <div className="text-lg text-slate-600 mb-6">
                {insuranceType.charAt(0).toUpperCase() + insuranceType.slice(1)} Insurance Premium
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-primary-500 hover:bg-primary-600"
                  onClick={() => window.location.href = "/api/login"}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Get This Coverage
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => setShowResults(false)}
                >
                  Recalculate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What's Included</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900">Coverage Benefits</h4>
                  <ul className="space-y-2 text-slate-600">
                    <li>• Comprehensive damage protection</li>
                    <li>• 24/7 claims processing</li>
                    <li>• AI-powered damage assessment</li>
                    <li>• Nationwide coverage</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900">Member Benefits</h4>
                  <ul className="space-y-2 text-slate-600">
                    <li>• No profit margins or hidden fees</li>
                    <li>• Bitcoin payment options</li>
                    <li>• Transparent claims process</li>
                    <li>• Member-owned mutual company</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
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
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Premium Calculator</h1>
          <p className="text-xl text-slate-600">
            Get an instant estimate for your insurance premium
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
                  <Calculator className="h-5 w-5" />
                  <span>Auto Insurance Calculator</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...autoForm}>
                  <form onSubmit={autoForm.handleSubmit(onSubmitAuto)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={autoForm.control}
                        name="vehicleYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Year</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1990" 
                                max={new Date().getFullYear() + 1}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={autoForm.control}
                        name="vehicleValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Value ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="1000"
                                max="1000000"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={autoForm.control}
                        name="coverageAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coverage Amount ($)</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
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
                            <FormLabel>Deductible ($)</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="250">$250</SelectItem>
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

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={autoForm.control}
                        name="drivingRecord"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Driving Record</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="excellent">Excellent (No incidents)</SelectItem>
                                <SelectItem value="good">Good (Minor incidents)</SelectItem>
                                <SelectItem value="average">Average (Some incidents)</SelectItem>
                                <SelectItem value="poor">Poor (Multiple incidents)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={autoForm.control}
                        name="annualMileage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Mileage</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="1000"
                                max="50000"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      <Calculator className="mr-2 h-4 w-4" />
                      Calculate Auto Premium
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
                  <Calculator className="h-5 w-5" />
                  <span>Home Insurance Calculator</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...homeForm}>
                  <form onSubmit={homeForm.handleSubmit(onSubmitHome)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={homeForm.control}
                        name="homeValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Home Value ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="50000"
                                max="5000000"
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
                        name="yearBuilt"
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
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={homeForm.control}
                        name="squareFootage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Square Footage</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="500"
                                max="20000"
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
                        name="coverageAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coverage Amount ($)</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
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
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      <Calculator className="mr-2 h-4 w-4" />
                      Calculate Home Premium
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