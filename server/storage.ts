import {
  users,
  policies,
  claims,
  payments,
  type User,
  type UpsertUser,
  type Policy,
  type InsertPolicy,
  type Claim,
  type InsertClaim,
  type Payment,
  type InsertPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Policy operations
  createPolicy(policy: InsertPolicy): Promise<Policy>;
  getUserPolicies(userId: string): Promise<Policy[]>;
  getPolicy(id: number): Promise<Policy | undefined>;
  updatePolicy(id: number, updates: Partial<InsertPolicy>): Promise<Policy>;
  
  // Claim operations
  createClaim(claim: InsertClaim): Promise<Claim>;
  getUserClaims(userId: string): Promise<Claim[]>;
  getClaim(id: number): Promise<Claim | undefined>;
  updateClaim(id: number, updates: Partial<Claim>): Promise<Claim>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getUserPayments(userId: string): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  updatePayment(id: number, updates: Partial<Payment>): Promise<Payment>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Policy operations
  async createPolicy(policy: InsertPolicy): Promise<Policy> {
    const [newPolicy] = await db
      .insert(policies)
      .values(policy)
      .returning();
    return newPolicy;
  }

  async getUserPolicies(userId: string): Promise<Policy[]> {
    return await db
      .select()
      .from(policies)
      .where(eq(policies.userId, userId))
      .orderBy(desc(policies.createdAt));
  }

  async getPolicy(id: number): Promise<Policy | undefined> {
    const [policy] = await db
      .select()
      .from(policies)
      .where(eq(policies.id, id));
    return policy;
  }

  async updatePolicy(id: number, updates: Partial<InsertPolicy>): Promise<Policy> {
    const [policy] = await db
      .update(policies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(policies.id, id))
      .returning();
    return policy;
  }

  // Claim operations
  async createClaim(claim: InsertClaim): Promise<Claim> {
    const [newClaim] = await db
      .insert(claims)
      .values(claim)
      .returning();
    return newClaim;
  }

  async getUserClaims(userId: string): Promise<Claim[]> {
    return await db
      .select()
      .from(claims)
      .where(eq(claims.userId, userId))
      .orderBy(desc(claims.submittedAt));
  }

  async getClaim(id: number): Promise<Claim | undefined> {
    const [claim] = await db
      .select()
      .from(claims)
      .where(eq(claims.id, id));
    return claim;
  }

  async updateClaim(id: number, updates: Partial<Claim>): Promise<Claim> {
    const [claim] = await db
      .update(claims)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(claims.id, id))
      .returning();
    return claim;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    return payment;
  }

  async updatePayment(id: number, updates: Partial<Payment>): Promise<Payment> {
    const [payment] = await db
      .update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }
}

export const storage = new DatabaseStorage();
