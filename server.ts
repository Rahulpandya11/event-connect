import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';

import {
  initDatabase,
  getDb,
  saveDatabase,
  calculateProposalMatchScore,
  recalculateAllProposalScores
} from './src/db/store.js';

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
  ServiceCategory
} from './src/types.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}

const PORT = 3000;

// Initialize database
initDatabase();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Authenticate Socket.IO connections
io.use((socket, next) => {
  let token: string | undefined;

  if (socket.handshake.auth?.token) {
    token = socket.handshake.auth.token;
  } else if (socket.handshake.headers.cookie) {
    const rawCookies = socket.handshake.headers.cookie.split(';');
    for (const item of rawCookies) {
      const [k, ...v] = item.trim().split('=');
      if (k === 'token') {
        token = decodeURIComponent(v.join('='));
        break;
      }
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
      const db = getDb();
      const user = db.users.find(u => u.id === decoded.id);
      if (user && !user.isSuspended) {
        (socket as any).user = user;
        (socket as any).providerProfile = user.role === 'provider'
          ? db.providerProfiles.find(p => p.userId === user.id)
          : undefined;
      }
    } catch (err) {
      // Invalid token - keep socket.user undefined
    }
  }

  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Authenticated Request Interface
export interface AuthRequest extends Request {
  user?: User;
  providerProfile?: ProviderProfile;
}

// Authentication Middleware
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return next(); // unauthenticated
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const db = getDb();
    const user = db.users.find(u => u.id === decoded.id);
    
    if (user && !user.isSuspended) {
      req.user = user;
      if (user.role === 'provider') {
        req.providerProfile = db.providerProfiles.find(p => p.userId === user.id);
      }
    }
  } catch (err) {
    // invalid token
  }
  next();
}

