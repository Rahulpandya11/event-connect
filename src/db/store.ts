import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  ProviderProfile,
  RequirementGroup,
  Requirement,
  RequirementServiceDetail,
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
} from '../types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'eventconnect_db.json');

interface DatabaseSchema {
  users: User[];
  providerProfiles: ProviderProfile[];
  requirementGroups: RequirementGroup[];
  requirements: Requirement[];
  requirementServices: RequirementServiceDetail[];
  proposals: Proposal[];
  preShortlistQuestions: PreShortlistQuestion[];
  chatThreads: ChatThread[];
  chatMessages: ChatMessage[];
  bookings: Booking[];
  reviews: Review[];
  notifications: NotificationItem[];
  serviceCategories: ServiceCategory[];
  platformSettings: {
    matchScoreWeights: MatchScoreWeights;
    launchCity: string;
  };
}

let dbMemory: DatabaseSchema;

export function initDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Seed default dataset
  const passwordHash = bcrypt.hashSync('password123', 10);
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbMemory = JSON.parse(raw);
      console.log('Database loaded successfully from file store.');
      
      // Ensure all loaded users have a valid passwordHash
      let updated = false;
      for (const u of dbMemory.users || []) {
        if (!u.passwordHash) {
          u.passwordHash = u.email.toLowerCase() === 'rahul@gmail.com' ? adminPasswordHash : passwordHash;
          updated = true;
        }
      }
      if (updated) {
        saveDatabase();
      }

      return dbMemory;
    } catch (err) {
      console.error('Failed to parse database file, re-seeding:', err);
    }
  }

  const defaultCategories: ServiceCategory[] = [
    { id: 'cat-1', name: 'Full-Service Event Planning', isFullServiceEligible: true, isActive: true, description: 'Complete end-to-end event design, coordination, and management.' },
    { id: 'cat-2', name: 'Photography', isFullServiceEligible: false, isActive: true, description: 'Candid, traditional, drone, and pre-wedding photo coverage.' },
    { id: 'cat-3', name: 'Catering', isFullServiceEligible: false, isActive: true, description: 'Multi-cuisine, buffet, plated meals, appetizers, and beverages.' },
    { id: 'cat-4', name: 'Decoration & Floral', isFullServiceEligible: false, isActive: true, description: 'Stage decor, theme lighting, floral arrangements, and mandate setup.' },
    { id: 'cat-5', name: 'Videography', isFullServiceEligible: false, isActive: true, description: 'Cinematic wedding films, highlight reels, and live broadcasts.' },
    { id: 'cat-6', name: 'Venue', isFullServiceEligible: false, isActive: true, description: 'Banquet halls, open lawns, beach resorts, and luxury villas.' },
    { id: 'cat-7', name: 'DJ & Sound', isFullServiceEligible: false, isActive: true, description: 'Professional DJ equipment, light show, sound system, and MC.' },
    { id: 'cat-8', name: 'Makeup & Styling', isFullServiceEligible: false, isActive: true, description: 'Bridal makeup, party styling, hair design, and drape setup.' },
    { id: 'cat-9', name: 'Invitations', isFullServiceEligible: false, isActive: true, description: 'Digital & physical invitations, custom wax seals, and wedding websites.' },
    { id: 'cat-10', name: 'Transportation', isFullServiceEligible: false, isActive: true, description: 'Luxury cars, vintage vehicles, guest shuttles, and driver service.' }
  ];

  const defaultUsers: User[] = [
    {
      id: 'usr-admin-1',
      name: 'Admin (Rahul)',
      email: 'rahul@gmail.com',
      role: 'admin',
      passwordHash: adminPasswordHash,
      phone: '+91 98765 43210',
      city: 'Surat, Gujarat, India',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      isSuspended: false
    },
    {
      id: 'usr-client-1',
      name: 'Sarah Jenkins',
      email: 'sarah.client@example.com',
      role: 'client',
      passwordHash,
      phone: '+91 98765 12345',
      city: 'Surat, Gujarat, India',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      isSuspended: false
    },
    {
      id: 'usr-client-2',
      name: 'David Miller',
      email: 'david.client@example.com',
      role: 'client',
      passwordHash,
      phone: '+91 98765 67890',
      city: 'Surat, Gujarat, India',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      isSuspended: false
    },
    {
      id: 'usr-prov-1',
      name: 'Elena Rostova',
      email: 'grandevents@example.com',
      role: 'provider',
      passwordHash,
      phone: '+91 98765 23456',
      city: 'Surat, Gujarat, India',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      isSuspended: false
    },
    {
      id: 'usr-prov-2',
      name: 'Marcus Thorne',
      email: 'aperture@example.com',
      role: 'provider',
      passwordHash,
      phone: '+91 98765 34567',
      city: 'Surat, Gujarat, India',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      isSuspended: false
    },
    {
      id: 'usr-prov-3',
      name: 'Chef Antonio Rossi',
      email: 'gourmet@example.com',
      role: 'provider',
      passwordHash,
      phone: '+91 98765 45678',
      city: 'Surat, Gujarat, India',
      createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
      isSuspended: false
    },
    {
      id: 'usr-prov-4',
      name: 'Lily Blossom',
      email: 'blooms@example.com',
      role: 'provider',
      passwordHash,
      phone: '+91 98765 56789',
      city: 'Surat, Gujarat, India',
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      isSuspended: false
    },
    {
      id: 'usr-prov-pending-1',
      name: 'Julian Vance',
      email: 'lenscraft@example.com',
      role: 'provider',
      passwordHash,
      phone: '+91 98765 89012',
      city: 'Surat, Gujarat, India',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      isSuspended: false
    },
    {
      id: 'usr-prov-pending-2',
      name: 'DJ Shadow Beats',
      email: 'pulse@example.com',
      role: 'provider',
      passwordHash,
      phone: '+91 98765 90123',
      city: 'Surat, Gujarat, India',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      isSuspended: false
    }
  ];

  const defaultProfiles: ProviderProfile[] = [
    {
      id: 'prof-1',
      userId: 'usr-prov-1',
      businessName: 'Grand Elegance Event Co.',
      category: 'Full-Service Event Planning',
      serviceCity: 'Surat, Gujarat, India',
      description: 'Award-winning full-service wedding and gala planners specializing in bespoke luxury events, seamless coordination, and vendor curation.',
      portfolioImages: [
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80'
      ],
      yearsExperience: 8,
      startingPriceRange: '₹3,00,000 - ₹15,00,000',
      avgRating: 4.9,
      totalReviews: 28,
      verificationStatus: 'verified',
      verificationDocuments: ['https://example.com/docs/grand_elegance_license.pdf']
    },
    {
      id: 'prof-2',
      userId: 'usr-prov-2',
      businessName: 'Aperture Studios Photography',
      category: 'Photography',
      serviceCity: 'Surat, Gujarat, India',
      description: 'Documentary style candid wedding photographers capturing timeless emotions with high-end camera gear and drone perspectives.',
      portfolioImages: [
        'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80'
      ],
      yearsExperience: 6,
      startingPriceRange: '₹80,000 - ₹2,50,000',
      avgRating: 4.8,
      totalReviews: 19,
      verificationStatus: 'verified',
      verificationDocuments: ['https://example.com/docs/aperture_business_reg.pdf']
    },
    {
      id: 'prof-3',
      userId: 'usr-prov-3',
      businessName: 'Gourmet Feast Catering',
      category: 'Catering',
      serviceCity: 'Surat, Gujarat, India',
      description: 'Artisanal organic multi-cuisine catering featuring farm-to-table menus, custom live stations, and dessert bars.',
      portfolioImages: [
        'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80'
      ],
      yearsExperience: 10,
      startingPriceRange: '₹500 - ₹2,500 / plate',
      avgRating: 4.7,
      totalReviews: 15,
      verificationStatus: 'verified',
      verificationDocuments: ['https://example.com/docs/gourmet_health_cert.pdf']
    },
    {
      id: 'prof-4',
      userId: 'usr-prov-4',
      businessName: 'Petals & Lighting Decor',
      category: 'Decoration & Floral',
      serviceCity: 'Surat, Gujarat, India',
      description: 'Transforming venues into dreamscapes with fairy lighting, floral arches, custom backdrops, and modern table settings.',
      portfolioImages: [
        'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80'
      ],
      yearsExperience: 7,
      startingPriceRange: '₹1,50,000 - ₹6,00,000',
      avgRating: 4.9,
      totalReviews: 31,
      verificationStatus: 'verified',
      verificationDocuments: ['https://example.com/docs/petals_permit.pdf']
    },
    {
      id: 'prof-pending-1',
      userId: 'usr-prov-pending-1',
      businessName: 'LensCraft Moments',
      category: 'Photography',
      serviceCity: 'Surat, Gujarat, India',
      description: 'Emerging wedding photojournalist with fine art editing aesthetic.',
      portfolioImages: [
        'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80'
      ],
      yearsExperience: 3,
      startingPriceRange: '₹60,000 - ₹1,80,000',
      avgRating: 0,
      totalReviews: 0,
      verificationStatus: 'pending',
      verificationDocuments: ['https://example.com/docs/lenscraft_id.pdf']
    },
    {
      id: 'prof-pending-2',
      userId: 'usr-prov-pending-2',
      businessName: 'Pulse Beat DJs',
      category: 'DJ & Sound',
      serviceCity: 'Surat, Gujarat, India',
      description: 'High energy wedding DJ & sound setup with intelligent laser lighting.',
      portfolioImages: [
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80'
      ],
      yearsExperience: 4,
      startingPriceRange: '₹35,000 - ₹1,00,000',
      avgRating: 0,
      totalReviews: 0,
      verificationStatus: 'pending',
      verificationDocuments: ['https://example.com/docs/pulse_tax_file.pdf']
    }
  ];

  // Default Requirement Group 1: Bundled Wedding
  const reqGroup1: RequirementGroup = {
    id: 'grp-101',
    clientId: 'usr-client-1',
    clientName: 'Sarah Jenkins',
    eventType: 'Wedding',
    eventDate: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
    city: 'Surat, Gujarat, India',
    guestCount: 180,
    budgetMin: 12000,
    budgetMax: 18000,
    budgetHidden: false,
    notes: 'Looking for a seamless full-package provider to handle end-to-end planning, decor, catering, and photography for our vineyard wedding.',
    bundleMode: 'bundled',
    referenceImages: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  };

  const req101: Requirement = {
    id: 'req-101',
    requirementGroupId: 'grp-101',
    category: 'Full-Service Event Planning',
    status: 'open',
    proposalDeadline: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  };

  const reqServices101: RequirementServiceDetail[] = [
    {
      id: 'svc-101-1',
      requirementId: 'req-101',
      serviceType: 'Full Event Planning/Management',
      details: {
        coordinationType: 'Full Planning & On-Site Execution',
        vendorSourcing: true,
        timelineManagement: true
      }
    },
    {
      id: 'svc-101-2',
      requirementId: 'req-101',
      serviceType: 'Catering',
      details: {
        cuisine: 'Modern American & Italian Fusion',
        mealType: '3-Course Plated Dinner',
        plateCount: 180,
        dietary: 'Vegetarian and Gluten-Free options required'
      }
    },
    {
      id: 'svc-101-3',
      requirementId: 'req-101',
      serviceType: 'Decoration/Flowers',
      details: {
        theme: 'Earthy Bohemian Elegance',
        colorPalette: 'Sage Green, Terracotta, White Florals',
        lighting: 'Fairy light canopy and candlelit centerpieces'
      }
    }
  ];

  // Proposal 1 for req-101 (from Grand Elegance)
  const prop101: Proposal = {
    id: 'prop-101',
    requirementId: 'req-101',
    providerId: 'prof-1',
    totalPrice: 15400,
    itemizedPrices: {
      'Full Planning & On-site Execution': 4200,
      'Plated Catering (180 Guests)': 7200,
      'Boho Floral & Lighting Decor': 4000
    },
    planText: 'Our master planning team will assign 2 dedicated planners to your vineyard wedding. We include a complete 3-course organic dinner with wine pairings, custom sage & terracotta floral arches, and full day-of coordination.',
    matchScore: 92,
    status: 'submitted',
    submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  };

  // Default Requirement Group 2: Split Event (David Miller's Corporate Anniversary)
  const reqGroup2: RequirementGroup = {
    id: 'grp-102',
    clientId: 'usr-client-2',
    clientName: 'David Miller',
    eventType: 'Corporate Event',
    eventDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    city: 'Surat, Gujarat, India',
    guestCount: 120,
    budgetMin: 5000,
    budgetMax: 10000,
    budgetHidden: false,
    notes: 'Annual tech gala requiring separate specialist vendors for photography and catering.',
    bundleMode: 'split',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  };

  const req102Photo: Requirement = {
    id: 'req-102-photo',
    requirementGroupId: 'grp-102',
    category: 'Photography',
    status: 'open',
    proposalDeadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  };

  const req102Catering: Requirement = {
    id: 'req-102-cat',
    requirementGroupId: 'grp-102',
    category: 'Catering',
    status: 'open',
    proposalDeadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  };

  const prop102Photo: Proposal = {
    id: 'prop-102-p1',
    requirementId: 'req-102-photo',
    providerId: 'prof-2',
    totalPrice: 2200,
    itemizedPrices: {
      '6-Hour Photography Coverage': 1600,
      'High-Res Digital Album': 400,
      'Same-Day Teaser Photos': 200
    },
    planText: '2 photographers capturing speeches, award presentations, and candid executive networking.',
    matchScore: 89,
    status: 'submitted',
    submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
  };

  const prop102Catering: Proposal = {
    id: 'prop-102-c1',
    requirementId: 'req-102-cat',
    providerId: 'prof-3',
    totalPrice: 5400,
    itemizedPrices: {
      'Gourmet Appetizers & Cocktail Hour': 1800,
      'Buffet Main Course (120 plates)': 3000,
      'Staff & Beverage Service': 600
    },
    planText: 'Artisanal pass-around appetizers during cocktail hour followed by a prime rib and salmon dinner buffet.',
    matchScore: 86,
    status: 'submitted',
    submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  };

  dbMemory = {
    users: defaultUsers,
    providerProfiles: defaultProfiles,
    requirementGroups: [reqGroup1, reqGroup2],
    requirements: [req101, req102Photo, req102Catering],
    requirementServices: [
      ...reqServices101,
      {
        id: 'svc-102-p',
        requirementId: 'req-102-photo',
        serviceType: 'Photography',
        details: { candid: true, hours: 6, drone: false }
      },
      {
        id: 'svc-102-c',
        requirementId: 'req-102-cat',
        serviceType: 'Catering',
        details: { cuisine: 'American Gourmet', style: 'Buffet', plateCount: 120 }
      }
    ],
    proposals: [prop101, prop102Photo, prop102Catering],
    preShortlistQuestions: [
      {
        id: 'q-1',
        proposalId: 'prop-101',
        clientId: 'usr-client-1',
        questionText: 'Is dietary restriction handling included without extra charge for 15 guests?',
        answerText: 'Yes! We customize vegetarian, vegan, and allergen-free meals at no added cost.',
        askedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        answeredAt: new Date(Date.now() - 12 * 3600000).toISOString()
      }
    ],
    chatThreads: [],
    chatMessages: [],
    bookings: [],
    reviews: [],
    notifications: [
      {
        id: 'notif-1',
        userId: 'usr-client-1',
        type: 'proposal_received',
        title: 'New Anonymized Proposal Received!',
        message: 'A provider has submitted a proposal for your Wedding requirement.',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'notif-2',
        userId: 'usr-prov-pending-1',
        type: 'verification_pending',
        title: 'Verification Pending',
        message: 'Your provider profile is currently under review by our admin team.',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
      }
    ],
    serviceCategories: defaultCategories,
    platformSettings: {
      matchScoreWeights: {
        priceWeight: 0.40,
        ratingWeight: 0.35,
        completenessWeight: 0.25
      },
      launchCity: 'Surat, Gujarat, India'
    }
  };

  saveDatabase();
  return dbMemory;
}

