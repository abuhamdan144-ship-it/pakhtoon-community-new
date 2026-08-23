import React from 'react';
import { motion } from 'framer-motion';

export default function Loader() {
  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-forest-dark"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer Ring */}
        <motion.div
          className="absolute inset-0 w-32 h-32 border-t-2 border-gold rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner Ring */}
        <motion.div
          className="absolute inset-0 w-24 h-24 border-b-2 border-gold-light rounded-full m-auto"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        {/* Logo Text */}
        <motion.div 
          className="text-gold font-serif text-3xl font-bold z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, yoyo: Infinity }}
        >
          OPC
        </motion.div>
      </div>
    </motion.div>
  );
}
