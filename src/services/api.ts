import {
  User,
  ProviderProfile,
  RequirementGroup,
  Requirement,
  Proposal,
  PreShortlistQuestion,
  ChatThread,
  ChatMessage,
  Booking,
  Review,
  NotificationItem,
  ServiceCategory,
  MatchScoreWeights,
  PlatformAnalytics
} from '../types';

async function fetchJson(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'API Request failed');
  }
  return data;
}

export const api = {
  // Auth
  register: (payload: any) => fetchJson('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (credentials: any) => fetchJson('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => fetchJson('/api/auth/logout', { method: 'POST' }),
  getMe: () => fetchJson('/api/auth/me'),

  // Categories & Settings
  getCategories: () => fetchJson('/api/categories'),
  getNotifications: () => fetchJson('/api/notifications'),
  markNotificationsRead: () => fetchJson('/api/notifications/read-all', { method: 'POST' }),

  // Client Requirements
  createRequirement: (payload: any) => fetchJson('/api/requirements', { method: 'POST', body: JSON.stringify(payload) }),
  getMyRequirementGroups: () => fetchJson('/api/requirements/my-groups'),
  getRequirementDetails: (id: string) => fetchJson(`/api/requirements/${id}`),
  updateRequirementGroup: (id: string, payload: any) => fetchJson(`/api/requirements/group/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteRequirementGroup: (id: string) => fetchJson(`/api/requirements/group/${id}`, { method: 'DELETE' }),
  deleteRequirement: (id: string) => fetchJson(`/api/requirements/${id}`, { method: 'DELETE' }),

  // Provider Requirements & Verification
  getOpenRequirements: () => fetchJson('/api/requirements/open'),
  submitProposal: (payload: any) => fetchJson('/api/proposals', { method: 'POST', body: JSON.stringify(payload) }),
  updateProposal: (id: string, payload: any) => fetchJson(`/api/proposals/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProposal: (id: string) => fetchJson(`/api/proposals/${id}`, { method: 'DELETE' }),
  submitProviderVerification: (payload: any) => fetchJson('/api/provider/verification', { method: 'POST', body: JSON.stringify(payload) }),

  // Proposal Actions
  shortlistProposal: (id: string) => fetchJson(`/api/proposals/${id}/shortlist`, { method: 'POST' }),
  rejectProposal: (id: string) => fetchJson(`/api/proposals/${id}/reject`, { method: 'POST' }),
  acceptProposal: (id: string) => fetchJson(`/api/proposals/${id}/accept`, { method: 'POST' }),

  // Q&A
  getQuestions: (proposalId: string) => fetchJson(`/api/proposals/${proposalId}/questions`),
  askQuestion: (proposalId: string, questionText: string) => fetchJson(`/api/proposals/${proposalId}/questions`, { method: 'POST', body: JSON.stringify({ questionText }) }),
  answerQuestion: (questionId: string, answerText: string) => fetchJson(`/api/questions/${questionId}/answer`, { method: 'POST', body: JSON.stringify({ answerText }) }),

  // Chat
  getChatThreads: () => fetchJson('/api/chat/threads'),
  getChatMessages: (threadId: string) => fetchJson(`/api/chat/threads/${threadId}/messages`),
  sendMessage: (threadId: string, payload: { messageText?: string; attachmentUrl?: string; isQuoteUpdate?: boolean; quoteData?: any }) =>
    fetchJson(`/api/chat/threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify(payload) }),

  // Bookings & Reviews
  getBookings: () => fetchJson('/api/bookings'),
  completeBooking: (id: string) => fetchJson(`/api/bookings/${id}/complete`, { method: 'POST' }),
  submitReview: (bookingId: string, rating: number, comment: string) => fetchJson(`/api/bookings/${bookingId}/review`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),

  // Admin
  getPendingProviders: () => fetchJson('/api/admin/pending-providers'),
  verifyProvider: (id: string, status: 'verified' | 'rejected', rejectionReason?: string) =>
    fetchJson(`/api/admin/providers/${id}/verify`, { method: 'POST', body: JSON.stringify({ status, rejectionReason }) }),
  getAdminUsers: () => fetchJson('/api/admin/users'),
  toggleSuspendUser: (id: string) => fetchJson(`/api/admin/users/${id}/suspend`, { method: 'POST' }),
  getMatchWeights: () => fetchJson('/api/admin/match-weights'),
  updateMatchWeights: (weights: MatchScoreWeights) => fetchJson('/api/admin/match-weights', { method: 'PUT', body: JSON.stringify(weights) }),
  getAnalytics: () => fetchJson('/api/admin/analytics'),
  getAdminCategories: () => fetchJson('/api/admin/categories'),
  createCategory: (category: any) => fetchJson('/api/admin/categories', { method: 'POST', body: JSON.stringify(category) })
};