export function saveDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbMemory, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

export function getDb(): DatabaseSchema {
  if (!dbMemory) {
    return initDatabase();
  }
  return dbMemory;
}

/**
 * Calculates Match Score (0-100) based on dynamic admin weights
 */
export function calculateProposalMatchScore(
  proposal: Partial<Proposal>,
  requirement: Requirement,
  providerProfile: ProviderProfile,
  requirementGroup?: RequirementGroup
): number {
  const weights = getDb().platformSettings.matchScoreWeights;

  // 1. Price Competitiveness Score (0 - 100)
  let priceScore = 70; // baseline neutral score
  if (requirementGroup && requirementGroup.budgetMax && proposal.totalPrice) {
    const budget = requirementGroup.budgetMax;
    if (proposal.totalPrice <= budget) {
      // Reward lower price relative to budget
      const savingsRatio = (budget - proposal.totalPrice) / budget;
      priceScore = Math.min(100, 80 + savingsRatio * 40);
    } else {
      // Over budget penalty
      const overRatio = (proposal.totalPrice - budget) / budget;
      priceScore = Math.max(10, 70 - overRatio * 80);
    }
  }

  // 2. Rating Score (0 - 100)
  const ratingScore = providerProfile.avgRating ? (providerProfile.avgRating / 5.0) * 100 : 75;

  // 3. Completeness Score (0 - 100)
  let completenessScore = 60;
  if (proposal.itemizedPrices && Object.keys(proposal.itemizedPrices).length > 0) {
    const itemNum = Object.keys(proposal.itemizedPrices).length;
    completenessScore = Math.min(100, 50 + itemNum * 15);
  }
  if (proposal.planText && proposal.planText.length > 50) {
    completenessScore = Math.min(100, completenessScore + 15);
  }

  const totalScore = Math.round(
    priceScore * weights.priceWeight +
    ratingScore * weights.ratingWeight +
    completenessScore * weights.completenessWeight
  );

  return Math.min(99, Math.max(40, totalScore));
}

export function recalculateAllProposalScores(): void {
  const db = getDb();
  for (const proposal of db.proposals) {
    const req = db.requirements.find(r => r.id === proposal.requirementId);
    const prof = db.providerProfiles.find(p => p.id === proposal.providerId);
    if (req && prof) {
      const group = db.requirementGroups.find(g => g.id === req.requirementGroupId);
      proposal.matchScore = calculateProposalMatchScore(proposal, req, prof, group);
    }
  }
  saveDatabase();
}
