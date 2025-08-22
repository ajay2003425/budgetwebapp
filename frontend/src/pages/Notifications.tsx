import React, { useState, useEffect } from 'react';
import { Bell, Search, Filter, Check, Trash2, RefreshCw } from 'lucide-react';
import { Notification } from '../types';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { notificationService } from '../services/notifications';

export const Notifications: React.FC = () => {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRead, setFilterRead] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterType, filterRead, allNotifications]);

  const applyFilters = () => {
    let filtered = [...allNotifications];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(search) ||
        notification.message.toLowerCase().includes(search)
      );
    }

    // Type filter
    if (filterType) {
      filtered = filtered.filter(notification => notification.type === filterType);
    }

    // Read status filter
    if (filterRead === 'read') {
      filtered = filtered.filter(notification => notification.read);
    } else if (filterRead === 'unread') {
      filtered = filtered.filter(notification => !notification.read);
    }

    setNotifications(filtered);
    setPagination(prev => ({
      ...prev,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / prev.limit),
      page: 1
    }));
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Load all notifications for client-side filtering
      const response = await notificationService.list({ limit: 1000 });
      setAllNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setActionLoading(id);
    try {
      await notificationService.markAsRead(id);
      setAllNotifications(prev =>
        prev.map(notif =>
          notif._id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading('all');
    try {
      await notificationService.markAllAsRead();
      setAllNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await notificationService.delete(id);
      setAllNotifications(prev => prev.filter(notif => notif._id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = () => {
    loadNotifications();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterRead('');
  };

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'INFO', label: 'Information' },
    { value: 'WARNING', label: 'Warning' },
    { value: 'ACTION', label: 'Action Required' },
  ];

  const readStatusOptions = [
    { value: '', label: 'All Notifications' },
    { value: 'unread', label: 'Unread Only' },
    { value: 'read', label: 'Read Only' },
  ];

  const unreadCount = allNotifications.filter(n => !n.read).length;
  const currentPageNotifications = notifications.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Notifications
          </h1>
          <p className="text-gray-600 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              loading={actionLoading === 'all'}
              disabled={actionLoading !== null}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div>
            <Select
              options={typeOptions}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              placeholder="Filter by type"
            />
          </div>
          <div>
            <Select
              options={readStatusOptions}
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value)}
              placeholder="Filter by status"
            />
          </div>
          <div>
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!searchTerm && !filterType && !filterRead}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : currentPageNotifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-12 h-12 text-gray-400" />}
            title="No notifications found"
            description={
              allNotifications.length === 0
                ? "You don't have any notifications yet."
                : "No notifications match your current filters."
            }
            action={
              allNotifications.length > 0
                ? {
                    label: 'Clear Filters',
                    onClick: handleClearFilters
                  }
                : undefined
            }
          />
        ) : (
          <div className="divide-y divide-gray-200">
            {currentPageNotifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center space-x-2 p-6 border-t">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 py-2 text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
