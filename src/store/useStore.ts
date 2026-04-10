import { create } from 'zustand';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

export interface Client {
  id: string;
  name: string;
  type?: string;
  nif?: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  notes: string;
  total_revenue: number;
  transaction_count: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string;
  category_name: string;
  description: string;
  date: string;
  client_id?: string;
  client_name?: string;
  created_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id?: string;
  client_name: string;
  client_email: string;
  client_address: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  notes: string;
  created_at: string;
}

export interface FinancialSummary {
  period: string;
  total_income: number;
  total_expenses: number;
  net_profit: number;
  transaction_count: number;
  income_by_category: Record<string, number>;
  expense_by_category: Record<string, number>;
}

interface AppState {
  categories: Category[];
  clients: Client[];
  transactions: Transaction[];
  invoices: Invoice[];
  summary: FinancialSummary | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCategories: (categories: Category[]) => void;
  setClients: (clients: Client[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setInvoices: (invoices: Invoice[]) => void;
  setSummary: (summary: FinancialSummary) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addTransaction: (transaction: Transaction) => void;
  removeTransaction: (id: string) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  removeInvoice: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  removeClient: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  categories: [],
  clients: [],
  transactions: [],
  invoices: [],
  summary: null,
  isLoading: false,
  error: null,

  setCategories: (categories) => set({ categories }),
  setClients: (clients) => set({ clients }),
  setTransactions: (transactions) => set({ transactions }),
  setInvoices: (invoices) => set({ invoices }),
  setSummary: (summary) => set({ summary }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  addTransaction: (transaction) =>
    set((state) => ({ transactions: [transaction, ...state.transactions] })),
  
  removeTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),
  
  addInvoice: (invoice) =>
    set((state) => ({ invoices: [invoice, ...state.invoices] })),
  
  updateInvoice: (id, updates) =>
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === id ? { ...inv, ...updates } : inv
      ),
    })),
  
  removeInvoice: (id) =>
    set((state) => ({
      invoices: state.invoices.filter((inv) => inv.id !== id),
    })),
  
  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),
  
  removeCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),

  updateCategory: (id: string, updates: Partial<Category>) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  addClient: (client) =>
    set((state) => ({ clients: [client, ...state.clients] })),
  
  updateClient: (id, updates) =>
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  
  removeClient: (id) =>
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
    })),
}));
