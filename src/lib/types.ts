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
