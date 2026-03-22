const API_BASE = '';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({ message: 'Server error' }));

  if (!res.ok) {
    // Auto-logout on 401 (token expired/invalid)
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(data.message || data.errors?.[0]?.msg || `Request failed with status ${res.status}`);
  }

  return data;
}

// ─── Auth ───────────────────────────────────────────
export const authApi = {
  register: (body: { name: string; email: string; password: string; role?: string }) =>
    request<{ success: boolean; token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ─── Users ──────────────────────────────────────────
export const usersApi = {
  getProfile: () => request<{ success: boolean; user: any }>('/api/users/profile'),
  updateProfile: (body: { name?: string; email?: string }) =>
    request<{ success: boolean; user: any }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deactivateAccount: () =>
    request<{ success: boolean }>('/api/users/profile', { method: 'DELETE' }),
  getAllUsers: (params?: string) =>
    request<{ success: boolean; users: any[]; pagination: any }>(`/api/users${params ? `?${params}` : ''}`),
  updateUserRole: (id: string, role: string) =>
    request<{ success: boolean; user: any }>(`/api/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  deactivateUser: (id: string) =>
    request<{ success: boolean; user: any }>(`/api/users/${id}/deactivate`, { method: 'PUT' }),
};

// ─── Events ─────────────────────────────────────────
export const eventsApi = {
  getAll: (params?: string) =>
    request<{ success: boolean; events: any[]; pagination: any }>(`/api/events${params ? `?${params}` : ''}`),
  getById: (id: string) =>
    request<{ success: boolean; event: any }>(`/api/events/${id}`),
  getAvailability: (id: string) =>
    request<any>(`/api/events/${id}/availability`),
  create: (body: any) =>
    request<{ success: boolean; event: any }>('/api/events', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id: string, body: any) =>
    request<{ success: boolean; event: any }>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/events/${id}`, { method: 'DELETE' }),
};

// ─── Bookings ───────────────────────────────────────
export const bookingsApi = {
  create: (body: { eventId: string; ticketCount: number; paymentMethodId: string }) =>
    request<{ success: boolean; booking: any }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getMy: (params?: string) =>
    request<{ success: boolean; bookings: any[]; pagination: any }>(`/api/bookings/my${params ? `?${params}` : ''}`),
  getAll: (params?: string) =>
    request<{ success: boolean; bookings: any[]; pagination: any }>(`/api/bookings/all${params ? `?${params}` : ''}`),
  getById: (id: string) =>
    request<{ success: boolean; booking: any }>(`/api/bookings/${id}`),
  cancel: (id: string, reason?: string) =>
    request<{ success: boolean; booking: any }>(`/api/bookings/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
};

// ─── Payments ───────────────────────────────────────
export const paymentsApi = {
  getAll: (params?: string) =>
    request<{ success: boolean; payments: any[]; pagination: any }>(`/api/payments/all${params ? `?${params}` : ''}`),
  getById: (id: string) =>
    request<{ success: boolean; payment: any }>(`/api/payments/${id}`),
};

// ─── Reviews ────────────────────────────────────────
export const reviewsApi = {
  create: (body: { eventId: string; rating: number; title: string; comment: string; eventTitle?: string }) =>
    request<{ success: boolean; review: any }>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getMy: () =>
    request<{ success: boolean; reviews: any[] }>('/api/reviews/my'),
  getByEvent: (eventId: string, params?: string) =>
    request<{ success: boolean; reviews: any[]; ratingDistribution: any[]; pagination: any }>(
      `/api/reviews/event/${eventId}${params ? `?${params}` : ''}`
    ),
  update: (id: string, body: { rating?: number; title?: string; comment?: string }) =>
    request<{ success: boolean; review: any }>(`/api/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/reviews/${id}`, { method: 'DELETE' }),
};

// ─── Notifications ──────────────────────────────────
export const notificationsApi = {
  getMy: (params?: string) =>
    request<{ success: boolean; notifications: any[]; unreadCount: number; pagination: any }>(
      `/api/notifications/my${params ? `?${params}` : ''}`
    ),
  markRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () =>
    request<{ success: boolean }>('/api/notifications/read-all', { method: 'PUT' }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}`, { method: 'DELETE' }),
};

// ─── Reports ────────────────────────────────────────
export const reportsApi = {
  getDashboard: () =>
    request<{ success: boolean; dashboard: any }>('/api/reports/dashboard'),
  getEventReport: (eventId: string) =>
    request<{ success: boolean; report: any }>(`/api/reports/events/${eventId}`),
  getRevenue: () =>
    request<{ success: boolean; revenue: any; dailyBreakdown: any[] }>('/api/reports/revenue'),
};
