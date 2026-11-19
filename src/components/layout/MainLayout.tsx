import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { 
  User as UserIcon, 
  ArrowUp, 
  BarChart3, 
  Shield, 
  Settings, 
  LogOut, 
  Home, 
  FileText, 
  CheckSquare, 
  Zap, 
  Camera, 
  UserCircle 
} from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useLocation, NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, logout } = useAuth();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  const permissions = user?.permissions || [];
  const hasPermission = (pageId: string) => isAdmin || permissions.includes(pageId);

  // Get clear page title from path
  const getPageTitle = () => {
    const path = location.pathname.split('/').pop() || 'Dashboard';
    if (path.toLowerCase() === 'ocr') return 'OCR';
    if (path.toLowerCase() === 'dashboard') return 'Dashboard';
    if (path.toLowerCase() === 'user') return 'Users';
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

  // Do not render sidebar/header/bottom nav on auth page
  if (location.pathname === '/auth' || location.pathname.startsWith('/auth')) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] font-sans">
        {children}
      </main>
    );
  }

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
            {/* TeleQuiz Brand Logo */}
            <img 
              src="/logo.svg" 
              alt="TeleQuiz Logo" 
              className="lg:hidden w-8 h-8 object-contain rounded-xl shadow-sm" 
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

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              to={isAdmin ? "/admin/suffix" : "/settings"}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>

            <Link
              to={isAdmin ? "/dashboard" : "/profile"}
              className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-blue-500/30 transition-all cursor-pointer"
              title="Profile"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon size={18} className="text-gray-400" />
              )}
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main 
          ref={mainRef} 
          className="flex-1 overflow-y-auto custom-scrollbar pb-20 lg:pb-0"
        >
          {children}
        </main>

        {/* User Mobile Bottom Navigation Bar */}
        {!isAdmin && (
          <nav 
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5"
            aria-label="User Navigation"
          >
            <div className="flex items-center justify-around max-w-md mx-auto">
              <NavLink
                to="/"
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
                      <Home className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] tracking-tight mt-0.5">Home</span>
                  </>
                )}
              </NavLink>

              <NavLink
                to="/drafts"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                    isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 shadow-sm' : ''}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] tracking-tight mt-0.5">Drafts</span>
                  </>
                )}
              </NavLink>

              <NavLink
                to="/polls"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                    isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 shadow-sm' : ''}`}>
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] tracking-tight mt-0.5">Polls</span>
                  </>
                )}
              </NavLink>

              {hasPermission('rapid-fire') && (
                <NavLink
                  to="/rapid-fire"
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                      isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 shadow-sm' : ''}`}>
                        <Zap className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] tracking-tight mt-0.5">Rapid</span>
                    </>
                  )}
                </NavLink>
              )}

              {hasPermission('ocr') && (
                <NavLink
                  to="/ocr"
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                      isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 shadow-sm' : ''}`}>
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] tracking-tight mt-0.5">OCR</span>
                    </>
                  )}
                </NavLink>
              )}

              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                    isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 shadow-sm' : ''}`}>
                      <UserCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] tracking-tight mt-0.5">Profile</span>
                  </>
                )}
              </NavLink>

              <NavLink
                to="/settings"
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
                    <span className="text-[10px] tracking-tight mt-0.5">Settings</span>
                  </>
                )}
              </NavLink>
            </div>
          </nav>
        )}

        {/* Admin Mobile Bottom Navigation Bar */}
        {isAdmin && (
          <nav 
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-3 py-1.5"
            aria-label="Admin Navigation"
          >
            <div className="flex items-center justify-around max-w-md mx-auto">
              <NavLink
                to="/dashboard"
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
                to="/user"
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
              className="fixed bottom-20 md:bottom-8 right-6 md:right-8 z-40 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 h-11 w-11 rounded-full border border-gray-200 shadow-lg flex items-center justify-center transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
