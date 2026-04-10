// Complete Theme System with Dark/Light Mode
export interface ThemeColors {
  // Primary
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Accent
  accent: string;
  accentLight: string;
  
  // Background
  background: string;
  backgroundLight: string;
  card: string;
  cardLight: string;
  
  // Status
  success: string;
  successLight: string;
  danger: string;
  dangerLight: string;
  warning: string;
  info: string;
  
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Border
  border: string;
  borderLight: string;
  
  // Gradients
  gradients: {
    primary: [string, string];
    success: [string, string];
    danger: [string, string];
    accent: [string, string];
    purple: [string, string];
    blue: [string, string];
  };
}

export const DARK_THEME: ThemeColors = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  accent: '#EC4899',
  accentLight: '#F472B6',
  background: '#0F0F1A',
  backgroundLight: '#1A1A2E',
  card: '#16213E',
  cardLight: '#1F2B4D',
  success: '#10B981',
  successLight: '#34D399',
  danger: '#EF4444',
  dangerLight: '#F87171',
  warning: '#F59E0B',
  info: '#3B82F6',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  borderLight: '#475569',
  gradients: {
    primary: ['#6366F1', '#8B5CF6'],
    success: ['#10B981', '#059669'],
    danger: ['#EF4444', '#DC2626'],
    accent: ['#EC4899', '#BE185D'],
    purple: ['#8B5CF6', '#6366F1'],
    blue: ['#3B82F6', '#2563EB'],
  }
};

export const LIGHT_THEME: ThemeColors = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  accent: '#EC4899',
  accentLight: '#F472B6',
  background: '#F8FAFC',
  backgroundLight: '#F1F5F9',
  card: '#FFFFFF',
  cardLight: '#F8FAFC',
  success: '#10B981',
  successLight: '#34D399',
  danger: '#EF4444',
  dangerLight: '#F87171',
  warning: '#F59E0B',
  info: '#3B82F6',
  text: '#1E293B',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#CBD5E1',
  gradients: {
    primary: ['#6366F1', '#8B5CF6'],
    success: ['#10B981', '#059669'],
    danger: ['#EF4444', '#DC2626'],
    accent: ['#EC4899', '#BE185D'],
    purple: ['#8B5CF6', '#6366F1'],
    blue: ['#3B82F6', '#2563EB'],
  }
};

// Backward compatibility export for static use (login/register/layouts)
export const COLORS = DARK_THEME;

// Currency symbols
export const CURRENCIES: Record<string, { symbol: string; name: Record<string, string> }> = {
  EUR: { symbol: '€', name: { pt: 'Euro', en: 'Euro' } },
};

// Language options
export const LANGUAGES: Record<string, { name: string; flag: string }> = {
  pt: { name: 'Português', flag: '🇵🇹' },
  en: { name: 'English', flag: '🇬🇧' },
};

