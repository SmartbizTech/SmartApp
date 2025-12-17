import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'devextreme-react/button';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '60px auto',
        textAlign: 'center',
        padding: '32px 24px',
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Access denied</h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
        You are logged in but do not have permission to view this page.
      </p>
      <Button
        text="Go to home"
        type="default"
        onClick={() => navigate('/')}
      />
    </div>
  );
};


