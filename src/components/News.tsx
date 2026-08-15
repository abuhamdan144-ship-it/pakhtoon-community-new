import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Search, Calendar, Tag, Sparkles, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { NewsAnnouncement } from '../types';

interface NewsProps {
  news: NewsAnnouncement[];
}

export default function News({ news }: NewsProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const defaultNews: NewsAnnouncement[] = [
    {
      id: 'n1',
      title: 'Consular & Legal Aid Session in Salalah',
      content: 'The Pakhtoon Community Executive Council has scheduled a free legal and consular support workshop for workers and businessmen in Dhofar region. Representatives will assist with passport renewal, labor contracts, and emergency repatriation claims.',
      image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
      createdAt: '2026-08-01'
    },
    {
      id: 'n2',
      title: 'Digital Membership Card Dispatches Completed for Muscat Chapter',
      content: 'Over 400 verified Pakhtoon Diaspora members in Muscat, Seeb, and Ruwi have been issued official QR-scannable digital membership credentials. Members can look up their profile and download PDF cards directly from this portal.',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      createdAt: '2026-07-28'
    },
    {
      id: 'n3',
      title: 'Welfare Emergency Relief Fund Allocation Announcement',
      content: 'A total of 4,500 OMR has been dispatched this month to support medical repatriation cases and families of deceased community members. The community thanks all donors for their generous contributions.',
      image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?w=800&auto=format&fit=crop&q=80',
      createdAt: '2026-07-20'
    }
  ];

  const newsItems = news && news.length > 0 ? news : defaultNews;

  const filteredNews = newsItems.filter(item => 
    item.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <section className="py-20 bg-[#faf6ed] text-[#0e2e25] relative border-b border-[#d4af37]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b4d3e] text-[#d4af37] text-xs font-black uppercase tracking-widest">
              <Newspaper size={14} />
              <span>OFFICIAL COMMUNITY NEWS & MEDIA</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#0e2e25]">
              Press Releases & Announcements
            </h2>
            <p className="text-sm text-slate-700">
              Stay updated with diplomatic, welfare, and executive council bulletins across Oman.
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1b4d3e]" size={16} />
              <input 
                type="text"
                placeholder="Filter news..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#d4af37]/50 text-xs font-semibold text-[#0e2e25] focus:outline-none focus:border-[#1b4d3e] shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Masonry Animated Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNews.map((item, idx) => (
            <motion.article
              key={item.id || idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              whileHover={{ y: -6 }}
              className="rounded-2xl bg-white border border-[#d4af37]/40 shadow-xl overflow-hidden flex flex-col justify-between group hover:shadow-2xl transition-all"
            >
              <div>
                {/* News Image */}
                {item.image && (
                  <div className="relative h-48 w-full overflow-hidden bg-[#0e2e25]">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={() => setSelectedImage(item.image || null)}
                      className="absolute bottom-3 right-3 p-2 rounded-lg bg-[#0e2e25]/80 text-[#d4af37] hover:bg-[#0e2e25] transition"
                      title="Enlarge Image"
                    >
                      <ImageIcon size={14} />
                    </button>
                  </div>
                )}

                {/* News Content */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#1b4d3e]">
                    <Calendar size={12} />
                    <span>{typeof item.createdAt === 'string' ? item.createdAt : 'Recent Bulletin'}</span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-[#0e2e25] group-hover:text-[#1b4d3e] transition line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-700 leading-relaxed line-clamp-4 font-sans">
                    {item.content}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#d4af37] bg-[#1b4d3e] px-2.5 py-0.5 rounded-full">
                  Verified Press
                </span>
                <button 
                  onClick={() => alert(`Full Release:\n\n${item.title}\n\n${item.content}`)}
                  className="text-xs font-bold text-[#1b4d3e] hover:text-[#0e2e25] flex items-center gap-1"
                >
                  Read Full <ExternalLink size={12} />
                </button>
              </div>

            </motion.article>
          ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={selectedImage}
              alt="Enlarged view"
              className="max-w-full max-h-[90vh] rounded-2xl border-2 border-[#d4af37]"
            />
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