app.use(authenticateToken);

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Access denied. Requires ${role} role.` });
    }
    next();
  };
}

// Helper to anonymize proposal
function anonymizeProposal(proposal: Proposal, index: number, isRevealed: boolean): Proposal {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
  const label = `Provider ${letters[index % letters.length] || index + 1}`;
  
  const db = getDb();
  const prof = db.providerProfiles.find(p => p.id === proposal.providerId);

  if (isRevealed && prof) {
    return {
      ...proposal,
      anonymizedLabel: label,
      isRevealed: true,
      providerInfo: {
        businessName: prof.businessName,
        category: prof.category,
        avgRating: prof.avgRating,
        totalReviews: prof.totalReviews,
        yearsExperience: prof.yearsExperience,
        portfolioImages: prof.portfolioImages,
        verificationStatus: prof.verificationStatus
      }
    };
  }

  return {
    ...proposal,
    anonymizedLabel: label,
    isRevealed: false,
    providerInfo: {
      businessName: label,
      category: prof?.category || 'Service Provider',
      avgRating: prof?.avgRating || 4.8,
      totalReviews: prof?.totalReviews || 12,
      yearsExperience: prof?.yearsExperience || 5,
      portfolioImages: [], // Hidden when unrevealed
      verificationStatus: 'verified'
    }
  };
}

// Helper to push notifications
function createNotification(userId: string, type: string, title: string, message: string, link?: string) {
  const db = getDb();
  const notif: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId,
    type,
    title,
    message,
    link,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  db.notifications.unshift(notif);
  saveDatabase();

  // Socket notification event
  io.to(`user:${userId}`).emit('notification', notif);
}

/* ==========================================================================
   REST API ROUTES
   ========================================================================== */

// --- 1. Auth API ---

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, role, city, phone, providerData } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Missing required signup fields' });
  }

  if (role === 'admin' || email.toLowerCase() === 'rahul@gmail.com') {
    return res.status(400).json({ error: 'Admin account creation is prohibited.' });
  }

  const db = getDb();
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email is already registered' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = `usr-${Date.now()}`;
  const newUser: User = {
    id: userId,
    name,
    email: email.toLowerCase(),
    role: role === 'provider' ? 'provider' : 'client',
    passwordHash: hashedPassword,
    phone: phone || '',
    city: city || db.platformSettings.launchCity,
    createdAt: new Date().toISOString(),
    isSuspended: false
  };

  db.users.push(newUser);

  let providerProfile: ProviderProfile | undefined;

  if (role === 'provider') {
    if (!providerData || !providerData.businessName || !providerData.category) {
      return res.status(400).json({ error: 'Missing provider business name or category' });
    }

    providerProfile = {
      id: `prof-${Date.now()}`,
      userId,
      businessName: providerData.businessName,
      category: providerData.category,
      serviceCity: city || db.platformSettings.launchCity,
      description: providerData.description || '',
      portfolioImages: providerData.portfolioImages || [],
      yearsExperience: Number(providerData.yearsExperience) || 1,
      startingPriceRange: providerData.startingPriceRange || '₹50,000+',
      avgRating: 0,
      totalReviews: 0,
      verificationStatus: 'pending', // Gated until admin approval
      verificationDocuments: providerData.verificationDocuments || ['Document_Registration.pdf']
    };

    db.providerProfiles.push(providerProfile);

    // Notify admins
    const admins = db.users.filter(u => u.role === 'admin');
    for (const admin of admins) {
      createNotification(admin.id, 'provider_pending', 'New Provider Verification Request', `${providerData.businessName} submitted onboarding verification.`);
    }
  }

  saveDatabase();

  const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 86400000 });

  const { passwordHash: _, ...safeUser } = newUser;

  res.json({
    user: safeUser,
    providerProfile,
    token
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const db = getDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.isSuspended) {
    return res.status(403).json({ error: 'Your account has been suspended by an administrator.' });
  }

  const match = user.passwordHash ? bcrypt.compareSync(password, user.passwordHash) : false;
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 86400000 });

  const providerProfile = user.role === 'provider' ? db.providerProfiles.find(p => p.userId === user.id) : undefined;
  const { passwordHash: _, ...safeUser } = user;

  res.json({
    user: safeUser,
    providerProfile,
    token
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.json({ user: null, providerProfile: null });
  }
  const { passwordHash: _, ...safeUser } = req.user;
  res.json({
    user: safeUser,
    providerProfile: req.providerProfile
  });
});

// --- 2. Categories & Settings API ---

app.get('/api/categories', (req: Request, res: Response) => {
  const db = getDb();
  res.json(db.serviceCategories.filter(c => c.isActive));
});

app.get('/api/notifications', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const userNotifs = db.notifications.filter(n => n.userId === req.user!.id);
  res.json(userNotifs);
});

app.post('/api/notifications/read-all', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.notifications.filter(n => n.userId === req.user!.id).forEach(n => n.isRead = true);
  saveDatabase();
  res.json({ success: true });
});

// --- 3. Client Requirements API ---

app.post('/api/requirements', requireAuth, requireRole('client'), (req: AuthRequest, res: Response) => {
  const {
    eventType,
    eventDate,
    city,
    guestCount,
    budgetMin,
    budgetMax,
    budgetHidden,
    notes,
    bundleMode, // 'bundled' or 'split'
    selectedServices, // array of strings e.g. ["Photography", "Catering"]
    serviceDetails, // object mapping serviceType -> details
    proposalDeadline,
    referenceImages
  } = req.body;

  if (!eventType || !eventDate || !selectedServices || selectedServices.length === 0) {
    return res.status(400).json({ error: 'Please select an event type, date, and at least one service.' });
  }

  const db = getDb();
  const groupId = `grp-${Date.now()}`;

  const requirementGroup: RequirementGroup = {
    id: groupId,
    clientId: req.user!.id,
    clientName: req.user!.name,
    eventType,
    eventDate,
    city: city || req.user!.city || db.platformSettings.launchCity,
    guestCount: Number(guestCount) || 50,
    budgetMin: budgetMin ? Number(budgetMin) : undefined,
    budgetMax: budgetMax ? Number(budgetMax) : undefined,
    budgetHidden: Boolean(budgetHidden),
    notes: notes || '',
    bundleMode,
    referenceImages: referenceImages || [],
    createdAt: new Date().toISOString()
  };

  db.requirementGroups.unshift(requirementGroup);

  const createdRequirements: Requirement[] = [];

  if (bundleMode === 'bundled') {
    // Option A — Bundled ("Full Package"): ONE requirement with category "Full-Service Event Planning"
    const reqId = `req-${Date.now()}-full`;
    const newReq: Requirement = {
      id: reqId,
      requirementGroupId: groupId,
      category: 'Full-Service Event Planning', // RESTRICTED to Full-Service providers only!
      status: 'open',
      proposalDeadline: proposalDeadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    db.requirements.push(newReq);
    createdRequirements.push(newReq);

    // Save service sub-form details
    for (const serviceType of selectedServices) {
      db.requirementServices.push({
        id: `svc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        requirementId: reqId,
        serviceType,
        details: serviceDetails?.[serviceType] || {}
      });
    }

    // Notify full-service providers
    const fullServiceProviders = db.providerProfiles.filter(p => p.category === 'Full-Service Event Planning' && p.verificationStatus === 'verified');
    for (const p of fullServiceProviders) {
      createNotification(p.userId, 'new_requirement', 'New Bundled Event Requirement Posted!', `A client posted a full package requirement for ${eventType} on ${eventDate}.`);
    }

  } else {
    // Option B — Split: Separate requirement per selected service
    for (let i = 0; i < selectedServices.length; i++) {
      const serviceType = selectedServices[i];
      const reqId = `req-${Date.now()}-${i}`;
      
      const newReq: Requirement = {
        id: reqId,
        requirementGroupId: groupId,
        category: serviceType, // Matched to providers of this specific service
        status: 'open',
        proposalDeadline: proposalDeadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      db.requirements.push(newReq);
      createdRequirements.push(newReq);

      db.requirementServices.push({
        id: `svc-${Date.now()}-${i}`,
        requirementId: reqId,
        serviceType,
        details: serviceDetails?.[serviceType] || {}
      });

      // Notify matching category providers
      const matchingProviders = db.providerProfiles.filter(p => p.category === serviceType && p.verificationStatus === 'verified');
      for (const p of matchingProviders) {
        createNotification(p.userId, 'new_requirement', `New ${serviceType} Requirement Posted!`, `A client requested ${serviceType} for a ${eventType} on ${eventDate}.`);
      }
    }
  }

  saveDatabase();

  res.json({
    group: requirementGroup,
    requirements: createdRequirements
  });
});

app.get('/api/requirements/my-groups', requireAuth, requireRole('client'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const myGroups = db.requirementGroups.filter(g => g.clientId === req.user!.id);

  const result = myGroups.map(group => {
    const reqs = db.requirements.filter(r => r.requirementGroupId === group.id).map(r => {
      const services = db.requirementServices.filter(s => s.requirementId === r.id);
      const props = db.proposals.filter(p => p.requirementId === r.id);
      return {
        ...r,
        services,
        proposalsCount: props.length
      };
    });

    return {
      ...group,
      requirements: reqs
    };
  });

  res.json(result);
});

