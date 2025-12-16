import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { CalendarEvent, Client } from '../types';
import './Calendar.css';

export const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventClientId, setNewEventClientId] = useState('');
  const [newEventStartAt, setNewEventStartAt] = useState('');
  const [newEventEndAt, setNewEventEndAt] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (user?.role !== 'CLIENT') {
      loadClients();
    }
  }, [user]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await api.get<CalendarEvent[]>('/calendar/events');
      setEvents(data);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const data = await api.get<Client[]>('/clients');
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => event.startAt.split('T')[0] === dateStr);
  };

  const startOfMonthGrid = () => {
    const first = new Date(currentMonth);
    const weekday = first.getDay(); // 0 (Sun) - 6 (Sat)
    const diff = weekday === 0 ? -6 : 1 - weekday; // start from Monday
    return new Date(first.getFullYear(), first.getMonth(), first.getDate() + diff);
  };

  const buildMonthGrid = () => {
    const start = startOfMonthGrid();
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    }
    return days;
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventStartAt || !newEventEndAt) {
      alert('Please fill title, start and end time');
      return;
    }

    try {
      setCreating(true);
      await api.post<CalendarEvent>('/calendar/events', {
        title: newEventTitle,
        description: newEventDescription || undefined,
        clientId: newEventClientId || undefined,
        startAt: newEventStartAt,
        endAt: newEventEndAt,
      });
      setShowAddModal(false);
      setNewEventTitle('');
      setNewEventDescription('');
      setNewEventClientId('');
      setNewEventStartAt('');
      setNewEventEndAt('');
      await loadEvents();
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      alert('Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading calendar...</div>;
  }

  const todayEvents = getEventsForDate(selectedDate);
  const monthDays = buildMonthGrid();

  return (
    <div className="calendar-page">
      <div className="page-header">
        <h1>Calendar</h1>
        {user?.role !== 'CLIENT' && (
          <button
            className="primary-button"
            onClick={() => setShowAddModal(true)}
          >
            Add Event
          </button>
        )}
      </div>

      <div className="calendar-content">
        <div className="calendar-view">
          <div className="calendar-month">
            <div className="month-header">
              <button
                className="secondary-button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                  )
                }
              >
                ◀
              </button>
              <h2>
                {currentMonth.toLocaleDateString('en-IN', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <button
                className="secondary-button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                  )
                }
              >
                ▶
              </button>
              <button
                className="link-button"
                onClick={() => {
                  const today = new Date();
                  setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelectedDate(today);
                }}
              >
                Today
              </button>
            </div>

            <div className="month-weekdays">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="weekday-cell">
                  {d}
                </div>
              ))}
            </div>

            <div className="month-grid">
              {monthDays.map((day) => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth =
                  day.getMonth() === currentMonth.getMonth() &&
                  day.getFullYear() === currentMonth.getFullYear();
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);

                return (
                  <div
                    key={day.toISOString()}
                    className={`day-cell${
                      isCurrentMonth ? '' : ' day-outside'
                    }${isToday ? ' day-today' : ''}${
                      isSelected ? ' day-selected' : ''
                    }`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="day-number">{day.getDate()}</div>
                    <div className="day-events-container">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className="day-event-pill">
                          <span className="pill-dot" />
                          <span className="pill-text">{event.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="day-more">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="calendar-sidebar">
          <h2>
            {selectedDate.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </h2>
          <div className="events-list">
            {todayEvents.length === 0 ? (
              <div className="empty-state">
                <p>No events for this day</p>
              </div>
            ) : (
              todayEvents
                .sort(
                  (a, b) =>
                    new Date(a.startAt).getTime() -
                    new Date(b.startAt).getTime()
                )
                .map((event) => (
                  <div key={event.id} className="event-item">
                    <div className="event-date">
                      {new Date(event.startAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="event-content">
                      <h4>{event.title}</h4>
                      {event.client && (
                        <p className="event-client">
                          {event.client.displayName}
                        </p>
                      )}
                      {event.description && <p>{event.description}</p>}
                      <span
                        className={`event-source source-${event.source.toLowerCase()}`}
                      >
                        {event.source}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {showAddModal && user?.role !== 'CLIENT' && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Add Event</h2>
            <form onSubmit={handleCreateEvent} className="form-grid">
              <div className="form-field">
                <label>Title</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Client (optional)</label>
                <select
                  value={newEventClientId}
                  onChange={(e) => setNewEventClientId(e.target.value)}
                >
                  <option value="">All / None</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Start</label>
                <input
                  type="datetime-local"
                  value={newEventStartAt}
                  onChange={(e) => setNewEventStartAt(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>End</label>
                <input
                  type="datetime-local"
                  value={newEventEndAt}
                  onChange={(e) => setNewEventEndAt(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Description</label>
                <textarea
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowAddModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={creating}
                >
                  {creating ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

