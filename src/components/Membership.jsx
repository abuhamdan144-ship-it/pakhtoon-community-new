import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Camera, Download, ShieldCheck } from 'lucide-react';
import { collections } from '../firebase/collections';
import { addDoc } from 'firebase/firestore';

const readProfilePhoto = (file) => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) {
    reject(new Error('Please choose an image file.'));
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    reject(new Error('Please choose an image smaller than 5 MB.'));
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const source = reader.result;
    const image = new Image();
    image.onload = () => {
      const maxSize = 720;
      const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      const context = canvas.getContext('2d');
      if (!context) {
        resolve(source);
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => reject(new Error('This image could not be processed.'));
    image.src = source;
  };
  reader.onerror = () => reject(new Error('This image could not be read.'));
  reader.readAsDataURL(file);
});

export default function Membership() {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  const watchedName = watch('name', 'YOUR NAME');
  const watchedId = watch('omanId', 'OMAN ID');

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readProfilePhoto(file);
      setPhoto(dataUrl);
      setPhotoPreview(dataUrl);
    } catch (error) {
      event.target.value = '';
      toast.error(error.message || 'The photo could not be uploaded.');
    }
  };

  const onSubmit = async (data) => {
    if (!photo) {
      toast.error('Please add a clear profile photo for the membership card.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collections.members, {
        ...data,
        photo,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      toast.success('Application submitted. Your card is available after administrator approval.');
      reset();
      setPhoto('');
      setPhotoPreview('');
    } catch (error) {
      toast.error(`Failed to submit application: ${error.message}`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream pt-20">
      <div className="container mx-auto px-6 py-12">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h1 className="mb-4 font-serif text-4xl font-bold text-forest-dark">Membership Registration</h1>
          <div className="mx-auto h-1 w-24 rounded-full bg-gold" />
          <p className="mt-5 text-sm leading-6 text-gray-600">Your photo is used only on your OPC membership card and is visible to authorised OPC administrators.</p>
        </div>

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
          <motion.div
            className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
                  <input {...register('name', { required: true })} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20" placeholder="Enter full name" />
                  {errors.name && <span className="mt-1 text-xs text-red-500">Required</span>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Father's Name</label>
                  <input {...register('father', { required: true })} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20" placeholder="Enter father's name" />
                  {errors.father && <span className="mt-1 text-xs text-red-500">Required</span>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Oman ID Card Number</label>
                <input {...register('omanId', { required: true })} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-mono outline-none transition-all focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20" placeholder="Enter Oman civil ID number" />
                {errors.omanId && <span className="mt-1 text-xs text-red-500">Required</span>}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Mobile (Oman)</label>
                  <input {...register('phone', { required: true })} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20" placeholder="+968..." />
                  {errors.phone && <span className="mt-1 text-xs text-red-500">Required</span>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Oman location</label>
                  <input {...register('omanLocation', { required: true })} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20" placeholder="e.g. Muscat, Sohar, Salalah" />
                  {errors.omanLocation && <span className="mt-1 text-xs text-red-500">Required</span>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">District of origin (Pakistan)</label>
                <input {...register('district', { required: true })} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20" placeholder="e.g. Swat, Peshawar" />
                {errors.district && <span className="mt-1 text-xs text-red-500">Required</span>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Address in Oman</label>
                <textarea {...register('address', { required: true })} rows="3" className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20" placeholder="Area and city" />
                {errors.address && <span className="mt-1 text-xs text-red-500">Required</span>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Membership-card profile photo</label>
                <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-gold/60 bg-gold/5 p-4 transition hover:bg-gold/10">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-dark text-gold"><Camera size={20} /></span>
                  <span className="flex-1 text-sm text-gray-600"><strong className="block text-forest-dark">Upload a clear face photo</strong>JPG or PNG, maximum 5 MB.</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handlePhotoChange} />
                </label>
                {photoPreview && <p className="mt-2 text-xs font-medium text-green-700">Photo ready for your membership-card application.</p>}
              </div>

              <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center rounded-lg bg-forest-dark py-4 font-bold text-gold shadow-lg transition-colors hover:bg-forest disabled:opacity-70">
                {isSubmitting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="h-6 w-6 rounded-full border-2 border-gold border-t-transparent" /> : 'SUBMIT APPLICATION'}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-forest-dark/10 bg-forest-dark/[.03] p-4 text-sm text-gray-600">
              <div className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-forest-dark" /><span>After the administrator approves your application, use your membership ID and registered phone number to securely download your card.</span></div>
              <Link to="/card" className="mt-3 inline-flex items-center gap-2 font-bold text-forest-dark underline decoration-gold decoration-2 underline-offset-4"><Download size={16} /> Download approved membership card</Link>
            </div>
          </motion.div>

          <motion.div className="sticky top-32 perspective-1000" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="mb-6 text-center"><h3 className="font-mono text-sm uppercase tracking-widest text-gray-500">Live Card Preview</h3></div>
            <motion.div className="relative mx-auto aspect-[1.586/1] w-full max-w-md overflow-hidden rounded-xl border-2 border-gold/50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transform-style-3d" whileHover={{ rotateX: 5, rotateY: -10, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <div className="absolute inset-0 bg-gradient-to-br from-forest-dark to-forest" />
              <motion.div className="absolute inset-0 skew-x-12 bg-gradient-to-tr from-transparent via-white/10 to-transparent" animate={{ x: ['-100%', '200%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
              <div className="absolute left-0 right-0 top-0 flex h-3"><div className="flex-1 bg-[#01411C]" /><div className="w-1/4 bg-white" /></div>
              <div className="relative z-10 flex h-full flex-col justify-between p-6 pt-8 text-cream">
                <div><h2 className="mb-1 text-center font-serif text-xl font-bold text-gold">PAKHTOON COMMUNITY OMAN</h2><p className="mb-4 text-center text-xs uppercase tracking-widest opacity-80">Membership Identity Card</p></div>
                <div className="flex items-end gap-4">
                  <div className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-white/20 bg-white/10">
                    {photoPreview ? <img src={photoPreview} alt="Membership card preview" className="h-full w-full object-cover" /> : <span className="text-xs opacity-50">PHOTO</span>}
                  </div>
                  <div className="min-w-0 flex-1 pb-2"><h3 className="truncate text-2xl font-bold uppercase">{watchedName || 'YOUR NAME'}</h3><p className="mt-1 truncate font-mono text-sm opacity-80">{watchedId || 'OMAN ID'}</p><p className="mt-3 font-mono text-sm font-bold text-gold">ISSUED AFTER APPROVAL</p></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
