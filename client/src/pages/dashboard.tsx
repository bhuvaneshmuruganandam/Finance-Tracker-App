import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, TrendingDown, PieChart, Plus, Edit, Trash2, Download, Filter } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { TransactionForm } from "@/components/TransactionForm";
import { BudgetForm } from "@/components/BudgetForm";
import { MonthlyExpensesChart, CategoryBreakdownChart, SpendingTrendsChart, BudgetComparisonChart } from "@/components/Charts";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { exportToCsv } from "@/lib/api";
import type { Transaction, Budget, Category } from "@shared/schema";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<(Transaction & { category: Category }) | undefined>();
  const [editingBudget, setEditingBudget] = useState<(Budget & { category: Category }) | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
    
  // Detect current section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['dashboard', 'transactions', 'charts', 'budgets'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Queries
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/analytics/summary"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ["/api/budgets"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Mutations
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Success",
        description: "Budget deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete budget",
        variant: "destructive",
      });
    },
  });

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction: Transaction & { category: Category }) => {
    const matchesCategory = !categoryFilter || categoryFilter === "all" || transaction.category?.name === categoryFilter;
    const matchesSearch = !searchTerm || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  const handleEditTransaction = (transaction: Transaction & { category: Category }) => {
    setEditingTransaction(transaction);
    setIsTransactionFormOpen(true);
  };

  const handleEditBudget = (budget: Budget & { category: Category }) => {
    setEditingBudget(budget);
    setIsBudgetFormOpen(true);
  };

  const handleExportCsv = async () => {
    try {
      await exportToCsv();
      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Dashboard Section */}
      <section id="dashboard" className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Financial Dashboard</h2>
            <p className="text-slate-600">Track your expenses, manage budgets, and visualize your financial health</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {summaryLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="card-hover">
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-4" />
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-slate-600">Total Balance</h3>
                      <div className="p-2 bg-blue-50 rounded-full">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary?.balance || 0)}</p>
                    <p className="text-sm text-success mt-1">Current balance</p>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-slate-600">Monthly Expenses</h3>
                      <div className="p-2 bg-red-50 rounded-full">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary?.monthlyExpenses || 0)}</p>
                    <p className="text-sm text-slate-500 mt-1">This month</p>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-slate-600">Monthly Income</h3>
                      <div className="p-2 bg-green-50 rounded-full">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary?.monthlyIncome || 0)}</p>
                    <p className="text-sm text-success mt-1">This month</p>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-slate-600">Savings Rate</h3>
                      <div className="p-2 bg-purple-50 rounded-full">
                        <PieChart className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{summary?.savingsRate || 0}%</p>
                    <p className="text-sm text-success mt-1">Monthly rate</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Recent Transactions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16 mb-1" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((transaction: Transaction & { category: Category }) => (
                    <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'income' ? 'bg-green-50' : 'bg-blue-50'
                        }`}>
                          {transaction.type === 'income' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{transaction.description}</p>
                          <p className="text-xs text-slate-500">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          transaction.type === 'income' ? 'text-success' : 'text-danger'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                        </p>
                        <p className="text-xs text-slate-500">{transaction.category?.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No transactions yet</p>
                  <Button
                    onClick={() => setIsTransactionFormOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Transaction
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Transactions Section */}
      <section id="transactions" className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Transactions</h2>
                <p className="text-slate-600">Manage your income and expenses</p>
              </div>
              <Button
                onClick={() => {
                  setEditingTransaction(undefined);
                  setIsTransactionFormOpen(true);
                }}
                className="mt-4 md:mt-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>

            {/* Transaction Form */}
            <TransactionForm
              isOpen={isTransactionFormOpen}
              onClose={() => {
                setIsTransactionFormOpen(false);
                setEditingTransaction(undefined);
              }}
              transaction={editingTransaction}
            />

            {/* Transaction Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Transaction List */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredTransactions.length > 0 ? (
                      filteredTransactions.map((transaction: Transaction & { category: Category }) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline" style={{ backgroundColor: transaction.category?.color + '20', borderColor: transaction.category?.color }}>
                              {transaction.category?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={transaction.type === 'income' ? 'text-success' : 'text-danger'}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTransaction(transaction)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section id="charts" className="py-8 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Financial Analytics</h2>
            <p className="text-slate-600">Visualize your spending patterns and trends</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MonthlyExpensesChart />
            <CategoryBreakdownChart />
            <div className="lg:col-span-2">
              <SpendingTrendsChart />
            </div>
          </div>
        </div>
      </section>

      {/* Budgets Section */}
      <section id="budgets" className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Budget Management</h2>
                <p className="text-slate-600">Set and track your monthly spending limits</p>
              </div>
              <Button
                onClick={() => {
                  setEditingBudget(undefined);
                  setIsBudgetFormOpen(true);
                }}
                className="mt-4 md:mt-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Set Budget
              </Button>
            </div>

            {/* Budget Form */}
            <BudgetForm
              isOpen={isBudgetFormOpen}
              onClose={() => {
                setIsBudgetFormOpen(false);
                setEditingBudget(undefined);
              }}
              budget={editingBudget}
            />

            {/* Budget Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {budgetsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-32 mb-4" />
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-2 w-full mb-4" />
                      <Skeleton className="h-4 w-20" />
                    </CardContent>
                  </Card>
                ))
              ) : budgets.length > 0 ? (
                budgets.map((budget: Budget & { category: Category }) => {
                  const currentMonth = new Date().getMonth() + 1;
                  const currentYear = new Date().getFullYear();
                  const spent = transactions
                    .filter((t: Transaction) => {
                      const date = new Date(t.date);
                      return t.categoryId === budget.categoryId &&
                             date.getMonth() + 1 === currentMonth &&
                             date.getFullYear() === currentYear &&
                             t.type === 'expense';
                    })
                    .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
                  
                  const budgetAmount = Number(budget.amount);
                  const percentage = (spent / budgetAmount) * 100;
                  const remaining = budgetAmount - spent;
                  
                  return (
                    <Card key={budget.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-900">{budget.category.name}</h3>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditBudget(budget)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBudgetMutation.mutate(budget.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-600">Spent</span>
                            <span className="text-sm font-medium text-slate-900">
                              {formatCurrency(spent)} / {formatCurrency(budgetAmount)}
                            </span>
                          </div>
                          <Progress value={Math.min(percentage, 100)} className="h-2" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">
                            {remaining >= 0 ? "Remaining" : "Over Budget"}
                          </span>
                          <span className={`text-sm font-medium ${
                            remaining >= 0 ? "text-success" : "text-danger"
                          }`}>
                            {remaining >= 0 ? formatCurrency(remaining) : formatCurrency(Math.abs(remaining))}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="p-6 text-center">
                    <p className="text-slate-500 mb-4">No budgets set yet</p>
                    <Button
                      onClick={() => setIsBudgetFormOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Set Your First Budget
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Budget vs Actual Chart */}
            {budgets.length > 0 && <BudgetComparisonChart />}
          </div>
        </div>
      </section>
      {/* Export Section */}
      <section className="py-8 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Export Your Data</h2>
            <p className="text-slate-600 mb-6">Download your financial data as a CSV file</p>
            <Button onClick={handleExportCsv}>
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
          </div>
        </div>
      </section>
      </div>
  );
}


