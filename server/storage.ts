import { categories, transactions, budgets, users, type Category, type Transaction, type Budget, type User, type InsertCategory, type InsertTransaction, type InsertBudget, type InsertUser } from "@shared/schema";
import { MongoStorage } from './mongodb';
import 'dotenv/config'; // or
import dotenv from 'dotenv';
dotenv.config();

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Transactions
  getTransactions(): Promise<(Transaction & { category: Category })[]>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<(Transaction & { category: Category })[]>;
  getTransactionsByCategory(categoryId: number): Promise<Transaction[]>;
  
  // Budgets
  getBudgets(): Promise<(Budget & { category: Category })[]>;
  getBudgetById(id: number): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<boolean>;
  getBudgetByCategory(categoryId: number, month: number, year: number): Promise<Budget | undefined>;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private categories: Map<number, Category>;
  private transactions: Map<number, Transaction>;
  private budgets: Map<number, Budget>;
  private users: Map<number, User>;
  private currentCategoryId: number;
  private currentTransactionId: number;
  private currentBudgetId: number;
  private currentUserId: number;

  constructor() {
    this.categories = new Map();
    this.transactions = new Map();
    this.budgets = new Map();
    this.users = new Map();
    this.currentCategoryId = 1;
    this.currentTransactionId = 1;
    this.currentBudgetId = 1;
    this.currentUserId = 1;
    
    // Initialize with predefined categories
    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories() {
    const defaultCategories = [
      { name: "Food & Dining", color: "#2563eb", icon: "utensils" },
      { name: "Transportation", color: "#16a34a", icon: "car" },
      { name: "Shopping", color: "#ea580c", icon: "shopping-bag" },
      { name: "Entertainment", color: "#8b5cf6", icon: "music" },
      { name: "Bills & Utilities", color: "#06b6d4", icon: "receipt" },
      { name: "Income", color: "#059669", icon: "trending-up" },
      { name: "Healthcare", color: "#dc2626", icon: "heart" },
      { name: "Education", color: "#7c3aed", icon: "book" },
    ];

    defaultCategories.forEach(cat => {
      const category: Category = {
        id: this.currentCategoryId++,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
      };
      this.categories.set(category.id, category);
    });
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = {
      id: this.currentCategoryId++,
      ...insertCategory,
    };
    this.categories.set(category.id, category);
    return category;
  }

  async getTransactions(): Promise<(Transaction & { category: Category })[]> {
    const transactions = Array.from(this.transactions.values());
    return transactions.map(transaction => ({
      ...transaction,
      category: this.categories.get(transaction.categoryId!)!,
    }));
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      id: this.currentTransactionId++,
      ...insertTransaction,
      categoryId: insertTransaction.categoryId || null,
      createdAt: new Date(),
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async updateTransaction(id: number, updateData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...updateData };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<(Transaction & { category: Category })[]> {
    const transactions = Array.from(this.transactions.values()).filter(
      transaction => transaction.date >= startDate && transaction.date <= endDate
    );
    return transactions.map(transaction => ({
      ...transaction,
      category: this.categories.get(transaction.categoryId!)!,
    }));
  }

  async getTransactionsByCategory(categoryId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      transaction => transaction.categoryId === categoryId
    );
  }

  async getBudgets(): Promise<(Budget & { category: Category })[]> {
    const budgets = Array.from(this.budgets.values());
    return budgets.map(budget => ({
      ...budget,
      category: this.categories.get(budget.categoryId!)!,
    }));
  }

  async getBudgetById(id: number): Promise<Budget | undefined> {
    return this.budgets.get(id);
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const budget: Budget = {
      id: this.currentBudgetId++,
      ...insertBudget,
      categoryId: insertBudget.categoryId || null,
      createdAt: new Date(),
    };
    this.budgets.set(budget.id, budget);
    return budget;
  }

  async updateBudget(id: number, updateData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;
    
    const updatedBudget = { ...budget, ...updateData };
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }

  async deleteBudget(id: number): Promise<boolean> {
    return this.budgets.delete(id);
  }

  async getBudgetByCategory(categoryId: number, month: number, year: number): Promise<Budget | undefined> {
    return Array.from(this.budgets.values()).find(
      budget => budget.categoryId === categoryId && budget.month === month && budget.year === year
    );
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

// Initialize storage based on environment
function initializeStorage(): IStorage {
  const mongoUrl = process.env.MONGODB_URI || process.env.MONGO_URL;
  
  if (mongoUrl) {
    console.log('Using MongoDB storage');
    return new MongoStorage(mongoUrl);
  } else {
    console.log('Using in-memory storage (no MongoDB URI provided)');
    return new MemStorage();
  }
}

export const storage = initializeStorage();
