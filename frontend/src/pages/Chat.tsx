import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/client';
import type { Document, DocumentFolder } from '../types';
import { List } from 'devextreme-react/list';
import { ScrollView } from 'devextreme-react/scroll-view';
import { Popup } from 'devextreme-react/popup';
import Tabs from 'devextreme-react/tabs';
import { DataGrid, Column, Paging, Pager } from 'devextreme-react/data-grid';
import { FileUploader } from 'devextreme-react/file-uploader';
import { TextArea } from 'devextreme-react/text-area';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import { PageHeader } from '../components/PageHeader';
import { Form, Item, Label, RequiredRule } from 'devextreme-react/form';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      loadConversations();
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

  const handleUploadSubmit = async () => {
    if (!selectedConversation) return;
    const conv = conversations.find((c) => c.id === selectedConversation);
    if (!conv) return;

    if (!uploadFile || !uploadFinancialYear || !uploadFolderName) {
      alert('Please fill all fields and select a file');
      return;
    }

    try {
      setUploading(true);

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

      await api.post(`/chat/conversations/${selectedConversation}/messages`, {
        body: `Attached document: ${uploadedDoc.fileName} (ID: ${uploadedDoc.id})`,
      });

      const docs = await api.get<Document[]>(`/documents?clientId=${conv.clientId}`);
      setAttachDocuments(docs);

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

  const conversationItemRender = (item: Conversation) => {
    return (
      <div className={`dx-conversation-item ${selectedConversation === item.id ? 'active' : ''}`}>
        <div className="dx-conversation-info">
          <h3>{item.clientName}</h3>
          {item.lastMessage && (
            <p className="dx-last-message">{item.lastMessage}</p>
          )}
        </div>
        {item.unreadCount && item.unreadCount > 0 && (
          <span className="dx-unread-badge">{item.unreadCount}</span>
        )}
      </div>
    );
  };

  if (loading) {
    return <LoadPanel visible={true} />;
  }

  return (
    <div className="dx-chat-page">
      <PageHeader title="Messages" subtitle="Chat with clients" />
      <div className="dx-chat-container">
        <div className="dx-conversations-sidebar">
          <div className="dx-conversations-header">
            <h2>Conversations</h2>
          </div>
          <List
            dataSource={conversations}
            itemRender={conversationItemRender}
            onItemClick={(e: any) => setSelectedConversation(e.itemData.id)}
          />
        </div>

        <div className="dx-chat-main">
          {selectedConversation ? (
            <>
              <ScrollView className="dx-messages-container" height="calc(100vh - 300px)">
                {messages.map((msg) => (
                  <div key={msg.id} className={`dx-message ${msg.read ? 'read' : 'unread'}`}>
                    <div className="dx-message-header">
                      <strong>{msg.senderName}</strong>
                      <span className="dx-message-time">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="dx-message-body">{msg.body}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </ScrollView>
              <div className="dx-message-input">
                <TextArea
                  value={messageText}
                  onValueChanged={(e) => setMessageText(e.value)}
                  placeholder="Type your message..."
                  height={80}
                  onKeyDown={(e: any) => {
                    if (e.event.key === 'Enter' && !e.event.shiftKey) {
                      e.event.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <div className="dx-message-actions">
                  <Button
                    icon="attach"
                    stylingMode="text"
                    onClick={openAttachModal}
                    hint="Attach Document"
                  />
                  <Button
                    text="Send"
                    type="default"
                    icon="send"
                    onClick={sendMessage}
                    disabled={!messageText.trim()}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="dx-chat-placeholder">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>

      <Popup
        visible={showAttachModal}
        onHiding={() => setShowAttachModal(false)}
        showTitle={true}
        title="Attach Document"
        width={800}
        height={600}
        showCloseButton={true}
      >
        <Tabs
          selectedIndex={attachMode === 'existing' ? 0 : 1}
          onSelectedIndexChange={(index) =>
            setAttachMode(index === 0 ? 'existing' : 'upload')
          }
          items={[
            { text: 'From Existing' },
            { text: 'Upload New' },
          ]}
        />
        {attachMode === 'existing' ? (
          <>
            {attachLoading ? (
              <LoadPanel visible={true} />
            ) : attachDocuments.length === 0 ? (
              <div className="dx-empty-state">
                <p>No documents available for this client</p>
              </div>
            ) : (
              <DataGrid
                dataSource={attachDocuments}
                showBorders={true}
                onRowClick={(e: any) => {
                  if (e.data) {
                    attachDocument(e.data.id, e.data.fileName);
                  }
                }}
              >
                <Column dataField="fileName" caption="File Name" />
                <Column dataField="status" caption="Status" />
                <Column
                  dataField="uploadedAt"
                  caption="Uploaded"
                  dataType="date"
                  format="shortDate"
                />
                <Paging defaultPageSize={10} />
                <Pager showPageSizeSelector={true} />
              </DataGrid>
            )}
          </>
        ) : (
          <Form formData={{}}>
            <Item
              dataField="financialYear"
              editorType="dxTextBox"
              editorOptions={{
                value: uploadFinancialYear,
                onValueChanged: (e: any) => setUploadFinancialYear(e.value),
                placeholder: 'e.g., 2024-25',
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
                placeholder: 'e.g., Tax Returns',
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
                  onClick={() => {
                    setShowAttachModal(false);
                    setUploadFinancialYear('');
                    setUploadFolderName('');
                    setUploadFile(null);
                  }}
                  disabled={uploading}
                />
                <Button
                  text={uploading ? 'Uploading...' : 'Upload & Attach'}
                  type="default"
                  onClick={handleUploadSubmit}
                  disabled={
                    uploading ||
                    !uploadFile ||
                    !uploadFinancialYear ||
                    !uploadFolderName
                  }
                />
              </div>
            </Item>
          </Form>
        )}
      </Popup>
    </div>
  );
};