app.put('/api/requirements/group/:id', requireAuth, requireRole('client'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const group = db.requirementGroups.find(g => g.id === req.params.id && g.clientId === req.user!.id);

  if (!group) {
    return res.status(404).json({ error: 'Requirement posting not found or unauthorized' });
  }

  const { eventType, eventDate, city, guestCount, budgetMin, budgetMax, notes } = req.body;
  const changesList: string[] = [];

  if (eventType && eventType !== group.eventType) {
    changesList.push(`Event type changed from "${group.eventType}" to "${eventType}"`);
    group.eventType = eventType;
  }
  if (eventDate && eventDate !== group.eventDate) {
    changesList.push(`Event date changed from ${group.eventDate} to ${eventDate}`);
    group.eventDate = eventDate;
  }
  if (city && city !== group.city) {
    changesList.push(`Location changed from "${group.city}" to "${city}"`);
    group.city = city;
  }
  if (guestCount !== undefined && Number(guestCount) !== group.guestCount) {
    changesList.push(`Guest count changed from ${group.guestCount} to ${guestCount}`);
    group.guestCount = Number(guestCount);
  }
  if (budgetMin !== undefined && Number(budgetMin) !== group.budgetMin) {
    changesList.push(`Min budget changed from ₹${(group.budgetMin||0).toLocaleString('en-IN')} to ₹${Number(budgetMin).toLocaleString('en-IN')}`);
    group.budgetMin = Number(budgetMin);
  }
  if (budgetMax !== undefined && Number(budgetMax) !== group.budgetMax) {
    changesList.push(`Max budget changed from ₹${(group.budgetMax||0).toLocaleString('en-IN')} to ₹${Number(budgetMax).toLocaleString('en-IN')}`);
    group.budgetMax = Number(budgetMax);
  }
  if (notes !== undefined && notes !== group.notes) {
    changesList.push(`Event notes revised`);
    group.notes = notes;
  }

  if (changesList.length > 0) {
    if (!group.editHistory) group.editHistory = [];
    const summaryStr = changesList.join(' • ');
    group.editHistory.push({
      id: `ehist-${Date.now()}`,
      editedAt: new Date().toISOString(),
      editedBy: req.user!.name || 'Client',
      summary: summaryStr
    });

    // Notify matched/proposing providers
    const groupReqs = db.requirements.filter(r => r.requirementGroupId === group.id);
    const reqIds = groupReqs.map(r => r.id);
    const proposals = db.proposals.filter(p => reqIds.includes(p.requirementId));
    const providerIds = [...new Set(proposals.map(p => p.providerId))];

    for (const pid of providerIds) {
      const prof = db.providerProfiles.find(p => p.id === pid);
      if (prof) {
        createNotification(
          prof.userId,
          'requirement_updated',
          'Posting Details Revised by Client',
          `Client updated event details for ${group.eventType} on ${group.eventDate}: ${summaryStr}`
        );
      }
    }
  }

  saveDatabase();
  res.json(group);
});

app.delete('/api/requirements/group/:id', requireAuth, requireRole('client'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const groupIdx = db.requirementGroups.findIndex(g => g.id === req.params.id && g.clientId === req.user!.id);

  if (groupIdx === -1) {
    return res.status(404).json({ error: 'Requirement posting not found or unauthorized' });
  }

  const group = db.requirementGroups[groupIdx];
  const groupReqs = db.requirements.filter(r => r.requirementGroupId === group.id);
  const reqIds = groupReqs.map(r => r.id);

  groupReqs.forEach(r => {
    r.status = 'cancelled';
  });

  const linkedProposals = db.proposals.filter(p => reqIds.includes(p.requirementId));
  linkedProposals.forEach(p => {
    p.status = 'withdrawn';
    const prof = db.providerProfiles.find(pr => pr.id === p.providerId);
    if (prof) {
      createNotification(
        prof.userId,
        'requirement_cancelled',
        'Requirement Cancelled',
        `Client has deleted the event posting for ${group.eventType}.`
      );
    }
  });

  db.requirementGroups.splice(groupIdx, 1);
  saveDatabase();
  res.json({ success: true, message: 'Requirement posting deleted successfully' });
});

app.delete('/api/requirements/:id', requireAuth, requireRole('client'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const reqItem = db.requirements.find(r => r.id === req.params.id);
  if (!reqItem) {
    return res.status(404).json({ error: 'Requirement not found' });
  }

  const group = db.requirementGroups.find(g => g.id === reqItem.requirementGroupId && g.clientId === req.user!.id);
  if (!group) {
    return res.status(403).json({ error: 'Unauthorized to delete this requirement' });
  }

  reqItem.status = 'cancelled';

  const proposals = db.proposals.filter(p => p.requirementId === reqItem.id);
  proposals.forEach(p => {
    p.status = 'withdrawn';
    const prof = db.providerProfiles.find(pr => pr.id === p.providerId);
    if (prof) {
      createNotification(
        prof.userId,
        'requirement_cancelled',
        'Requirement Item Cancelled',
        `Client deleted the ${reqItem.category} requirement for ${group.eventType}.`
      );
    }
  });

  saveDatabase();
  res.json({ success: true, message: 'Requirement item deleted successfully' });
});

// --- 4. Provider Open Requirements & Proposal API ---

app.get('/api/requirements/open', requireAuth, requireRole('provider'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const profile = req.providerProfile;

  if (!profile) {
    return res.status(400).json({ error: 'Provider profile missing' });
  }

  // Filter requirements: Category must match provider category
  // Full-Service providers see category == "Full-Service Event Planning"
  // Single category providers see category == profile.category
  const matchingReqs = db.requirements.filter(r => {
    if (r.status === 'cancelled' || r.status === 'completed') return false;
    return r.category === profile.category;
  });

  const nowStr = new Date().toISOString().split('T')[0];

  const result = matchingReqs.map(reqItem => {
    const group = db.requirementGroups.find(g => g.id === reqItem.requirementGroupId);
    const services = db.requirementServices.filter(s => s.requirementId === reqItem.id);
    const existingProposal = db.proposals.find(p => p.requirementId === reqItem.id && p.providerId === profile.id);

    return {
      ...reqItem,
      group,
      services,
      hasSubmittedProposal: !!existingProposal,
      myProposal: existingProposal,
      isExpired: reqItem.proposalDeadline < nowStr
    };
  });

  res.json(result);
});

