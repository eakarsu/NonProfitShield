import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bitcoin, CreditCard, Clock, CheckCircle, QrCode } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import BitcoinPayment from "@/components/payment/bitcoin-payment";

export default function Payment() {
  const [selectedPolicy, setSelectedPolicy] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: policies } = useQuery<any>({
    queryKey: ["/api/policies"],
  });

  const { data: payments } = useQuery<any>({
    queryKey: ["/api/payments"],
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Created",
        description: "Your payment has been set up. Please complete the Bitcoin transaction.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    },
    onError: (error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePayPremium = (policyId: number, amount: string) => {
    createPaymentMutation.mutate({
      policyId,
      type: "premium",
      amount,
      paymentMethod: "bitcoin",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "confirmed": return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const paymentsList = Array.isArray(payments) ? payments : payments?.data || [];
  const policiesList = Array.isArray(policies) ? policies : policies?.data || [];
  const pendingPayments = paymentsList.filter((p: any) => p.status === "pending");

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Payment Center</h1>
          <p className="text-xl text-slate-600">
            Manage your premium payments with Bitcoin
          </p>
        </div>

        <Tabs defaultValue="pay" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pay">Pay Premiums</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>

          <TabsContent value="pay" className="space-y-6">
            {/* Pending Payments */}
            {pendingPayments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span>Pending Bitcoin Payments</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingPayments.map((payment: any) => (
                    <BitcoinPayment key={payment.id} payment={payment} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Policy Premiums */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bitcoin className="h-5 w-5 text-orange-500" />
                  <span>Premium Payments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {policiesList && policiesList.length > 0 ? (
                  <div className="space-y-4">
                    {policiesList.map((policy: any) => (
                      <div 
                        key={policy.id} 
                        className="border border-slate-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-1">
                              {policy.type.charAt(0).toUpperCase() + policy.type.slice(1)} Insurance
                            </h3>
                            <p className="text-sm text-slate-600 mb-2">
                              Coverage: ${parseFloat(policy.coverageAmount).toLocaleString()}
                            </p>
                            <div className="text-lg font-bold text-slate-900">
                              Monthly Premium: ${parseFloat(policy.monthlyPremium).toFixed(2)}
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => handlePayPremium(policy.id, policy.monthlyPremium)}
                            disabled={createPaymentMutation.isPending}
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            <Bitcoin className="mr-2 h-4 w-4" />
                            Pay with Bitcoin
                          </Button>
                        </div>

                        {/* Policy Details */}
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-600">Deductible:</span>
                              <div className="font-medium">${parseFloat(policy.deductible).toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-slate-600">Status:</span>
                              <div className="font-medium capitalize">{policy.status}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      No Policies Found
                    </h3>
                    <p className="text-slate-600 mb-4">
                      You need an active policy to make premium payments.
                    </p>
                    <Button>Get Coverage</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentsList && paymentsList.length > 0 ? (
                  <div className="space-y-4">
                    {paymentsList.map((payment: any) => (
                      <div 
                        key={payment.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                            {payment.paymentMethod === "bitcoin" ? (
                              <Bitcoin className="h-5 w-5 text-orange-500" />
                            ) : (
                              <CreditCard className="h-5 w-5 text-slate-500" />
                            )}
                          </div>
                          
                          <div>
                            <div className="font-medium text-slate-900">
                              {payment.type === "premium" ? "Premium Payment" : "Claim Payout"}
                            </div>
                            <div className="text-sm text-slate-600">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-slate-900">
                            ${parseFloat(payment.amount).toFixed(2)}
                          </div>
                          <Badge className={`${getStatusColor(payment.status)} flex items-center space-x-1 mt-1`}>
                            {getStatusIcon(payment.status)}
                            <span className="capitalize">{payment.status}</span>
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      No Payment History
                    </h3>
                    <p className="text-slate-600">
                      Your payment transactions will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
