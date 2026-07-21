import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertPolicySchema,
  insertClaimSchema,
  insertPaymentSchema,
  autoInsuranceSchema,
  homeInsuranceSchema,
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "@shared/schema";
import { analyzeDamageImages, claimsChatbot, assessRisk, recommendCoverage } from "./openai";
import { registerExtraRoutes } from "./extraRoutes";
import multer from "multer";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// RBAC middleware
function requireRole(...roles: string[]) {
  return async (req: any, res: Response, next: NextFunction) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }
    next();
  };
}

// Parse pagination params from query string
function parsePaginationParams(query: any) {
  return {
    page: Math.max(1, parseInt(query.page) || 1),
    limit: Math.min(100, Math.max(1, parseInt(query.limit) || 10)),
    search: query.search || undefined,
    sortBy: query.sortBy || undefined,
    sortOrder: (query.sortOrder === "asc" ? "asc" : "desc") as "asc" | "desc",
    filter: query.filter ? (typeof query.filter === "string" ? JSON.parse(query.filter) : query.filter) : undefined,
  };
}

// Helper to check local auth session
function isLocalAuthenticated(req: any, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    return next();
  }
  // Fall back to Replit Auth
  return isAuthenticated(req, res, next);
}

// Get userId from either auth system
function getUserId(req: any): string | null {
  return req.session?.userId || req.user?.claims?.sub || null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // Rate limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { message: "Too many requests, please try again later" },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many auth attempts, please try again later" },
  });

  app.use("/api/", generalLimiter);

  // Auth middleware (Replit Auth)
  await setupAuth(app);

  // Health check endpoint for Docker
  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // ==========================================
  // LOCAL AUTH ROUTES (Register, Login, etc.)
  // ==========================================

  // Register
  app.post("/api/auth/register", authLimiter, async (req: any, res) => {
    try {
      const data = registerSchema.parse(req.body);

      // Check if email already exists
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Create user
      const userId = crypto.randomUUID();
      const user = await storage.createUser({
        id: userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: hashedPassword,
        role: "member",
        emailVerified: false,
        emailVerificationToken: verificationToken,
      });

      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        verification: "out_of_band",
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.issues) {
        return res.status(400).json({ message: "Validation failed", errors: error.issues });
      }
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", authLimiter, async (req: any, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(data.email);

      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (!user.emailVerified) return res.status(403).json({ message: "Email verification required" });

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session
      req.session.userId = user.id;

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  // Logout (local)
  app.post("/api/auth/local-logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out successfully" });
    });
  });

  // Verify email
  app.get("/api/auth/verify-email/:token", async (req, res) => {
    try {
      const user = await storage.getUserByVerificationToken(req.params.token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      await storage.updateUser(user.id, {
        emailVerified: true,
        emailVerificationToken: null,
      });

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Forgot password
  app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ message: "If an account exists with that email, a reset link has been sent" });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      });

      res.json({
        message: "If an account exists with that email, a reset link has been sent",
        delivery: "out_of_band",
      });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(400).json({ message: error.message || "Failed" });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
    try {
      const data = resetPasswordSchema.parse(req.body);
      const user = await storage.getUserByResetToken(data.token);

      if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 12);

      await storage.updateUser(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      res.json({ message: "Password reset successfully" });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(400).json({ message: error.message || "Reset failed" });
    }
  });

  // Change password (authenticated)
  app.post("/api/auth/change-password", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const data = changePasswordSchema.parse(req.body);
      const user = await storage.getUser(userId);

      if (!user || !user.password) {
        return res.status(400).json({ message: "Cannot change password for this account type" });
      }

      const validPassword = await bcrypt.compare(data.currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 12);
      await storage.updateUser(userId, { password: hashedPassword });

      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      console.error("Change password error:", error);
      res.status(400).json({ message: error.message || "Failed to change password" });
    }
  });

  // ==========================================
  // AUTH USER ROUTE
  // ==========================================

  app.get(["/api/auth/user", "/api/auth/me"], isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Don't return sensitive fields
      const { password, passwordResetToken, passwordResetExpires, emailVerificationToken, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ==========================================
  // PROFILE ROUTES
  // ==========================================

  app.get("/api/profile", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { password, passwordResetToken, passwordResetExpires, emailVerificationToken, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const data = updateProfileSchema.parse(req.body);
      const user = await storage.updateUser(userId, data);

      const { password, passwordResetToken, passwordResetExpires, emailVerificationToken, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  // ==========================================
  // POLICY ROUTES (with pagination, search, filter, sort)
  // ==========================================

  app.post("/api/policies", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      let validatedData;
      if (req.body.type === "auto") {
        validatedData = autoInsuranceSchema.parse(req.body);
      } else if (req.body.type === "home") {
        validatedData = homeInsuranceSchema.parse(req.body);
      } else {
        return res.status(400).json({ message: "Invalid insurance type" });
      }

      const coverageAmount = parseFloat(validatedData.coverageAmount);
      let baseRate;
      if (validatedData.type === "auto") {
        const vehicle = validatedData.vehicleInfo;
        const age = new Date().getFullYear() - vehicle.year;
        baseRate = coverageAmount * 0.0008 + (age > 10 ? 200 : 100);
      } else {
        const property = validatedData.propertyInfo;
        const age = new Date().getFullYear() - property.yearBuilt;
        baseRate = coverageAmount * 0.0006 + (age > 30 ? 150 : 75);
        if (property.hasSecuritySystem) baseRate *= 0.9;
        if (property.hasFireAlarm) baseRate *= 0.95;
      }

      const monthlyPremium = Math.round((baseRate / 12) * 100) / 100;

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

  app.get("/api/policies", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      // If pagination params present, use paginated version
      if (req.query.page) {
        const params = parsePaginationParams(req.query);
        const result = await storage.getPoliciesPaginated(userId, params);
        return res.json(result);
      }

      const policies = await storage.getUserPolicies(userId);
      res.json(policies);
    } catch (error) {
      console.error("Error fetching policies:", error);
      res.status(500).json({ message: "Failed to fetch policies" });
    }
  });

  app.get("/api/policies/:id", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

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

  app.put("/api/policies/:id", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const policyId = parseInt(req.params.id);
      const policy = await storage.getPolicy(policyId);

      if (!policy || policy.userId !== userId) {
        return res.status(404).json({ message: "Policy not found" });
      }

      const updated = await storage.updatePolicy(policyId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating policy:", error);
      res.status(500).json({ message: "Failed to update policy" });
    }
  });

  app.delete("/api/policies/:id", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const policyId = parseInt(req.params.id);
      const policy = await storage.getPolicy(policyId);

      if (!policy || policy.userId !== userId) {
        return res.status(404).json({ message: "Policy not found" });
      }

      await storage.deletePolicies([policyId]);
      res.json({ message: "Policy deleted successfully" });
    } catch (error) {
      console.error("Error deleting policy:", error);
      res.status(500).json({ message: "Failed to delete policy" });
    }
  });

  // ==========================================
  // CLAIM ROUTES (with pagination, search, filter, sort)
  // ==========================================

  app.post("/api/claims", isLocalAuthenticated, upload.array("images", 10), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "At least one image is required" });
      }

      const base64Images = files.map((file) => file.buffer.toString("base64"));

      let aiAssessment;
      try {
        aiAssessment = await analyzeDamageImages(base64Images);
      } catch (error) {
        console.error("AI analysis failed:", error);
        aiAssessment = null;
      }

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

  app.get("/api/claims", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      if (req.query.page) {
        const params = parsePaginationParams(req.query);
        const result = await storage.getClaimsPaginated(userId, params);
        return res.json(result);
      }

      const claims = await storage.getUserClaims(userId);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  app.get("/api/claims/:id", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

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

  app.patch("/api/claims/:id", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const claimId = parseInt(req.params.id);
      const claim = await storage.getClaim(claimId);

      if (!claim || claim.userId !== userId) {
        return res.status(404).json({ message: "Claim not found" });
      }

      const updatedClaim = await storage.updateClaim(claimId, req.body);
      res.json(updatedClaim);
    } catch (error) {
      console.error("Error updating claim:", error);
      res.status(500).json({ message: "Failed to update claim" });
    }
  });

  app.delete("/api/claims/:id", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const claimId = parseInt(req.params.id);
      const claim = await storage.getClaim(claimId);

      if (!claim || claim.userId !== userId) {
        return res.status(404).json({ message: "Claim not found" });
      }

      await storage.deleteClaims([claimId]);
      res.json({ message: "Claim deleted successfully" });
    } catch (error) {
      console.error("Error deleting claim:", error);
      res.status(500).json({ message: "Failed to delete claim" });
    }
  });

  // ==========================================
  // PAYMENT ROUTES (with pagination, search, filter, sort)
  // ==========================================

  app.post("/api/payments", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        userId,
      });

      if (paymentData.paymentMethod === "bitcoin") {
        paymentData.bitcoinAddress = `tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh`;
        const btcRate = 45000;
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

  app.get("/api/payments", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      if (req.query.page) {
        const params = parsePaginationParams(req.query);
        const result = await storage.getPaymentsPaginated(userId, params);
        return res.json(result);
      }

      const payments = await storage.getUserPayments(userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/:id", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);

      if (!payment || payment.userId !== userId) {
        return res.status(404).json({ message: "Payment not found" });
      }

      res.json(payment);
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  app.patch("/api/payments/:id/confirm", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

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

  app.delete("/api/payments/:id", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);

      if (!payment || payment.userId !== userId) {
        return res.status(404).json({ message: "Payment not found" });
      }

      await storage.deletePayments([paymentId]);
      res.json({ message: "Payment deleted successfully" });
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  app.post("/api/bulk/policies/delete", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No IDs provided" });
      }

      const count = await storage.deletePolicies(ids);
      res.json({ message: `${count} policies deleted`, count });
    } catch (error) {
      console.error("Error bulk deleting policies:", error);
      res.status(500).json({ message: "Failed to bulk delete policies" });
    }
  });

  app.post("/api/bulk/policies/update", isLocalAuthenticated, async (req: any, res) => {
    try {
      const { ids, updates } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No IDs provided" });
      }

      const result = await storage.bulkUpdatePolicies(ids, updates);
      res.json({ message: `${result.length} policies updated`, data: result });
    } catch (error) {
      console.error("Error bulk updating policies:", error);
      res.status(500).json({ message: "Failed to bulk update policies" });
    }
  });

  app.post("/api/bulk/claims/delete", isLocalAuthenticated, async (req: any, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No IDs provided" });
      }

      const count = await storage.deleteClaims(ids);
      res.json({ message: `${count} claims deleted`, count });
    } catch (error) {
      console.error("Error bulk deleting claims:", error);
      res.status(500).json({ message: "Failed to bulk delete claims" });
    }
  });

  app.post("/api/bulk/claims/update", isLocalAuthenticated, async (req: any, res) => {
    try {
      const { ids, updates } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No IDs provided" });
      }

      const result = await storage.bulkUpdateClaims(ids, updates);
      res.json({ message: `${result.length} claims updated`, data: result });
    } catch (error) {
      console.error("Error bulk updating claims:", error);
      res.status(500).json({ message: "Failed to bulk update claims" });
    }
  });

  app.post("/api/bulk/payments/delete", isLocalAuthenticated, async (req: any, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No IDs provided" });
      }

      const count = await storage.deletePayments(ids);
      res.json({ message: `${count} payments deleted`, count });
    } catch (error) {
      console.error("Error bulk deleting payments:", error);
      res.status(500).json({ message: "Failed to bulk delete payments" });
    }
  });

  app.post("/api/bulk/payments/update", isLocalAuthenticated, async (req: any, res) => {
    try {
      const { ids, updates } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No IDs provided" });
      }

      const result = await storage.bulkUpdatePayments(ids, updates);
      res.json({ message: `${result.length} payments updated`, data: result });
    } catch (error) {
      console.error("Error bulk updating payments:", error);
      res.status(500).json({ message: "Failed to bulk update payments" });
    }
  });

  // ==========================================
  // EXPORT ROUTES (CSV and PDF)
  // ==========================================

  app.get("/api/export/policies/csv", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const policies = await storage.getUserPolicies(userId);

      const headers = ["ID", "Type", "Status", "Coverage Amount", "Monthly Premium", "Deductible", "Start Date", "Created At"];
      const rows = policies.map((p) => [
        p.id,
        p.type,
        p.status,
        p.coverageAmount,
        p.monthlyPremium,
        p.deductible,
        p.startDate ? new Date(p.startDate).toLocaleDateString() : "",
        p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=policies.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting policies CSV:", error);
      res.status(500).json({ message: "Failed to export" });
    }
  });

  app.get("/api/export/claims/csv", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const claims = await storage.getUserClaims(userId);

      const headers = ["ID", "Title", "Description", "Status", "Estimated Amount", "Approved Amount", "Paid Amount", "Incident Date", "Submitted At"];
      const rows = claims.map((c) => [
        c.id,
        `"${(c.title || "").replace(/"/g, '""')}"`,
        `"${(c.description || "").replace(/"/g, '""')}"`,
        c.status,
        c.estimatedAmount || "",
        c.approvedAmount || "",
        c.paidAmount || "",
        c.incidentDate ? new Date(c.incidentDate).toLocaleDateString() : "",
        c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : "",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=claims.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting claims CSV:", error);
      res.status(500).json({ message: "Failed to export" });
    }
  });

  app.get("/api/export/payments/csv", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const payments = await storage.getUserPayments(userId);

      const headers = ["ID", "Type", "Amount", "Currency", "Payment Method", "Status", "Bitcoin Address", "Created At"];
      const rows = payments.map((p) => [
        p.id,
        p.type,
        p.amount,
        p.currency,
        p.paymentMethod,
        p.status,
        p.bitcoinAddress || "",
        p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=payments.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting payments CSV:", error);
      res.status(500).json({ message: "Failed to export" });
    }
  });

  // PDF exports (generates HTML-based PDF content)
  app.get("/api/export/policies/pdf", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const policies = await storage.getUserPolicies(userId);
      const user = await storage.getUser(userId);

      const html = generatePdfHtml("Insurance Policies Report", user, policies.map(p => ({
        ID: p.id,
        Type: p.type,
        Status: p.status,
        "Coverage Amount": `$${parseFloat(p.coverageAmount).toLocaleString()}`,
        "Monthly Premium": `$${parseFloat(p.monthlyPremium).toFixed(2)}`,
        Deductible: `$${parseFloat(p.deductible).toLocaleString()}`,
        "Start Date": p.startDate ? new Date(p.startDate).toLocaleDateString() : "N/A",
      })));

      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", "attachment; filename=policies-report.html");
      res.send(html);
    } catch (error) {
      console.error("Error exporting policies PDF:", error);
      res.status(500).json({ message: "Failed to export" });
    }
  });

  app.get("/api/export/claims/pdf", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const claims = await storage.getUserClaims(userId);
      const user = await storage.getUser(userId);

      const html = generatePdfHtml("Insurance Claims Report", user, claims.map(c => ({
        ID: c.id,
        Title: c.title,
        Status: c.status,
        "Estimated Amount": c.estimatedAmount ? `$${parseFloat(c.estimatedAmount).toLocaleString()}` : "N/A",
        "Approved Amount": c.approvedAmount ? `$${parseFloat(c.approvedAmount).toLocaleString()}` : "N/A",
        "Incident Date": c.incidentDate ? new Date(c.incidentDate).toLocaleDateString() : "N/A",
      })));

      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", "attachment; filename=claims-report.html");
      res.send(html);
    } catch (error) {
      console.error("Error exporting claims PDF:", error);
      res.status(500).json({ message: "Failed to export" });
    }
  });

  app.get("/api/export/payments/pdf", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const payments = await storage.getUserPayments(userId);
      const user = await storage.getUser(userId);

      const html = generatePdfHtml("Payments Report", user, payments.map(p => ({
        ID: p.id,
        Type: p.type,
        Amount: `$${parseFloat(p.amount).toLocaleString()}`,
        Method: p.paymentMethod,
        Status: p.status,
        "Created At": p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "N/A",
      })));

      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", "attachment; filename=payments-report.html");
      res.send(html);
    } catch (error) {
      console.error("Error exporting payments PDF:", error);
      res.status(500).json({ message: "Failed to export" });
    }
  });

  // ==========================================
  // ADMIN ROUTES (RBAC protected)
  // ==========================================

  app.get("/api/admin/users", isLocalAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const params = parsePaginationParams(req.query);
      const result = await storage.getAllUsers(params);
      res.json(result);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/role", isLocalAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const { role } = req.body;
      if (!["admin", "agent", "member"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.updateUser(req.params.id, { role });
      const { password, passwordResetToken, passwordResetExpires, emailVerificationToken, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.get("/api/admin/policies", isLocalAuthenticated, requireRole("admin", "agent"), async (req: any, res) => {
    try {
      const params = parsePaginationParams(req.query);
      const result = await storage.getAllPoliciesPaginated(params);
      res.json(result);
    } catch (error) {
      console.error("Error fetching all policies:", error);
      res.status(500).json({ message: "Failed to fetch policies" });
    }
  });

  app.get("/api/admin/claims", isLocalAuthenticated, requireRole("admin", "agent"), async (req: any, res) => {
    try {
      const params = parsePaginationParams(req.query);
      const result = await storage.getAllClaimsPaginated(params);
      res.json(result);
    } catch (error) {
      console.error("Error fetching all claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  app.get("/api/admin/payments", isLocalAuthenticated, requireRole("admin", "agent"), async (req: any, res) => {
    try {
      const params = parsePaginationParams(req.query);
      const result = await storage.getAllPaymentsPaginated(params);
      res.json(result);
    } catch (error) {
      console.error("Error fetching all payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // ==========================================
  // DASHBOARD STATS
  // ==========================================

  app.get("/api/dashboard/stats", isLocalAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const policies = await storage.getUserPolicies(userId);
      const claims = await storage.getUserClaims(userId);

      const totalCoverage = policies.reduce(
        (sum, policy) => sum + parseFloat(policy.coverageAmount),
        0
      );

      const activeClaims = claims.filter((claim) =>
        ["submitted", "processing"].includes(claim.status)
      );

      const nextPremium =
        policies.length > 0
          ? Math.min(...policies.map((p) => parseFloat(p.monthlyPremium)))
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

  // ==========================================
  // AI Routes
  // ==========================================

  app.post("/api/ai/claims-chatbot", isLocalAuthenticated, async (req: any, res) => {
    try {
      const { question, context } = req.body || {};
      if (!question) {
        return res.status(400).json({ message: "question is required" });
      }
      const answer = await claimsChatbot(question, context);
      res.json({ answer });
    } catch (error: any) {
      console.error("Claims chatbot route error:", error);
      res.status(500).json({ message: error.message || "Claims chatbot failed" });
    }
  });

  app.post("/api/ai/risk-assessment", isLocalAuthenticated, async (req: any, res) => {
    try {
      const intake = req.body || {};
      if (!intake || Object.keys(intake).length === 0) {
        return res.status(400).json({ message: "intake payload is required" });
      }
      const result = await assessRisk(intake);
      res.json(result);
    } catch (error: any) {
      console.error("Risk assessment route error:", error);
      res.status(500).json({ message: error.message || "Risk assessment failed" });
    }
  });

  app.post("/api/ai/coverage-recommendation", isLocalAuthenticated, async (req: any, res) => {
    try {
      const { profile, available } = req.body || {};
      if (!profile || !Array.isArray(available)) {
        return res.status(400).json({ message: "profile (object) and available (array) are required" });
      }
      const result = await recommendCoverage(profile, available);
      res.json(result);
    } catch (error: any) {
      console.error("Coverage recommendation route error:", error);
      res.status(500).json({ message: error.message || "Coverage recommendation failed" });
    }
  });

  registerExtraRoutes(app, isLocalAuthenticated);
  const httpServer = createServer(app);
  return httpServer;
}

// Helper to generate printable HTML report (used as PDF alternative)
function generatePdfHtml(title: string, user: any, rows: Record<string, any>[]) {
  if (rows.length === 0) {
    return `<html><body><h1>${title}</h1><p>No data available.</p></body></html>`;
  }

  const headers = Object.keys(rows[0]);
  const tableRows = rows
    .map(
      (row) =>
        `<tr>${headers.map((h) => `<td style="border:1px solid #ddd;padding:8px;">${row[h]}</td>`).join("")}</tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <title>${title} - SafeGuard Mutual</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    .meta { color: #64748b; margin-bottom: 20px; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th { background-color: #3b82f6; color: white; padding: 12px 8px; text-align: left; }
    td { border: 1px solid #ddd; padding: 8px; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .footer { margin-top: 30px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">
    <p>Generated for: ${user?.firstName || ""} ${user?.lastName || ""} (${user?.email || ""})</p>
    <p>Date: ${new Date().toLocaleDateString()} | Total Records: ${rows.length}</p>
  </div>
  <table>
    <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">
    <p>SafeGuard Mutual - Non-Profit Insurance Platform</p>
    <p>This report was generated automatically. Print this page to save as PDF.</p>
  </div>
</body>
</html>`;
}
