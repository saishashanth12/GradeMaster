import React, { useState, useEffect } from 'react';
import { Target, Bell } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [userInitials, setUserInitials] = useState('U');
  const [todayEvents, setTodayEvents] = useState([]);

  useEffect(() => {
    // Get User Initials
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser.full_name) {
          const parts = parsedUser.full_name.split(' ');
          const initials = parts.map(n => n[0]).join('').toUpperCase().substring(0, 2);
          setUserInitials(initials);
        }
      } catch (e) {}
    }

    // Fetch Events for notifications
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('gm_token');
        if (!token) return;
        const res = await axios.get('/api/logistics/events', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filter events for today and the next 3 days
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = res.data.filter(ev => {
          const evDate = new Date(ev.date);
          const evDay = new Date(evDate.getFullYear(), evDate.getMonth(), evDate.getDate());
          const diffTime = evDay - today;
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 3;
        }).map(ev => {
          const evDate = new Date(ev.date);
          const evDay = new Date(evDate.getFullYear(), evDate.getMonth(), evDate.getDate());
          const diffTime = evDay - today;
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          
          let statusLabel = 'Today';
          if (diffDays === 1) statusLabel = 'Tomorrow';
          else if (diffDays > 1) statusLabel = `In ${diffDays} days`;
          
          return {
            ...ev,
            statusLabel
          };
        });
        
        setTodayEvents(upcoming);
      } catch (e) {
        console.error('Failed to fetch events for notifications', e);
      }
    };
    
    fetchEvents();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('gm_token');
    navigate('/');
  };

  const navLinkClass = (path) => {
    return location.pathname === path
      ? "text-sm font-medium text-[var(--color-electric-blue)]"
      : "text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors";
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Nav */}
          <div className="flex items-center gap-10">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="bg-[var(--color-primary-navy)] p-1.5 rounded-md">
                <Target size={20} className="text-white" />
              </div>
              <span className="text-xl font-medium text-[var(--color-primary-navy)]">
                GradeMaster
              </span>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                Dashboard
              </Link>
              <Link to="/proximity-analyzer" className={navLinkClass('/proximity-analyzer')}>
                Proximity Analyzer
              </Link>
              <Link to="/scheduler" className={navLinkClass('/scheduler')}>
                Scheduler
              </Link>
            </nav>
          </div>

          {/* Right side: Notifications & Avatar */}
          <div className="flex items-center gap-6">
            


            {/* Profile Avatar */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="h-8 w-8 rounded-full bg-[var(--color-electric-blue)] flex items-center justify-center text-white text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-electric-blue)]"
              >
                {userInitials}
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                  <Link
                    to="/profile-settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
