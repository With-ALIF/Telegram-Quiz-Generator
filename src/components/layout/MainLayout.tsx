import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X, User as UserIcon, ArrowUp, BarChart3, Shield, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Get clear page title from path
  const getPageTitle = () => {
    const path = location.pathname.split('/').pop() || 'Dashboard';
    if (path.toLowerCase() === 'ocr') return 'OCR';
    if (path.toLowerCase() === 'system-stats') return 'System Stats';
    return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
  };

  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      if (mainEl.scrollTop > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    mainEl.addEventListener('scroll', handleScroll);
    return () => {
      mainEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    mainRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 shrink-0 fixed h-full z-50">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 h-screen relative">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 h-16 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Show hamburger ONLY for regular users (Admin uses bottom navigation) */}
            {!isAdmin && (
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-900 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            
            {/* TeleQuiz Brand Logo */}
            <img 
              src="https://i.postimg.cc/RZ8xLzf7/Purple-White-Playful-Quiz-Time-Video-20260318-195033-0000.jpg" 
              alt="TeleQuiz Logo" 
              className="lg:hidden w-8 h-8 object-cover rounded-xl shadow-sm border border-slate-100" 
              referrerPolicy="no-referrer" 
            />

            <div className="hidden sm:block">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">{getPageTitle()}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">
                {isAdmin ? 'Admin Console' : 'TeleQuiz Platform'}
              </p>
            </div>
            
            {/* Mobile title */}
            <div className="sm:hidden">
              <h2 className="text-base font-black text-gray-900 tracking-tight">{getPageTitle()}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon size={18} className="text-gray-400" />
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer for Non-Admin */}
        {!isAdmin && isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" />
            <div 
              className="absolute left-0 top-0 h-full w-64 bg-white shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <Sidebar />
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main 
          ref={mainRef} 
          className={`flex-1 overflow-y-auto custom-scrollbar ${isAdmin ? 'pb-20 lg:pb-0' : ''}`}
        >
          {children}
        </main>

        {/* Admin Mobile Bottom Navigation Bar */}
        {isAdmin && (
          <nav 
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-3 py-1.5"
            aria-label="Admin Navigation"
          >
            <div className="flex items-center justify-around max-w-md mx-auto">
              <NavLink
                to="/system-stats"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                    isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 shadow-sm' : ''}`}>
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] tracking-tight mt-0.5">Stats</span>
                  </>
                )}
              </NavLink>

              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                    isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 shadow-sm' : ''}`}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] tracking-tight mt-0.5">Users</span>
                  </>
                )}
              </NavLink>

              <NavLink
                to="/admin/suffix"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                    isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 shadow-sm' : ''}`}>
                      <Settings className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] tracking-tight mt-0.5">Suffix</span>
                  </>
                )}
              </NavLink>

              <button
                type="button"
                onClick={logout}
                className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                title="Log out"
              >
                <div className="p-1.5 rounded-xl">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">Logout</span>
              </button>
            </div>
          </nav>
        )}

        {/* Floating Scroll to Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ scale: 0, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 15 }}
              onClick={scrollToTop}
              className={`fixed ${isAdmin ? 'bottom-20' : 'bottom-6'} right-6 md:bottom-8 md:right-8 z-40 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 h-11 w-11 rounded-full border border-gray-200 shadow-lg flex items-center justify-center transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              aria-label="Scroll to top"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}} />
    </div>
  );
};
