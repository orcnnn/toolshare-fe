// src/services/api.ts
export const API_BASE_URL = 'http://localhost:8001';

// --- Types (Backend schemas.py'den alınmıştır) ---
export interface User {
  user_id: number;
  user_name: string;
  avg_scr: number;
  rev_cnt: number;
  created_at: string;
  role?: string;
}

export interface UserCreate {
  user_name: string;
  password: string;
}

export interface UserLogin {
  user_name: string;
  password: string;
}

export interface Category {
  category_id: number;
  category_name: string;
  description: string | null;
  created_at: string;
}

export interface CategoryCreate {
  category_name: string;
  description?: string;
}

export interface Tool {
  tool_id: number;
  tool_name: string;
  user_id: number;
  category_id: number | null;
  created_at: string;
}

export interface ToolCreate {
  tool_name: string;
  user_id: number;
  category_id?: number;
}

export interface ToolWithCategory extends Tool {
  category: Category | null;
}

export type ToolStatusType = 'never_reserved' | 'currently_available' | 'currently_rented' | string;

export interface ToolWithStatus {
  tool_id: number;
  tool_name: string;
  category_id: number | null;
  category_name: string | null;
  owner_id: number;
  owner_name: string;
  status: string; // "Şu An Kirada", "Şu An Müsait", "Hiç Kiralanmamış" etc.
  current_borrower_id: number | null;
  current_borrower_name: string | null;
}

export interface ToolAvailability {
  check_date: string;
  day_name: string;
  is_available: boolean;
  reservation_id: number | null;
  borrower_id?: number | null;
  borrower_name: string | null;
  reservation_start: string | null;
  reservation_end: string | null;
}

export interface Reservation {
  reservation_id: number;
  user_id: number;
  tool_id: number;
  start_t: string;
  end_t: string;
  created_at: string;
}

export interface ReservationCreate {
  user_id: number;
  tool_id: number;
  start_t: string;
  end_t: string;
}

export interface Review {
  review_id: number;
  score: number;
  reservation_id: number;
  user_id_reviewer: number;
  user_id_target: number;
  created_at: string;
}

export interface ReviewCreate {
  score: number;
  reservation_id: number;
  user_id_reviewer: number;
  user_id_target: number;
}

export interface UserReviewDetail {
  review_id: number;
  score: number;
  review_type: string;
  reviewer_id: number;
  reviewer_name: string;
  target_id: number;
  target_name: string;
  tool_id: number;
  tool_name: string;
  reservation_start: string;
  reservation_end: string;
  review_created_at: string;
}

// --- Analytics Types ---
export interface TopUserStats {
  user_id: number;
  user_name: string;
  avg_scr: number;
  rev_cnt: number;
  rank: number;
}

export interface BorrowHistoryItem {
  reservation_id: number;
  tool_id: number;
  tool_name: string;
  start_t: string;
  end_t: string;
  status: string; // 'Aktif', 'Tamamlandı', vb.
  owner_id: number;
  owner_name: string;
  created_at: string;
}

export interface AvailableToolSearch {
  tool_id: number;
  tool_name: string;
  owner_id: number;
  owner_name: string;
  category_name: string | null;
  first_available_date: string;
  availability_gap_days: number;
}

export interface LendingPerformance {
  total_tools_owned: number
  total_times_lent: number
  active_loans: number
  completed_loans: number
  avg_rating: number
  five_star_reviews: number
  four_star_reviews: number
  three_star_reviews: number
  two_star_reviews: number
  one_star_reviews: number
  total_reviews: number
  days_analyzed: number
}

// --- Views Types ---
export interface RecentReservationView {
  reservation_id: number
  borrower_name: string
  owner_name: string
  tool_name: string
  start_t: string
  end_t: string
  
  duration: string
  status: string
}

export interface UserActivityView {
  user_id: number;
  user_name: string;
  avg_scr: number;
  rev_cnt: number;
  is_borrower: boolean;
  is_lender: boolean;
}

export interface DualRoleUserView {
  user_id: number;
  user_name: string;
  avg_scr: number;
  rev_cnt: number;
  total_borrowing_count: number;
  total_lending_count: number;
}

// --- Statistics Types (Set Operations: UNION, INTERSECT, EXCEPT) ---
export interface AllActiveUsersStats {
  user_id: number;
  user_name: string;
  activity_type: string; // 'Borrower' or 'Lender'
}

export interface DualRoleUsersStats {
  user_id: number;
  user_name: string;
}

export interface LendersOnlyStats {
  user_id: number;
  user_name: string;
}

export interface SystemStatisticsSummary {
  total_users: number;
  total_tools: number;
  total_reservations: number;
  total_reviews: number;
  active_borrowers: number;
  active_lenders: number;
  avg_tools_per_owner: number | null;
}

