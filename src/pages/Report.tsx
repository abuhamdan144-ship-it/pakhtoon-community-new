import React from 'react';
import { motion } from 'motion/react';
import Incidents from '../components/Incidents';
import { IncidentReport } from '../types';

interface ReportProps {
  incidents: IncidentReport[];
  onSubmitIncident: (report: Omit<IncidentReport, 'id' | 'createdAt'>) => Promise<void>;
}

export default function Report({ incidents, onSubmitIncident }: ReportProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
    >
      <Incidents 
        incidents={incidents}
        onSubmitIncident={onSubmitIncident}
      />
    </motion.div>
  );
}
