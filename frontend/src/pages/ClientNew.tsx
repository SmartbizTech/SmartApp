import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Client } from '../types';
import './Clients.css';

export const ClientNew: React.FC = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [type, setType] = useState<'INDIVIDUAL' | 'BUSINESS'>('INDIVIDUAL');
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [cin, setCin] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post<Client>('/clients', {
        displayName,
        type,
        pan: pan || undefined,
        gstin: gstin || undefined,
        cin: cin || undefined,
        contactName,
        contactEmail,
      });
      navigate('/clients');
    } catch (error: any) {
      console.error('Failed to create client:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to create client';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1>Add Client</h1>
      </div>

      <form className="client-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field">
            <label>Client Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label>Client Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'INDIVIDUAL' | 'BUSINESS')}
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="BUSINESS">Business</option>
            </select>
          </div>
          <div className="form-field">
            <label>PAN</label>
            <input
              type="text"
              value={pan}
              onChange={(e) => setPan(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>GSTIN</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>CIN</label>
            <input
              type="text"
              value={cin}
              onChange={(e) => setCin(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Contact Name</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label>Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('/clients')}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Client'}
          </button>
        </div>
      </form>
    </div>
  );
};


