import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bitcoin, Copy, QrCode, Clock, CheckCircle, ExternalLink } from "lucide-react";
import type { Payment } from "@shared/schema";

interface BitcoinPaymentProps {
  payment: Payment;
}

export default function BitcoinPayment({ payment }: BitcoinPaymentProps) {
  const [txId, setTxId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const confirmPaymentMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await fetch(`/api/payments/${payment.id}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txId: transactionId }),
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
        title: "Payment Confirmed",
        description: "Your Bitcoin payment has been confirmed and recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    },
    onError: (error) => {
      toast({
        title: "Confirmation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Address copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleConfirmPayment = () => {
    if (!txId.trim()) {
      toast({
        title: "Transaction ID Required",
        description: "Please enter the Bitcoin transaction ID",
        variant: "destructive",
      });
      return;
    }
    confirmPaymentMutation.mutate(txId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bitcoin className="h-6 w-6 text-orange-500" />
            <div>
              <div className="text-lg font-semibold text-slate-900">
                Bitcoin Payment
              </div>
              <div className="text-sm text-slate-600">
                {payment.type === "premium" ? "Premium Payment" : "Claim Payout"}
              </div>
            </div>
          </div>
          <Badge className={`${getStatusColor(payment.status)} flex items-center space-x-1`}>
            {getStatusIcon(payment.status)}
            <span className="capitalize">{payment.status}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Amount */}
        <div className="bg-white rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600">Payment Amount</span>
            <span className="text-2xl font-bold text-slate-900">
              ${parseFloat(payment.amount).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Bitcoin Amount</span>
            <span className="font-mono text-slate-700">
              {payment.bitcoinAmount} BTC
            </span>
          </div>
        </div>

        {/* Bitcoin Address */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Payment Address
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-white border border-slate-200 rounded p-3 font-mono text-sm text-slate-600 break-all">
              {payment.bitcoinAddress}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(payment.bitcoinAddress || "")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* QR Code Placeholder */}
        <div className="flex justify-center">
          <div className="bg-white p-4 border-2 border-slate-200 rounded-lg">
            <div className="w-32 h-32 bg-slate-100 rounded flex items-center justify-center">
              <QrCode className="h-16 w-16 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-white rounded-lg p-4 border border-orange-200">
          <h4 className="font-medium text-slate-900 mb-2">Payment Instructions</h4>
          <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
            <li>Send exactly {payment.bitcoinAmount} BTC to the address above</li>
            <li>Wait for network confirmation (usually 10-60 minutes)</li>
            <li>Enter your transaction ID below to confirm payment</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => window.open(`bitcoin:${payment.bitcoinAddress}?amount=${payment.bitcoinAmount}`, '_blank')}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            <Bitcoin className="mr-2 h-4 w-4" />
            Open Bitcoin Wallet
          </Button>

          {payment.status === "pending" && (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter Bitcoin transaction ID"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleConfirmPayment}
                  disabled={confirmPaymentMutation.isPending || !txId.trim()}
                  variant="outline"
                >
                  Confirm
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Enter your transaction ID after sending payment to confirm
              </p>
            </div>
          )}

          {payment.status === "confirmed" && payment.bitcoinTxId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-green-800">Payment Confirmed</div>
                  <div className="text-xs text-green-600 font-mono">
                    TX: {payment.bitcoinTxId.slice(0, 16)}...
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://blockstream.info/testnet/tx/${payment.bitcoinTxId}`, '_blank')}
                  className="text-green-600 hover:text-green-700"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {payment.status === "pending" && (
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-yellow-600">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Waiting for payment...</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                This page will update automatically when payment is detected
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
