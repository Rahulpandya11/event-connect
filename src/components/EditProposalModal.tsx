import React, { useState } from 'react';
import { Proposal } from '../types';
import { api } from '../services/api';
import { X, DollarSign, Edit3, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface EditProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal;
  onSuccess: () => void;
}

export const EditProposalModal: React.FC<EditProposalModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onSuccess
}) => {
  const [totalPrice, setTotalPrice] = useState<number>(proposal.totalPrice || 0);
  const [planText, setPlanText] = useState(proposal.planText || '');
  
  // Itemized breakdown state
  const [items, setItems] = useState<{ name: string; price: number }[]>(() => {
    if (proposal.itemizedPrices && Object.keys(proposal.itemizedPrices).length > 0) {
      return Object.entries(proposal.itemizedPrices).map(([name, price]) => ({
        name,
        price: Number(price)
      }));
    }
    return [
      { name: 'Core Service Fee', price: Math.round(proposal.totalPrice * 0.7) },
      { name: 'Equipment & Logistics', price: Math.round(proposal.totalPrice * 0.3) }
    ];
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { name: '', price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    recalcTotal(updated);
  };

  const handleItemChange = (index: number, field: 'name' | 'price', val: any) => {
    const updated = [...items];
    if (field === 'price') {
      updated[index].price = Number(val) || 0;
    } else {
      updated[index].name = val;
    }
    setItems(updated);
    recalcTotal(updated);
  };

  const recalcTotal = (list: { name: string; price: number }[]) => {
    const sum = list.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
    if (sum > 0) {
      setTotalPrice(sum);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalPrice || totalPrice <= 0) {
      setError('Please provide a valid total price.');
      return;
    }
    if (!planText.trim()) {
      setError('Please provide a description of your proposal plan.');
      return;
    }

    setError('');
    setSaving(true);

    const itemizedObj: Record<string, number> = {};
    items.forEach(item => {
      if (item.name.trim()) {
        itemizedObj[item.name.trim()] = Number(item.price) || 0;
      }
    });

    try {
      await api.updateProposal(proposal.id, {
        totalPrice: Number(totalPrice),
        itemizedPrices: itemizedObj,
        planText
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update proposal');
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
              Revise Proposal & Pricing
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
              Total Quoted Price (₹)
            </label>
            <input
              type="number"
              required
              min={100}
              step={500}
              value={totalPrice}
              onChange={e => setTotalPrice(Number(e.target.value))}
              className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl p-3 text-lg font-bold text-[#11361E] focus:outline-none focus:border-[#11361E]"
            />
            <p className="text-[11px] text-[#5A6B5D] mt-1">
              Updating this price will record a transparent price history entry visible to the client.
            </p>
          </div>

          {/* Itemized Price Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-[#5A6B5D] uppercase tracking-wider">
                Itemized Price Breakdown
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[11px] text-[#11361E] font-semibold hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. Photography, Album printing"
                    value={item.name}
                    onChange={e => handleItemChange(idx, 'name', e.target.value)}
                    className="flex-1 bg-[#FAF8F5] border border-[#E2DDD3] rounded-lg p-2.5 text-[#1F2923] focus:outline-none focus:border-[#11361E]"
                  />
                  <input
                    type="number"
                    placeholder="Amount ₹"
                    value={item.price}
                    onChange={e => handleItemChange(idx, 'price', e.target.value)}
                    className="w-32 bg-[#FAF8F5] border border-[#E2DDD3] rounded-lg p-2.5 text-[#1F2923] font-semibold text-right focus:outline-none focus:border-[#11361E]"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#5A6B5D] uppercase tracking-wider mb-1">
              Proposal Details & Deliverables Pitch
            </label>
            <textarea
              rows={4}
              required
              value={planText}
              onChange={e => setPlanText(e.target.value)}
              placeholder="Describe your service offer, equipment provided, team size, timeline, and terms..."
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
              {saving ? 'Updating Proposal...' : 'Save & Record Revision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
