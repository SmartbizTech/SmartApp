import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/client';
import type { Document, DocumentFolder } from '../types';
import './Chat.css';

interface Conversation {
  id: string;
  clientId: string;
  clientName: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  read: boolean;
}

export const Chat: React.FC = () => {
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachMode, setAttachMode] = useState<'existing' | 'upload'>('existing');
  const [attachDocuments, setAttachDocuments] = useState<Document[]>([]);
  const [attachLoading, setAttachLoading] = useState(false);
  const [uploadFinancialYear, setUploadFinancialYear] = useState('');
  const [uploadFolderName, setUploadFolderName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await api.get<Conversation[]>('/chat/conversations');
      setConversations(data);
      const state = location.state as { conversationId?: string } | null;
      if (state?.conversationId) {
        setSelectedConversation(state.conversationId);
      } else if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await api.get<Message[]>(`/chat/conversations/${conversationId}/messages`);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    try {
      await api.post(`/chat/conversations/${selectedConversation}/messages`, {
        body: messageText,
      });
      setMessageText('');
      loadMessages(selectedConversation);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  const openAttachModal = async () => {
    if (!selectedConversation) return;
    const conv = conversations.find((c) => c.id === selectedConversation);
    if (!conv) return;
    setAttachMode('existing');
    try {
      setAttachLoading(true);
      const docs = await api.get<Document[]>(`/documents?clientId=${conv.clientId}`);
      setAttachDocuments(docs);
      setShowAttachModal(true);
    } catch (error) {
      console.error('Failed to load documents for attachment:', error);
      alert('Failed to load documents');
    } finally {
      setAttachLoading(false);
    }
  };

  const attachDocument = async (docId: string, fileName: string) => {
    if (!selectedConversation) return;
    try {
      await api.post(`/chat/conversations/${selectedConversation}/messages`, {
        body: `Attached document: ${fileName} (ID: ${docId})`,
      });
      setShowAttachModal(false);
      loadMessages(selectedConversation);
    } catch (error) {
      console.error('Failed to attach document:', error);
      alert('Failed to attach document');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation) return;
    const conv = conversations.find((c) => c.id === selectedConversation);
    if (!conv) return;

    if (!uploadFile || !uploadFinancialYear || !uploadFolderName) {
      alert('Please fill all fields and select a file');
      return;
    }

    try {
      setUploading(true);

      // Create folder for this client/year if needed
      const folder = await api.post<DocumentFolder>('/documents/folders', {
        clientId: conv.clientId,
        financialYear: uploadFinancialYear,
        name: uploadFolderName,
      });

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('clientId', conv.clientId);
      formData.append('folderId', folder.id);

      const uploadedDoc = await api.upload<Document>('/documents', formData);

      // Send message with the uploaded document
      await api.post(`/chat/conversations/${selectedConversation}/messages`, {
        body: `Attached document: ${uploadedDoc.fileName} (ID: ${uploadedDoc.id})`,
      });

      // Refresh existing documents list
      const docs = await api.get<Document[]>(`/documents?clientId=${conv.clientId}`);
      setAttachDocuments(docs);

      // Reset form
      setUploadFinancialYear('');
      setUploadFolderName('');
      setUploadFile(null);
      setAttachMode('existing');
      setShowAttachModal(false);
      loadMessages(selectedConversation);
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading conversations...</div>;
  }

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="conversations-sidebar">
          <div className="conversations-header">
            <h2>Conversations</h2>
          </div>
          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="empty-state">
                <p>No conversations</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-item ${
                    selectedConversation === conv.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedConversation(conv.id)}
                >
                  <div className="conversation-info">
                    <h3>{conv.clientName}</h3>
                    {conv.lastMessage && (
                      <p className="last-message">{conv.lastMessage}</p>
                    )}
                  </div>
                  {conv.unreadCount && conv.unreadCount > 0 && (
                    <span className="unread-badge">{conv.unreadCount}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chat-main">
          {selectedConversation ? (
            <>
              <div className="messages-container">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.read ? 'read' : 'unread'}`}>
                    <div className="message-header">
                      <strong>{msg.senderName}</strong>
                      <span className="message-time">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="message-body">{msg.body}</div>
                  </div>
                ))}
              </div>
              <div className="message-input">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button
                  className="attach-button"
                  onClick={openAttachModal}
                  aria-label="Attach Document"
                  title="Attach Document"
                >
                  <span className="icon-paperclip">📎</span>
                </button>
                <button
                  className="send-button-icon"
                  onClick={sendMessage}
                  aria-label="Send Message"
                  title="Send Message"
                  disabled={!messageText.trim()}
                >
                  <span className="icon-paper-plane">✈️</span>
                </button>
              </div>
            </>
          ) : (
            <div className="chat-placeholder">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
      {showAttachModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Attach Document</h2>
            <div className="attach-modal-tabs">
              <button
                type="button"
                className={`attach-tab ${attachMode === 'existing' ? 'active' : ''}`}
                onClick={() => setAttachMode('existing')}
              >
                From Existing
              </button>
              <button
                type="button"
                className={`attach-tab ${attachMode === 'upload' ? 'active' : ''}`}
                onClick={() => setAttachMode('upload')}
              >
                Upload New
              </button>
            </div>
            {attachMode === 'existing' ? (
              <>
                {attachLoading ? (
                  <div className="page-loading">Loading documents...</div>
                ) : attachDocuments.length === 0 ? (
                  <div className="empty-state">
                    <p>No documents available for this client</p>
                  </div>
                ) : (
                  <div className="documents-list">
                    <table className="documents-table">
                      <thead>
                        <tr>
                          <th>File Name</th>
                          <th>Status</th>
                          <th>Uploaded</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attachDocuments.map((doc) => (
                          <tr key={doc.id}>
                            <td>{doc.fileName}</td>
                            <td>{doc.status}</td>
                            <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                            <td>
                              <button
                                className="primary-button"
                                type="button"
                                onClick={() => attachDocument(doc.id, doc.fileName)}
                              >
                                Attach
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <form className="upload-form" onSubmit={handleUploadSubmit}>
                <div className="form-field">
                  <label>Financial Year</label>
                  <input
                    type="text"
                    value={uploadFinancialYear}
                    onChange={(e) => setUploadFinancialYear(e.target.value)}
                    placeholder="e.g., 2024-25"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Folder Name</label>
                  <input
                    type="text"
                    value={uploadFolderName}
                    onChange={(e) => setUploadFolderName(e.target.value)}
                    placeholder="e.g., Tax Returns"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>File</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setShowAttachModal(false);
                      setUploadFinancialYear('');
                      setUploadFolderName('');
                      setUploadFile(null);
                    }}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={uploading || !uploadFile || !uploadFinancialYear || !uploadFolderName}
                  >
                    {uploading ? 'Uploading...' : 'Upload & Attach'}
                  </button>
                </div>
              </form>
            )}
            {attachMode === 'existing' && (
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowAttachModal(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

