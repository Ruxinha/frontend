import { format, parseISO, isValid } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    return format(date, 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
};

export const formatDateShort = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    return format(date, 'MM/dd');
  } catch {
    return dateString;
  }
};

export const formatMonthYear = (dateString: string): string => {
  try {
    const date = parseISO(dateString + '-01');
    if (!isValid(date)) return dateString;
    return format(date, 'MMMM yyyy');
  } catch {
    return dateString;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'paid':
      return '#4CAF50';
    case 'sent':
      return '#2196F3';
    case 'approved':
      return '#FF9800';
    case 'overdue':
      return '#F44336';
    case 'draft':
    default:
      return '#9E9E9E';
  }
};
