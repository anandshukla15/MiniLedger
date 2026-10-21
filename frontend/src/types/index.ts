export interface User {
  id: string;
  phone: string;
  created_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  friend_name: string;
  amount: number;
  due_date: string; // YYYY-MM-DD
  is_repaid: boolean;
  repaid_at?: string | null;
  notes?: string | null;
  receipt_url?: string | null;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean;
}

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  pendingAmount: number;
  activeLoansCount: number;
  repaidLoansCount: number;
  overdueLoansCount: number;
}

export interface CreateLoanInput {
  friend_name: string;
  amount: number;
  due_date: string;
  notes?: string;
  receiptUri?: string;
}

export type FilterStatus = 'all' | 'pending' | 'overdue' | 'repaid';