app.get('/api/requirements/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const requirement = db.requirements.find(r => r.id === req.params.id);
  if (!requirement) {
    return res.status(404).json({ error: 'Requirement not found' });
  }

  const group = db.requirementGroups.find(g => g.id === requirement.requirementGroupId);
  const services = db.requirementServices.filter(s => s.requirementId === requirement.id);
  
  let rawProposals = db.proposals.filter(p => p.requirementId === requirement.id);

  // Sort proposals by matchScore descending
  rawProposals.sort((a, b) => b.matchScore - a.matchScore);

  // Anonymize unless shortlisted or current user is the provider who submitted it or client shortlisted
  const formattedProposals = rawProposals.map((p, index) => {
    const isShortlisted = p.status === 'shortlisted' || p.status === 'accepted';
    const isOwnProposal = req.user?.id && db.providerProfiles.some(prof => prof.id === p.providerId && prof.userId === req.user?.id);
    const isRevealed = isShortlisted || isOwnProposal || req.user?.role === 'admin';

    return anonymizeProposal(p, index, isRevealed);
  });

  res.json({
    requirement: {
      ...requirement,
      group,
      services,
      proposalsCount: rawProposals.length
    },
    proposals: formattedProposals
  });
});

// --- 4. Provider Verification & Proposals API ---

app.post('/api/provider/verification', requireAuth, requireRole('provider'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  let profile = db.providerProfiles.find(p => p.userId === req.user!.id);

  const {
    businessName,
    category,
    yearsExperience,
    startingPriceRange,
    description,
    portfolioImages,
    verificationDocuments,
    serviceCity
  } = req.body;

  if (!businessName || !category) {
    return res.status(400).json({ error: 'Business name and category are required' });
  }

  if (!profile) {
    profile = {
      id: `prof-${Date.now()}`,
      userId: req.user!.id,
      businessName,
      category,
      serviceCity: serviceCity || req.user!.city || db.platformSettings.launchCity,
      description: description || '',
      portfolioImages: portfolioImages || [],
      yearsExperience: Number(yearsExperience) || 1,
      startingPriceRange: startingPriceRange || '₹50,000+',
      avgRating: 0,
      totalReviews: 0,
      verificationStatus: 'pending',
      verificationDocuments: verificationDocuments || ['Business_License.pdf']
    };
    db.providerProfiles.push(profile);
  } else {
    profile.businessName = businessName;
    profile.category = category;
    profile.yearsExperience = Number(yearsExperience) || profile.yearsExperience;
    profile.startingPriceRange = startingPriceRange || profile.startingPriceRange;
    profile.description = description || profile.description;
    if (serviceCity) profile.serviceCity = serviceCity;
    if (portfolioImages) profile.portfolioImages = portfolioImages;
    if (verificationDocuments && verificationDocuments.length > 0) {
      profile.verificationDocuments = verificationDocuments;
    }
    profile.verificationStatus = 'pending'; // Flag for admin verification queue
  }

  saveDatabase();

  // Notify Admins
  const admins = db.users.filter(u => u.role === 'admin');
  for (const admin of admins) {
    createNotification(
      admin.id,
      'provider_pending',
      'New Provider Verification Request',
      `${businessName} (${category}) submitted details for admin verification.`
    );
  }

  res.json(profile);
});

app.post('/api/proposals', requireAuth, requireRole('provider'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const profile = req.providerProfile;

  if (!profile) {
    return res.status(400).json({ error: 'Provider profile not found' });
  }

  // CRITICAL MANDATORY GATE: Providers cannot submit proposals until approved by admin!
  if (profile.verificationStatus !== 'verified') {
    return res.status(403).json({
      error: 'Account Pending Verification. Your provider profile must be verified by an administrator before submitting proposals.'
    });
  }

  const { requirementId, totalPrice, itemizedPrices, planText } = req.body;

  if (!requirementId || !totalPrice || !planText) {
    return res.status(400).json({ error: 'Requirement ID, total price, and plan description are required.' });
  }

  const requirement = db.requirements.find(r => r.id === requirementId);
  if (!requirement) {
    return res.status(404).json({ error: 'Requirement not found' });
  }

  if (requirement.status === 'provider_selected' || requirement.status === 'completed') {
    return res.status(400).json({ error: 'This requirement is no longer accepting proposals.' });
  }

  // Check if provider already submitted
  let proposal = db.proposals.find(p => p.requirementId === requirementId && p.providerId === profile.id);

  const group = db.requirementGroups.find(g => g.id === requirement.requirementGroupId);

  if (proposal) {
    // Record price and plan text edit history
    const oldPrice = proposal.totalPrice;
    const newPriceNumber = Number(totalPrice);
    const priceChanged = oldPrice !== newPriceNumber;
    const planChanged = proposal.planText !== planText;

    if (priceChanged || planChanged) {
      if (!proposal.priceHistory) proposal.priceHistory = [];
      let summary = '';
      if (priceChanged && planChanged) {
        summary = `Pricing updated from ₹${oldPrice.toLocaleString('en-IN')} to ₹${newPriceNumber.toLocaleString('en-IN')} & plan details revised`;
      } else if (priceChanged) {
        summary = `Pricing updated from ₹${oldPrice.toLocaleString('en-IN')} to ₹${newPriceNumber.toLocaleString('en-IN')}`;
      } else {
        summary = `Proposal plan details revised`;
      }

      proposal.priceHistory.push({
        id: `phist-${Date.now()}`,
        editedAt: new Date().toISOString(),
        oldPrice,
        newPrice: newPriceNumber,
        oldPlanText: proposal.planText,
        newPlanText: planText,
        summary
      });
    }

    // Update existing proposal
    proposal.totalPrice = newPriceNumber;
    proposal.itemizedPrices = itemizedPrices || {};
    proposal.planText = planText;
    proposal.updatedAt = new Date().toISOString();
    proposal.matchScore = calculateProposalMatchScore(proposal, requirement, profile, group);
  } else {
    // Create new proposal
    proposal = {
      id: `prop-${Date.now()}`,
      requirementId,
      providerId: profile.id,
      totalPrice: Number(totalPrice),
      itemizedPrices: itemizedPrices || {},
      planText,
      matchScore: 80,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priceHistory: []
    };
    proposal.matchScore = calculateProposalMatchScore(proposal, requirement, profile, group);
    db.proposals.push(proposal);
  }

  saveDatabase();

  // Notify Client
  if (group) {
    createNotification(
      group.clientId,
      'proposal_received',
      'Proposal Submitted / Updated by Provider',
      `A proposal for your ${requirement.category} requirement was submitted/revised with pricing ₹${Number(totalPrice).toLocaleString('en-IN')}.`,
      `/requirements/${requirement.id}`
    );
  }

  res.json(proposal);
});

