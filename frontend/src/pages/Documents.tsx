import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Client, Document, DocumentFolder } from '../types';
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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadClientId || !uploadFinancialYear || !uploadFolderName) {
      alert('Please fill all fields and select a file');
      return;
    }

    try {
      setUploading(true);

      // Create folder for this client/year if needed
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

  if (loading) {
    return <div className="page-loading">Loading documents...</div>;
  }

  return (
    <div className="documents-page">
      <div className="page-header">
        <h1>Documents</h1>
        <div className="page-actions">
          {!isClientUser && (
            <select
              className="filter-select"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="all">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.displayName}
                </option>
              ))}
            </select>
          )}
          <button className="primary-button" onClick={() => setShowUploadModal(true)}>
            Upload Document
          </button>
        </div>
      </div>

      <div className="documents-content">
        <div className="documents-sidebar">
          <div className="filters-section">
            {!isClientUser && (
              <div className="filter-group">
                <label>Financial Year</label>
                <select
                  className="filter-select"
                  value={selectedFinancialYear}
                  onChange={(e) => {
                    setSelectedFinancialYear(e.target.value);
                    setSelectedFolder(null);
                  }}
                >
                  <option value="all">All Years</option>
                  {Array.from(new Set(folders.map((f) => f.financialYear))).map((fy) => (
                    <option key={fy} value={fy}>
                      {fy}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="folders-section">
            <h3>Folders</h3>
            {folders.length === 0 ? (
              <div className="empty-state">
                <p>No folders</p>
              </div>
            ) : (
              <div className="folders-list">
                {folders.map((folder) => {
                  const folderClient = clients.find((c) => c.id === folder.clientId);
                  return (
                    <div
                      key={folder.id}
                      className={`folder-item ${selectedFolder === folder.id ? 'active' : ''}`}
                      onClick={() => setSelectedFolder(folder.id)}
                    >
                      <div className="folder-name">{folder.name}</div>
                      <div className="folder-meta">
                        {!isClientUser && folderClient && (
                          <span className="folder-client">{folderClient.displayName}</span>
                        )}
                        <span className="folder-fy">{folder.financialYear}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedFolder && (
              <button
                className="secondary-button"
                onClick={() => setSelectedFolder(null)}
                style={{ marginTop: '12px', width: '100%' }}
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
        <div className="documents-list">
          {documents.length === 0 ? (
            <div className="empty-state">
              <p>No documents found</p>
              <button
                className="primary-button"
                onClick={() => setShowUploadModal(true)}
              >
                Upload Your First Document
              </button>
            </div>
          ) : (
            <table className="documents-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  {!isClientUser && <th>Client</th>}
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>Version</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.fileName}</td>
                    {!isClientUser && <td>{doc.client?.displayName ?? '-'}</td>}
                    <td>
                      <span className={`status-badge status-${doc.status.toLowerCase()}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                    <td>v{doc.versionNumber}</td>
                    <td>
                      <button
                        className="action-button"
                        onClick={() => handleDownload(doc.id, doc.fileName)}
                      >
                        Download
                      </button>
                      {!isClientUser && (
                        <button
                          className="action-button action-danger"
                          onClick={() => handleDelete(doc.id)}
                          style={{ marginLeft: '8px' }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showUploadModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Upload Document</h2>
            <form onSubmit={handleUploadSubmit} className="form-grid">
              {!isClientUser && (
                <div className="form-field">
                  <label>Client</label>
                  <select
                    value={uploadClientId}
                    onChange={(e) => setUploadClientId(e.target.value)}
                    required
                  >
                    <option value="">Select client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {isClientUser && (
                <input
                  type="hidden"
                  value={uploadClientId}
                  readOnly
                />
              )}
              <div className="form-field">
                <label>Financial Year</label>
                <input
                  type="text"
                  placeholder="2024-25"
                  value={uploadFinancialYear}
                  onChange={(e) => setUploadFinancialYear(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Folder Name</label>
                <input
                  type="text"
                  placeholder="ITR Documents"
                  value={uploadFolderName}
                  onChange={(e) => setUploadFolderName(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>File</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  required
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

