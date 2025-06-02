import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertPolicySchema, 
  insertClaimSchema, 
  insertPaymentSchema,
  autoInsuranceSchema,
  homeInsuranceSchema,
  claimSubmissionSchema,
} from "@shared/schema";
import { analyzeDamageImages, generateClaimSummary } from "./openai";
import multer from "multer";

// Setup multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Health check endpoint for Docker
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Policy routes
  app.post('/api/policies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate the request based on insurance type
      let validatedData;
      if (req.body.type === "auto") {
        validatedData = autoInsuranceSchema.parse(req.body);
      } else if (req.body.type === "home") {
        validatedData = homeInsuranceSchema.parse(req.body);
      } else {
        return res.status(400).json({ message: "Invalid insurance type" });
      }

      // Calculate premium based on coverage and risk factors
      const coverageAmount = parseFloat(validatedData.coverageAmount);
      const deductible = parseFloat(validatedData.deductible);
      
      // Simple premium calculation (in a real system, this would be more complex)
      let baseRate;
      if (validatedData.type === "auto") {
        const vehicle = validatedData.vehicleInfo;
        const age = new Date().getFullYear() - vehicle.year;
        baseRate = (coverageAmount * 0.0008) + (age > 10 ? 200 : 100);
      } else {
        const property = validatedData.propertyInfo;
        const age = new Date().getFullYear() - property.yearBuilt;
        baseRate = (coverageAmount * 0.0006) + (age > 30 ? 150 : 75);
        if (property.hasSecuritySystem) baseRate *= 0.9;
        if (property.hasFireAlarm) baseRate *= 0.95;
      }

      const monthlyPremium = Math.round(baseRate / 12 * 100) / 100;

      const policyData = {
        userId,
        type: validatedData.type,
        coverageAmount: validatedData.coverageAmount,
        monthlyPremium: monthlyPremium.toString(),
        deductible: validatedData.deductible,
        startDate: new Date(),
        vehicleInfo: validatedData.type === "auto" ? validatedData.vehicleInfo : null,
        propertyInfo: validatedData.type === "home" ? validatedData.propertyInfo : null,
      };

      const policy = await storage.createPolicy(policyData);
      res.json(policy);
    } catch (error) {
      console.error("Error creating policy:", error);
      res.status(400).json({ message: "Failed to create policy" });
    }
  });

  app.get('/api/policies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const policies = await storage.getUserPolicies(userId);
      res.json(policies);
    } catch (error) {
      console.error("Error fetching policies:", error);
      res.status(500).json({ message: "Failed to fetch policies" });
    }
  });

  app.get('/api/policies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const policyId = parseInt(req.params.id);
      const policy = await storage.getPolicy(policyId);
      
      if (!policy || policy.userId !== userId) {
        return res.status(404).json({ message: "Policy not found" });
      }
      
      res.json(policy);
    } catch (error) {
      console.error("Error fetching policy:", error);
      res.status(500).json({ message: "Failed to fetch policy" });
    }
  });

  // Claim routes
  app.post('/api/claims', isAuthenticated, upload.array('images', 10), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "At least one image is required" });
      }

      // Convert images to base64 for AI analysis
      const base64Images = files.map(file => file.buffer.toString('base64'));
      
      // Perform AI damage assessment
      let aiAssessment;
      try {
        aiAssessment = await analyzeDamageImages(base64Images);
      } catch (error) {
        console.error("AI analysis failed:", error);
        // Continue without AI assessment if it fails
        aiAssessment = null;
      }

      // Store images (in a real system, you'd upload to cloud storage)
      const imageUrls = files.map((_, index) => `data:image/jpeg;base64,${base64Images[index]}`);

      const claimData = {
        userId,
        policyId: parseInt(req.body.policyId),
        title: req.body.title,
        description: req.body.description,
        incidentDate: new Date(req.body.incidentDate),
        images: imageUrls,
        aiAssessment,
        estimatedAmount: aiAssessment ? aiAssessment.estimatedCost.total.toString() : "0",
      };

      const claim = await storage.createClaim(claimData);
      res.json(claim);
    } catch (error) {
      console.error("Error creating claim:", error);
      res.status(400).json({ message: "Failed to create claim" });
    }
  });

  app.get('/api/claims', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const claims = await storage.getUserClaims(userId);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  app.get('/api/claims/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const claimId = parseInt(req.params.id);
      const claim = await storage.getClaim(claimId);
      
      if (!claim || claim.userId !== userId) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      res.json(claim);
    } catch (error) {
      console.error("Error fetching claim:", error);
      res.status(500).json({ message: "Failed to fetch claim" });
    }
  });

  app.patch('/api/claims/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const claimId = parseInt(req.params.id);
      const claim = await storage.getClaim(claimId);
      
      if (!claim || claim.userId !== userId) {
        return res.status(404).json({ message: "Claim not found" });
      }

      const updates = req.body;
      const updatedClaim = await storage.updateClaim(claimId, updates);
      res.json(updatedClaim);
    } catch (error) {
      console.error("Error updating claim:", error);
      res.status(500).json({ message: "Failed to update claim" });
    }
  });

  // Payment routes
  app.post('/api/payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        userId,
      });

      // For Bitcoin payments, generate a test address
      if (paymentData.paymentMethod === "bitcoin") {
        paymentData.bitcoinAddress = `tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh`;
        
        // Convert USD to Bitcoin (mock rate for testnet)
        const btcRate = 45000; // Mock BTC/USD rate
        const usdAmount = parseFloat(paymentData.amount);
        paymentData.bitcoinAmount = (usdAmount / btcRate).toFixed(8);
      }

      const payment = await storage.createPayment(paymentData);
      res.json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(400).json({ message: "Failed to create payment" });
    }
  });

  app.get('/api/payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const payments = await storage.getUserPayments(userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.patch('/api/payments/:id/confirm', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);
      
      if (!payment || payment.userId !== userId) {
        return res.status(404).json({ message: "Payment not found" });
      }

      const updates = {
        status: "confirmed" as const,
        bitcoinTxId: req.body.txId,
        confirmedAt: new Date(),
      };

      const updatedPayment = await storage.updatePayment(paymentId, updates);
      res.json(updatedPayment);
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const policies = await storage.getUserPolicies(userId);
      const claims = await storage.getUserClaims(userId);
      const payments = await storage.getUserPayments(userId);

      const totalCoverage = policies.reduce((sum, policy) => 
        sum + parseFloat(policy.coverageAmount), 0);
      
      const activeClaims = claims.filter(claim => 
        ["submitted", "processing"].includes(claim.status));
      
      const nextPremium = policies.length > 0 
        ? Math.min(...policies.map(p => parseFloat(p.monthlyPremium)))
        : 0;

      res.json({
        totalCoverage,
        activeClaims: activeClaims.length,
        nextPremium,
        totalPolicies: policies.length,
        totalClaims: claims.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
