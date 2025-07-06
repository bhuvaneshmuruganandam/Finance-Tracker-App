import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertBudgetSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";
import 'dotenv/config'; // or
import dotenv from 'dotenv';
dotenv.config();

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  });

  // Transactions routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const { startDate, endDate, categoryId } = req.query;
      
      let transactions;
      if (startDate && endDate) {
        transactions = await storage.getTransactionsByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else if (categoryId) {
        const categoryTransactions = await storage.getTransactionsByCategory(Number(categoryId));
        transactions = categoryTransactions.map(t => ({
          ...t,
          category: storage.getCategoryById(t.categoryId!)
        }));
      } else {
        transactions = await storage.getTransactions();
      }
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse({
        ...req.body,
        date: new Date(req.body.date),
        amount: req.body.amount.toString(),
      });
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid transaction data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create transaction" });
      }
    }
  });

  app.put("/api/transactions/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const validatedData = insertTransactionSchema.partial().parse({
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined,
        amount: req.body.amount ? req.body.amount.toString() : undefined,
      });
      const transaction = await storage.updateTransaction(id, validatedData);
      if (!transaction) {
        res.status(404).json({ error: "Transaction not found" });
      } else {
        res.json(transaction);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid transaction data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update transaction" });
      }
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteTransaction(id);
      if (!deleted) {
        res.status(404).json({ error: "Transaction not found" });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  // Budgets routes
  app.get("/api/budgets", async (req, res) => {
    try {
      const budgets = await storage.getBudgets();
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budgets" });
    }
  });

  app.post("/api/budgets", async (req, res) => {
    try {
      const validatedData = insertBudgetSchema.parse({
        ...req.body,
        amount: req.body.amount.toString(),
      });
      const budget = await storage.createBudget(validatedData);
      res.status(201).json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid budget data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create budget" });
      }
    }
  });

  app.put("/api/budgets/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const validatedData = insertBudgetSchema.partial().parse({
        ...req.body,
        amount: req.body.amount ? req.body.amount.toString() : undefined,
      });
      const budget = await storage.updateBudget(id, validatedData);
      if (!budget) {
        res.status(404).json({ error: "Budget not found" });
      } else {
        res.json(budget);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid budget data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update budget" });
      }
    }
  });

  app.delete("/api/budgets/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteBudget(id);
      if (!deleted) {
        res.status(404).json({ error: "Budget not found" });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete budget" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/summary", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const currentMonthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
      });
      
      const income = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const balance = income - expenses;
      const savingsRate = income > 0 ? ((balance / income) * 100) : 0;
      
      res.json({
        balance,
        monthlyIncome: income,
        monthlyExpenses: expenses,
        savingsRate: Math.round(savingsRate),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics summary" });
    }
  });

  app.get("/api/analytics/monthly-expenses", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const currentYear = new Date().getFullYear();
      
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthTransactions = transactions.filter(t => {
          const date = new Date(t.date);
          return date.getMonth() + 1 === month && 
                 date.getFullYear() === currentYear && 
                 t.type === 'expense';
        });
        
        const total = monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        return {
          month: new Date(currentYear, i).toLocaleDateString('en-US', { month: 'short' }),
          amount: total,
        };
      });
      
      res.json(monthlyData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monthly expenses" });
    }
  });

  app.get("/api/analytics/category-breakdown", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const categories = await storage.getCategories();
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const categoryData = categories.map(category => {
        const categoryTransactions = transactions.filter(t => {
          const date = new Date(t.date);
          return t.categoryId === category.id && 
                 date.getMonth() + 1 === currentMonth && 
                 date.getFullYear() === currentYear &&
                 t.type === 'expense';
        });
        
        const total = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        return {
          name: category.name,
          value: total,
          color: category.color,
        };
      }).filter(item => item.value > 0);
      
      res.json(categoryData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category breakdown" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
