import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProviderProfile, User, MatchScoreWeights, PlatformAnalytics, ServiceCategory } from '../types';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Users,
  BarChart2,
  Sliders,
  Layers,
  Search,
  Building,
  FileText,
  Trash2,
  Plus,
  TrendingUp,
  Award
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'verification' | 'users' | 'match_weights' | 'categories' | 'analytics'>('verification');

  // Verification Queue State
  const [pendingProviders, setPendingProviders] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Match Score Weights State
  const [weights, setWeights] = useState<MatchScoreWeights>({
    priceWeight: 0.40,
    ratingWeight: 0.35,
    completenessWeight: 0.25
  });
  const [weightSaveMsg, setWeightSaveMsg] = useState('');

  // Categories State
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatFullService, setNewCatFullService] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);

  const loadPending = async () => {
    try {
      const data = await api.getPendingProviders();
      setPendingProviders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPending(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMatchWeights = async () => {
    try {
      const data = await api.getMatchWeights();
      setWeights(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getAdminCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadPending();
      loadUsers();
      loadMatchWeights();
      loadCategories();
      loadAnalytics();
    } else {
      setLoadingPending(false);
    }
  }, [user]);

  const handleVerify = async (id: string, status: 'verified' | 'rejected', reason?: string) => {
    try {
      await api.verifyProvider(id, status, reason);
      loadPending();
      loadAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSuspend = async (id: string) => {
    try {
      await api.toggleSuspendUser(id);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveWeights = async () => {
    setWeightSaveMsg('');
    try {
      await api.updateMatchWeights(weights);
      setWeightSaveMsg('Match score weights updated! Platform proposal scores recalculated in real-time.');
    } catch (err: any) {
      alert(err.message || 'Failed to update weights');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await api.createCategory({
        name: newCatName,
        isFullServiceEligible: newCatFullService
      });
      setNewCatName('');
      loadCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Admin Panel Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#E2DDD3] p-4 rounded-xl shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-md bg-[#E8F0EA] text-[#11361E] border border-[#11361E]/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif italic font-bold text-[#11361E]">EventConnect Platform Control Panel</h2>
            <p className="text-xs text-[#5A6B5D]">Manage Provider Verification, Match Algorithm Weights, Users & Analytics</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'verification' ? 'bg-[#11361E] text-white shadow-sm' : 'bg-[#FAF8F5] border border-[#E2DDD3] text-[#5A6B5D] hover:text-[#11361E]'
            }`}
          >
            Verification Queue ({pendingProviders.length})
          </button>
          <button
            onClick={() => setActiveTab('match_weights')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'match_weights' ? 'bg-[#11361E] text-white shadow-sm' : 'bg-[#FAF8F5] border border-[#E2DDD3] text-[#5A6B5D] hover:text-[#11361E]'
            }`}
          >
            Match Score Controls
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'users' ? 'bg-[#11361E] text-white shadow-sm' : 'bg-[#FAF8F5] border border-[#E2DDD3] text-[#5A6B5D] hover:text-[#11361E]'
            }`}
          >
            User Management ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'categories' ? 'bg-[#11361E] text-white shadow-sm' : 'bg-[#FAF8F5] border border-[#E2DDD3] text-[#5A6B5D] hover:text-[#11361E]'
            }`}
          >
            Service Categories
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'analytics' ? 'bg-[#11361E] text-white shadow-sm' : 'bg-[#FAF8F5] border border-[#E2DDD3] text-[#5A6B5D] hover:text-[#11361E]'
            }`}
          >
            Analytics Dashboard
          </button>
        </div>
      </div>

      {/* TAB 1: PROVIDER VERIFICATION QUEUE */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <h3 className="text-sm font-serif italic text-[#5A6B5D] uppercase tracking-wider font-semibold">
            Pending Provider Onboarding Applications
          </h3>

          {loadingPending ? (
            <div className="text-xs text-[#5A6B5D] py-8 text-center">Loading queue...</div>
          ) : pendingProviders.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-[#E2DDD3] text-center text-xs text-[#5A6B5D] shadow-sm">
              No pending provider applications right now. All accounts verified!
            </div>
          ) : (
            <div className="space-y-4">
              {pendingProviders.map(prof => (
                <div key={prof.id} className="p-5 bg-white border border-[#E2DDD3] rounded-xl flex flex-wrap items-start justify-between gap-4 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-serif italic font-bold text-base text-[#11361E]">{prof.businessName}</h4>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[#E8F0EA] text-[#11361E] border border-[#11361E]/30">
                        {prof.category}
                      </span>
                    </div>

                    <p className="text-xs text-[#1F2923]">{prof.description}</p>

                    <div className="text-xs text-[#5A6B5D] space-y-1">
                      <div>Contact: {prof.user?.name} ({prof.user?.email})</div>
                      <div>City: {prof.serviceCity} • Experience: {prof.yearsExperience} yrs • Starting Range: {prof.startingPriceRange}</div>
                    </div>

                    {prof.verificationDocuments && prof.verificationDocuments.length > 0 && (
                      <div className="pt-2 flex items-center space-x-2 text-xs text-[#11361E] font-medium">
                        <FileText className="w-4 h-4 text-[#11361E]" />
                        <span>Submitted Documents: {prof.verificationDocuments.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleVerify(prof.id, 'rejected', 'Documents unverified')}
                      className="px-3.5 py-2 rounded-md bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs border border-rose-200 transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleVerify(prof.id, 'verified')}
                      className="px-4 py-2 rounded-md bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs transition shadow-sm"
                    >
                      Approve & Enable Bidding
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MATCH SCORE WEIGHT CONTROLS */}
      {activeTab === 'match_weights' && (
        <div className="p-6 bg-white border border-[#E2DDD3] rounded-xl space-y-6 max-w-2xl shadow-sm">
          <div>
            <h3 className="text-lg font-serif italic font-bold text-[#11361E] mb-1">Adjustable Proposal Ranking Algorithm</h3>
            <p className="text-xs text-[#5A6B5D]">
              Control the weights used to compute match score percentages for blind bidding proposals. Weights must sum to 1.0 (100%).
            </p>
          </div>

          {weightSaveMsg && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              {weightSaveMsg}
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-[#11361E]">Price Competitiveness Weight</span>
                <span className="font-bold text-[#1F2923]">{(weights.priceWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={weights.priceWeight}
                onChange={e => setWeights({ ...weights, priceWeight: Number(e.target.value) })}
                className="w-full accent-[#11361E]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-[#11361E]">Provider Historical Rating Weight</span>
                <span className="font-bold text-[#1F2923]">{(weights.ratingWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={weights.ratingWeight}
                onChange={e => setWeights({ ...weights, ratingWeight: Number(e.target.value) })}
                className="w-full accent-[#11361E]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-[#11361E]">Proposal Plan Completeness Weight</span>
                <span className="font-bold text-[#1F2923]">{(weights.completenessWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={weights.completenessWeight}
                onChange={e => setWeights({ ...weights, completenessWeight: Number(e.target.value) })}
                className="w-full accent-[#11361E]"
              />
            </div>
          </div>

          <button
            onClick={handleSaveWeights}
            className="w-full py-2.5 bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs rounded-md transition shadow-sm"
          >
            Save & Recalculate All Platform Proposal Match Scores
          </button>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif italic text-[#5A6B5D] uppercase tracking-wider font-semibold">Platform Registered Users</h3>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C9B8F]" />
              <input
                type="text"
                placeholder="Search name, email, role..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
              />
            </div>
          </div>

          <div className="bg-white border border-[#E2DDD3] rounded-xl overflow-hidden text-xs shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-[#FAF8F5] border-b border-[#E2DDD3] text-[#5A6B5D] font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD3] text-[#1F2923]">
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td className="p-3 font-semibold text-[#11361E]">{u.name}</td>
                    <td className="p-3 text-[#5A6B5D]">{u.email}</td>
                    <td className="p-3 capitalize font-medium">{u.role}</td>
                    <td className="p-3 text-[#5A6B5D]">{u.city}</td>
                    <td className="p-3">
                      {u.isSuspended ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-[10px]">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-[10px]">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleSuspend(u.id)}
                          className={`px-3 py-1 rounded text-[11px] font-semibold transition ${
                            u.isSuspended ? 'bg-[#11361E] text-white' : 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50'
                          }`}
                        >
                          {u.isSuspended ? 'Activate' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORY MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <form onSubmit={handleAddCategory} className="p-4 bg-white border border-[#E2DDD3] rounded-xl flex items-center space-x-3 shadow-sm">
            <input
              type="text"
              placeholder="New Category Name (e.g. Drone Videography)"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="flex-1 bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
            />
            <label className="flex items-center space-x-2 text-xs text-[#5A6B5D]">
              <input
                type="checkbox"
                checked={newCatFullService}
                onChange={e => setNewCatFullService(e.target.checked)}
                className="rounded bg-[#FAF8F5] border-[#E2DDD3] text-[#11361E]"
              />
              <span>Full-Service Bundled Eligible</span>
            </label>
            <button
              type="submit"
              className="px-4 py-2 bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs rounded-md flex items-center space-x-1 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map(cat => (
              <div key={cat.id} className="p-4 bg-white border border-[#E2DDD3] rounded-xl text-xs space-y-1 shadow-sm">
                <div className="font-serif italic font-bold text-[#11361E]">{cat.name}</div>
                <div className="text-[11px] text-[#5A6B5D]">
                  {cat.isFullServiceEligible ? 'Full-Service Bundled Eligible' : 'Specialist Category'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-[#E2DDD3] rounded-xl text-[#1F2923] shadow-sm">
              <div className="text-xs text-[#5A6B5D]">Total Users</div>
              <div className="text-2xl font-serif italic font-bold text-[#11361E] mt-1">{analytics.totalUsers}</div>
              <div className="text-[11px] text-[#5A6B5D] mt-1">{analytics.totalClients} Clients • {analytics.totalProviders} Providers</div>
            </div>

            <div className="p-4 bg-white border border-[#E2DDD3] rounded-xl text-[#1F2923] shadow-sm">
              <div className="text-xs text-[#5A6B5D]">Verified Providers</div>
              <div className="text-2xl font-serif italic font-bold text-emerald-700 mt-1">{analytics.verifiedProviders}</div>
              <div className="text-[11px] text-[#5A6B5D] mt-1">{analytics.pendingProviders} Pending Review</div>
            </div>

            <div className="p-4 bg-white border border-[#E2DDD3] rounded-xl text-[#1F2923] shadow-sm">
              <div className="text-xs text-[#5A6B5D]">Event Requirements</div>
              <div className="text-2xl font-serif italic font-bold text-amber-700 mt-1">{analytics.totalRequirements}</div>
              <div className="text-[11px] text-[#5A6B5D] mt-1">{analytics.bundledRequirements} Bundled • {analytics.splitRequirements} Split</div>
            </div>

            <div className="p-4 bg-white border border-[#E2DDD3] rounded-xl text-[#1F2923] shadow-sm">
              <div className="text-xs text-[#5A6B5D]">Accepted Proposals</div>
              <div className="text-2xl font-serif italic font-bold text-[#11361E] mt-1">{analytics.acceptedProposals}</div>
              <div className="text-[11px] text-[#5A6B5D] mt-1">{analytics.acceptanceRate}% Acceptance Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