app.put('/api/proposals/:id', requireAuth, requireRole('provider'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const profile = req.providerProfile;
  if (!profile) {
    return res.status(400).json({ error: 'Provider profile not found' });
  }

  const proposal = db.proposals.find(p => p.id === req.params.id && p.providerId === profile.id);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found or unauthorized' });
  }

  const { totalPrice, itemizedPrices, planText } = req.body;
  if (!totalPrice || !planText) {
    return res.status(400).json({ error: 'Total price and plan text are required' });
  }

  const requirement = db.requirements.find(r => r.id === proposal.requirementId);
  if (!requirement) {
    return res.status(404).json({ error: 'Linked requirement not found' });
  }
  const group = db.requirementGroups.find(g => g.id === requirement.requirementGroupId);

  const oldPrice = proposal.totalPrice;
  const newPriceNumber = Number(totalPrice);
  const priceChanged = oldPrice !== newPriceNumber;
  const planChanged = proposal.planText !== planText;

  if (priceChanged || planChanged) {
    if (!proposal.priceHistory) proposal.priceHistory = [];
    let summary = '';
    if (priceChanged && planChanged) {
      summary = `Pricing updated from ₹${oldPrice.toLocaleString('en-IN')} to ₹${newPriceNumber.toLocaleString('en-IN')} & plan details revised`;
    } else if (priceChanged) {
      summary = `Pricing updated from ₹${oldPrice.toLocaleString('en-IN')} to ₹${newPriceNumber.toLocaleString('en-IN')}`;
    } else {
      summary = `Proposal plan details revised`;
    }

    proposal.priceHistory.push({
      id: `phist-${Date.now()}`,
      editedAt: new Date().toISOString(),
      oldPrice,
      newPrice: newPriceNumber,
      oldPlanText: proposal.planText,
      newPlanText: planText,
      summary
    });
  }

  proposal.totalPrice = newPriceNumber;
  proposal.itemizedPrices = itemizedPrices || {};
  proposal.planText = planText;
  proposal.updatedAt = new Date().toISOString();
  proposal.matchScore = calculateProposalMatchScore(proposal, requirement, profile, group);

  saveDatabase();

  if (group) {
    createNotification(
      group.clientId,
      'proposal_updated',
      'Proposal Revised by Provider',
      `A provider updated their proposal pricing to ₹${newPriceNumber.toLocaleString('en-IN')} for your ${requirement.category} requirement.`,
      `/requirements/${requirement.id}`
    );
  }

  res.json(proposal);
});

app.delete('/api/proposals/:id', requireAuth, requireRole('provider'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const profile = req.providerProfile;
  if (!profile) {
    return res.status(400).json({ error: 'Provider profile not found' });
  }

  const propIdx = db.proposals.findIndex(p => p.id === req.params.id && p.providerId === profile.id);
  if (propIdx === -1) {
    return res.status(404).json({ error: 'Proposal not found or unauthorized' });
  }

  const proposal = db.proposals[propIdx];
  const requirement = db.requirements.find(r => r.id === proposal.requirementId);
  const group = requirement ? db.requirementGroups.find(g => g.id === requirement.requirementGroupId) : null;

  db.proposals.splice(propIdx, 1);
  saveDatabase();

  if (group) {
    createNotification(
      group.clientId,
      'proposal_withdrawn',
      'Proposal Withdrawn',
      `A provider has withdrawn their proposal for your ${requirement?.category || 'event'} requirement.`
    );
  }

  res.json({ success: true, message: 'Proposal deleted / withdrawn successfully' });
});

// Shortlist Proposal -> REVEALS IDENTITY & OPENS CHAT
app.post('/api/proposals/:id/shortlist', requireAuth, requireRole('client'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const proposal = db.proposals.find(p => p.id === req.params.id);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  const requirement = db.requirements.find(r => r.id === proposal.requirementId);
  const group = requirement ? db.requirementGroups.find(g => g.id === requirement.requirementGroupId) : undefined;

  if (!group || group.clientId !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized to manage this proposal' });
  }

  proposal.status = 'shortlisted';
  if (requirement.status === 'open' || requirement.status === 'reviewing') {
    requirement.status = 'negotiating';
  }

  // Find or create chat thread
  let thread = db.chatThreads.find(t => t.proposalId === proposal.id);
  const providerProf = db.providerProfiles.find(p => p.id === proposal.providerId);

  if (!thread) {
    thread = {
      id: `thread-${Date.now()}`,
      requirementId: requirement!.id,
      proposalId: proposal.id,
      clientId: req.user!.id,
      providerId: proposal.providerId,
      createdAt: new Date().toISOString(),
      clientName: req.user!.name,
      providerBusinessName: providerProf?.businessName || 'Service Provider',
      requirementCategory: requirement?.category,
      eventType: group.eventType,
      lastMessage: 'Proposal shortlisted! Chat thread initiated.',
      lastMessageAt: new Date().toISOString()
    };
    db.chatThreads.push(thread);

    // Initial message
    db.chatMessages.push({
      id: `msg-${Date.now()}`,
      threadId: thread.id,
      senderId: req.user!.id,
      senderRole: 'client',
      messageText: `Hello! I have shortlisted your proposal for our ${group.eventType} (${requirement?.category}). Let's discuss details and final custom requirements.`,
      sentAt: new Date().toISOString()
    });
  }

  saveDatabase();

  // Notify Provider
  if (providerProf) {
    createNotification(
      providerProf.userId,
      'proposal_shortlisted',
      'Proposal Shortlisted! Identity Revealed',
      `Your proposal for ${group.eventType} was shortlisted! You can now chat directly with the client.`,
      `/chat/${thread.id}`
    );
  }

  res.json({
    proposal: anonymizeProposal(proposal, 0, true),
    chatThread: thread
  });
});

