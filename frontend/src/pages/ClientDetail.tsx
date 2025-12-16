import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { CalendarEvent, Client, ComplianceTask } from '../types';
import './Clients.css';

export const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [type, setType] = useState<'INDIVIDUAL' | 'BUSINESS'>('INDIVIDUAL');
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [cin, setCin] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (id) {
      loadClient(id);
      loadTasksAndEvents(id);
    }
  }, [id]);

  const loadClient = async (clientId: string) => {
    try {
      setLoading(true);
      const data = await api.get<Client>(`/clients/${clientId}`);
      setClient(data);
      setDisplayName(data.displayName);
      setType(data.type);
      setPan(data.pan || '');
      setGstin(data.gstin || '');
      setCin(data.cin || '');
      setContactName(data.primaryUser?.name || '');
      setContactEmail(data.primaryUser?.email || '');
    } catch (error) {
      console.error('Failed to load client:', error);
      alert('Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  const loadTasksAndEvents = async (clientId: string) => {
    try {
      const [tasksData, eventsData] = await Promise.all([
        api.get<ComplianceTask[]>(`/tasks?clientId=${clientId}`),
        api.get<CalendarEvent[]>(`/calendar/events?clientId=${clientId}`),
      ]);
      setTasks(tasksData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to load client tasks/events:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSaving(true);
      const updated = await api.put<Client>(`/clients/${id}`, {
        displayName,
        type,
        pan,
        gstin,
        cin,
        contactName,
        contactEmail,
      });
      setClient(updated);
      alert('Client updated');
    } catch (error) {
      console.error('Failed to update client:', error);
      alert('Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChat = async () => {
    if (!client) return;
    try {
      const conversation = await api.post<{ id: string }>('/chat/conversations', {
        clientId: client.id,
      });
      navigate('/chat', { state: { conversationId: conversation.id } });
    } catch (error) {
      console.error('Failed to open chat:', error);
      alert('Failed to open chat');
    }
  };

  const handleOpenDocuments = () => {
    if (!client) return;
    navigate(`/documents?clientId=${client.id}`);
  };

  if (loading) {
    return <div className="page-loading">Loading client...</div>;
  }

  if (!client) {
    return <div className="page-loading">Client not found</div>;
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1>Edit Client</h1>
        <div className="page-actions">
          <button className="secondary-button" onClick={() => navigate('/clients')}>
            Back to Clients
          </button>
          <button className="secondary-button" onClick={handleOpenChat}>
            Message
          </button>
          <button className="secondary-button" onClick={handleOpenDocuments}>
            Documents
          </button>
        </div>
      </div>

      <form className="client-form" onSubmit={handleSave}>
        <div className="form-grid">
          <div className="form-field">
            <label>Client Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label>Client Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'INDIVIDUAL' | 'BUSINESS')}
              required
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="BUSINESS">Business</option>
            </select>
          </div>
          <div className="form-field">
            <label>PAN</label>
            <input
              type="text"
              value={pan}
              onChange={(e) => setPan(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>GSTIN</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>CIN</label>
            <input
              type="text"
              value={cin}
              onChange={(e) => setCin(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Contact Name</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('/clients')}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <div className="client-related">
        <div className="dashboard-section" style={{ marginTop: '20px' }}>
          <h2>Client Tasks</h2>
          {tasks.length === 0 ? (
            <div className="empty-state">
              <p>No tasks for this client</p>
            </div>
          ) : (
            <div className="tasks-list">
              {tasks.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <h3>{task.complianceType.displayName}</h3>
                    <span
                      className={`status-badge status-${task.status.toLowerCase()}`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="task-period">
                    Period: {new Date(task.periodStart).toLocaleDateString()} -{' '}
                    {new Date(task.periodEnd).toLocaleDateString()}
                  </p>
                  <p className="task-due">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section" style={{ marginTop: '20px' }}>
          <h2>Client Events</h2>
          {events.length === 0 ? (
            <div className="empty-state">
              <p>No calendar events for this client</p>
            </div>
          ) : (
            <div className="notifications-list">
              {events.map((event) => (
                <div key={event.id} className="notification-item">
                  <div className="notification-content">
                    <strong>{event.title}</strong>
                    <p>
                      {new Date(event.startAt).toLocaleString()} -{' '}
                      {new Date(event.endAt).toLocaleString()}
                    </p>
                    {event.description && <p>{event.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


