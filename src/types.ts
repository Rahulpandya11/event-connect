/**
 * Shared Type Definitions for EventConnect
 */

export type UserRole = 'client' | 'provider' | 'admin';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type RequirementStatus = 
  | 'open' 
  | 'reviewing' 
  | 'negotiating' 
  | 'provider_selected' 
  | 'completed' 
  | 'cancelled';

export type ProposalStatus = 
  | 'submitted' 
  | 'shortlisted' 
  | 'accepted' 
  | 'rejected' 
  | 'withdrawn';

export type BookingStatus = 'confirmed' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
  phone?: string;
  city: string;
  createdAt: string;
  isSuspended: boolean;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  businessName: string;
  category: string; // e.g., "Full-Service Event Planning", "Photography", "Catering", etc.
  serviceCity: string;
  description: string;
  portfolioImages: string[];
  yearsExperience: number;
  startingPriceRange: string; // e.g., "$1,000 - $3,000" or "$$$"
  avgRating: number;
  totalReviews: number;
  verificationStatus: VerificationStatus;
  verificationDocuments: string[];
  rejectionReason?: string;
}

export interface RequirementEditHistory {
  id: string;
  editedAt: string;
  editedBy: string;
  summary: string;
  changes?: Record<string, { old: any; new: any }>;
}

export interface ProposalEditHistory {
  id: string;
  editedAt: string;
  oldPrice: number;
  newPrice: number;
  oldPlanText?: string;
  newPlanText?: string;
  summary: string;
}

export interface RequirementGroup {
  id: string;
  clientId: string;
  clientName?: string;
  eventType: string; // Wedding, Birthday, Corporate, etc.
  eventDate: string;
  city: string;
  guestCount: number;
  budgetMin?: number;
  budgetMax?: number;
  budgetHidden: boolean;
  notes?: string;
  bundleMode: 'bundled' | 'split';
  referenceImages?: string[];
  createdAt: string;
  editHistory?: RequirementEditHistory[];
}

export interface RequirementServiceDetail {
  id: string;
  requirementId: string;
  serviceType: string; // e.g. "Photography", "Catering", "Decoration"
  details: Record<string, any>; // e.g. { candid: true, drone: true, plateCount: 150 }
}

export interface Requirement {
  id: string;
  requirementGroupId: string;
  category: string; // Matches provider category or "Full-Service Event Planning"
  status: RequirementStatus;
  proposalDeadline: string;
  createdAt: string;
  // Included fields when fetched
  group?: RequirementGroup;
  services?: RequirementServiceDetail[];
  proposalsCount?: number;
  selectedProposalId?: string;
}

export interface Proposal {
  id: string;
  requirementId: string;
  providerId: string;
  totalPrice: number;
  itemizedPrices: Record<string, number>;
  planText: string;
  matchScore: number;
  status: ProposalStatus;
  submittedAt: string;
  updatedAt: string;
  priceHistory?: ProposalEditHistory[];
  // Injected for client view (anonymized vs revealed)
  anonymizedLabel?: string; // e.g. "Provider A"
  isRevealed?: boolean;
  providerInfo?: {
    businessName: string;
    category: string;
    avgRating: number;
    totalReviews: number;
    yearsExperience: number;
    portfolioImages: string[];
    verificationStatus: VerificationStatus;
  };
}

export interface PreShortlistQuestion {
  id: string;
  proposalId: string;
  clientId: string;
  questionText: string;
  answerText?: string;
  askedAt: string;
  answeredAt?: string;
}

export interface ChatThread {
  id: string;
  requirementId: string;
  proposalId: string;
  clientId: string;
  providerId: string;
  createdAt: string;
  clientName?: string;
  providerBusinessName?: string;
  requirementCategory?: string;
  eventType?: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: UserRole;
  messageText: string;
  attachmentUrl?: string;
  isQuoteUpdate?: boolean;
  quoteData?: {
    totalPrice: number;
    itemizedPrices: Record<string, number>;
    note?: string;
  };
  sentAt: string;
  readAt?: string;
}

export interface Booking {
  id: string;
  requirementId: string;
  proposalId: string;
  clientId: string;
  providerId: string;
  finalPrice: number;
  status: BookingStatus;
  eventDate: string;
  createdAt: string;
  clientName?: string;
  providerBusinessName?: string;
  category?: string;
  eventType?: string;
  hasReview?: boolean;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  reviewerName: string;
  providerId: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  isFullServiceEligible: boolean;
  isActive: boolean;
  description?: string;
}

export interface MatchScoreWeights {
  priceWeight: number;       // default 0.40
  ratingWeight: number;      // default 0.35
  completenessWeight: number;// default 0.25
}

export interface PlatformAnalytics {
  totalUsers: number;
  totalClients: number;
  totalProviders: number;
  verifiedProviders: number;
  pendingProviders: number;
  totalRequirements: number;
  bundledRequirements: number;
  splitRequirements: number;
  totalProposals: number;
  acceptedProposals: number;
  acceptanceRate: number;
  topCategories: { category: string; count: number }[];
  recentBookingsValue: number;
}
