import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppFloat() {
  return (
    <motion.a
      href="https://wa.me/96899111870"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      animate={{ 
        boxShadow: ["0px 0px 0px 0px rgba(34,197,94,0.7)", "0px 0px 0px 15px rgba(34,197,94,0)"]
      }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity,
        ease: "easeOut"
      }}
    >
      <MessageCircle size={28} />
      <span className="sr-only">Chat with OPC</span>
    </motion.a>
  );
}
