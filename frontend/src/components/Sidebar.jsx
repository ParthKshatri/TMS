import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FileCheck,
  Users,
  CalendarCheck,
  Calendar,
  History,
  LogOut,
  Download,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isStandalone, setIsStandalone] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean(window.navigator.standalone);
    setIsStandalone(isStandaloneMode);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPwaPrompt = e;
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      window.deferredPwaPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDownloadClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmDownload = async () => {
    setShowConfirmModal(false);
    const promptEvent = window.deferredPwaPrompt;

    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsStandalone(true);
        }
        window.deferredPwaPrompt = null;
      } catch (err) {
        console.error('PWA install error:', err);
      }
    }
  };

  const handleLogout = async () => {
    onClose?.();
    await logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    onClose?.();
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="brand-title">Task Manager</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Office Work Portal</div>
          </div>
          <span className="brand-badge">{user.role}</span>
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {isAdmin ? (
            <>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/tasks"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <CheckSquare size={18} />
                Task Management
              </NavLink>
              <NavLink
                to="/admin/work-history"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <FileCheck size={18} />
                Submitted Work
              </NavLink>
              <NavLink
                to="/admin/employees"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <Users size={18} />
                Employees
              </NavLink>
              <NavLink
                to="/admin/attendance"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <CalendarCheck size={18} />
                Attendance History
              </NavLink>
              <NavLink
                to="/admin/calendar"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <Calendar size={18} />
                Calendar
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/employee/dashboard"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </NavLink>
              <NavLink
                to="/employee/tasks"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <CheckSquare size={18} />
                My Tasks
              </NavLink>
              <NavLink
                to="/employee/attendance"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <CalendarCheck size={18} />
                Daily Attendance
              </NavLink>
              <NavLink
                to="/employee/history"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <History size={18} />
                My Activity Log
              </NavLink>
              <NavLink
                to="/employee/calendar"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <Calendar size={18} />
                Calendar
              </NavLink>
            </>
          )}

          {!isStandalone && (
            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
              <button
                type="button"
                className="nav-item"
                onClick={handleDownloadClick}
                style={{
                  width: '100%',
                  border: '1px solid rgba(234, 88, 12, 0.3)',
                  background: 'rgba(234, 88, 12, 0.08)',
                  color: '#ea580c',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Download size={18} />
                Download App
              </button>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.email}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-logout-btn"
            style={{
              color: '#94a3b8',
              padding: '0.5rem',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Download Verification Modal */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Download Task Manager App"
          footer={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmDownload}
              >
                Yes, Download
              </button>
            </div>
          }
        >
          <p style={{ color: '#334155', fontSize: '0.925rem', lineHeight: '1.5', margin: 0 }}>
            Do you want to download and install the Task Manager app on your device for fast access and shift logs?
          </p>
        </Modal>
      </aside>
    </>
  );
};

export default Sidebar;
