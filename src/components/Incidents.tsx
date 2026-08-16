import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Plus, PhoneCall, CheckCircle2, Clock, ShieldAlert, Heart, FileText, Send } from 'lucide-react';
import { IncidentReport } from '../types';

interface IncidentsProps {
  incidents: IncidentReport[];
  onSubmitIncident: (report: Omit<IncidentReport, 'id' | 'createdAt'>) => Promise<void>;
}

export default function Incidents({ incidents, onSubmitIncident }: IncidentsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    type: 'medical' as 'death' | 'injury' | 'loss',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const defaultIncidents: IncidentReport[] = [
    {
      id: 'inc-1',
      type: 'death',
      name: 'Emergency Repatriation Case - Barka',
      description: 'Official diplomatic clearance and repatriation support provided for deceased community member family to Peshawar, Pakistan.',
      date: '2026-08-02',
      contact: '+968 99111870',
      status: 'published',
      createdAt: new Date().toISOString()
    },
    {
      id: 'inc-2',
      type: 'injury',
      name: 'Workplace Injury Hospitalization - Nizwa',
      description: 'Community medical fund sanctioned 1,200 OMR for emergency surgical procedure and family relief allowance.',
      date: '2026-07-29',
      contact: '+968 98223344',
      status: 'published',
      createdAt: new Date().toISOString()
    },
    {
      id: 'inc-3',
      type: 'loss',
      name: 'Consular Passport & Document Legal Loss - Sohar',
      description: 'Passport loss report filed with Muscat Embassy Liaison. Legal assistance provided for emergency travel document clearance.',
      date: '2026-07-22',
      contact: '+968 97334455',
      status: 'published',
      createdAt: new Date().toISOString()
    }
  ];

  const incidentList = incidents && incidents.length > 0 ? incidents : defaultIncidents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact || !formData.description) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitIncident({
        ...formData,
        status: 'pending'
      });
      alert('Welfare incident claim submitted successfully! Executive team will contact you shortly.');
      setModalOpen(false);
      setFormData({
        name: '',
        contact: '',
        type: 'injury',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error(err);
      alert('Error submitting claim. Please contact hotline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-[#faf6ed] text-[#0e2e25] relative border-b border-[#d4af37]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b4d3e] text-[#d4af37] text-xs font-black uppercase tracking-widest">
              <ShieldAlert size={14} />
              <span>WELFARE & EMERGENCY RESPONSE HUB</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#0e2e25]">
              Incidents & Relief Claims Timeline
            </h2>
            <p className="text-sm text-slate-700">
              Transparent log of community medical relief, repatriation claims, and emergency assistance.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setModalOpen(true)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#1b4d3e] to-[#0e2e25] text-[#d4af37] border border-[#d4af37] font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xl"
          >
            <Plus size={18} />
            <span>File Emergency Claim</span>
          </motion.button>
        </div>

        {/* Timeline Layout */}
        <div className="relative border-l-2 border-[#1b4d3e]/30 ml-4 sm:ml-8 space-y-10">
          {incidentList.map((item, idx) => (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="relative pl-8 sm:pl-12 group"
            >
              {/* Timeline Bullet Icon */}
              <div className="absolute -left-[17px] top-1.5 p-2 rounded-full bg-[#1b4d3e] border-2 border-[#d4af37] text-[#d4af37] shadow-lg">
                <AlertTriangle size={16} />
              </div>

              {/* Claim Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#d4af37]/40 shadow-xl space-y-4 hover:shadow-2xl transition">
                
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                    CLAIM CATEGORY: {item.type.toUpperCase()}
                  </span>

                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1b4d3e]">
                    <Clock size={14} />
                    <span>Filed: {item.date}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-bold text-[#0e2e25]">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans mt-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Official Action Complete</span>
                  </div>

                  <a 
                    href={`tel:${item.contact}`} 
                    className="font-mono text-xs font-bold text-[#1b4d3e] hover:underline"
                  >
                    Contact Helpline: {item.contact}
                  </a>
                </div>

              </div>

            </motion.div>
          ))}
        </div>

      </div>

      {/* Submission Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-lg w-full bg-[#0e2e25] border-2 border-[#d4af37] p-6 sm:p-8 rounded-3xl text-white space-y-6 shadow-2xl my-8"
            >
              <div className="flex justify-between items-center border-b border-[#d4af37]/30 pb-4">
                <h3 className="font-serif text-2xl font-bold text-[#d4af37] flex items-center gap-2">
                  <AlertTriangle size={24} />
                  <span>Submit Emergency Claim</span>
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#d4af37] mb-1">Applicant / Deceased Name *</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Mohammad Bilal Yousafzai"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1b4d3e] border border-[#d4af37]/40 text-xs font-semibold text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#d4af37] mb-1">Emergency Category</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1b4d3e] border border-[#d4af37]/40 text-xs font-semibold text-white focus:outline-none focus:border-[#d4af37]"
                    >
                      <option value="death">Deceased / Repatriation</option>
                      <option value="injury">Medical / Hospitalization</option>
                      <option value="loss">Consular / Legal Loss</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#d4af37] mb-1">Contact Phone *</label>
                    <input 
                      type="text"
                      required
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="+968 99111870"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1b4d3e] border border-[#d4af37]/40 text-xs font-semibold text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#d4af37] mb-1">Incident Details & Emergency Request *</label>
                  <textarea 
                    rows={4}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide full details of hospital, location, passport number, and requested assistance..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1b4d3e] border border-[#d4af37]/40 text-xs font-semibold text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="w-1/3 py-3 rounded-xl border border-slate-600 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-2/3 py-3 rounded-xl bg-[#d4af37] text-[#0e2e25] text-xs font-black hover:bg-amber-400 transition flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    <span>{isSubmitting ? 'Submitting Claim...' : 'Dispatch Claim Request'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
