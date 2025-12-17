import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Client } from '../types';
import { DataGrid, Column, Paging, Pager, FilterRow, SearchPanel, MasterDetail, Export } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import { PageHeader } from '../components/PageHeader';
import './Clients.css';

const ClientDetailTemplate = ({ data }: { data: Client }) => {
  return (
    <div className="dx-client-detail">
      <div className="dx-client-detail-grid">
        <div><strong>PAN:</strong> {data.pan || '-'}</div>
        <div><strong>GSTIN:</strong> {data.gstin || '-'}</div>
        <div><strong>CIN:</strong> {data.cin || '-'}</div>
        {data.primaryUser && (
          <>
            <div><strong>Contact Name:</strong> {data.primaryUser.name}</div>
            <div><strong>Contact Email:</strong> {data.primaryUser.email}</div>
          </>
        )}
        <div><strong>Created:</strong> {new Date(data.createdAt).toLocaleDateString()}</div>
      </div>
    </div>
  );
};

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await api.get<Client[]>('/clients');
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRowClick = (e: any) => {
    if (e.data?.id) {
      navigate(`/clients/${e.data.id}`);
    }
  };

  const typeCellRender = (data: any) => {
    const type = data.value?.toLowerCase() || '';
    return (
      <span className={`client-type type-${type}`}>
        {data.value || ''}
      </span>
    );
  };

  return (
    <div className="dx-clients-page">
      <PageHeader
        title="Clients"
        subtitle="Manage your clients"
        actions={
          <Button
            text="Add Client"
            type="default"
            icon="plus"
            onClick={() => navigate('/clients/new')}
          />
        }
      />

      <DataGrid
        dataSource={clients}
        showBorders={true}
        columnAutoWidth={true}
        rowAlternationEnabled={true}
        onRowClick={onRowClick}
        keyExpr="id"
      >
        <Export enabled={true} />
        <MasterDetail
          enabled={true}
          component={ClientDetailTemplate}
        />
        <Column
          dataField="displayName"
          caption="Name"
          sortOrder="asc"
        />
        <Column
          dataField="type"
          caption="Type"
          cellRender={typeCellRender}
        />
        <Column
          dataField="pan"
          caption="PAN"
        />
        <Column
          dataField="gstin"
          caption="GSTIN"
        />
        <Column
          dataField="cin"
          caption="CIN"
        />
        <Column
          dataField="primaryUser.email"
          caption="Contact Email"
          cellRender={(data: any) => data.data?.primaryUser?.email || '-'}
        />
        <Column
          dataField="createdAt"
          caption="Created Date"
          dataType="date"
          format="shortDate"
        />
        <FilterRow visible={true} />
        <SearchPanel visible={true} />
        <Paging defaultPageSize={20} />
        <Pager showPageSizeSelector={true} allowedPageSizes={[10, 20, 50]} showInfo={true} />
      </DataGrid>

      <LoadPanel visible={loading} />
    </div>
  );
};
