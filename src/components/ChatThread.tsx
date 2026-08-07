import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { ChatThread as ChatThreadType, ChatMessage } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Send,
  DollarSign,
  Paperclip,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  X
} from 'lucide-react';

interface ChatThreadProps {
  thread: ChatThreadType;
  onAcceptQuote?: (totalPrice: number) => void;
}

export const ChatThreadView: React.FC<ChatThreadProps> = ({ thread, onAcceptQuote }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  // Structured Quote Modal State (for Provider)
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteTotal, setQuoteTotal] = useState(14500);
  const [quoteItems, setQuoteItems] = useState<{ name: string; price: number }[]>([
    { name: 'Full Planning & Execution', price: 4000 },
    { name: 'Plated Catering (Discounted)', price: 6800 },
    { name: 'Floral Arches & Lighting', price: 3700 }
  ]);
  const [quoteNote, setQuoteNote] = useState('Special revised bundle quote with 5% seasonal discount applied.');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      const msgs = await api.getChatMessages(thread.id);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000); // Polling backup
    return () => clearInterval(interval);
  }, [thread.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newMsgText = text;
    setText('');

    try {
      const msg = await api.sendMessage(thread.id, { messageText: newMsgText });
      setMessages(prev => [...prev, msg]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendRevisedQuote = async () => {
    const itemizedObj: Record<string, number> = {};
    quoteItems.forEach(i => {
      if (i.name) itemizedObj[i.name] = Number(i.price);
    });

    try {
      const msg = await api.sendMessage(thread.id, {
        isQuoteUpdate: true,
        messageText: `Revised Quote Proposal: $${quoteTotal.toLocaleString()} — ${quoteNote}`,
        quoteData: {
          totalPrice: Number(quoteTotal),
          itemizedPrices: itemizedObj,
          note: quoteNote
        }
      });
      setMessages(prev => [...prev, msg]);
      setShowQuoteModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-white border border-[#E2DDD3] rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 bg-[#FAF8F5] border-b border-[#E2DDD3] flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-serif italic font-bold text-sm text-[#11361E]">
              {user?.role === 'client' ? thread.providerBusinessName : thread.clientName}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#E8F0EA] text-[#11361E] border border-[#11361E]/30">
              {thread.eventType} • {thread.requirementCategory}
            </span>
          </div>
          <p className="text-[11px] text-[#5A6B5D]">Negotiation & Direct Requirement Chat Thread</p>
        </div>

        {user?.role === 'provider' && (
          <button
            onClick={() => setShowQuoteModal(true)}
            className="px-3 py-1.5 rounded-md bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs flex items-center space-x-1 transition shadow-sm"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Send Revised Quote</span>
          </button>
        )}
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF8F5]">
        {loading ? (
          <div className="text-xs text-[#5A6B5D] text-center py-8">Loading chat history...</div>
        ) : messages.length === 0 ? (
          <div className="text-xs text-[#5A6B5D] text-center py-8">No messages yet. Start negotiating!</div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === user?.id;

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md p-3.5 rounded-lg text-xs space-y-1 ${
                  isMe
                    ? 'bg-[#11361E] text-white rounded-br-none shadow-sm'
                    : 'bg-white text-[#1F2923] border border-[#E2DDD3] rounded-bl-none shadow-sm'
                }`}>
                  {/* Standard Text */}
                  {msg.messageText && <p>{msg.messageText}</p>}

                  {/* STRUCTURED REVISED QUOTE CARD */}
                  {msg.isQuoteUpdate && msg.quoteData && (
                    <div className="mt-2 p-3 bg-[#FAF8F5] border border-[#11361E]/40 rounded-lg text-[#1F2923] space-y-2">
                      <div className="flex items-center space-x-1.5 text-[#11361E] font-bold text-xs border-b border-[#E2DDD3] pb-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>Official Revised Price Quote</span>
                      </div>

                      <div className="text-lg font-bold text-[#11361E]">
                        ₹{msg.quoteData.totalPrice?.toLocaleString()}
                      </div>

                      {msg.quoteData.itemizedPrices && (
                        <div className="space-y-1 text-[11px] bg-white p-2 rounded border border-[#E2DDD3]">
                          {Object.entries(msg.quoteData.itemizedPrices).map(([item, price]) => (
                            <div key={item} className="flex justify-between text-[#5A6B5D]">
                              <span>{item}</span>
                              <span className="font-semibold text-[#1F2923]">₹{Number(price).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.quoteData.note && (
                        <p className="text-[11px] text-[#5A6B5D] italic">"{msg.quoteData.note}"</p>
                      )}

                      {user?.role === 'client' && onAcceptQuote && (
                        <button
                          onClick={() => onAcceptQuote(msg.quoteData!.totalPrice)}
                          className="w-full py-1.5 mt-2 rounded bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs shadow-sm"
                        >
                          Accept This Revised Quote
                        </button>
                      )}
                    </div>
                  )}

                  <div className={`text-[10px] text-right opacity-70 mt-1 ${isMe ? 'text-white/80' : 'text-[#5A6B5D]'}`}>
                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 bg-[#FAF8F5] border-t border-[#E2DDD3] flex items-center space-x-2">
        <input
          type="text"
          placeholder="Type message, negotiate terms, or ask questions..."
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 bg-white border border-[#E2DDD3] rounded-md px-3.5 py-2 text-xs text-[#1F2923] placeholder-[#8C9B8F] focus:outline-none focus:border-[#11361E]"
        />
        <button
          type="submit"
          className="p-2 rounded-md bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Provider Revised Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-[#E2DDD3] rounded-xl p-5 text-[#1F2923] space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#E2DDD3] pb-2">
              <h4 className="font-serif italic font-bold text-sm text-[#11361E]">Send Structured Revised Quote</h4>
              <button onClick={() => setShowQuoteModal(false)} className="text-[#5A6B5D] hover:text-[#11361E]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#11361E] mb-1">New Total Agreed Price (₹)</label>
              <input
                type="number"
                value={quoteTotal}
                onChange={e => setQuoteTotal(Number(e.target.value))}
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A6B5D] mb-1">Quote Note / Discount Justification</label>
              <input
                type="text"
                value={quoteNote}
                onChange={e => setQuoteNote(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-md px-3 py-2 text-xs text-[#1F2923] focus:outline-none focus:border-[#11361E]"
              />
            </div>

            <button
              type="button"
              onClick={handleSendRevisedQuote}
              className="w-full py-2 bg-[#11361E] hover:bg-[#0B2414] text-white font-semibold text-xs rounded-md shadow-sm transition"
            >
              Submit Revised Quote into Chat Thread
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