// --- Helper Function ---
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Bir hata oluştu' }));
    throw new Error(error.detail || 'API isteği başarısız');
  }
  return response.json();
}

// --- USER API ---
export const userApi = {
  create: async (user: UserCreate): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/USER/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    return handleResponse<User>(res);
  },

  login: async (credentials: UserLogin): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/USER/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse<User>(res);
  },

  getById: async (userId: number): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/USER/${userId}`);
    return handleResponse<User>(res);
  },

  getScore: async (userId: number): Promise<number> => {
    const res = await fetch(`${API_BASE_URL}/USER/${userId}/score`);
    return handleResponse<number>(res);
  },

  getTools: async (userId: number): Promise<Tool[]> => {
    const res = await fetch(`${API_BASE_URL}/USER/${userId}/tools`);
    return handleResponse<Tool[]>(res);
  },

  getReservations: async (userId: number): Promise<Reservation[]> => {
    const res = await fetch(`${API_BASE_URL}/USER/${userId}/reservations`);
    return handleResponse<Reservation[]>(res);
  },

  getTakenReviews: async (userId: number): Promise<Review[]> => {
    const res = await fetch(`${API_BASE_URL}/USER/${userId}/taken_reviews`);
    return handleResponse<Review[]>(res);
  },

  getSubmittedReviews: async (userId: number): Promise<Review[]> => {
    const res = await fetch(`${API_BASE_URL}/USER/${userId}/submitted_reviews`);
    return handleResponse<Review[]>(res);
  },

  getReviewsDetailed: async (
    userId: number, 
    reviewType: 'received' | 'submitted' | 'all' = 'all',
    limit: number = 50
  ): Promise<UserReviewDetail[]> => {
    const params = new URLSearchParams();
    params.append('review_type', reviewType);
    params.append('limit', limit.toString());
    
    const res = await fetch(`${API_BASE_URL}/USER/${userId}/reviews_detailed?${params.toString()}`);
    return handleResponse<UserReviewDetail[]>(res);
  },

  delete: async (userId: number): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/USER/${userId}`, { method: 'DELETE' });
    return handleResponse<User>(res);
  },
};

// --- CATEGORY API ---
export const categoryApi = {
  create: async (category: CategoryCreate): Promise<Category> => {
    const res = await fetch(`${API_BASE_URL}/CATEGORY/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return handleResponse<Category>(res);
  },

  getAll: async (): Promise<Category[]> => {
    const res = await fetch(`${API_BASE_URL}/CATEGORY/`);
    return handleResponse<Category[]>(res);
  },

  getById: async (categoryId: number): Promise<Category> => {
    const res = await fetch(`${API_BASE_URL}/CATEGORY/${categoryId}`);
    return handleResponse<Category>(res);
  },

  getTools: async (categoryId: number): Promise<Tool[]> => {
    const res = await fetch(`${API_BASE_URL}/CATEGORY/${categoryId}/tools`);
    return handleResponse<Tool[]>(res);
  },

  delete: async (categoryId: number): Promise<Category> => {
    const res = await fetch(`${API_BASE_URL}/CATEGORY/${categoryId}`, { method: 'DELETE' });
    return handleResponse<Category>(res);
  },
};

// --- TOOL API ---
export const toolApi = {
  create: async (tool: ToolCreate): Promise<Tool> => {
    const res = await fetch(`${API_BASE_URL}/TOOL/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tool),
    });
    return handleResponse<Tool>(res);
  },

  getAll: async (): Promise<Tool[]> => {
    const res = await fetch(`${API_BASE_URL}/TOOL/`);
    return handleResponse<Tool[]>(res);
  },

  getById: async (toolId: number): Promise<Tool> => {
    const res = await fetch(`${API_BASE_URL}/TOOL/${toolId}`);
    return handleResponse<Tool>(res);
  },

  getAvailable: async (startDate?: string, endDate?: string): Promise<Tool[]> => {
    let url = `${API_BASE_URL}/TOOL/available`;
    const params = new URLSearchParams();
    if (startDate) params.append('start_t', startDate);
    if (endDate) params.append('end_t', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    return handleResponse<Tool[]>(res);
  },

  getAvailability: async (
    toolId: number,
    startDate?: string,
    daysAhead: number = 30
  ): Promise<ToolAvailability[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    params.append('days_ahead', daysAhead.toString());

    const res = await fetch(`${API_BASE_URL}/TOOL/${toolId}/availability?${params.toString()}`);
    return handleResponse<ToolAvailability[]>(res);
  },

  getReviews: async (toolId: number): Promise<Review[]> => {
    const res = await fetch(`${API_BASE_URL}/TOOL/${toolId}/reviews`);
    return handleResponse<Review[]>(res);
  },

  getReservations: async (toolId: number): Promise<Reservation[]> => {
    const res = await fetch(`${API_BASE_URL}/TOOL/${toolId}/reservations`);
    return handleResponse<Reservation[]>(res);
  },

  getByStatus: async (filterType: 'never_reserved' | 'currently_available' | 'currently_rented' | 'all' = 'all'): Promise<ToolWithStatus[]> => {
    const res = await fetch(`${API_BASE_URL}/TOOL/by-status?filter_type=${filterType}`);
    return handleResponse<ToolWithStatus[]>(res);
  },
};

