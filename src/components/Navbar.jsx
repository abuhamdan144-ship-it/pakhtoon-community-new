import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const links = [
  { name: 'Home', path: '/' },
  { name: 'Membership', path: '/membership' },
  { name: 'Admin', path: '/admin' }
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass bg-forest-dark/90 border-b border-gold/30' : 'bg-transparent border-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group relative">
          <motion.div 
            className="w-10 h-10 rounded-full bg-gold flex items-center justify-center font-serif text-forest-dark font-bold text-xl relative"
            animate={{ boxShadow: ["0 0 0px rgba(212,175,55,0)", "0 0 15px rgba(212,175,55,0.6)", "0 0 0px rgba(212,175,55,0)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            PC
          </motion.div>
          <span className="font-serif font-bold text-white text-xl tracking-wide hidden sm:block">
            PAKHTOON COMMUNITY
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              className={`relative font-medium transition-colors ${
                location.pathname === link.path ? 'text-gold' : 'text-cream hover:text-gold'
              }`}
            >
              {link.name}
              {location.pathname === link.path && (
                <motion.div 
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gold"
                  layoutId="underline"
                  style={{ boxShadow: '0 0 8px rgba(212,175,55,0.8)' }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-cream hover:text-gold transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <motion.div 
        className="md:hidden overflow-hidden bg-forest-dark border-b border-gold/20"
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="flex flex-col px-6 py-4 gap-4">
          {links.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`font-medium py-2 border-b border-white/5 ${
                location.pathname === link.path ? 'text-gold' : 'text-cream'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.nav>
  );
}
