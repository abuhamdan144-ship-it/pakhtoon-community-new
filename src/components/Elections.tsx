import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, CheckCircle2, UserCheck, Shield, Sparkles, Award, BarChart3, AlertCircle } from 'lucide-react';
import { Election } from '../types';

interface ElectionsProps {
  elections: Election[];
  onCastVote: (electionId: string, candidateId: string) => Promise<void>;
  userEmail?: string | null;
}

export default function Elections({ elections, onCastVote, userEmail }: ElectionsProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<{ electionId: string; candidateId: string; candidateName: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votedElections, setVotedElections] = useState<Record<string, boolean>>({});

  const activeElections = elections || [];

  const handleVoteSubmit = async () => {
    if (!selectedCandidate) return;
    setIsSubmitting(true);
    try {
      await onCastVote(selectedCandidate.electionId, selectedCandidate.candidateId);
      setVotedElections(prev => ({ ...prev, [selectedCandidate.electionId]: true }));
      setSelectedCandidate(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-[#0e2e25] via-[#1b4d3e] to-[#0e2e25] text-[#faf6ed] relative border-b border-[#d4af37]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1b4d3e] border border-[#d4af37]/50 text-[#d4af37] text-xs font-black uppercase tracking-widest">
            <Vote size={14} className="animate-bounce text-[#d4af37]" />
            <span>DIRECT DEMOCRACY & ELECTORAL PORTAL</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-black text-white">
            Live Community Voting Portal
          </h2>
          <p className="text-sm sm:text-base text-[#faf6ed]/80">
            Cast your verified vote for executive representatives in Muscat, Salalah, Sohar, and Nizwa chapters.
          </p>
        </div>

        {/* Active Elections Grid */}
        <div className="space-y-12">
          {activeElections.map((election) => {
            const totalVotes = election.candidates.reduce((sum, c) => sum + (Number(c.votes) || 0), 0);
            const hasVoted = votedElections[election.id || ''] || false;

            return (
              <motion.div
                key={election.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl bg-gradient-to-br from-[#1b4d3e] to-[#0e2e25] border-2 border-[#d4af37]/60 p-6 sm:p-8 shadow-2xl space-y-6"
              >
                {/* Election Title Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/30 pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        election.status === 'open' ? 'bg-emerald-500 text-[#0e2e25]' : 'bg-rose-500 text-white'
                      }`}>
                        {election.status === 'open' ? '🟢 LIVE POLL OPEN' : '🔴 POLL CLOSED'}
                      </span>
                      <span className="text-xs font-mono text-[#d4af37]">Total Votes: {totalVotes}</span>
                    </div>

                    <h3 className="font-serif text-2xl font-bold text-white mt-2">
                      {election.title}
                    </h3>
                  </div>

                  {hasVoted && (
                    <div className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-400 text-emerald-300 font-extrabold text-xs flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>Vote Successfully Cast</span>
                    </div>
                  )}
                </div>

                {/* Candidate Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {election.candidates.map((candidate) => {
                    const percentage = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;

                    return (
                      <div
                        key={candidate.id}
                        className="p-5 rounded-2xl bg-[#0e2e25] border border-[#d4af37]/40 space-y-4 hover:border-[#d4af37] transition flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="p-2 rounded-lg bg-[#1b4d3e] text-[#d4af37]">
                              <UserCheck size={18} />
                            </span>
                            <span className="text-xs font-mono font-bold text-[#d4af37]">
                              {candidate.votes} Votes ({percentage}%)
                            </span>
                          </div>

                          <h4 className="font-bold text-base text-white">
                            {candidate.name}
                          </h4>

                          {/* Progress Bar */}
                          <div className="w-full h-3 rounded-full bg-[#1b4d3e] overflow-hidden p-0.5 border border-[#d4af37]/20">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-amber-400"
                            />
                          </div>
                        </div>

                        {/* Cast Vote Action Button */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={hasVoted || election.status !== 'open'}
                          onClick={() => setSelectedCandidate({
                            electionId: election.id || '',
                            candidateId: candidate.id,
                            candidateName: candidate.name
                          })}
                          className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
                            hasVoted 
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                              : 'bg-[#d4af37] hover:bg-amber-400 text-[#0e2e25] cursor-pointer shadow-lg'
                          }`}
                        >
                          <Vote size={14} />
                          <span>{hasVoted ? 'Already Voted' : 'Vote For Candidate'}</span>
                        </motion.button>

                      </div>
                    );
                  })}
                </div>

              </motion.div>
            );
          })}
        </div>

      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full bg-[#0e2e25] border-2 border-[#d4af37] p-6 rounded-3xl text-center space-y-5 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-[#1b4d3e] border border-[#d4af37] text-[#d4af37] flex items-center justify-center mx-auto">
                <Vote size={32} />
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-white">Confirm Your Vote</h3>
                <p className="text-xs text-[#faf6ed]/80 mt-1">
                  You are about to submit your official vote for:
                </p>
                <span className="block text-base font-black text-[#d4af37] mt-2 bg-[#1b4d3e] py-2 px-3 rounded-xl border border-[#d4af37]/40">
                  {selectedCandidate.candidateName}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-600 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVoteSubmit}
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-[#d4af37] text-[#0e2e25] text-xs font-black hover:bg-amber-400 transition"
                >
                  {isSubmitting ? 'Recording Vote...' : 'Confirm Vote'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
