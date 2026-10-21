/**
 * Currency formatter with Indian Rupee symbol or clean format
 */
export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Format a YYYY-MM-DD date string to a clean readable format (e.g. 15 Nov, 2026)
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Computes humanized relative due/repaid label
 */
export const getDueStatusInfo = (
  dueDateStr: string,
  isRepaid: boolean,
  repaidAt?: string | null
): { label: string; isOverdue: boolean; color: string; badgeBg: string } => {
  if (isRepaid) {
    let repaidText = 'Repaid';
    if (repaidAt) {
      const d = new Date(repaidAt);
      if (!isNaN(d.getTime())) {
        repaidText = `Repaid ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
      }
    }
    return {
      label: repaidText,
      isOverdue: false,
      color: '#059669',
      badgeBg: '#ECFDF5',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      label: `Overdue by ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'}`,
      isOverdue: true,
      color: '#DC2626',
      badgeBg: '#FEF2F2',
    };
  } else if (diffDays === 0) {
    return {
      label: 'Due Today',
      isOverdue: true, // Today due requires immediate attention
      color: '#EA580C',
      badgeBg: '#FFF7ED',
    };
  } else if (diffDays === 1) {
    return {
      label: 'Due Tomorrow',
      isOverdue: false,
      color: '#D97706',
      badgeBg: '#FFFBEB',
    };
  } else {
    return {
      label: `Due in ${diffDays} days`,
      isOverdue: false,
      color: '#4F46E5',
      badgeBg: '#EEF2FF',
    };
  }
};

/**
 * Returns initials from friend's full name
 */
export const getInitials = (name: string): string => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
