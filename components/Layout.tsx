
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Menu, X, LayoutDashboard, Wallet, 
  Share2, ShieldAlert, LogOut, User as UserIcon, Settings,
  Sun, Moon
} from 'lucide-react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout, hasRole } = useAuth();
  const { currency, toggleCurrency } = useCurrency();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label, allowedRoles }: any) => {
    if (allowedRoles && !hasRole(allowedRoles)) return null;
    
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center px-6 py-3 transition-colors duration-200 ${
          isActive 
            ? 'bg-akachai-red text-white border-r-4 border-akachai-gold' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-akachai-red'
        }`}
      >
        <Icon className="w-5 h-5 mr-3" />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden transition-colors duration-200">
      
      {/* Sidebar Navigation */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static flex flex-col h-[100dvh] md:h-full border-r dark:border-gray-700
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Sidebar Content Container - Scrollable */}
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
            <div className="p-6 border-b dark:border-gray-700 flex flex-col items-center shrink-0">
              <div className="w-24 h-24 rounded-full mb-3 flex items-center justify-center text-gray-400 overflow-hidden bg-white p-2">
                <img src="https://i.ibb.co/RkFSx7Cb/logo-removebg-preview.png" alt="Akachai Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-xl font-bold text-akachai-red">AKACHAI FC</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-1">{user?.role.replace('_', ' ')}</p>
            </div>

            <nav className="mt-6 flex-1">
              <NavItem 
                to="/" 
                icon={LayoutDashboard} 
                label="Dashboard" 
              />
              {/* Finances now available to all, specific restrictions handled inside view */}
              <NavItem 
                to="/finances" 
                icon={Wallet} 
                label="Finances" 
              />
              <NavItem 
                to="/social" 
                icon={Share2} 
                label="Social & Info" 
                allowedRoles={[UserRole.L1_ADMIN, UserRole.L3_ADMIN]} 
              />
              <NavItem 
                to="/admin" 
                icon={ShieldAlert} 
                label="Admin Controls" 
                allowedRoles={[UserRole.L1_ADMIN]} 
              />
            </nav>

            <div className="p-4 border-t dark:border-gray-700 shrink-0 bg-white dark:bg-gray-800">
              <Link to="/profile" className="flex items-center mb-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-2 transition" onClick={() => setIsSidebarOpen(false)}>
                  <div className="w-8 h-8 rounded-full bg-akachai-red text-white flex items-center justify-center overflow-hidden mr-3 shrink-0 border border-gray-200 dark:border-gray-600">
                      {user?.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover" /> : <UserIcon size={16} />}
                  </div>
                  <div className="overflow-hidden">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{user?.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <Settings className="w-4 h-4 ml-auto text-gray-400 shrink-0" />
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Navigation Bar */}
        <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 h-16 flex items-center justify-between px-4 md:px-8 shrink-0 z-10 shadow-sm transition-colors duration-200">
             <div className="flex items-center md:hidden">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-3 text-gray-600 dark:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                  {isSidebarOpen ? <X /> : <Menu />}
                </button>
                <span className="font-bold text-akachai-red text-lg tracking-tight">AKACHAI FC</span>
             </div>
             
             {/* Desktop Left Side Spacer */}
             <div className="hidden md:block text-gray-400 dark:text-gray-500 text-sm font-medium">
                Management Portal v1.1
             </div>

             {/* Right Side Actions */}
             <div className="flex items-center space-x-4">
                 {/* Theme Toggle */}
                 <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    title="Toggle Theme"
                 >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                 </button>

                 {/* Currency Toggle */}
                 <button 
                    onClick={toggleCurrency}
                    className="flex items-center space-x-2 text-sm border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition shadow-sm"
                    title="Toggle Currency"
                  >
                    <span className="text-lg leading-none">{currency === 'UGX' ? '🇺🇬' : '🇺🇸'}</span>
                    <span>{currency}</span>
                 </button>
                 
                 <Link to="/profile" className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border border-gray-300 dark:border-gray-600 hover:ring-2 ring-akachai-red transition flex items-center justify-center">
                    {user?.photoURL ? <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400"/>}
                 </Link>
             </div>
        </header>

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;