// Reject Proposal
app.post('/api/proposals/:id/reject', requireAuth, requireRole('client'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const proposal = db.proposals.find(p => p.id === req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  const requirement = db.requirements.find(r => r.id === proposal.requirementId);
  const group = requirement ? db.requirementGroups.find(g => g.id === requirement.requirementGroupId) : undefined;

  if (!group || group.clientId !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized to reject this proposal' });
  }

  proposal.status = 'rejected';
  saveDatabase();

  res.json({ success: true, proposal });
});

// Accept Proposal -> CREATE BOOKING & AUTO-REJECT OTHERS
app.post('/api/proposals/:id/accept', requireAuth, requireRole('client'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const proposal = db.proposals.find(p => p.id === req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  const requirement = db.requirements.find(r => r.id === proposal.requirementId);
  const group = requirement ? db.requirementGroups.find(g => g.id === requirement.requirementGroupId) : undefined;

  if (!group || group.clientId !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized to accept this proposal' });
  }

  // Update proposal & requirement status
  proposal.status = 'accepted';
  requirement!.status = 'provider_selected';
  requirement!.selectedProposalId = proposal.id;

  // Auto-reject other proposals for this requirement
  const otherProposals = db.proposals.filter(p => p.requirementId === requirement!.id && p.id !== proposal.id);
  for (const other of otherProposals) {
    other.status = 'rejected';
    const otherProf = db.providerProfiles.find(p => p.id === other.providerId);
    if (otherProf) {
      createNotification(otherProf.userId, 'proposal_rejected', 'Proposal Not Selected', `Another provider was selected for ${group.eventType} (${requirement!.category}).`);
    }
  }

  // Create Booking
  const providerProf = db.providerProfiles.find(p => p.id === proposal.providerId);
  const booking: Booking = {
    id: `book-${Date.now()}`,
    requirementId: requirement!.id,
    proposalId: proposal.id,
    clientId: req.user!.id,
    providerId: proposal.providerId,
    finalPrice: proposal.totalPrice,
    status: 'confirmed',
    eventDate: group.eventDate,
    createdAt: new Date().toISOString(),
    clientName: req.user!.name,
    providerBusinessName: providerProf?.businessName || 'Service Provider',
    category: requirement!.category,
    eventType: group.eventType
  };

  db.bookings.push(booking);
  saveDatabase();

  // Notify Provider
  if (providerProf) {
    createNotification(
      providerProf.userId,
      'proposal_accepted',
      '🎉 Proposal Accepted! Booking Confirmed',
      `Congratulations! The client has accepted your proposal of $${proposal.totalPrice.toLocaleString()} for ${group.eventType}.`,
      `/bookings`
    );
  }

  res.json({
    booking,
    proposal,
    requirement
  });
});

// --- 5. Pre-Shortlist Q&A API ---

app.get('/api/proposals/:id/questions', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const proposal = db.proposals.find(p => p.id === req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  const isOwnerProvider = req.providerProfile && proposal.providerId === req.providerProfile.id;
  const isAdmin = req.user!.role === 'admin';
  const requirement = db.requirements.find(r => r.id === proposal.requirementId);
  const group = requirement ? db.requirementGroups.find(g => g.id === requirement.requirementGroupId) : undefined;
  const isClient = group && group.clientId === req.user!.id;

  if (!isOwnerProvider && !isAdmin && !isClient) {
    return res.status(403).json({ error: 'You do not have access to these questions' });
  }

  const questions = db.preShortlistQuestions.filter(q => q.proposalId === req.params.id);
  res.json(questions);
});

app.post('/api/proposals/:id/questions', requireAuth, requireRole('client'), (req: AuthRequest, res: Response) => {
  const { questionText } = req.body;
  if (!questionText) return res.status(400).json({ error: 'Question text required' });

  const db = getDb();
  const proposal = db.proposals.find(p => p.id === req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  const requirement = db.requirements.find(r => r.id === proposal.requirementId);
  const group = requirement ? db.requirementGroups.find(g => g.id === requirement.requirementGroupId) : undefined;
  if (!group || group.clientId !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized to ask questions on this proposal' });
  }

  // Cap at 1 active pre-shortlist question per proposal to prevent bypass
  const existingCount = db.preShortlistQuestions.filter(q => q.proposalId === proposal.id && q.clientId === req.user!.id).length;
  if (existingCount >= 3) {
    return res.status(400).json({ error: 'Maximum pre-shortlist questions reached for this proposal. Please shortlist to initiate open chat.' });
  }

  const newQ: PreShortlistQuestion = {
    id: `q-${Date.now()}`,
    proposalId: proposal.id,
    clientId: req.user!.id,
    questionText,
    askedAt: new Date().toISOString()
  };

  db.preShortlistQuestions.push(newQ);
  saveDatabase();

  // Notify Provider
  const providerProf = db.providerProfiles.find(p => p.id === proposal.providerId);
  if (providerProf) {
    createNotification(providerProf.userId, 'qa_asked', 'New Question on Anonymized Proposal', 'A client asked a clarifying question on your submitted proposal.');
  }

  res.json(newQ);
});

app.post('/api/questions/:id/answer', requireAuth, requireRole('provider'), (req: AuthRequest, res: Response) => {
  const { answerText } = req.body;
  if (!answerText) return res.status(400).json({ error: 'Answer text required' });

  const db = getDb();
  const question = db.preShortlistQuestions.find(q => q.id === req.params.id);
  if (!question) return res.status(404).json({ error: 'Question not found' });

  const proposal = db.proposals.find(p => p.id === question.proposalId);
  if (!proposal || !req.providerProfile || proposal.providerId !== req.providerProfile.id) {
    return res.status(403).json({ error: 'Unauthorized to answer this question' });
  }

  question.answerText = answerText;
  question.answeredAt = new Date().toISOString();

  saveDatabase();

  // Notify Client
  createNotification(question.clientId, 'qa_answered', 'Provider Answered Your Question', 'An anonymized provider responded to your clarifying question.');

  res.json(question);
});

// --- 6. Real-Time Chat API ---

app.get('/api/chat/threads', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  let threads: ChatThread[] = [];

  if (req.user!.role === 'client') {
    threads = db.chatThreads.filter(t => t.clientId === req.user!.id);
  } else if (req.user!.role === 'provider' && req.providerProfile) {
    threads = db.chatThreads.filter(t => t.providerId === req.providerProfile!.id);
  } else if (req.user!.role === 'admin') {
    threads = db.chatThreads;
  }

  threads.sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime());

  res.json(threads);
});

app.get('/api/chat/threads/:id/messages', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const thread = db.chatThreads.find(t => t.id === req.params.id);
  if (!thread) return res.status(404).json({ error: 'Chat thread not found' });

  const isClient = thread.clientId === req.user!.id;
  const isProvider = req.providerProfile && thread.providerId === req.providerProfile.id;
  const isAdmin = req.user!.role === 'admin';

  if (!isClient && !isProvider && !isAdmin) {
    return res.status(403).json({ error: 'You do not have access to this chat thread' });
  }

  const messages = db.chatMessages.filter(m => m.threadId === thread.id);
  res.json(messages);
});

