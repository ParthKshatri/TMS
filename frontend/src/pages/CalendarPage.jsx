import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/CalendarPage.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const formatDateStr = (year, monthIndex, dayNumber) => {
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(dayNumber).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getTodayStr = () => {
  const now = new Date();
  return formatDateStr(now.getFullYear(), now.getMonth(), now.getDate());
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const CalendarPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const todayStr = getTodayStr();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(todayStr);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/calendar', {
        params: {
          year,
          month: monthIndex + 1
        }
      });
      if (response.data?.success) {
        setEvents(response.data.events || []);
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [year, monthIndex]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, monthIndex - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, monthIndex + 1, 1));
  };

  const handleDateClick = (dayNumber) => {
    const clickedStr = formatDateStr(year, monthIndex, dayNumber);
    setSelectedDateStr(clickedStr);
  };

  const handleOpenAddModal = () => {
    setEventName('');
    setEventDate(selectedDateStr || todayStr);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleAddEventSubmit = async (e) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate) {
      setErrorMsg('Please provide event name and date.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const response = await api.post('/calendar', {
        eventName: eventName.trim(),
        date: eventDate
      });

      if (response.data?.success) {
        setIsModalOpen(false);
        setEventName('');
        // Refresh events
        await fetchEvents();
        // If event was added to currently selected date, keep it selected
        setSelectedDateStr(eventDate);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add event.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar math
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayObj = new Date(year, monthIndex, 1);
  // Monday-first index: Mon=0, Tue=1, ..., Sun=6
  const firstDayIndex = (firstDayObj.getDay() + 6) % 7;

  // Selected date events
  const selectedDateEvents = events.filter((ev) => ev.date === selectedDateStr);

  return (
    <div className="calendar-page-container">
      {/* Header Bar */}
      <div className="calendar-header-card">
        <div className="calendar-month-nav">
          <button
            onClick={handlePrevMonth}
            className="calendar-nav-btn"
            aria-label="Previous month"
            title="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="calendar-month-title">
            {MONTH_NAMES[monthIndex]} {year}
          </div>
          <button
            onClick={handleNextMonth}
            className="calendar-nav-btn"
            aria-label="Next month"
            title="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} style={{ marginRight: '6px' }} />
            Add Event
          </button>
        )}
      </div>

      {/* Main Layout: Left Calendar Grid + Right Events Panel */}
      <div className="calendar-body-layout">
        {/* Monthly Calendar Grid */}
        <div className="calendar-grid-card">
          {loading ? (
            <div style={{ padding: '2rem 0' }}>
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="calendar-weekdays-grid">
                {WEEKDAYS.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              <div className="calendar-days-grid">
                {/* Empty leading slots */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="calendar-day-cell empty" />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const cellDateStr = formatDateStr(year, monthIndex, dayNum);
                  const isToday = cellDateStr === todayStr;
                  const isSelected = cellDateStr === selectedDateStr;
                  const hasEvent = events.some((ev) => ev.date === cellDateStr);

                  return (
                    <div
                      key={dayNum}
                      className={`calendar-day-cell ${isToday ? 'today' : ''} ${
                        isSelected ? 'selected' : ''
                      }`}
                      onClick={() => handleDateClick(dayNum)}
                    >
                      <div className="calendar-day-number">
                        <span>{dayNum}</span>
                        {hasEvent && <span className="calendar-event-dot">●</span>}
                      </div>
                      {isToday && <span className="today-label">Today</span>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Selected Date Details */}
        <div className="selected-date-card">
          <div className="selected-date-title">Selected Date:</div>
          <div className="selected-date-heading">{formatDisplayDate(selectedDateStr)}</div>

          {selectedDateEvents.length > 0 ? (
            <div className="event-list">
              {selectedDateEvents.map((ev) => (
                <div key={ev._id} className="event-item">
                  <span className="calendar-event-dot">●</span> {ev.eventName}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-events-text">No events for this date.</p>
          )}
        </div>
      </div>

      {/* Admin Add Event Modal */}
      {isAdmin && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add Event"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddEventSubmit}
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add Event'}
              </button>
            </div>
          }
        >
          <form onSubmit={handleAddEventSubmit}>
            {errorMsg && (
              <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}>
                {errorMsg}
              </div>
            )}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                Event Name
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Gandhi Jayanti"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                Date
              </label>
              <input
                type="date"
                className="form-input"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CalendarPage;
