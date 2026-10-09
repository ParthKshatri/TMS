import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ title = 'Dashboard', onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, gap: '0.5rem' }}>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          aria-expanded={isSidebarOpen}
        >
          <Menu size={22} />
        </button>
        <h2 className="navbar-title">{title}</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <div className="navbar-user-text" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', whiteSpace: 'nowrap' }}>{user?.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>
            {user?.role} Account
          </div>
        </div>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#ea580c',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '0.9rem',
            flexShrink: 0
          }}
          title={user?.name}
        >
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="navbar-logout-btn"
          title="Log out"
          aria-label="Log out"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            color: '#64748b',
            backgroundColor: '#f1f5f9',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
