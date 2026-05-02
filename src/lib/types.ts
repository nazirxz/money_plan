export type TxType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TxType;
  icon: string;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  creator_name: string | null;
  category_id: string | null;
  type: TxType;
  amount: number;
  note: string | null;
  occurred_at: string;
  created_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category: Pick<Category, 'id' | 'name' | 'icon' | 'color'> | null;
}

export interface Budget {
  id: string;
  category_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export type RecurringFrequency = 'monthly' | 'weekly';

export interface RecurringRule {
  id: string;
  user_id: string;
  creator_name: string | null;
  category_id: string;
  type: TxType;
  amount: number;
  note: string | null;
  frequency: RecurringFrequency;
  day_of_month: number | null;
  day_of_week: number | null;
  start_date: string;
  end_date: string | null;
  last_generated_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringRuleWithCategory extends RecurringRule {
  category: Pick<Category, 'id' | 'name' | 'icon' | 'color'> | null;
}
