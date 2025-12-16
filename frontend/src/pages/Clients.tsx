import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Client } from '../types';
import './Clients.css';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const filteredClients = clients.filter((client) => {
    const term = search.toLowerCase();
    if (!term) return true;
    return (
      client.displayName.toLowerCase().includes(term) ||
      (client.pan && client.pan.toLowerCase().includes(term)) ||
      (client.gstin && client.gstin.toLowerCase().includes(term)) ||
      (client.cin && client.cin.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return <div className="page-loading">Loading clients...</div>;
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1>Clients</h1>
        <div className="page-actions">
          <input
            type="text"
            className="filter-select"
            placeholder="Search by name, PAN, GSTIN, CIN"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="primary-button" onClick={() => navigate('/clients/new')}>
            Add Client
          </button>
        </div>
      </div>

      <div className="clients-grid">
        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <p>No clients found</p>
            <button className="primary-button" onClick={() => navigate('/clients/new')}>
              Add Your First Client
            </button>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="client-card"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <div className="client-header">
                <h3>{client.displayName}</h3>
                <span className={`client-type type-${client.type.toLowerCase()}`}>
                  {client.type}
                </span>
              </div>
              <div className="client-details">
                {client.pan && (
                  <div className="detail-item">
                    <span className="label">PAN:</span>
                    <span className="value">{client.pan}</span>
                  </div>
                )}
                {client.gstin && (
                  <div className="detail-item">
                    <span className="label">GSTIN:</span>
                    <span className="value">{client.gstin}</span>
                  </div>
                )}
                {client.cin && (
                  <div className="detail-item">
                    <span className="label">CIN:</span>
                    <span className="value">{client.cin}</span>
                  </div>
                )}
                {client.primaryUser && (
                  <div className="detail-item">
                    <span className="label">Contact:</span>
                    <span className="value">{client.primaryUser.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