app.post('/api/chat/threads/:id/messages', requireAuth, (req: AuthRequest, res: Response) => {
  const { messageText, attachmentUrl, isQuoteUpdate, quoteData } = req.body;
  const db = getDb();

  const thread = db.chatThreads.find(t => t.id === req.params.id);
  if (!thread) return res.status(404).json({ error: 'Chat thread not found' });

  const isClient = thread.clientId === req.user!.id;
  const isProvider = req.providerProfile && thread.providerId === req.providerProfile.id;
  const isAdmin = req.user!.role === 'admin';

  if (!isClient && !isProvider && !isAdmin) {
    return res.status(403).json({ error: 'You do not have access to this chat thread' });
  }

  const message: ChatMessage = {
    id: `msg-${Date.now()}`,
    threadId: thread.id,
    senderId: req.user!.id,
    senderRole: req.user!.role,
    messageText: messageText || (isQuoteUpdate ? 'Submitted a revised quote update.' : ''),
    attachmentUrl,
    isQuoteUpdate: Boolean(isQuoteUpdate),
    quoteData: isQuoteUpdate ? quoteData : undefined,
    sentAt: new Date().toISOString()
  };

  db.chatMessages.push(message);

  thread.lastMessage = isQuoteUpdate ? `Revised Quote: $${quoteData?.totalPrice?.toLocaleString()}` : message.messageText;
  thread.lastMessageAt = message.sentAt;

  // If quote update, also update the proposal record in DB!
  if (isQuoteUpdate && quoteData && req.user!.role === 'provider') {
    const proposal = db.proposals.find(p => p.id === thread.proposalId);
    if (proposal) {
      proposal.totalPrice = Number(quoteData.totalPrice);
      if (quoteData.itemizedPrices) proposal.itemizedPrices = quoteData.itemizedPrices;
      proposal.updatedAt = new Date().toISOString();
    }
  }

  saveDatabase();

  // Socket broadcast
  io.to(`thread:${thread.id}`).emit('new_message', message);

  // Notify receiver
  const receiverId = req.user!.role === 'client' 
    ? db.providerProfiles.find(p => p.id === thread.providerId)?.userId 
    : thread.clientId;

  if (receiverId) {
    createNotification(receiverId, 'chat_message', 'New Chat Message', message.messageText, `/chat/${thread.id}`);
  }

  res.json(message);
});

// --- 7. Bookings & Reviews API ---

app.get('/api/bookings', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  let bookings: Booking[] = [];

  if (req.user!.role === 'client') {
    bookings = db.bookings.filter(b => b.clientId === req.user!.id);
  } else if (req.user!.role === 'provider' && req.providerProfile) {
    bookings = db.bookings.filter(b => b.providerId === req.providerProfile!.id);
  } else if (req.user!.role === 'admin') {
    bookings = db.bookings;
  }

  // Inject review flag
  const result = bookings.map(b => ({
    ...b,
    hasReview: db.reviews.some(r => r.bookingId === b.id)
  }));

  res.json(result);
});

app.post('/api/bookings/:id/complete', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const booking = db.bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  booking.status = 'completed';

  const reqObj = db.requirements.find(r => r.id === booking.requirementId);
  if (reqObj) reqObj.status = 'completed';

  saveDatabase();

  res.json(booking);
});

app.post('/api/bookings/:id/review', requireAuth, requireRole('client'), (req: AuthRequest, res: Response) => {
  const { rating, comment } = req.body;
  if (!rating || !comment) return res.status(400).json({ error: 'Rating and comment required' });

  const db = getDb();
  const booking = db.bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (db.reviews.some(r => r.bookingId === booking.id)) {
    return res.status(400).json({ error: 'A review has already been submitted for this booking.' });
  }

  const review: Review = {
    id: `rev-${Date.now()}`,
    bookingId: booking.id,
    reviewerId: req.user!.id,
    reviewerName: req.user!.name,
    providerId: booking.providerId,
    rating: Number(rating),
    comment,
    createdAt: new Date().toISOString()
  };

  db.reviews.push(review);

  // Update provider average rating
  const prof = db.providerProfiles.find(p => p.id === booking.providerId);
  if (prof) {
    const providerReviews = db.reviews.filter(r => r.providerId === prof.id);
    const sum = providerReviews.reduce((acc, r) => acc + r.rating, 0);
    prof.totalReviews = providerReviews.length;
    prof.avgRating = Number((sum / providerReviews.length).toFixed(1));
  }

  // Recalculate match scores across proposals
  recalculateAllProposalScores();

  saveDatabase();

  res.json(review);
});

