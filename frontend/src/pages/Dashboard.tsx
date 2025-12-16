import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { ComplianceTask, Notification, Client } from '../types';
import './Dashboard.css';

interface DashboardStats {
  pendingClients?: number;
  upcomingDeadlines?: number;
  pendingTasks?: number;
  uploadedDocuments?: number;
  filingStatus?: {
    pending: number;
    inProgress: number;
    filed: number;
  };
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentTasks, setRecentTasks] = useState<ComplianceTask[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.get<any>(`/dashboard${user?.role === 'CLIENT' ? '/client' : ''}`);
      setStats(data.stats || {});
      setRecentTasks(data.recentTasks || []);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  const isClient = user?.role === 'CLIENT';

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name}</h1>
        <p>{isClient ? 'Client Dashboard' : 'CA Dashboard'}</p>
      </div>

      <div className="stats-grid">
        {!isClient && (
          <>
            <StatCard
              title="Pending Clients"
              value={stats.pendingClients || 0}
              icon="👥"
            />
            <StatCard
              title="Upcoming Deadlines"
              value={stats.upcomingDeadlines || 0}
              icon="📅"
            />
            <StatCard
              title="Pending Tasks"
              value={stats.pendingTasks || 0}
              icon="📋"
            />
          </>
        )}
        {isClient && (
          <>
            <StatCard
              title="Pending Actions"
              value={stats.pendingTasks || 0}
              icon="⚠️"
            />
            <StatCard
              title="Uploaded Documents"
              value={stats.uploadedDocuments || 0}
              icon="📄"
            />
            {stats.filingStatus && (
              <>
                <StatCard
                  title="In Progress"
                  value={stats.filingStatus.inProgress || 0}
                  icon="🔄"
                />
                <StatCard
                  title="Filed"
                  value={stats.filingStatus.filed || 0}
                  icon="✅"
                />
              </>
            )}
          </>
        )}
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Recent Tasks</h2>
          <div className="tasks-list">
            {recentTasks.length === 0 ? (
              <p className="empty-state">No recent tasks</p>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <h3>{task.complianceType.displayName}</h3>
                    <span className={`status-badge status-${task.status.toLowerCase()}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="task-client">{task.client.displayName}</p>
                  <p className="task-due">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                  {task.assignedTo && (
                    <p className="task-assigned">Assigned to: {task.assignedTo.name}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Notifications</h2>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p className="empty-state">No notifications</p>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.readAt ? 'unread' : ''}`}
                >
                  <div className="notification-content">
                    <strong>{notification.type.replace('_', ' ')}</strong>
                    <p>{new Date(notification.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: string }> = ({
  title,
  value,
  icon,
}) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
    </div>
  </div>
);

