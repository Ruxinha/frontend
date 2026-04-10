import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Categories API
export const categoriesApi = {
  getAll: () => apiClient.get('/categories'),
  create: (data: { name: string; type: string; color: string; icon: string }) =>
    apiClient.post('/categories', data),
  update: (id: string, data: any) => apiClient.put(`/categories/${id}`, data),
  delete: (id: string) => apiClient.delete(`/categories/${id}`),
};

// Transactions API
export const transactionsApi = {
  getAll: (params?: { type?: string; category_id?: string; limit?: number }) =>
    apiClient.get('/transactions', { params }),
  create: (data: {
    amount: number;
    type: string;
    category_id: string;
    category_name: string;
    description: string;
    date: string;
  }) => apiClient.post('/transactions', data),
  update: (id: string, data: any) => apiClient.put(`/transactions/${id}`, data),
  delete: (id: string) => apiClient.delete(`/transactions/${id}`),
};

// Invoices API
export const invoicesApi = {
  getAll: (params?: { status?: string; limit?: number }) =>
    apiClient.get('/invoices', { params }),
  getById: (id: string) => apiClient.get(`/invoices/${id}`),
  create: (data: any) => apiClient.post('/invoices', data),
  update: (id: string, data: any) => apiClient.put(`/invoices/${id}`, data),
  delete: (id: string) => apiClient.delete(`/invoices/${id}`),
};

// Reports API
export const reportsApi = {
  getSummary: (period: string) => apiClient.get('/reports/summary', { params: { period } }),
  getTrends: (period: string) => apiClient.get('/reports/trends', { params: { period } }),
  getMonthly: (year?: number) => apiClient.get('/reports/monthly', { params: { year } }),
};

// Clients API
export const clientsApi = {
  getAll: (params?: { search?: string; limit?: number }) =>
    apiClient.get('/clients', { params }),
  getById: (id: string) => apiClient.get(`/clients/${id}`),
  create: (data: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    notes?: string;
  }) => apiClient.post('/clients', data),
  update: (id: string, data: any) => apiClient.put(`/clients/${id}`, data),
  delete: (id: string) => apiClient.delete(`/clients/${id}`),
  getTransactions: (id: string) => apiClient.get(`/clients/${id}/transactions`),
};

// Export API
export const exportApi = {
  getTransactionsUrl: (params?: { type?: string; start_date?: string; end_date?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append('type', params.type);
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    const queryString = searchParams.toString();
    return `${BACKEND_URL}/api/export/transactions${queryString ? `?${queryString}` : ''}`;
  },
  getInvoicesUrl: (params?: { status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    const queryString = searchParams.toString();
    return `${BACKEND_URL}/api/export/invoices${queryString ? `?${queryString}` : ''}`;
  },
  getReportUrl: (period: string) => {
    return `${BACKEND_URL}/api/export/report?period=${period}`;
  },
};

export default apiClient;
