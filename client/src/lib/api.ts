import { apiRequest } from "./queryClient";

export async function exportToCsv() {
  try {
    const response = await fetch('/api/transactions');
    const transactions = await response.json();
    
    const csvHeader = 'Date,Description,Category,Amount,Type\n';
    const csvData = transactions.map((t: any) => 
      `${new Date(t.date).toLocaleDateString()},${t.description},${t.category?.name || ''},${t.amount},${t.type}`
    ).join('\n');
    
    const csvContent = csvHeader + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export CSV:', error);
    throw new Error('Failed to export data');
  }
}

export async function exportToPdf() {
  // This would integrate with a PDF generation service
  throw new Error('PDF export not implemented yet');
}

export async function emailReport() {
  // This would integrate with an email service
  throw new Error('Email report not implemented yet');
}