// Complete Translations
export const TRANSLATIONS: Record<string, Record<string, string>> = {
  pt: {
    // Navigation
    dashboard: 'Painel',
    transactions: 'Transações',
    invoices: 'Faturas',
    clients: 'Clientes',
    reports: 'Relatórios',
    categories: 'Categorias',
    settings: 'Definições',
    
    // Auth
    login: 'Entrar',
    register: 'Registar',
    logout: 'Sair',
    email: 'Email',
    password: 'Palavra-passe',
    confirmPassword: 'Confirmar palavra-passe',
    name: 'Nome',
    fullName: 'Nome completo',
    welcome: 'Bem-vindo',
    welcomeBack: 'Bem-vindo de volta',
    createAccount: 'Criar conta',
    alreadyHaveAccount: 'Já tem conta?',
    dontHaveAccount: 'Não tem conta?',
    loginToContinue: 'Entre na sua conta para continuar',
    startManaging: 'Comece a gerir as suas finanças hoje',
    financialManagement: 'Gestão Financeira Simplificada',
    
    // Dashboard
    hello: 'Olá',
    overviewFinances: 'Visão geral das suas finanças',
    income: 'Receitas',
    expenses: 'Despesas',
    netProfit: 'Lucro Líquido',
    recentTransactions: 'Transações Recentes',
    expenseBreakdown: 'Análise de Despesas',
    viewAll: 'Ver Todas',
    noTransactions: 'Sem transações',
    addTransaction: 'Adicionar Transação',
    
    // Transactions
    all: 'Todos',
    noDescription: 'Sem descrição',
    deleteTransaction: 'Eliminar Transação',
    confirmDeleteTransaction: 'Tem a certeza que deseja eliminar esta transação?',
    
    // Clients
    totalClients: 'Total de Clientes',
    totalRevenue: 'Receita Total',
    noClients: 'Sem Clientes',
    addFirstClient: 'Adicione o seu primeiro cliente para acompanhar vendas e faturas',
    addClient: 'Adicionar Cliente',
    deleteClient: 'Eliminar Cliente',
    confirmDeleteClient: 'Tem a certeza que deseja eliminar este cliente?',
    searchClients: 'Pesquisar clientes...',
    sales: 'vendas',
    clientDetails: 'Detalhes do Cliente',
    contactInfo: 'Informação de Contacto',
    noEmail: 'Sem email',
    noPhone: 'Sem telefone',
    noAddress: 'Sem morada',
    notes: 'Notas',
    noNotes: 'Sem notas',
    
    // Invoices
    noInvoices: 'Sem Faturas',
    createFirstInvoice: 'Crie a sua primeira fatura para começar a faturar clientes',
    createInvoice: 'Criar Fatura',
    deleteInvoice: 'Eliminar Fatura',
    confirmDeleteInvoice: 'Tem a certeza que deseja eliminar esta fatura?',
    changeStatus: 'Alterar Estado',
    items: 'Itens',
    dueDate: 'Data de Vencimento',
    total: 'Total',
    draft: 'Rascunho',
    sent: 'Enviada',
    paid: 'Paga',
    overdue: 'Expirada',
    approved: 'Aprovada',
    
    // Reports
    overview: 'Visão Geral',
    trends: 'Tendências',
    monthly: 'Mensal',
    totalIncome: 'Receita Total',
    totalExpenses: 'Despesas Totais',
    incomeVsExpenses: 'Receitas vs Despesas',
    monthlyComparison: 'Comparação Mensal',
    noTrendData: 'Sem dados de tendência',
    noMonthlyData: 'Sem dados mensais',
    
    // Categories
    noCategories: 'Sem Categorias',
    createCategories: 'Crie categorias personalizadas para organizar as suas transações',
    addCategory: 'Adicionar Categoria',
    deleteCategory: 'Eliminar Categoria',
    confirmDeleteCategory: 'Tem a certeza que deseja eliminar esta categoria?',
    categoryName: 'Nome da Categoria',
    type: 'Tipo',
    color: 'Cor',
    icon: 'Ícone',
    
    // Settings
    profile: 'Perfil',
    account: 'Conta',
    appearance: 'Aparência',
    darkMode: 'Modo Escuro',
    language: 'Idioma',
    currency: 'Moeda',
    logoutConfirm: 'Tem a certeza que deseja sair?',
    settingsUpdated: 'Definições atualizadas',
    profilePhoto: 'Foto de Perfil',
    changePhoto: 'Alterar Foto',
    removePhoto: 'Remover Foto',
    
    // Common
    add: 'Adicionar',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    search: 'Pesquisar',
    week: 'Semana',
    month: 'Mês',
    year: 'Ano',
    optional: 'Opcional',
    required: 'Obrigatório',
    client: 'Cliente',
    selectClient: 'Selecionar cliente',
    noClientsYet: 'Ainda sem clientes',
    category: 'Categoria',
    description: 'Descrição',
    amount: 'Montante',
    date: 'Data',
    error: 'Erro',
    success: 'Sucesso',
    loading: 'A carregar...',
    basicInfo: 'Informação Básica',
    company: 'Empresa',
    phone: 'Telefone',
    address: 'Morada',
    clientInfo: 'Informação do Cliente',
    addItem: 'Adicionar Item',
    qty: 'Qtd',
    price: 'Preço',
    subtotal: 'Subtotal',
    tax: 'Imposto',
    taxRate: 'Taxa de Imposto (%)',
    additionalDetails: 'Detalhes Adicionais',
    enterAmount: 'Introduza um montante válido',
    selectACategory: 'Selecione uma categoria',
    failedToCreate: 'Falha ao criar',
    failedToDelete: 'Falha ao eliminar',
    noTransactionsYet: 'Ainda sem transações',
    transactionCount: 'Transações',
    enterCategoryName: 'Introduza o nome da categoria...',
    enterDescription: 'Introduza a descrição...',
    addNotesAboutClient: 'Adicionar notas sobre este cliente...',
    clientNamePlaceholder: 'Nome do Cliente *',
    emailPlaceholder: 'Email',
    phonePlaceholder: 'Telefone',
    companyPlaceholder: 'Empresa',
    addressPlaceholder: 'Morada',
    notesPlaceholder: 'Notas (opcional)',
    descriptionPlaceholder: 'Descrição',
    item: 'Item',
    clientNotFound: 'Cliente não encontrado',
    editProfile: 'Editar Perfil',
    dataExport: 'Exportação de Dados',
    exportTransactions: 'Exportar Transações',
    exportInvoices: 'Exportar Faturas',
    exportReport: 'Exportar Relatório',
    data: 'Dados',
    dataDescription: 'Gerir transações, relatórios e categorias',
    manageTransactions: 'Gerir Transações',
    manageTransactionsDesc: 'Receitas, despesas e histórico financeiro',
    viewReports: 'Ver Relatórios',
    viewReportsDesc: 'Análises, tendências e resumos financeiros',
    manageCategories: 'Gerir Categorias',
    manageCategoriesDesc: 'Organizar e personalizar categorias de transações',
    uploadingPhoto: 'A enviar foto...',
    photoUpdated: 'Foto atualizada com sucesso',
    photoRemoved: 'Foto removida',
    registerAsIncome: 'Registar como Receita',
    registerAsIncomeQuestion: 'Deseja registar o valor desta fatura como receita nas transações?',
    incomeRegistered: 'Receita registada com sucesso',
    editInvoice: 'Editar Fatura',
    invoiceDetails: 'Detalhes da Fatura',
    saveChanges: 'Guardar Alterações',
    invoicePayment: 'Pagamento de fatura',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    invoices: 'Invoices',
    clients: 'Clients',
    reports: 'Reports',
    categories: 'Categories',
    settings: 'Settings',
    
    // Auth
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    name: 'Name',
    fullName: 'Full name',
    welcome: 'Welcome',
    welcomeBack: 'Welcome back',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    loginToContinue: 'Login to your account to continue',
    startManaging: 'Start managing your finances today',
    financialManagement: 'Simplified Financial Management',
    
    // Dashboard
    hello: 'Hello',
    overviewFinances: 'Overview of your finances',
    income: 'Income',
    expenses: 'Expenses',
    netProfit: 'Net Profit',
    recentTransactions: 'Recent Transactions',
    expenseBreakdown: 'Expense Breakdown',
    viewAll: 'View All',
    noTransactions: 'No transactions',
    addTransaction: 'Add Transaction',
    
    // Transactions
    all: 'All',
    noDescription: 'No description',
    deleteTransaction: 'Delete Transaction',
    confirmDeleteTransaction: 'Are you sure you want to delete this transaction?',
    
    // Clients
    totalClients: 'Total Clients',
    totalRevenue: 'Total Revenue',
    noClients: 'No Clients',
    addFirstClient: 'Add your first client to track sales and invoices',
    addClient: 'Add Client',
    deleteClient: 'Delete Client',
    confirmDeleteClient: 'Are you sure you want to delete this client?',
    searchClients: 'Search clients...',
    sales: 'sales',
    clientDetails: 'Client Details',
    contactInfo: 'Contact Information',
    noEmail: 'No email',
    noPhone: 'No phone',
    noAddress: 'No address',
    notes: 'Notes',
    noNotes: 'No notes',
    
    // Invoices
    noInvoices: 'No Invoices',
    createFirstInvoice: 'Create your first invoice to start billing clients',
    createInvoice: 'Create Invoice',
    deleteInvoice: 'Delete Invoice',
    confirmDeleteInvoice: 'Are you sure you want to delete this invoice?',
    changeStatus: 'Change Status',
    items: 'Items',
    dueDate: 'Due Date',
    total: 'Total',
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
    overdue: 'Expired',
    approved: 'Approved',
    
    // Reports
    overview: 'Overview',
    trends: 'Trends',
    monthly: 'Monthly',
    totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses',
    incomeVsExpenses: 'Income vs Expenses',
    monthlyComparison: 'Monthly Comparison',
    noTrendData: 'No trend data available',
    noMonthlyData: 'No monthly data available',
    
    // Categories
    noCategories: 'No Categories',
    createCategories: 'Create custom categories to organize your transactions',
    addCategory: 'Add Category',
    deleteCategory: 'Delete Category',
    confirmDeleteCategory: 'Are you sure you want to delete this category?',
    categoryName: 'Category Name',
    type: 'Type',
    color: 'Color',
    icon: 'Icon',
    
    // Settings
    profile: 'Profile',
    account: 'Account',
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    language: 'Language',
    currency: 'Currency',
    logoutConfirm: 'Are you sure you want to logout?',
    settingsUpdated: 'Settings updated',
    profilePhoto: 'Profile Photo',
    changePhoto: 'Change Photo',
    removePhoto: 'Remove Photo',
    
    // Common
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    optional: 'Optional',
    required: 'Required',
    client: 'Client',
    selectClient: 'Select client',
    noClientsYet: 'No clients yet',
    category: 'Category',
    description: 'Description',
    amount: 'Amount',
    date: 'Date',
    error: 'Error',
    success: 'Success',
    loading: 'Loading...',
    basicInfo: 'Basic Information',
    company: 'Company',
    phone: 'Phone',
    address: 'Address',
    clientInfo: 'Client Information',
    addItem: 'Add Item',
    qty: 'Qty',
    price: 'Price',
    subtotal: 'Subtotal',
    tax: 'Tax',
    taxRate: 'Tax Rate (%)',
    additionalDetails: 'Additional Details',
    enterAmount: 'Please enter a valid amount',
    selectACategory: 'Please select a category',
    failedToCreate: 'Failed to create',
    failedToDelete: 'Failed to delete',
    noTransactionsYet: 'No transactions yet',
    transactionCount: 'Transactions',
    enterCategoryName: 'Enter category name...',
    enterDescription: 'Enter description...',
    addNotesAboutClient: 'Add notes about this client...',
    clientNamePlaceholder: 'Client Name *',
    emailPlaceholder: 'Email',
    phonePlaceholder: 'Phone',
    companyPlaceholder: 'Company',
    addressPlaceholder: 'Address',
    notesPlaceholder: 'Notes (optional)',
    descriptionPlaceholder: 'Description',
    item: 'Item',
    clientNotFound: 'Client not found',
    editProfile: 'Edit Profile',
    dataExport: 'Data Export',
    exportTransactions: 'Export Transactions',
    exportInvoices: 'Export Invoices',
    exportReport: 'Export Report',
    data: 'Data',
    dataDescription: 'Manage transactions, reports and categories',
    manageTransactions: 'Manage Transactions',
    manageTransactionsDesc: 'Income, expenses and financial history',
    viewReports: 'View Reports',
    viewReportsDesc: 'Analytics, trends and financial summaries',
    manageCategories: 'Manage Categories',
    manageCategoriesDesc: 'Organize and customize transaction categories',
    uploadingPhoto: 'Uploading photo...',
    photoUpdated: 'Photo updated successfully',
    photoRemoved: 'Photo removed',
    registerAsIncome: 'Register as Income',
    registerAsIncomeQuestion: 'Do you want to register this invoice amount as income in transactions?',
    incomeRegistered: 'Income registered successfully',
    editInvoice: 'Edit Invoice',
    invoiceDetails: 'Invoice Details',
    saveChanges: 'Save Changes',
    invoicePayment: 'Invoice payment',
  },
};
