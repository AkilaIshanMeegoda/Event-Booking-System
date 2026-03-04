export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    music: 'bg-purple-100 text-purple-700',
    concert: 'bg-indigo-100 text-indigo-700',
    sports: 'bg-green-100 text-green-700',
    conference: 'bg-blue-100 text-blue-700',
    theater: 'bg-red-100 text-red-700',
    workshop: 'bg-yellow-100 text-yellow-700',
    festival: 'bg-pink-100 text-pink-700',
    meetup: 'bg-teal-100 text-teal-700',
    other: 'bg-gray-100 text-gray-700',
  };
  return colors[category] || colors.other;
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getPaymentStatusColor(status: string) {
  return getStatusColor(status);
}
