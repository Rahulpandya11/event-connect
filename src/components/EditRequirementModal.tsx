import React, { useState } from 'react';
import { RequirementGroup } from '../types';
import { api } from '../services/api';
import { X, Calendar, MapPin, Users, DollarSign, Edit3, AlertCircle } from 'lucide-react';

interface EditRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: RequirementGroup;
  onSuccess: () => void;
}

export const EditRequirementModal: React.FC<EditRequirementModalProps> = ({
  isOpen,
  onClose,
  group,
  onSuccess
}) => {
  const [eventType, setEventType] = useState(group.eventType || '');
  const [eventDate, setEventDate] = useState(group.eventDate || '');
  const [city, setCity] = useState(group.city || '');
  const [guestCount, setGuestCount] = useState<number>(group.guestCount || 100);
  const [budgetMin, setBudgetMin] = useState<number>(group.budgetMin || 50000);
  const [budgetMax, setBudgetMax] = useState<number>(group.budgetMax || 150000);
  const [notes, setNotes] = useState(group.notes || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await api.updateRequirementGroup(group.id, {
        eventType,
        eventDate,
        city,
        guestCount,
        budgetMin,
        budgetMax,
        notes
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update requirement posting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white border border-[#E2DDD3] rounded-2xl p-6 text-[#1F2923] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-[#11361E]" />
            <h3 className="font-serif italic font-bold text-lg text-[#11361E]">
              Edit Event Requirement Posting
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5A6B5D] hover:text-[#11361E] hover:bg-[#FAF8F5] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[#5A6B5D] uppercase tracking-wider mb-1">
              Event Title / Type
            </label>
            <input
              type="text"
              required
              value={eventType}
              onChange={e => setEventType(e.target.value)}
              placeholder="e.g. Royal Wedding, 30th Birthday Bash"
              className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl p-3 text-[#1F2923] focus:outline-none focus:border-[#11361E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#5A6B5D] uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-[#11361E]" />
                <span>Event Date</span>
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl p-3 text-[#1F2923] focus:outline-none focus:border-[#11361E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#5A6B5D] uppercase tracking-wider mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-[#11361E]" />
                <span>City / Location</span>
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl p-3 text-[#1F2923] focus:outline-none focus:border-[#11361E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#5A6B5D] uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-[#11361E]" />
                <span>Guests</span>
              </label>
              <input
                type="number"
                min={10}
                value={guestCount}
                onChange={e => setGuestCount(Number(e.target.value))}
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl p-3 text-[#1F2923] focus:outline-none focus:border-[#11361E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#5A6B5D] uppercase tracking-wider mb-1">
                Min Budget (₹)
              </label>
              <input
                type="number"
                step={5000}
                value={budgetMin}
                onChange={e => setBudgetMin(Number(e.target.value))}
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl p-3 text-[#1F2923] focus:outline-none focus:border-[#11361E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#5A6B5D] uppercase tracking-wider mb-1">
                Max Budget (₹)
              </label>
              <input
                type="number"
                step={5000}
                value={budgetMax}
                onChange={e => setBudgetMax(Number(e.target.value))}
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl p-3 text-[#1F2923] focus:outline-none focus:border-[#11361E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#5A6B5D] uppercase tracking-wider mb-1">
              Event Notes & Special Instructions
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any specific theme, dietary preferences, or schedule details..."
              className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl p-3 text-[#1F2923] focus:outline-none focus:border-[#11361E]"
            />
          </div>

          <div className="pt-3 border-t border-[#E2DDD3] flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-[#FAF8F5] hover:bg-[#E8F0EA] border border-[#E2DDD3] text-[#5A6B5D] hover:text-[#11361E] font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-[#11361E] hover:bg-[#0B2414] disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-sm"
            >
              {saving ? 'Saving Changes...' : 'Save & Record History'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
