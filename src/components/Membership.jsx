import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function Membership() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const watchedName = watch('name', 'YOUR NAME');
  const watchedId = watch('cnic', '12345-6789012-3');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    // Simulate Firebase delay
    await new Promise(r => setTimeout(r, 1500));
    toast.success('Application submitted successfully!');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen pt-20 bg-cream">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-forest-dark mb-4">Membership Registration</h1>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Form Side */}
          <motion.div 
            className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    {...register('name', { required: true })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="Enter full name"
                  />
                  {errors.name && <span className="text-red text-xs mt-1">Required</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                  <input 
                    {...register('father', { required: true })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="Enter father's name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNIC / Passport Number</label>
                <input 
                  {...register('cnic', { required: true })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all bg-gray-50 focus:bg-white font-mono"
                  placeholder="00000-0000000-0"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile (Oman)</label>
                  <input 
                    {...register('phone', { required: true })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="+968..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District (Pakistan)</label>
                  <input 
                    {...register('district', { required: true })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="e.g. Swat, Peshawar"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-forest-dark text-gold font-bold py-4 rounded-lg hover:bg-forest transition-colors shadow-lg disabled:opacity-70 flex justify-center items-center"
              >
                {isSubmitting ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full" />
                ) : (
                  "SUBMIT APPLICATION"
                )}
              </button>
            </form>
          </motion.div>

          {/* Card Preview Side */}
          <motion.div 
            className="sticky top-32 perspective-1000"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="text-center mb-6">
              <h3 className="text-gray-500 font-mono text-sm uppercase tracking-widest">Live Card Preview</h3>
            </div>
            
            <motion.div 
              className="w-full max-w-md mx-auto aspect-[1.586/1] rounded-xl overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-gold/50 transform-style-3d"
              whileHover={{ rotateX: 5, rotateY: -10, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-forest-dark to-forest" />
              
              {/* Shimmer */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent skew-x-12"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />

              {/* Flag Strip */}
              <div className="absolute top-0 left-0 right-0 h-3 flex">
                <div className="flex-1 bg-[#01411C]" />
                <div className="w-1/4 bg-white" />
              </div>

              {/* Content */}
              <div className="relative p-6 pt-8 h-full flex flex-col justify-between z-10 text-cream">
                <div>
                  <h2 className="text-gold font-serif font-bold text-xl text-center mb-1">PAKHTOON COMMUNITY OMAN</h2>
                  <p className="text-xs text-center uppercase tracking-widest opacity-80 mb-4">Membership Identity Card</p>
                </div>
                
                <div className="flex items-end gap-4">
                  <div className="w-24 h-32 bg-white/10 rounded flex items-center justify-center border border-white/20">
                    <span className="text-xs opacity-50">PHOTO</span>
                  </div>
                  <div className="flex-1 pb-2">
                    <h3 className="text-2xl font-bold uppercase truncate">{watchedName || 'YOUR NAME'}</h3>
                    <p className="text-sm opacity-80 font-mono mt-1 truncate">{watchedId || '12345-6789012-3'}</p>
                    <p className="text-gold font-mono font-bold mt-3 text-sm">OPC-OM-2026-XXXX</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
