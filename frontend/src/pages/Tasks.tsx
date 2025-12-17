import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { Client, ComplianceTask, ComplianceType, AdminUser } from '../types';
import { DataGrid, Column, Paging, Pager, FilterRow, SearchPanel, Grouping, GroupPanel, Export } from 'devextreme-react/data-grid';
import { Popup } from 'devextreme-react/popup';
import { Form, Item, Label, RequiredRule } from 'devextreme-react/form';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { Button } from 'devextreme-react/button';
import { Toolbar, Item as ToolbarItem } from 'devextreme-react/toolbar';
import { LoadPanel } from 'devextreme-react/load-panel';
import { PageHeader } from '../components/PageHeader';
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
  const [newTaskPeriodStart, setNewTaskPeriodStart] = useState<Date | null>(null);
  const [newTaskPeriodEnd, setNewTaskPeriodEnd] = useState<Date | null>(null);
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(null);
  const [creating, setCreating] = useState(false);
  const [assignees, setAssignees] = useState<AdminUser[]>([]);
  const [newTaskAssignedToUserId, setNewTaskAssignedToUserId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [filter]);

  useEffect(() => {
    if (user?.role !== 'CLIENT') {
      loadClientsAndTypes();
      loadAssignees();
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

  const loadAssignees = async () => {
    try {
      const data = await api.get<AdminUser[]>('/users');
      // Only CA_ADMIN and CA_STAFF can be assignees
      setAssignees(
        data.filter((u) => u.role === 'CA_ADMIN' || u.role === 'CA_STAFF')
      );
    } catch (error) {
      console.error('Failed to load assignees:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskClientId || !newTaskTypeId || !newTaskPeriodStart || !newTaskPeriodEnd || !newTaskDueDate) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setCreating(true);
      await api.post<ComplianceTask>('/tasks', {
        clientId: newTaskClientId,
        complianceTypeId: newTaskTypeId,
        periodStart: newTaskPeriodStart.toISOString().split('T')[0],
        periodEnd: newTaskPeriodEnd.toISOString().split('T')[0],
        dueDate: newTaskDueDate.toISOString().split('T')[0],
        assignedToUserId: newTaskAssignedToUserId || undefined,
      });
      setShowCreateModal(false);
      setNewTaskClientId('');
      setNewTaskTypeId('');
      setNewTaskPeriodStart(null);
      setNewTaskPeriodEnd(null);
      setNewTaskDueDate(null);
      setNewTaskAssignedToUserId(null);
      await loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const statusCellRender = (data: any) => {
    const status = data.value?.toLowerCase() || '';
    const statusClass = `status-badge status-${status}`;
    return (
      <span className={statusClass}>
        {data.value?.replace('_', ' ') || ''}
      </span>
    );
  };

  const filterButtons = [
    { text: 'All', value: 'all' },
    { text: 'Pending', value: 'PENDING' },
    { text: 'In Progress', value: 'IN_PROGRESS' },
    { text: 'Filed', value: 'FILED' },
  ];

  const toolbarItems = [
    {
      location: 'before',
      widget: 'dxButton',
      options: {
        text: 'Create Task',
        type: 'default',
        icon: 'plus',
        onClick: async () => {
          await loadClientsAndTypes();
          setShowCreateModal(true);
        },
        disabled: loadingClients || user?.role === 'CLIENT',
      },
    },
    {
      location: 'after',
      widget: 'dxButtonGroup',
      options: {
        items: filterButtons,
        selectedItemKeys: [filter],
        onItemClick: (e: any) => {
          setFilter(e.itemData.value);
        },
        stylingMode: 'outlined',
      },
    },
  ];

  return (
    <div className="dx-tasks-page">
      <PageHeader
        title="Compliance Tasks"
        subtitle="Manage and track compliance tasks"
      />

      <DataGrid
        dataSource={tasks}
        showBorders={true}
        columnAutoWidth={true}
        rowAlternationEnabled={true}
        onRowPrepared={(e: any) => {
          if (e.rowType === 'data') {
            e.rowElement.style.cursor = 'pointer';
          }
        }}
      >
        <Export enabled={true} />
        <Grouping autoExpandAll={false} />
        <GroupPanel visible={true} />
        <Column
          dataField="complianceType.displayName"
          caption="Compliance Type"
          cellRender={(data: any) => data.data?.complianceType?.displayName || ''}
          groupIndex={0}
        />
        <Column
          dataField="client.displayName"
          caption="Client"
          cellRender={(data: any) => data.data?.client?.displayName || ''}
        />
        <Column
          dataField="periodStart"
          caption="Period Start"
          dataType="date"
          format="shortDate"
        />
        <Column
          dataField="periodEnd"
          caption="Period End"
          dataType="date"
          format="shortDate"
        />
        <Column
          dataField="dueDate"
          caption="Due Date"
          dataType="date"
          format="shortDate"
        />
        <Column
          dataField="status"
          caption="Status"
          cellRender={statusCellRender}
        />
        <Column
          dataField="assignedTo.name"
          caption="Assigned To"
          cellRender={(data: any) => {
            if (user?.role === 'CLIENT') {
              return data.data?.assignedTo?.name || '-';
            }
            return (
              <SelectBox
                dataSource={assignees}
                displayExpr="name"
                valueExpr="id"
                value={data.data?.assignedTo?.id || null}
                placeholder="Unassigned"
                onValueChanged={async (e: any) => {
                  try {
                    await api.patch(`/tasks/${data.data.id}/assign`, {
                      assignedToUserId: e.value || null,
                    });
                    await loadTasks();
                  } catch (error: any) {
                    console.error('Failed to assign task:', error);
                    alert(error?.message || 'Failed to assign task');
                  }
                }}
              />
            );
          }}
        />
        <FilterRow visible={true} />
        <SearchPanel visible={true} />
        <Paging defaultPageSize={20} />
        <Pager showPageSizeSelector={true} allowedPageSizes={[10, 20, 50]} showInfo={true} />
      </DataGrid>

      <Popup
        visible={showCreateModal}
        onHiding={() => setShowCreateModal(false)}
        showTitle={true}
        title="Create Compliance Task"
        width={600}
        height="auto"
        showCloseButton={true}
      >
        <Form formData={{}}>
          <Item
            dataField="clientId"
            editorType="dxSelectBox"
            editorOptions={{
              dataSource: clients,
              displayExpr: 'displayName',
              valueExpr: 'id',
              value: newTaskClientId,
              onValueChanged: (e: any) => setNewTaskClientId(e.value),
              disabled: loadingClients || clients.length === 0,
              placeholder: loadingClients ? 'Loading clients...' : clients.length === 0 ? 'No clients available' : 'Select client',
            }}
          >
            <Label text="Client" />
            <RequiredRule />
          </Item>
          <Item
            dataField="complianceTypeId"
            editorType="dxSelectBox"
            editorOptions={{
              dataSource: types,
              displayExpr: 'displayName',
              valueExpr: 'id',
              value: newTaskTypeId,
              onValueChanged: (e: any) => setNewTaskTypeId(e.value),
              placeholder: 'Select compliance type',
            }}
          >
            <Label text="Compliance Type" />
            <RequiredRule />
          </Item>
          <Item
            dataField="periodStart"
            editorType="dxDateBox"
            editorOptions={{
              value: newTaskPeriodStart,
              onValueChanged: (e: any) => setNewTaskPeriodStart(e.value),
              type: 'date',
            }}
          >
            <Label text="Period Start" />
            <RequiredRule />
          </Item>
          <Item
            dataField="periodEnd"
            editorType="dxDateBox"
            editorOptions={{
              value: newTaskPeriodEnd,
              onValueChanged: (e: any) => setNewTaskPeriodEnd(e.value),
              type: 'date',
            }}
          >
            <Label text="Period End" />
            <RequiredRule />
          </Item>
          <Item
            dataField="dueDate"
            editorType="dxDateBox"
            editorOptions={{
              value: newTaskDueDate,
              onValueChanged: (e: any) => setNewTaskDueDate(e.value),
              type: 'date',
            }}
          >
            <Label text="Due Date" />
            <RequiredRule />
          </Item>
          {user?.role !== 'CLIENT' && (
            <Item
              dataField="assignedToUserId"
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: assignees,
                displayExpr: 'name',
                valueExpr: 'id',
                value: newTaskAssignedToUserId,
                onValueChanged: (e: any) => setNewTaskAssignedToUserId(e.value),
                placeholder: 'Assign to (optional)',
              }}
            >
              <Label text="Assignee" />
            </Item>
          )}
          <Item>
            <div className="dx-form-actions">
              <Button
                text="Cancel"
                stylingMode="outlined"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              />
              <Button
                text={creating ? 'Creating...' : 'Create Task'}
                type="default"
                onClick={handleCreateTask}
                disabled={creating}
              />
            </div>
          </Item>
        </Form>
      </Popup>

      <LoadPanel visible={loading} />
    </div>
  );
};
