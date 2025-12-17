import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import type { ComplianceTask, Notification } from "../types";
import { DataGrid, Column, Paging, Pager } from "devextreme-react/data-grid";
import { LoadPanel } from "devextreme-react/load-panel";
import { PageHeader } from "../components/PageHeader";
import "./Dashboard.css";

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
  const navigate = useNavigate();
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
      const data = await api.get<any>(
        `/dashboard${user?.role === "CLIENT" ? "/client" : ""}`
      );
      setStats(data.stats || {});
      setRecentTasks(data.recentTasks || []);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const isClient = user?.role === "CLIENT";

  const statusCellRender = (data: any) => {
    const status = data.value?.toLowerCase() || "";
    const statusClass = `status-badge status-${status}`;
    return (
      <span className={statusClass}>{data.value?.replace("_", " ") || ""}</span>
    );
  };

  const onTaskRowClick = (e: any) => {
    if (e.data?.id) {
      navigate(`/tasks`);
    }
  };

  return (
    <div className="dx-dashboard">
      <PageHeader
        title={`Welcome back, ${user?.name || "User"}`}
        subtitle={isClient ? "Client Dashboard" : "CA Dashboard"}
      />

      <div className="dx-stats-grid">
        {!isClient && (
          <>
            <div className="dx-stat-card">
              <div className="stat-content">
                <div className="stat-icon">👥</div>
                <div>
                  <div className="stat-value">{stats.pendingClients || 0}</div>
                  <div className="stat-title">Pending Clients</div>
                </div>
              </div>
            </div>
            <div className="dx-stat-card">
              <div className="stat-content">
                <div className="stat-icon">📅</div>
                <div>
                  <div className="stat-value">
                    {stats.upcomingDeadlines || 0}
                  </div>
                  <div className="stat-title">Upcoming Deadlines</div>
                </div>
              </div>
            </div>
            <div className="dx-stat-card">
              <div className="stat-content">
                <div className="stat-icon">📋</div>
                <div>
                  <div className="stat-value">{stats.pendingTasks || 0}</div>
                  <div className="stat-title">Pending Tasks</div>
                </div>
              </div>
            </div>
          </>
        )}
        {isClient && (
          <>
            <div className="dx-stat-card">
              <div className="stat-content">
                <div className="stat-icon">⚠️</div>
                <div>
                  <div className="stat-value">{stats.pendingTasks || 0}</div>
                  <div className="stat-title">Pending Actions</div>
                </div>
              </div>
            </div>
            <div className="dx-stat-card">
              <div className="stat-content">
                <div className="stat-icon">📄</div>
                <div>
                  <div className="stat-value">
                    {stats.uploadedDocuments || 0}
                  </div>
                  <div className="stat-title">Uploaded Documents</div>
                </div>
              </div>
            </div>
            {stats.filingStatus && (
              <>
                <div className="dx-stat-card">
                  <div className="stat-content">
                    <div className="stat-icon">🔄</div>
                    <div>
                      <div className="stat-value">
                        {stats.filingStatus.inProgress || 0}
                      </div>
                      <div className="stat-title">In Progress</div>
                    </div>
                  </div>
                </div>
                <div className="dx-stat-card">
                  <div className="stat-content">
                    <div className="stat-icon">✅</div>
                    <div>
                      <div className="stat-value">
                        {stats.filingStatus.filed || 0}
                      </div>
                      <div className="stat-title">Filed</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="dx-dashboard-content">
        <div className="dx-section-card">
          <h2>Recent Tasks</h2>
          <DataGrid
            dataSource={recentTasks}
            showBorders={true}
            columnAutoWidth={true}
            onRowClick={onTaskRowClick}
            rowAlternationEnabled={true}
          >
            <Column
              dataField="complianceType.displayName"
              caption="Task"
              cellRender={(data: any) =>
                data.data?.complianceType?.displayName || ""
              }
            />
            <Column
              dataField="client.displayName"
              caption="Client"
              cellRender={(data: any) => data.data?.client?.displayName || ""}
            />
            <Column
              dataField="status"
              caption="Status"
              cellRender={statusCellRender}
            />
            <Column
              dataField="dueDate"
              caption="Due Date"
              dataType="date"
              format="shortDate"
            />
            <Column
              dataField="assignedTo.name"
              caption="Assigned To"
              cellRender={(data: any) => data.data?.assignedTo?.name || "-"}
            />
            <Paging defaultPageSize={10} />
            <Pager showPageSizeSelector={true} allowedPageSizes={[5, 10, 20]} />
          </DataGrid>
        </div>

        <div className="dx-section-card">
          <h2>Notifications</h2>
          <DataGrid
            dataSource={notifications}
            showBorders={true}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
          >
            <Column
              dataField="type"
              caption="Type"
              cellRender={(data: any) => data.value?.replace("_", " ") || ""}
            />
            <Column
              dataField="createdAt"
              caption="Date"
              dataType="datetime"
              format="shortDateShortTime"
            />
            <Column
              dataField="readAt"
              caption="Read"
              cellRender={(data: any) => (data.value ? "✓" : "✗")}
            />
            <Paging defaultPageSize={10} />
            <Pager showPageSizeSelector={true} allowedPageSizes={[5, 10, 20]} />
          </DataGrid>
        </div>
      </div>

      <LoadPanel visible={loading} />
    </div>
  );
};
