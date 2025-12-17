import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Client, Document, DocumentFolder } from '../types';
import { TreeList, Column, Selection, FilterRow } from 'devextreme-react/tree-list';
import { DataGrid, Column as DataGridColumn, Paging, Pager, FilterRow as DataGridFilterRow, SearchPanel, Export } from 'devextreme-react/data-grid';
import { FileUploader } from 'devextreme-react/file-uploader';
import { Popup } from 'devextreme-react/popup';
import { Form, Item, Label, RequiredRule } from 'devextreme-react/form';
import { SelectBox } from 'devextreme-react/select-box';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import { PageHeader } from '../components/PageHeader';
import './Documents.css';

export const Documents: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadClientId, setUploadClientId] = useState<string>('');
  const [uploadFinancialYear, setUploadFinancialYear] = useState<string>('');
  const [uploadFolderName, setUploadFolderName] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const clientIdFromUrl = searchParams.get('clientId');
    if (clientIdFromUrl) {
      setSelectedClientId(clientIdFromUrl);
      setUploadClientId(clientIdFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    loadFolders();
  }, [selectedClientId, selectedFinancialYear]);

  useEffect(() => {
    loadDocuments();
  }, [selectedFolder, selectedClientId]);

  useEffect(() => {
    if (user?.role !== 'CLIENT') {
      loadClients();
    } else if (user?.clientId) {
      setUploadClientId(user.clientId);
    }
  }, [user]);

  const loadClients = async () => {
    try {
      const data = await api.get<Client[]>('/clients');
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const loadFolders = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClientId !== 'all') {
        params.append('clientId', selectedClientId);
      }
      if (selectedFinancialYear !== 'all') {
        params.append('financialYear', selectedFinancialYear);
      }
      const endpoint = params.toString()
        ? `/documents/folders?${params.toString()}`
        : '/documents/folders';
      const data = await api.get<DocumentFolder[]>(endpoint);
      setFolders(data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFolder) {
        params.append('folderId', selectedFolder);
      }
      if (selectedClientId !== 'all') {
        params.append('clientId', selectedClientId);
      }
      const endpoint = params.toString()
        ? `/documents?${params.toString()}`
        : '/documents';
      const data = await api.get<Document[]>(endpoint);
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const blob = await api.download(`/documents/${documentId}/download`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download document:', error);
      alert('Failed to download document');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete<void>(`/documents/${documentId}`);
      await loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadClientId || !uploadFinancialYear || !uploadFolderName) {
      alert('Please fill all fields and select a file');
      return;
    }

    try {
      setUploading(true);

      const folder = await api.post<DocumentFolder>('/documents/folders', {
        clientId: uploadClientId,
        financialYear: uploadFinancialYear,
        name: uploadFolderName,
      });

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('clientId', uploadClientId);
      formData.append('folderId', folder.id);

      await api.upload<Document>('/documents', formData);

      setShowUploadModal(false);
      setUploadClientId('');
      setUploadFinancialYear('');
      setUploadFolderName('');
      setUploadFile(null);
      await loadFolders();
      await loadDocuments();
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const isClientUser = user?.role === 'CLIENT';

  const treeListData = folders.map((folder) => {
    const folderClient = clients.find((c) => c.id === folder.clientId);
    return {
      id: folder.id,
      parentId: null,
      name: folder.name,
      financialYear: folder.financialYear,
      clientName: folderClient?.displayName || '',
      clientId: folder.clientId,
    };
  });

  const statusCellRender = (data: any) => {
    const status = data.value?.toLowerCase() || '';
    return (
      <span className={`status-badge status-${status}`}>
        {data.value || ''}
      </span>
    );
  };

  const actionsCellRender = (data: any) => {
    return (
      <div className="dx-document-actions">
        <Button
          text="Download"
          stylingMode="text"
          icon="download"
          onClick={() => handleDownload(data.data.id, data.data.fileName)}
        />
        {!isClientUser && (
          <Button
            text="Delete"
            stylingMode="text"
            icon="trash"
            onClick={() => handleDelete(data.data.id)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="dx-documents-page">
      <PageHeader
        title="Documents"
        subtitle="Manage documents and folders"
        actions={
          <Button
            text="Upload Document"
            type="default"
            icon="upload"
            onClick={() => setShowUploadModal(true)}
          />
        }
      />

      <div className="dx-documents-layout">
        <div className="dx-documents-sidebar">
          {!isClientUser && (
            <div className="dx-filters-section">
              <SelectBox
                dataSource={[{ id: 'all', displayName: 'All Clients' }, ...clients]}
                displayExpr="displayName"
                valueExpr="id"
                value={selectedClientId}
                onValueChanged={(e) => setSelectedClientId(e.value)}
                placeholder="Select Client"
              />
              <SelectBox
                dataSource={[
                  { value: 'all', text: 'All Years' },
                  ...Array.from(new Set(folders.map((f) => f.financialYear))).map((fy) => ({
                    value: fy,
                    text: fy,
                  })),
                ]}
                displayExpr="text"
                valueExpr="value"
                value={selectedFinancialYear}
                onValueChanged={(e) => {
                  setSelectedFinancialYear(e.value);
                  setSelectedFolder(null);
                }}
                placeholder="Financial Year"
              />
            </div>
          )}
          <div className="dx-folders-section">
            <h3>Folders</h3>
            <TreeList
              dataSource={treeListData}
              keyExpr="id"
              parentIdExpr="parentId"
              showBorders={true}
              onRowClick={(e: any) => {
                if (e.data) {
                  setSelectedFolder(e.data.id);
                }
              }}
            >
              <Selection mode="single" />
              <FilterRow visible={true} />
              <Column dataField="name" caption="Folder Name" />
              <Column dataField="financialYear" caption="Year" />
              {!isClientUser && <Column dataField="clientName" caption="Client" />}
            </TreeList>
            {selectedFolder && (
              <Button
                text="Clear Filter"
                stylingMode="outlined"
                onClick={() => setSelectedFolder(null)}
                style={{ marginTop: '12px', width: '100%' }}
              />
            )}
          </div>
        </div>
        <div className="dx-documents-main">
          <DataGrid
            dataSource={documents}
            showBorders={true}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
            keyExpr="id"
          >
            <Export enabled={true} />
            <DataGridColumn dataField="fileName" caption="File Name" />
            {!isClientUser && (
              <DataGridColumn
                dataField="client.displayName"
                caption="Client"
                cellRender={(data: any) => data.data?.client?.displayName ?? '-'}
              />
            )}
            <DataGridColumn
              dataField="status"
              caption="Status"
              cellRender={statusCellRender}
            />
            <DataGridColumn
              dataField="uploadedAt"
              caption="Uploaded"
              dataType="date"
              format="shortDate"
            />
            <DataGridColumn
              dataField="versionNumber"
              caption="Version"
              cellRender={(data: any) => `v${data.value || ''}`}
            />
            <DataGridColumn
              caption="Actions"
              cellRender={actionsCellRender}
              allowSorting={false}
            />
            <DataGridFilterRow visible={true} />
            <SearchPanel visible={true} />
            <Paging defaultPageSize={20} />
            <Pager showPageSizeSelector={true} allowedPageSizes={[10, 20, 50]} />
          </DataGrid>
        </div>
      </div>

      <Popup
        visible={showUploadModal}
        onHiding={() => setShowUploadModal(false)}
        showTitle={true}
        title="Upload Document"
        width={600}
        height="auto"
        showCloseButton={true}
      >
        <Form formData={{}}>
          {!isClientUser && (
            <Item
              dataField="clientId"
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: clients,
                displayExpr: 'displayName',
                valueExpr: 'id',
                value: uploadClientId,
                onValueChanged: (e: any) => setUploadClientId(e.value),
                placeholder: 'Select client',
              }}
            >
              <Label text="Client" />
              <RequiredRule />
            </Item>
          )}
          <Item
            dataField="financialYear"
            editorType="dxTextBox"
            editorOptions={{
              value: uploadFinancialYear,
              onValueChanged: (e: any) => setUploadFinancialYear(e.value),
              placeholder: '2024-25',
            }}
          >
            <Label text="Financial Year" />
            <RequiredRule />
          </Item>
          <Item
            dataField="folderName"
            editorType="dxTextBox"
            editorOptions={{
              value: uploadFolderName,
              onValueChanged: (e: any) => setUploadFolderName(e.value),
              placeholder: 'ITR Documents',
            }}
          >
            <Label text="Folder Name" />
            <RequiredRule />
          </Item>
          <Item
            render={() => (
              <>
                <Label text="File" />
                <FileUploader
                  accept="*"
                  uploadMode="useForm"
                  onValueChanged={(e: any) => {
                    if (e.value && e.value.length > 0) {
                      setUploadFile(e.value[0]);
                    }
                  }}
                />
              </>
            )}
          >
            <RequiredRule />
          </Item>
          <Item>
            <div className="dx-form-actions">
              <Button
                text="Cancel"
                stylingMode="outlined"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              />
              <Button
                text={uploading ? 'Uploading...' : 'Upload'}
                type="default"
                onClick={handleUploadSubmit}
                disabled={uploading}
              />
            </div>
          </Item>
        </Form>
      </Popup>

      <LoadPanel visible={loading} />
    </div>
  );
};
