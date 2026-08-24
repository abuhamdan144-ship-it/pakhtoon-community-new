import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collections } from '../firebase/collections';
import { onSnapshot, query, orderBy } from 'firebase/firestore';

const fallbackNews = [
  { id: 1, title: 'Annual Community Gathering', date: '2026-10-15', category: 'Event' },
  { id: 2, title: 'New Embassy Guidelines', date: '2026-09-02', category: 'Notice' },
  { id: 3, title: 'Welfare Fund Distribution', date: '2026-08-20', category: 'Welfare' },
];

export default function News() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    // If you don't have indexes set up in Firebase, orderBy might fail.
    // Try catching errors or just pull and sort locally.
    const unsub = onSnapshot(query(collections.news), (snap) => {
      let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data = data.length > 0 ? data : fallbackNews;
      setNews(data);
    }, (error) => {
      console.log(error);
      setNews(fallbackNews);
    });
    return () => unsub();
  }, []);

  return (
    <section className="py-24 bg-cream">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-forest-dark mb-4">Latest Updates</h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {news.map((item, i) => (
            <motion.div 
              key={item.id}
              className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 group cursor-pointer hover:shadow-2xl transition-all"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="h-48 bg-gray-200 overflow-hidden relative">
                <img 
                  src={item.image || `https://images.unsplash.com/photo-1572013343866-df2f5c0c9d7a?w=600&q=80`} 
                  alt="News" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute top-4 left-4 bg-gold text-forest-dark px-3 py-1 text-xs font-bold rounded-full">
                  {item.category || 'Update'}
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-2 font-mono">{item.date}</p>
                <h3 className="text-xl font-bold text-forest-dark mb-4">{item.title}</h3>
                <span className="text-gold font-medium group-hover:underline flex items-center gap-2">
                  Read More <span>→</span>
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
