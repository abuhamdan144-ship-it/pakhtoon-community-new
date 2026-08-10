import React from 'react';
import { motion } from 'framer-motion';
import Membership from '../components/Membership';
import { Member } from '../types';

interface RegisterProps {
  onRegisterMember: (memberData: Omit<Member, 'id' | 'createdAt' | 'status'>) => Promise<string | void>;
  onLookupMember?: (cnicOrId: string) => Member | undefined;
}

export default function Register({ onRegisterMember, onLookupMember }: RegisterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
    >
      <Membership 
        onRegisterMember={onRegisterMember}
        onLookupMember={onLookupMember}
      />
    </motion.div>
  );
}
