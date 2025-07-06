import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { categories, transactions, budgets, users, type Category, type Transaction, type Budget, type User, type InsertCategory, type InsertTransaction, type InsertBudget, type InsertUser } from "@shared/schema";
import { IStorage } from './storage';
import 'dotenv/config'; // or
import dotenv from 'dotenv';
dotenv.config();

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private categoriesCollection: Collection;
  private transactionsCollection: Collection;
  private budgetsCollection: Collection;
  private usersCollection: Collection;
  private isConnected: boolean = false;

  constructor(connectionString: string, dbName: string = 'finance-tracker-app') {
    this.client = new MongoClient(connectionString);
    this.db = this.client.db(dbName);
    this.categoriesCollection = this.db.collection('categories');
    this.transactionsCollection = this.db.collection('transactions');
    this.budgetsCollection = this.db.collection('budgets');
    this.usersCollection = this.db.collection('users');
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
      console.log('Connected to MongoDB');
      
      // Initialize default categories if collection is empty
      await this.initializeDefaultCategories();
      
      // Create indexes for better performance
      await this.createIndexes();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  private async createIndexes(): Promise<void> {
    try {
      // Create indexes for better query performance
      await this.transactionsCollection.createIndex({ categoryId: 1 });
      await this.transactionsCollection.createIndex({ date: -1 });
      await this.transactionsCollection.createIndex({ type: 1 });
      await this.budgetsCollection.createIndex({ categoryId: 1, month: 1, year: 1 }, { unique: true });
      await this.usersCollection.createIndex({ username: 1 }, { unique: true });
    } catch (error) {
      console.log('Indexes may already exist, continuing...');
    }
  }

  private async initializeDefaultCategories(): Promise<void> {
    const count = await this.categoriesCollection.countDocuments();
    if (count === 0) {
      const defaultCategories = [
        { id: 1, name: "Food & Dining", color: "#2563eb", icon: "utensils" },
        { id: 2, name: "Transportation", color: "#16a34a", icon: "car" },
        { id: 3, name: "Shopping", color: "#ea580c", icon: "shopping-bag" },
        { id: 4, name: "Entertainment", color: "#8b5cf6", icon: "music" },
        { id: 5, name: "Bills & Utilities", color: "#06b6d4", icon: "receipt" },
        { id: 6, name: "Income", color: "#059669", icon: "trending-up" },
        { id: 7, name: "Healthcare", color: "#dc2626", icon: "heart" },
        { id: 8, name: "Education", color: "#7c3aed", icon: "book" },
      ];

      await this.categoriesCollection.insertMany(defaultCategories);
      console.log('Default categories initialized');
    }
  }

  private async getNextId(collection: Collection): Promise<number> {
    const lastDoc = await collection.findOne({}, { sort: { id: -1 } });
    return lastDoc ? lastDoc.id + 1 : 1;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    await this.connect();
    const categories = await this.categoriesCollection.find({}).sort({ id: 1 }).toArray();
    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
    }));
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    await this.connect();
    const category = await this.categoriesCollection.findOne({ id });
    if (!category) return undefined;
    return {
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
    };
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    await this.connect();
    const id = await this.getNextId(this.categoriesCollection);
    const category: Category = {
      id,
      ...insertCategory,
    };
    await this.categoriesCollection.insertOne(category);
    return category;
  }

  // Transactions
  async getTransactions(): Promise<(Transaction & { category: Category })[]> {
    await this.connect();
    const transactions = await this.transactionsCollection.find({}).sort({ date: -1 }).toArray();
    const categories = await this.getCategories();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

    return transactions.map(transaction => ({
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date,
      categoryId: transaction.categoryId,
      type: transaction.type,
      createdAt: transaction.createdAt,
      category: categoryMap.get(transaction.categoryId) || categories[0],
    }));
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    await this.connect();
    const transaction = await this.transactionsCollection.findOne({ id });
    if (!transaction) return undefined;
    return {
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date,
      categoryId: transaction.categoryId,
      type: transaction.type,
      createdAt: transaction.createdAt,
    };
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    await this.connect();
    const id = await this.getNextId(this.transactionsCollection);
    const transaction: Transaction = {
      id,
      ...insertTransaction,
      categoryId: insertTransaction.categoryId || null,
      createdAt: new Date(),
    };
    await this.transactionsCollection.insertOne(transaction);
    return transaction;
  }

  async updateTransaction(id: number, updateData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    await this.connect();
    const result = await this.transactionsCollection.findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    if (!result.value) return undefined;
    const updated = result.value;
    return {
      id: updated.id,
      description: updated.description,
      amount: updated.amount,
      date: updated.date,
      categoryId: updated.categoryId,
      type: updated.type,
      createdAt: updated.createdAt,
    };
  }

  async deleteTransaction(id: number): Promise<boolean> {
    await this.connect();
    const result = await this.transactionsCollection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<(Transaction & { category: Category })[]> {
    await this.connect();
    const transactions = await this.transactionsCollection
      .find({
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ date: -1 })
      .toArray();

    const categories = await this.getCategories();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

    return transactions.map(transaction => ({
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date,
      categoryId: transaction.categoryId,
      type: transaction.type,
      createdAt: transaction.createdAt,
      category: categoryMap.get(transaction.categoryId) || categories[0],
    }));
  }

  async getTransactionsByCategory(categoryId: number): Promise<Transaction[]> {
    await this.connect();
    const transactions = await this.transactionsCollection
      .find({ categoryId })
      .sort({ date: -1 })
      .toArray();

    return transactions.map(transaction => ({
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date,
      categoryId: transaction.categoryId,
      type: transaction.type,
      createdAt: transaction.createdAt,
    }));
  }

  // Budgets
  async getBudgets(): Promise<(Budget & { category: Category })[]> {
    await this.connect();
    const budgets = await this.budgetsCollection.find({}).sort({ year: -1, month: -1 }).toArray();
    const categories = await this.getCategories();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

    return budgets.map(budget => ({
      id: budget.id,
      categoryId: budget.categoryId,
      amount: budget.amount,
      month: budget.month,
      year: budget.year,
      createdAt: budget.createdAt,
      category: categoryMap.get(budget.categoryId) || categories[0],
    }));
  }

  async getBudgetById(id: number): Promise<Budget | undefined> {
    await this.connect();
    const budget = await this.budgetsCollection.findOne({ id });
    if (!budget) return undefined;
    return {
      id: budget.id,
      categoryId: budget.categoryId,
      amount: budget.amount,
      month: budget.month,
      year: budget.year,
      createdAt: budget.createdAt,
    };
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    await this.connect();
    const id = await this.getNextId(this.budgetsCollection);
    const budget: Budget = {
      id,
      ...insertBudget,
      categoryId: insertBudget.categoryId || null,
      createdAt: new Date(),
    };
    await this.budgetsCollection.insertOne(budget);
    return budget;
  }

  async updateBudget(id: number, updateData: Partial<InsertBudget>): Promise<Budget | undefined> {
    await this.connect();
    const result = await this.budgetsCollection.findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    if (!result.value) return undefined;
    const updated = result.value;
    return {
      id: updated.id,
      categoryId: updated.categoryId,
      amount: updated.amount,
      month: updated.month,
      year: updated.year,
      createdAt: updated.createdAt,
    };
  }

  async deleteBudget(id: number): Promise<boolean> {
    await this.connect();
    const result = await this.budgetsCollection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async getBudgetByCategory(categoryId: number, month: number, year: number): Promise<Budget | undefined> {
    await this.connect();
    const budget = await this.budgetsCollection.findOne({
      categoryId,
      month,
      year,
    });
    if (!budget) return undefined;
    return {
      id: budget.id,
      categoryId: budget.categoryId,
      amount: budget.amount,
      month: budget.month,
      year: budget.year,
      createdAt: budget.createdAt,
    };
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    await this.connect();
    const user = await this.usersCollection.findOne({ id });
    if (!user) return undefined;
    return {
      id: user.id,
      username: user.username,
      password: user.password,
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.connect();
    const user = await this.usersCollection.findOne({ username });
    if (!user) return undefined;
    return {
      id: user.id,
      username: user.username,
      password: user.password,
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.connect();
    const id = await this.getNextId(this.usersCollection);
    const user: User = {
      id,
      ...insertUser,
    };
    await this.usersCollection.insertOne(user);
    return user;
  }
}