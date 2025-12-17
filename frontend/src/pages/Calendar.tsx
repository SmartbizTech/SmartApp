import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { CalendarEvent, Client } from '../types';
import Scheduler, { Resource, View } from 'devextreme-react/scheduler';
import { Popup } from 'devextreme-react/popup';
import { Form, Item, Label, RequiredRule } from 'devextreme-react/form';
import { TextBox } from 'devextreme-react/text-box';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { TextArea } from 'devextreme-react/text-area';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import { PageHeader } from '../components/PageHeader';
import './Calendar.css';

const currentDate = new Date();

export const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventClientId, setNewEventClientId] = useState('');
  const [newEventStartAt, setNewEventStartAt] = useState<Date | null>(null);
  const [newEventEndAt, setNewEventEndAt] = useState<Date | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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

  const schedulerData = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      text: event.title,
      startDate: new Date(event.startAt),
      endDate: new Date(event.endAt),
      description: event.description || '',
      clientId: event.clientId || null,
      clientName: event.client?.displayName || '',
    }));
  }, [events]);

  const handleCreateEvent = async () => {
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
        startAt: newEventStartAt.toISOString(),
        endAt: newEventEndAt.toISOString(),
      });
      setShowAddModal(false);
      setNewEventTitle('');
      setNewEventDescription('');
      setNewEventClientId('');
      setNewEventStartAt(null);
      setNewEventEndAt(null);
      await loadEvents();
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      alert('Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const onAppointmentClick = (e: any) => {
    const event = events.find((ev) => ev.id === e.appointmentData.id);
    if (event && user?.role !== 'CLIENT') {
      setSelectedAppointment(event);
      setShowEditModal(true);
    }
  };

  const onAppointmentFormOpening = (e: any) => {
    if (user?.role === 'CLIENT') {
      e.cancel = true;
    }
  };

  const appointmentRender = (data: any) => {
    return (
      <div className="dx-appointment">
        <div className="dx-appointment-title">{data.appointmentData.text}</div>
        {data.appointmentData.clientName && (
          <div className="dx-appointment-client">{data.appointmentData.clientName}</div>
        )}
      </div>
    );
  };

  return (
    <div className="dx-calendar-page">
      <PageHeader
        title="Calendar"
        subtitle="View and manage calendar events"
        actions={
          user?.role !== 'CLIENT' ? (
            <Button
              text="Add Event"
              type="default"
              icon="plus"
              onClick={() => setShowAddModal(true)}
            />
          ) : undefined
        }
      />

      <Scheduler
        dataSource={schedulerData}
        views={['month', 'week', 'day', 'agenda']}
        defaultCurrentView="month"
        defaultCurrentDate={currentDate}
        height={600}
        startDayHour={9}
        endDayHour={18}
        onAppointmentClick={onAppointmentClick}
        onAppointmentFormOpening={onAppointmentFormOpening}
        appointmentRender={appointmentRender}
      >
        <View type="month" />
        <View type="week" />
        <View type="day" />
        <View type="agenda" />
        <Resource
          dataSource={clients}
          fieldExpr="clientId"
          displayExpr="displayName"
          valueExpr="id"
        />
      </Scheduler>

      <Popup
        visible={showAddModal}
        onHiding={() => setShowAddModal(false)}
        showTitle={true}
        title="Add Event"
        width={600}
        height="auto"
        showCloseButton={true}
      >
        <Form formData={{}}>
          <Item
            dataField="title"
            editorType="dxTextBox"
            editorOptions={{
              value: newEventTitle,
              onValueChanged: (e: any) => setNewEventTitle(e.value),
            }}
          >
            <Label text="Title" />
            <RequiredRule />
          </Item>
          {user?.role !== 'CLIENT' && (
            <Item
              dataField="clientId"
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: [{ id: '', displayName: 'All / None' }, ...clients],
                displayExpr: 'displayName',
                valueExpr: 'id',
                value: newEventClientId,
                onValueChanged: (e: any) => setNewEventClientId(e.value),
              }}
            >
              <Label text="Client (optional)" />
            </Item>
          )}
          <Item
            dataField="startAt"
            editorType="dxDateBox"
            editorOptions={{
              value: newEventStartAt,
              onValueChanged: (e: any) => setNewEventStartAt(e.value),
              type: 'datetime',
            }}
          >
            <Label text="Start" />
            <RequiredRule />
          </Item>
          <Item
            dataField="endAt"
            editorType="dxDateBox"
            editorOptions={{
              value: newEventEndAt,
              onValueChanged: (e: any) => setNewEventEndAt(e.value),
              type: 'datetime',
            }}
          >
            <Label text="End" />
            <RequiredRule />
          </Item>
          <Item
            dataField="description"
            editorType="dxTextArea"
            editorOptions={{
              value: newEventDescription,
              onValueChanged: (e: any) => setNewEventDescription(e.value),
              height: 80,
            }}
          >
            <Label text="Description" />
          </Item>
          <Item>
            <div className="dx-form-actions">
              <Button
                text="Cancel"
                stylingMode="outlined"
                onClick={() => setShowAddModal(false)}
                disabled={creating}
              />
              <Button
                text={creating ? 'Saving...' : 'Save Event'}
                type="default"
                onClick={handleCreateEvent}
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
