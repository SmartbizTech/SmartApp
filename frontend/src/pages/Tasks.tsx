import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { Client, ComplianceTask, ComplianceType } from '../types';
import './Tasks.css';

export const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [types, setTypes] = useState<ComplianceType[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [newTaskClientId, setNewTaskClientId] = useState('');
  const [newTaskTypeId, setNewTaskTypeId] = useState('');
  const [newTaskPeriodStart, setNewTaskPeriodStart] = useState('');
  const [newTaskPeriodEnd, setNewTaskPeriodEnd] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [filter]);

  useEffect(() => {
    if (user?.role !== 'CLIENT') {
      loadClientsAndTypes();
    }
  }, [user]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const endpoint = filter !== 'all' ? `/tasks?status=${filter}` : '/tasks';
      const data = await api.get<ComplianceTask[]>(endpoint);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientsAndTypes = async () => {
    try {
      setLoadingClients(true);
      const [clientsData, typesData] = await Promise.all([
        api.get<Client[]>('/clients'),
        api.get<ComplianceType[]>('/tasks/compliance-types'),
      ]);
      setClients(clientsData);
      setTypes(typesData);
    } catch (error) {
      console.error('Failed to load task metadata:', error);
      alert('Failed to load clients and compliance types');
    } finally {
      setLoadingClients(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskClientId || !newTaskTypeId || !newTaskPeriodStart || !newTaskPeriodEnd || !newTaskDueDate) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setCreating(true);
      await api.post<ComplianceTask>('/tasks', {
        clientId: newTaskClientId,
        complianceTypeId: newTaskTypeId,
        periodStart: newTaskPeriodStart,
        periodEnd: newTaskPeriodEnd,
        dueDate: newTaskDueDate,
      });
      setShowCreateModal(false);
      setNewTaskClientId('');
      setNewTaskTypeId('');
      setNewTaskPeriodStart('');
      setNewTaskPeriodEnd('');
      setNewTaskDueDate('');
      await loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading tasks...</div>;
  }

  return (
    <div className="tasks-page">
      <div className="page-header">
        <h1>Compliance Tasks</h1>
        {user?.role !== 'CLIENT' && (
          <button
            className="primary-button"
            onClick={async () => {
              await loadClientsAndTypes();
              setShowCreateModal(true);
            }}
            disabled={loadingClients}
          >
            {loadingClients ? 'Loading...' : 'Create Task'}
          </button>
        )}
      </div>

      <div className="tasks-filters">
        <button
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-button ${filter === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilter('PENDING')}
        >
          Pending
        </button>
        <button
          className={`filter-button ${filter === 'IN_PROGRESS' ? 'active' : ''}`}
          onClick={() => setFilter('IN_PROGRESS')}
        >
          In Progress
        </button>
        <button
          className={`filter-button ${filter === 'FILED' ? 'active' : ''}`}
          onClick={() => setFilter('FILED')}
        >
          Filed
        </button>
      </div>

      <div className="tasks-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks found</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="task-item">
              <div className="task-main">
                <div className="task-info">
                  <h3>{task.complianceType.displayName}</h3>
                  <p className="task-client">{task.client.displayName}</p>
                  <p className="task-period">
                    Period: {new Date(task.periodStart).toLocaleDateString()} -{' '}
                    {new Date(task.periodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div className="task-meta">
                  <span className={`status-badge status-${task.status.toLowerCase()}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  {task.assignedTo && (
                    <p className="task-assigned">Assigned to: {task.assignedTo.name}</p>
                  )}
                  <p className="task-due">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && user?.role !== 'CLIENT' && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Create Compliance Task</h2>
            <form onSubmit={handleCreateTask} className="form-grid">
              <div className="form-field">
                <label>Client</label>
                <select
                  value={newTaskClientId}
                  onChange={(e) => setNewTaskClientId(e.target.value)}
                  required
                  disabled={loadingClients || clients.length === 0}
                >
                  <option value="">
                    {loadingClients ? 'Loading clients...' : clients.length === 0 ? 'No clients available' : 'Select client'}
                  </option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Compliance Type</label>
                <select
                  value={newTaskTypeId}
                  onChange={(e) => setNewTaskTypeId(e.target.value)}
                  required
                >
                  <option value="">Select type</option>
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Period Start</label>
                <input
                  type="date"
                  value={newTaskPeriodStart}
                  onChange={(e) => setNewTaskPeriodStart(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Period End</label>
                <input
                  type="date"
                  value={newTaskPeriodEnd}
                  onChange={(e) => setNewTaskPeriodEnd(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Due Date</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

