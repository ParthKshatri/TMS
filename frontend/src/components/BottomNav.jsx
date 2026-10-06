import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FileCheck,
  Users,
  CalendarCheck,
  Calendar,
  History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/BottomNav.css';

const BottomNav = () => {
  const { user } = useAuth();
  const [isStandaloneMobile, setIsStandaloneMobile] = useState(false);

  useEffect(() => {
    const mediaDisplay = window.matchMedia('(display-mode: standalone)');
    const mediaMobile = window.matchMedia('(max-width: 768px)');

    const updateState = () => {
      const standalone = mediaDisplay.matches || Boolean(window.navigator.standalone);
      const mobile = mediaMobile.matches;
      setIsStandaloneMobile(standalone && mobile);
    };

    updateState();

    mediaDisplay.addEventListener('change', updateState);
    mediaMobile.addEventListener('change', updateState);

    return () => {
      mediaDisplay.removeEventListener('change', updateState);
      mediaMobile.removeEventListener('change', updateState);
    };
  }, []);

  if (!isStandaloneMobile || !user) return null;

  const isAdmin = user.role === 'admin';

  const navItems = isAdmin
    ? [
        { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
        { to: '/admin/tasks', label: 'Tasks', icon: CheckSquare },
        { to: '/admin/work-history', label: 'Work', icon: FileCheck },
        { to: '/admin/employees', label: 'Employees', icon: Users },
        { to: '/admin/calendar', label: 'Calendar', icon: Calendar }
      ]
    : [
        { to: '/employee/dashboard', label: 'Overview', icon: LayoutDashboard },
        { to: '/employee/tasks', label: 'Tasks', icon: CheckSquare },
        { to: '/employee/attendance', label: 'Attendance', icon: CalendarCheck },
        { to: '/employee/history', label: 'History', icon: History },
        { to: '/employee/calendar', label: 'Calendar', icon: Calendar }
      ];

  return (
    <nav className="standalone-bottom-bar" aria-label="Mobile Bottom Navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `standalone-bottom-bar__item ${isActive ? 'standalone-bottom-bar__item--active' : ''}`
            }
          >
            <Icon size={20} />
            <span className="standalone-bottom-bar__label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
