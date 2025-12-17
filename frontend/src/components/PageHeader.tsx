import React, { type ReactNode } from 'react';
import { Button } from 'devextreme-react/button';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="dx-page-header">
      <div className="dx-page-header-content">
        <div>
          <h1 className="dx-page-title">{title}</h1>
          {subtitle && <p className="dx-page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="dx-page-actions">{actions}</div>}
      </div>
    </div>
  );
};

