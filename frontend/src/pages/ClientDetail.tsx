import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { CalendarEvent, Client, ComplianceTask } from '../types';
import { Form, Item, Label, RequiredRule } from 'devextreme-react/form';
import Tabs from 'devextreme-react/tabs';
import { DataGrid, Column, Paging, Pager, FilterRow } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import { PageHeader } from '../components/PageHeader';
import './Clients.css';

export const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);

  const [formData, setFormData] = useState({
    displayName: '',
    type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'BUSINESS',
    pan: '',
    gstin: '',
    cin: '',
    contactName: '',
    contactEmail: '',
  });

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
      setFormData({
        displayName: data.displayName,
        type: data.type,
        pan: data.pan || '',
        gstin: data.gstin || '',
        cin: data.cin || '',
        contactName: data.primaryUser?.name || '',
        contactEmail: data.primaryUser?.email || '',
      });
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

  const handleSave = async () => {
    if (!id) return;

    try {
      setSaving(true);
      const updated = await api.put<Client>(`/clients/${id}`, {
        displayName: formData.displayName,
        type: formData.type,
        pan: formData.pan || undefined,
        gstin: formData.gstin || undefined,
        cin: formData.cin || undefined,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
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

  const statusCellRender = (data: any) => {
    const status = data.value?.toLowerCase() || '';
    return (
      <span className={`status-badge status-${status}`}>
        {data.value?.replace('_', ' ') || ''}
      </span>
    );
  };

  if (loading) {
    return <LoadPanel visible={true} />;
  }

  if (!client) {
    return <div className="page-loading">Client not found</div>;
  }

  return (
    <div className="dx-clients-page">
      <PageHeader
        title="Edit Client"
        subtitle={client.displayName}
        actions={
          <>
            <Button
              text="Back to Clients"
              stylingMode="outlined"
              onClick={() => navigate('/clients')}
            />
            <Button
              text="Message"
              stylingMode="outlined"
              icon="message"
              onClick={handleOpenChat}
            />
            <Button
              text="Documents"
              stylingMode="outlined"
              icon="file"
              onClick={handleOpenDocuments}
            />
          </>
        }
      />

      <Tabs
        selectedIndex={selectedTab}
        onSelectedIndexChange={setSelectedTab}
        items={[
          { text: 'Client Information' },
          { text: 'Tasks' },
          { text: 'Events' },
        ]}
      />

      {selectedTab === 0 && (
        <Form
          formData={formData}
          onFieldDataChanged={(e) => {
            if (e.dataField) {
              const field = e.dataField as keyof typeof formData;
              setFormData((prev) => ({
                ...prev,
                [field]: e.value,
              }));
            }
          }}
        >
          <Item
            dataField="displayName"
            editorType="dxTextBox"
          >
            <Label text="Client Name" />
            <RequiredRule />
          </Item>
          <Item
            dataField="type"
            editorType="dxSelectBox"
            editorOptions={{
              items: ['INDIVIDUAL', 'BUSINESS'],
            }}
          >
            <Label text="Client Type" />
            <RequiredRule />
          </Item>
          <Item
            dataField="pan"
            editorType="dxTextBox"
          >
            <Label text="PAN" />
          </Item>
          <Item
            dataField="gstin"
            editorType="dxTextBox"
          >
            <Label text="GSTIN" />
          </Item>
          <Item
            dataField="cin"
            editorType="dxTextBox"
          >
            <Label text="CIN" />
          </Item>
          <Item
            dataField="contactName"
            editorType="dxTextBox"
          >
            <Label text="Contact Name" />
          </Item>
          <Item
            dataField="contactEmail"
            editorType="dxTextBox"
            editorOptions={{
              mode: 'email',
            }}
          >
            <Label text="Contact Email" />
          </Item>
          <Item>
            <div className="dx-form-actions">
              <Button
                text="Cancel"
                stylingMode="outlined"
                onClick={() => navigate('/clients')}
                disabled={saving}
              />
              <Button
                text={saving ? 'Saving...' : 'Save Changes'}
                type="default"
                onClick={handleSave}
                disabled={saving}
              />
            </div>
          </Item>
        </Form>
      )}

      {selectedTab === 1 && (
        <DataGrid
          dataSource={tasks}
          showBorders={true}
          columnAutoWidth={true}
        >
          <Column
            dataField="complianceType.displayName"
            caption="Task"
            cellRender={(data: any) => data.data?.complianceType?.displayName || ''}
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
          <FilterRow visible={true} />
          <Paging defaultPageSize={10} />
          <Pager showPageSizeSelector={true} />
        </DataGrid>
      )}

      {selectedTab === 2 && (
        <DataGrid
          dataSource={events}
          showBorders={true}
          columnAutoWidth={true}
        >
          <Column dataField="title" caption="Title" />
          <Column
            dataField="startAt"
            caption="Start"
            dataType="datetime"
            format="shortDateShortTime"
          />
          <Column
            dataField="endAt"
            caption="End"
            dataType="datetime"
            format="shortDateShortTime"
          />
          <FilterRow visible={true} />
          <Paging defaultPageSize={10} />
          <Pager showPageSizeSelector={true} />
        </DataGrid>
      )}

      <LoadPanel visible={loading} />
    </div>
  );
};
