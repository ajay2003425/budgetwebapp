import React from 'react';
import { X, Bell, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { Notification } from '../../types';
import { formatDate } from '../../utils/format';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'INFO':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'ACTION':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBorderColor = () => {
    if (!notification.read) {
      switch (notification.type) {
        case 'INFO':
          return 'border-l-blue-500';
        case 'WARNING':
          return 'border-l-yellow-500';
        case 'ACTION':
          return 'border-l-red-500';
        default:
          return 'border-l-gray-500';
      }
    }
    return 'border-l-gray-300';
  };

  return (
    <div 
      className={`p-4 border-l-4 ${getBorderColor()} ${
        notification.read ? 'bg-gray-50' : 'bg-white'
      } hover:bg-gray-50 transition-colors`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-medium ${
                notification.read ? 'text-gray-600' : 'text-gray-900'
              }`}>
                {notification.title}
              </h4>
              <span className="text-xs text-gray-500">
                {formatDate(notification.createdAt)}
              </span>
            </div>
            <p className={`mt-1 text-sm ${
              notification.read ? 'text-gray-500' : 'text-gray-700'
            }`}>
              {notification.message}
            </p>
            
            {!notification.read && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMarkAsRead(notification._id)}
                >
                  Mark as read
                </Button>
              </div>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(notification._id)}
          className="ml-2 p-1 hover:bg-red-50 hover:text-red-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
