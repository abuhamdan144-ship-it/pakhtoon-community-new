import React from 'react';
import { motion } from 'motion/react';
import ElectionsComponent from '../components/Elections';
import { Election } from '../types';

interface ElectionsProps {
  elections: Election[];
  onCastVote: (electionId: string, candidateId: string) => Promise<void>;
  userEmail?: string | null;
}

export default function ElectionsPage({ elections, onCastVote, userEmail }: ElectionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
    >
      <ElectionsComponent 
        elections={elections}
        onCastVote={onCastVote}
        userEmail={userEmail}
      />
    </motion.div>
  );
}
