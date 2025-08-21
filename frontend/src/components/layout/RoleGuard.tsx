import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../ui/EmptyState';
import { Shield } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback,
}) => {
  const { hasRole } = useAuth();

  if (!hasRole(allowedRoles)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          icon={<Shield className="w-12 h-12 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to access this page."
        />
      </div>
    );
  }

  return <>{children}</>;
};