import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function generateWeekLabel(date: Date) {
  const day = date.getDate();
  if (day <= 7) return "Week 1";
  if (day <= 14) return "Week 2";
  if (day <= 21) return "Week 3";
  return "Week 4";
}

export function MonthlyExpensesChart() {
  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ["/api/analytics/monthly-expenses"],
    refetchInterval: 5000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function CategoryBreakdownChart() {
  const { data: categoryData, isLoading } = useQuery({
    queryKey: ["/api/analytics/category-breakdown"],
    refetchInterval: 5000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData || []}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {(categoryData || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function SpendingTrendsChart() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    refetchInterval: 5000,
  });

  const processedData = useMemo(() => {
    if (!transactions) return [];

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const weekTotals: Record<string, number> = {
      "Week 1": 0,
      "Week 2": 0,
      "Week 3": 0,
      "Week 4": 0,
    };

    transactions.forEach((t: any) => {
      const date = new Date(t.date);
      if (
        t.type === "expense" &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      ) {
        const day = date.getDate();
        let weekLabel = "Week 4";
        if (day <= 7) weekLabel = "Week 1";
        else if (day <= 14) weekLabel = "Week 2";
        else if (day <= 21) weekLabel = "Week 3";

        weekTotals[weekLabel] += Number(t.amount);
      }
    });

    return Object.entries(weekTotals).map(([week, amount]) => ({ week, amount }));
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Trends (Weekly)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
              <Bar
                dataKey="amount"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}


export function BudgetComparisonChart() {
  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: ["/api/budgets"],
    refetchInterval: 5000,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    refetchInterval: 5000,
  });

  const comparisonData = useMemo(() => {
    if (!budgets || !transactions) return [];

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    return budgets.map((budget: any) => {
      const categoryTransactions = transactions.filter((t: any) => {
        const date = new Date(t.date);
        return (
          t.categoryId === budget.categoryId &&
          date.getMonth() + 1 === currentMonth &&
          date.getFullYear() === currentYear &&
          t.type === "expense"
        );
      });

      const actualAmount = categoryTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      return {
        category: budget.category?.name || "Unknown",
        budget: Number(budget.amount),
        actual: actualAmount,
      };
    });
  }, [budgets, transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget vs Actual Spending</CardTitle>
      </CardHeader>
      <CardContent>
        {budgetsLoading || transactionsLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
              <Bar dataKey="budget" fill="hsl(var(--muted-foreground))" name="Budget" />
              <Bar dataKey="actual" fill="hsl(var(--primary))" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
