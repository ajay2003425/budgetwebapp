import React from 'react';
import { Card } from './Card';

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileCard: React.FC<MobileCardProps> = ({ children, className }) => {
  return (
    <div className={`block sm:hidden ${className}`}>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

interface MobileCardItemProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export const MobileCardItem: React.FC<MobileCardItemProps> = ({ children, onClick }) => {
  return (
    <div
      className={`bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden p-4 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface MobileFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export const MobileField: React.FC<MobileFieldProps> = ({ label, value, className }) => {
  return (
    <div className={`flex justify-between items-center py-1 ${className}`}>
      <span className="text-sm text-gray-600 font-medium">{label}:</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
};

interface MobileFieldVerticalProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export const MobileFieldVertical: React.FC<MobileFieldVerticalProps> = ({ label, value, className }) => {
  return (
    <div className={`${className}`}>
      <span className="block text-xs text-gray-600 font-medium mb-1">{label}</span>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
};
