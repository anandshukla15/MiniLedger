import { Request } from 'express';

export interface User {
  id: string;
  phone: string;
  created_at: Date;
}

export interface Loan {
  id: string;
  user_id: string;
  friend_name: string;
  amount: number;
  due_date: string; // YYYY-MM-DD
  is_repaid: boolean;
  repaid_at: Date | null;
  notes?: string | null;
  receipt_url?: string | null;
  created_at: Date;
  updated_at: Date;
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

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phone: string;
  };
}