// --- 8. Admin Panel API ---

app.get('/api/admin/pending-providers', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const pending = db.providerProfiles.filter(p => p.verificationStatus === 'pending').map(p => {
    const user = db.users.find(u => u.id === p.userId);
    return { ...p, user };
  });
  res.json(pending);
});

app.post('/api/admin/providers/:id/verify', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const { status, rejectionReason } = req.body; // 'verified' | 'rejected'
  if (!status || !['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid verification status' });
  }

  const db = getDb();
  const prof = db.providerProfiles.find(p => p.id === req.params.id);
  if (!prof) return res.status(404).json({ error: 'Provider profile not found' });

  prof.verificationStatus = status;
  if (rejectionReason) prof.rejectionReason = rejectionReason;

  saveDatabase();

  // Notify Provider
  createNotification(
    prof.userId,
    'verification_update',
    status === 'verified' ? '🎉 Account Verified!' : 'Account Verification Decision',
    status === 'verified'
      ? 'Your provider account has been approved by Admin! You can now submit competing proposals on open requirements.'
      : `Your verification request was rejected: ${rejectionReason || 'Documents insufficient'}`
  );

  res.json(prof);
});

app.get('/api/admin/users', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  res.json(db.users);
});

app.post('/api/admin/users/:id/suspend', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.isSuspended = !user.isSuspended;
  saveDatabase();

  res.json(user);
});

app.get('/api/admin/match-weights', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  res.json(db.platformSettings.matchScoreWeights);
});

app.put('/api/admin/match-weights', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const { priceWeight, ratingWeight, completenessWeight } = req.body;
  if (priceWeight === undefined || ratingWeight === undefined || completenessWeight === undefined) {
    return res.status(400).json({ error: 'All three weights required' });
  }

  const sum = Number(priceWeight) + Number(ratingWeight) + Number(completenessWeight);
  if (Math.abs(sum - 1.0) > 0.05) {
    return res.status(400).json({ error: 'Match score weights must total 1.0 (100%)' });
  }

  const db = getDb();
  db.platformSettings.matchScoreWeights = {
    priceWeight: Number(priceWeight),
    ratingWeight: Number(ratingWeight),
    completenessWeight: Number(completenessWeight)
  };

  // Trigger platform-wide proposal score recalculation!
  recalculateAllProposalScores();

  res.json(db.platformSettings.matchScoreWeights);
});

app.get('/api/admin/analytics', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDb();

  const totalClients = db.users.filter(u => u.role === 'client').length;
  const totalProviders = db.users.filter(u => u.role === 'provider').length;
  const verifiedProviders = db.providerProfiles.filter(p => p.verificationStatus === 'verified').length;
  const pendingProviders = db.providerProfiles.filter(p => p.verificationStatus === 'pending').length;

  const totalReqGroups = db.requirementGroups.length;
  const bundledCount = db.requirementGroups.filter(g => g.bundleMode === 'bundled').length;
  const splitCount = db.requirementGroups.filter(g => g.bundleMode === 'split').length;

  const totalProposals = db.proposals.length;
  const acceptedProposals = db.proposals.filter(p => p.status === 'accepted').length;

  // Category counts
  const catMap: Record<string, number> = {};
  for (const reqObj of db.requirements) {
    catMap[reqObj.category] = (catMap[reqObj.category] || 0) + 1;
  }

  const topCategories = Object.entries(catMap).map(([category, count]) => ({ category, count }));

  const recentBookingsValue = db.bookings.reduce((acc, b) => acc + b.finalPrice, 0);

  res.json({
    totalUsers: db.users.length,
    totalClients,
    totalProviders,
    verifiedProviders,
    pendingProviders,
    totalRequirements: totalReqGroups,
    bundledRequirements: bundledCount,
    splitRequirements: splitCount,
    totalProposals,
    acceptedProposals,
    acceptanceRate: totalProposals > 0 ? Number(((acceptedProposals / totalProposals) * 100).toFixed(1)) : 0,
    topCategories,
    recentBookingsValue
  });
});

app.get('/api/admin/categories', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  res.json(db.serviceCategories);
});

app.post('/api/admin/categories', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const { name, isFullServiceEligible, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name required' });

  const db = getDb();
  const cat: ServiceCategory = {
    id: `cat-${Date.now()}`,
    name,
    isFullServiceEligible: Boolean(isFullServiceEligible),
    isActive: true,
    description
  };

  db.serviceCategories.push(cat);
  saveDatabase();

  res.json(cat);
});

// --- Socket.IO Event Handlers ---
io.on('connection', (socket) => {
  const user = (socket as any).user;
  const providerProfile = (socket as any).providerProfile;

  if (user?.id) {
    socket.join(`user:${user.id}`);
  }

  socket.on('join_thread', (threadId: string) => {
    const db = getDb();
    const thread = db.chatThreads.find(t => t.id === threadId);
    if (!thread) return;

    const isClient = thread.clientId === user?.id;
    const isProvider = providerProfile && thread.providerId === providerProfile.id;
    const isAdmin = user?.role === 'admin';

    if (isClient || isProvider || isAdmin) {
      socket.join(`thread:${threadId}`);
    }
  });

  socket.on('typing', ({ threadId, isTyping }: { threadId: string; isTyping: boolean }) => {
    if (user?.id) {
      socket.to(`thread:${threadId}`).emit('user_typing', { userId: user.id, isTyping });
    }
  });
});

// --- Vite Middleware Integration ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`EventConnect Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