// --- RESERVATION API ---
export const reservationApi = {
  create: async (reservation: ReservationCreate): Promise<Reservation> => {
    const res = await fetch(`${API_BASE_URL}/RESERVATION/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation),
    });
    return handleResponse<Reservation>(res);
  },

  getCurrent: async (currentTime?: string): Promise<Reservation[]> => {
    let url = `${API_BASE_URL}/RESERVATION/`;
    if (currentTime) url += `?current_time=${currentTime}`;

    const res = await fetch(url);
    return handleResponse<Reservation[]>(res);
  },

  getRecentView: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE_URL}/RESERVATION/view-recent`);
    return handleResponse<any[]>(res);
  },

  finish: async (reservationId: number): Promise<Reservation> => {
    const res = await fetch(`${API_BASE_URL}/RESERVATION/${reservationId}/finish`, {
      method: 'PATCH',
    });
    return handleResponse<Reservation>(res);
  },
};

// --- REVIEW API ---
export const reviewApi = {
  create: async (review: ReviewCreate): Promise<Review> => {
    const res = await fetch(`${API_BASE_URL}/REVIEW/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    });
    return handleResponse<Review>(res);
  },
};

// --- ANALYTICS API ---
export const analyticsApi = {
  getTopUsers: async (): Promise<TopUserStats[]> => {
    const res = await fetch(`${API_BASE_URL}/analytics/top-users`);
    return handleResponse<TopUserStats[]>(res);
  },

  getBorrowHistory: async (userId: number, limit: number = 10): Promise<BorrowHistoryItem[]> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    const res = await fetch(`${API_BASE_URL}/analytics/history/${userId}?${params.toString()}`);
    return handleResponse<BorrowHistoryItem[]>(res);
  },

  searchAvailableTools: async (keyword?: string, daysAhead: number = 30): Promise<AvailableToolSearch[]> => {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    params.append('days_ahead', daysAhead.toString());
    const res = await fetch(`${API_BASE_URL}/analytics/search-tools?${params.toString()}`);
    return handleResponse<AvailableToolSearch[]>(res);
  },

  getLenderPerformance: async (userId: number, months: number = 3): Promise<LendingPerformance[]> => {
    const params = new URLSearchParams();
    params.append('months', months.toString());
    const res = await fetch(`${API_BASE_URL}/analytics/performance/${userId}?${params.toString()}`);
    return handleResponse<LendingPerformance[]>(res);
  },
};

// --- VIEWS API ---
export const viewsApi = {
  getRecentReservations: async (): Promise<RecentReservationView[]> => {
    const res = await fetch(`${API_BASE_URL}/views/recent-reservations`);
    return handleResponse<RecentReservationView[]>(res);
  },

  getAllActiveUsers: async (excludeName: string = 'Mehmet'): Promise<UserActivityView[]> => {
    const params = new URLSearchParams();
    params.append('exclude_name', excludeName);
    const res = await fetch(`${API_BASE_URL}/views/all-active-users?${params.toString()}`);
    return handleResponse<UserActivityView[]>(res);
  },

  getDualRoleUsers: async (excludeName: string = 'Mehmet'): Promise<DualRoleUserView[]> => {
    const params = new URLSearchParams();
    params.append('exclude_name', excludeName);
    const res = await fetch(`${API_BASE_URL}/views/dual-role-users?${params.toString()}`);
    return handleResponse<DualRoleUserView[]>(res);
  },
};

// --- STATISTICS API (Set Operations: UNION, INTERSECT, EXCEPT) ---
export const statisticsApi = {
  getSystemSummary: async (): Promise<SystemStatisticsSummary> => {
    const res = await fetch(`${API_BASE_URL}/statistics/summary`);
    return handleResponse<SystemStatisticsSummary>(res);
  },

  getAllActiveUsers: async (): Promise<AllActiveUsersStats[]> => {
    const res = await fetch(`${API_BASE_URL}/statistics/all-active-users`);
    return handleResponse<AllActiveUsersStats[]>(res);
  },

  getDualRoleUsers: async (): Promise<DualRoleUsersStats[]> => {
    const res = await fetch(`${API_BASE_URL}/statistics/dual-role-users`);
    return handleResponse<DualRoleUsersStats[]>(res);
  },

  getLendersOnly: async (): Promise<LendersOnlyStats[]> => {
    const res = await fetch(`${API_BASE_URL}/statistics/lenders-only`);
    return handleResponse<LendersOnlyStats[]>(res);
  },
};