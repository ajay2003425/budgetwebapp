import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  CheckSquare,
  BarChart3,
  Building2,
  Tag,
  Users,
  Settings,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, hasRole } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MANAGER', 'USER'],
    },
    {
      name: 'Budgets',
      href: '/budgets',
      icon: Wallet,
      roles: ['ADMIN', 'MANAGER', 'USER'],
    },
    {
      name: 'Expenses',
      href: '/expenses',
      icon: Receipt,
      roles: ['ADMIN', 'MANAGER', 'USER'],
    },
    {
      name: 'Approvals',
      href: '/approvals',
      icon: CheckSquare,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: ['ADMIN', 'MANAGER', 'USER'],
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      name: 'Departments',
      href: '/departments',
      icon: Building2,
      roles: ['ADMIN'],
    },
    {
      name: 'Categories',
      href: '/categories',
      icon: Tag,
      roles: ['ADMIN'],
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: Settings,
      roles: ['ADMIN', 'MANAGER', 'USER'],
    },
  ];

  const filteredNavigation = navigation.filter(item =>
    hasRole(item.roles)
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => onClose()}
              className={({ isActive }) =>
                clsx(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
                  isActive
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 uppercase">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};