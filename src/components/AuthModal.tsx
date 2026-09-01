import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserRole, ServiceCategory } from '../types';
import {
  X,
  UserCheck,
  Briefcase,
  ShieldAlert,
  Upload,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  initialRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  initialRole = 'client'
}) => {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('Surat, Gujarat, India');
  const [phone, setPhone] = useState('');

  // Provider Onboarding Form State
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [yearsExperience, setYearsExperience] = useState(3);
  const [startingPriceRange, setStartingPriceRange] = useState('₹50,000 - ₹2,00,000');
  const [description, setDescription] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80');

  useEffect(() => {
    setMode(initialMode);
    setRole(initialRole);
    api.getCategories().then(cats => {
      setCategories(cats);
      if (cats.length > 0) setCategory(cats[0].name);
    }).catch(() => {});
  }, [initialMode, initialRole, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login({ email, password });
        onClose();
      } else {
        // Signup
        const payload: any = {
          name,
          email,
          password,
          role,
          city,
          phone
        };

        if (role === 'provider') {
          payload.providerData = {
            businessName,
            category,
            yearsExperience: Number(yearsExperience),
            startingPriceRange,
            description,
            portfolioImages: [portfolioUrl],
            verificationDocuments: [`${businessName.replace(/\s+/g, '_')}_Business_License.pdf`]
          };
        }

        await register(payload);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoClient = async () => {
    setError('');
    setSubmitting(true);
    try {
      await login({ email: 'sarah.client@example.com', password: 'password123' });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Client login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoProvider = async () => {
    setError('');
    setSubmitting(true);
    try {
      await login({ email: 'grandevents@example.com', password: 'password123' });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Provider login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-[#E2DDD3] rounded-xl shadow-xl p-6 my-8 text-[#1F2923]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5A6B5D] hover:text-[#11361E] p-1.5 rounded-md bg-[#FAF8F5] border border-[#E2DDD3]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-serif italic font-bold text-[#11361E] tracking-tight">
            {mode === 'login' ? 'Welcome Back to EventConnect' : 'Create Your EventConnect Account'}
          </h2>
          <p className="text-xs text-[#5A6B5D] mt-1">
            {mode === 'login'
              ? 'Access your event postings, blind proposals, or provider dashboard.'
              : 'Join as a Client or Provider on Surat, Gujarat’s top event bidding platform.'}
          </p>
        </div>

        {/* Role Selector Tabs (Client vs Provider) */}
        <div className="grid grid-cols-2 gap-2 bg-[#F5F2EB] p-1 rounded-md mb-5 border border-[#E2DDD3]">
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-xs font-medium transition ${
              role === 'client'
                ? 'bg-white text-[#11361E] border border-[#11361E]/40 font-semibold shadow-sm'
                : 'text-[#5A6B5D] hover:text-[#1F2923]'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#11361E]" />
            <span>Continue as Client</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('provider')}
            className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-xs font-medium transition ${
              role === 'provider'
                ? 'bg-white text-[#11361E] border border-[#11361E]/40 font-semibold shadow-sm'
                : 'text-[#5A6B5D] hover:text-[#1F2923]'
            }`}
          >
            <Briefcase className="w-4 h-4 text-[#11361E]" />
            <span>Continue as Provider</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-[#5A6B5D] mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#5A6B5D] mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A6B5D] mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
            />
          </div>

          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#5A6B5D] mb-1">City / Region</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5A6B5D] mb-1">Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
                />
              </div>
            </div>
          )}

          {/* Provider Onboarding Extra Fields */}
          {mode === 'signup' && role === 'provider' && (
            <div className="pt-3 border-t border-[#E2DDD3] space-y-3">
              <div className="text-xs font-semibold text-[#11361E] flex items-center space-x-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>Provider Business Onboarding Details</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A6B5D] mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Moments Photography Co."
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A6B5D] mb-1">Service Category (Single Select)</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name} {cat.isFullServiceEligible ? '(Eligible for Full Package Bids)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#5A6B5D] mt-1">
                  Note: Only registered "Full-Service Event Planning" providers can bid on bundled full package requirements.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5A6B5D] mb-1">Years Experience</label>
                  <input
                    type="number"
                    min={1}
                    value={yearsExperience}
                    onChange={e => setYearsExperience(Number(e.target.value))}
                    className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A6B5D] mb-1">Starting Price Range</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹50,000 - ₹2,00,000"
                    value={startingPriceRange}
                    onChange={e => setStartingPriceRange(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A6B5D] mb-1">Short Business Bio</label>
                <textarea
                  rows={2}
                  placeholder="Describe your equipment, team, and specialties..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A6B5D] mb-1">Portfolio Sample Image URL</label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={e => setPortfolioUrl(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                />
              </div>

              <div className="p-2.5 rounded-md bg-[#E8F0EA] border border-[#11361E]/30 text-[#1F2923] text-[11px] flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#11361E] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#11361E]">Admin Verification Required:</strong> After signup, your profile will be held in a "Pending Verification" state. You cannot submit proposals until an admin approves your credentials.
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold py-2.5 rounded-md text-xs shadow-sm transition disabled:opacity-50"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Log In to EventConnect' : 'Complete Account Registration'}
          </button>
        </form>

        {/* Demo Fast Login Shortcuts for Users */}
        <div className="mt-4 pt-3 border-t border-[#E2DDD3] text-center space-y-2">
          <div className="text-[11px] text-[#5A6B5D]">Instant Demo Login Shortcuts:</div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <button
              onClick={handleDemoClient}
              type="button"
              className="px-2.5 py-1 rounded bg-[#F5F2EB] hover:bg-[#E5E0D5] text-[#11361E] border border-[#D8D2C6] font-medium transition"
            >
              Client Demo
            </button>
            <button
              onClick={handleDemoProvider}
              type="button"
              className="px-2.5 py-1 rounded bg-[#F5F2EB] hover:bg-[#E5E0D5] text-[#11361E] border border-[#D8D2C6] font-medium transition"
            >
              Verified Provider Demo
            </button>
          </div>
        </div>

        {/* Toggle Login/Signup */}
        <div className="mt-4 text-center text-xs text-[#5A6B5D]">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-[#11361E] font-bold hover:underline"
              >
                Sign up here
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#11361E] font-bold hover:underline"
              >
                Log in here
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

