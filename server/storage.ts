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
import { eq, desc, and, or, ilike, sql, inArray, asc } from "drizzle-orm";

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filter?: Record<string, string>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class DatabaseStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token));
    return user;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token));
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

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(params: PaginationParams): Promise<PaginatedResult<User>> {
    const { page, limit, search, sortBy, sortOrder, filter } = params;
    const offset = (page - 1) * limit;

    let conditions: any[] = [];
    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`)
        )
      );
    }
    if (filter?.role) {
      conditions.push(eq(users.role, filter.role));
    }
    if (filter?.emailVerified) {
      conditions.push(eq(users.emailVerified, filter.emailVerified === "true"));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const orderCol = sortBy === "email" ? users.email
      : sortBy === "firstName" ? users.firstName
      : sortBy === "role" ? users.role
      : users.createdAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const [data, countResult] = await Promise.all([
      db.select().from(users).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(users).where(where),
    ]);

    const total = Number(countResult[0].count);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

  async getPoliciesPaginated(userId: string, params: PaginationParams): Promise<PaginatedResult<Policy>> {
    const { page, limit, search, sortBy, sortOrder, filter } = params;
    const offset = (page - 1) * limit;

    let conditions: any[] = [eq(policies.userId, userId)];
    if (search) {
      conditions.push(
        or(
          ilike(policies.type, `%${search}%`),
          ilike(policies.status, `%${search}%`)
        )
      );
    }
    if (filter?.type) conditions.push(eq(policies.type, filter.type));
    if (filter?.status) conditions.push(eq(policies.status, filter.status));

    const where = and(...conditions);
    const orderCol = sortBy === "type" ? policies.type
      : sortBy === "status" ? policies.status
      : sortBy === "coverageAmount" ? policies.coverageAmount
      : sortBy === "monthlyPremium" ? policies.monthlyPremium
      : policies.createdAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const [data, countResult] = await Promise.all([
      db.select().from(policies).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(policies).where(where),
    ]);

    const total = Number(countResult[0].count);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAllPoliciesPaginated(params: PaginationParams): Promise<PaginatedResult<Policy>> {
    const { page, limit, search, sortBy, sortOrder, filter } = params;
    const offset = (page - 1) * limit;

    let conditions: any[] = [];
    if (search) {
      conditions.push(
        or(
          ilike(policies.type, `%${search}%`),
          ilike(policies.status, `%${search}%`)
        )
      );
    }
    if (filter?.type) conditions.push(eq(policies.type, filter.type));
    if (filter?.status) conditions.push(eq(policies.status, filter.status));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const orderCol = sortBy === "type" ? policies.type
      : sortBy === "status" ? policies.status
      : sortBy === "coverageAmount" ? policies.coverageAmount
      : sortBy === "monthlyPremium" ? policies.monthlyPremium
      : policies.createdAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const [data, countResult] = await Promise.all([
      db.select().from(policies).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(policies).where(where),
    ]);

    const total = Number(countResult[0].count);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

  async deletePolicies(ids: number[]): Promise<number> {
    const result = await db.delete(policies).where(inArray(policies.id, ids));
    return ids.length;
  }

  async bulkUpdatePolicies(ids: number[], updates: Partial<InsertPolicy>): Promise<Policy[]> {
    const result = await db
      .update(policies)
      .set({ ...updates, updatedAt: new Date() })
      .where(inArray(policies.id, ids))
      .returning();
    return result;
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

  async getClaimsPaginated(userId: string, params: PaginationParams): Promise<PaginatedResult<Claim>> {
    const { page, limit, search, sortBy, sortOrder, filter } = params;
    const offset = (page - 1) * limit;

    let conditions: any[] = [eq(claims.userId, userId)];
    if (search) {
      conditions.push(
        or(
          ilike(claims.title, `%${search}%`),
          ilike(claims.description, `%${search}%`)
        )
      );
    }
    if (filter?.status) conditions.push(eq(claims.status, filter.status));

    const where = and(...conditions);
    const orderCol = sortBy === "title" ? claims.title
      : sortBy === "status" ? claims.status
      : sortBy === "estimatedAmount" ? claims.estimatedAmount
      : sortBy === "incidentDate" ? claims.incidentDate
      : claims.submittedAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const [data, countResult] = await Promise.all([
      db.select().from(claims).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(claims).where(where),
    ]);

    const total = Number(countResult[0].count);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAllClaimsPaginated(params: PaginationParams): Promise<PaginatedResult<Claim>> {
    const { page, limit, search, sortBy, sortOrder, filter } = params;
    const offset = (page - 1) * limit;

    let conditions: any[] = [];
    if (search) {
      conditions.push(
        or(
          ilike(claims.title, `%${search}%`),
          ilike(claims.description, `%${search}%`)
        )
      );
    }
    if (filter?.status) conditions.push(eq(claims.status, filter.status));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const orderCol = sortBy === "title" ? claims.title
      : sortBy === "status" ? claims.status
      : sortBy === "estimatedAmount" ? claims.estimatedAmount
      : sortBy === "incidentDate" ? claims.incidentDate
      : claims.submittedAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const [data, countResult] = await Promise.all([
      db.select().from(claims).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(claims).where(where),
    ]);

    const total = Number(countResult[0].count);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

  async deleteClaims(ids: number[]): Promise<number> {
    await db.delete(claims).where(inArray(claims.id, ids));
    return ids.length;
  }

  async bulkUpdateClaims(ids: number[], updates: Partial<Claim>): Promise<Claim[]> {
    const result = await db
      .update(claims)
      .set({ ...updates, updatedAt: new Date() })
      .where(inArray(claims.id, ids))
      .returning();
    return result;
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

  async getPaymentsPaginated(userId: string, params: PaginationParams): Promise<PaginatedResult<Payment>> {
    const { page, limit, search, sortBy, sortOrder, filter } = params;
    const offset = (page - 1) * limit;

    let conditions: any[] = [eq(payments.userId, userId)];
    if (search) {
      conditions.push(
        or(
          ilike(payments.type, `%${search}%`),
          ilike(payments.paymentMethod, `%${search}%`)
        )
      );
    }
    if (filter?.status) conditions.push(eq(payments.status, filter.status));
    if (filter?.type) conditions.push(eq(payments.type, filter.type));
    if (filter?.paymentMethod) conditions.push(eq(payments.paymentMethod, filter.paymentMethod));

    const where = and(...conditions);
    const orderCol = sortBy === "amount" ? payments.amount
      : sortBy === "type" ? payments.type
      : sortBy === "status" ? payments.status
      : sortBy === "paymentMethod" ? payments.paymentMethod
      : payments.createdAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const [data, countResult] = await Promise.all([
      db.select().from(payments).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(payments).where(where),
    ]);

    const total = Number(countResult[0].count);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAllPaymentsPaginated(params: PaginationParams): Promise<PaginatedResult<Payment>> {
    const { page, limit, search, sortBy, sortOrder, filter } = params;
    const offset = (page - 1) * limit;

    let conditions: any[] = [];
    if (search) {
      conditions.push(
        or(
          ilike(payments.type, `%${search}%`),
          ilike(payments.paymentMethod, `%${search}%`)
        )
      );
    }
    if (filter?.status) conditions.push(eq(payments.status, filter.status));
    if (filter?.type) conditions.push(eq(payments.type, filter.type));
    if (filter?.paymentMethod) conditions.push(eq(payments.paymentMethod, filter.paymentMethod));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const orderCol = sortBy === "amount" ? payments.amount
      : sortBy === "type" ? payments.type
      : sortBy === "status" ? payments.status
      : sortBy === "paymentMethod" ? payments.paymentMethod
      : payments.createdAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const [data, countResult] = await Promise.all([
      db.select().from(payments).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(payments).where(where),
    ]);

    const total = Number(countResult[0].count);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async deletePayments(ids: number[]): Promise<number> {
    await db.delete(payments).where(inArray(payments.id, ids));
    return ids.length;
  }

  async bulkUpdatePayments(ids: number[], updates: Partial<Payment>): Promise<Payment[]> {
    const result = await db
      .update(payments)
      .set(updates)
      .where(inArray(payments.id, ids))
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
