import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, ShieldCheck, CreditCard, Upload, Send, Search, CheckCircle2, Award, Download, ArrowRight } from 'lucide-react';
import LiveCardPreview from './LiveCardPreview';
import { Member } from '../types';

interface MembershipProps {
  onRegisterMember: (memberData: Omit<Member, 'id' | 'createdAt' | 'status'>) => Promise<string | void>;
  onLookupMember?: (cnicOrId: string) => Member | undefined;
}

export default function Membership({ onRegisterMember, onLookupMember }: MembershipProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'lookup'>('form');
  const [lookupValue, setLookupValue] = useState('');
  const [foundMember, setFoundMember] = useState<Member | null>(null);
  const [lookupSearched, setLookupSearched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    father: '',
    cnic: '',
    district: 'Peshawar',
    phone: '',
    whatsapp: '',
    address: 'Muscat, Oman',
    occupation: 'Private Business',
    emergency: '+968 99111870',
    email: '',
    photo: '',
    cardColor: 'emerald'
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.father || !formData.cnic || !formData.phone) {
      alert('Please fill out all required fields marked with *');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegisterMember({
        ...formData,
        feeAmount: 10,
        paymentMethod: 'Bank Transfer'
      });
      setSubmittedSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Registration failed. Please check your details or retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupValue.trim()) return;
    setLookupSearched(true);
    if (onLookupMember) {
      const res = onLookupMember(lookupValue.trim());
      setFoundMember(res || null);
    } else {
      setFoundMember(null);
    }
  };

  return (
    <section className="py-20 bg-[#faf6ed] text-[#0e2e25] relative border-b border-[#d4af37]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1b4d3e] text-[#d4af37] text-xs font-black uppercase tracking-widest">
            <UserCheck size={14} />
            <span>PAKHTOON DIASPORA REGISTRATION PORTAL</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#0e2e25]">
            Membership Application & Credentials
          </h2>
          <p className="text-sm sm:text-base text-slate-700">
            Apply for official scannable membership credentials or check your existing approval status.
          </p>

          {/* Toggle Form / Lookup Tabs */}
          <div className="inline-flex p-1.5 rounded-2xl bg-[#0e2e25] border border-[#d4af37]/40 max-w-md mx-auto pt-2">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'form' 
                  ? 'bg-[#d4af37] text-[#0e2e25] shadow-lg' 
                  : 'text-[#faf6ed]/80 hover:text-white'
              }`}
            >
              New Registration Form
            </button>
            <button
              onClick={() => setActiveTab('lookup')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'lookup' 
                  ? 'bg-[#d4af37] text-[#0e2e25] shadow-lg' 
                  : 'text-[#faf6ed]/80 hover:text-white'
              }`}
            >
              Verify Status / Download Card
            </button>
          </div>
        </div>

        {/* Tab Content 1: New Registration Form */}
        {activeTab === 'form' && (
          <div>
            {submittedSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto bg-white border-2 border-emerald-500 p-8 sm:p-12 rounded-3xl text-center space-y-6 shadow-2xl"
              >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="font-serif text-3xl font-bold text-[#0e2e25]">
                  Membership Application Submitted!
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your registration application has been received by the Pakhtoon Community Executive Secretariat. You can verify your status and generate your card upon approval.
                </p>
                <button
                  onClick={() => {
                    setSubmittedSuccess(false);
                    setFormData({
                      name: '', father: '', cnic: '', district: 'Peshawar', phone: '', whatsapp: '',
                      address: 'Muscat, Oman', occupation: 'Private Business', emergency: '+968 99111870', email: '', photo: '', cardColor: 'emerald'
                    });
                  }}
                  className="px-6 py-3 rounded-xl bg-[#1b4d3e] text-[#d4af37] text-xs font-black hover:bg-[#0e2e25] transition"
                >
                  Submit Another Application
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                
                {/* Left Form */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="lg:col-span-7 bg-white border border-[#d4af37]/40 p-6 sm:p-10 rounded-3xl shadow-xl space-y-6"
                >
                  <form onSubmit={handleSubmit} className="space-y-4">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#0e2e25] mb-1">Full Name *</label>
                        <input 
                          type="text" required value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Jan Mohammad Khan"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-[#0e2e25] focus:outline-none focus:border-[#1b4d3e]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#0e2e25] mb-1">Father's Name *</label>
                        <input 
                          type="text" required value={formData.father}
                          onChange={(e) => setFormData({ ...formData, father: e.target.value })}
                          placeholder="e.g. Haji Gul Khan"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-[#0e2e25] focus:outline-none focus:border-[#1b4d3e]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#0e2e25] mb-1">CNIC / NICOP Number *</label>
                        <input 
                          type="text" required value={formData.cnic}
                          onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                          placeholder="17301-1234567-1"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-[#0e2e25] focus:outline-none focus:border-[#1b4d3e]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#0e2e25] mb-1">District of Origin</label>
                        <select
                          value={formData.district}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-[#0e2e25] focus:outline-none focus:border-[#1b4d3e]"
                        >
                          {['Peshawar', 'Mardan', 'Swat', 'Dir', 'Kohat', 'Bannu', 'Abbottabad', 'Charsadda', 'Nowshera', 'Quetta', 'Swabi', 'Tribal Districts'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#0e2e25] mb-1">Mobile Number (Oman) *</label>
                        <input 
                          type="text" required value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+968 99111870"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-[#0e2e25] focus:outline-none focus:border-[#1b4d3e]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#0e2e25] mb-1">WhatsApp Number</label>
                        <input 
                          type="text" value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          placeholder="+968 99111870"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-[#0e2e25] focus:outline-none focus:border-[#1b4d3e]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0e2e25] mb-1">Upload Portrait Photo</label>
                      <input 
                        type="file" accept="image/*" onChange={handlePhotoChange}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#1b4d3e] file:text-[#d4af37] hover:file:bg-[#0e2e25]"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#1b4d3e] to-[#0e2e25] text-[#d4af37] font-black text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 cursor-pointer border border-[#d4af37]"
                    >
                      <Send size={18} />
                      <span>{isSubmitting ? 'Processing Application...' : 'Submit Official Registration'}</span>
                    </motion.button>

                  </form>
                </motion.div>

                {/* Right Live Card Preview */}
                <div className="lg:col-span-5 space-y-4">
                  <span className="text-xs font-black uppercase tracking-widest text-[#1b4d3e] block text-center lg:text-left">
                    Live Real-Time Card Preview
                  </span>

                  <LiveCardPreview 
                    member={{
                      name: formData.name || 'Your Full Name',
                      father: formData.father || 'Father Name',
                      cnic: formData.cnic || '17301-0000000-0',
                      district: formData.district,
                      phone: formData.phone || '+968 00000000',
                      photo: formData.photo,
                      membershipId: 'OPC-OMN-PENDING',
                      status: 'approved',
                      createdAt: new Date().toISOString(),
                      address: formData.address
                    }}
                  />
                </div>

              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Verification Lookup */}
        {activeTab === 'lookup' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
            <form onSubmit={handleLookup} className="flex gap-3">
              <input 
                type="text"
                placeholder="Enter CNIC number or Membership ID..."
                value={lookupValue}
                onChange={(e) => setLookupValue(e.target.value)}
                className="flex-1 px-5 py-3.5 rounded-2xl bg-white border-2 border-[#d4af37] text-sm font-semibold text-[#0e2e25] focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3.5 rounded-2xl bg-[#1b4d3e] text-[#d4af37] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg"
              >
                <Search size={16} />
                <span>Verify</span>
              </button>
            </form>

            {lookupSearched && (
              <div className="p-6 rounded-3xl bg-white border border-[#d4af37]/40 shadow-xl text-center space-y-4">
                {foundMember ? (
                  <div className="space-y-4">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs">
                      ✅ VERIFIED APPROVED MEMBER
                    </span>
                    <h3 className="text-2xl font-serif font-bold text-[#0e2e25]">{foundMember.name}</h3>
                    <p className="text-xs text-slate-600 font-mono">Member ID: {foundMember.membershipId || 'OPC-OMN-88421'}</p>
                    <p className="text-xs text-slate-600 font-mono">CNIC: {foundMember.cnic}</p>
                    <LiveCardPreview member={foundMember} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 font-bold">
                    No approved membership record found for "{lookupValue}". Please submit a new registration application.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}

      </div>
    </section>
  );
}
