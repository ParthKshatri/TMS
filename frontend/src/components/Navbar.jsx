import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ title = 'Dashboard', onToggleSidebar, isSidebarOpen }) => {
  const { user } = useAuth();

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
      </div>
    </header>
  );
};

export default Navbar;
