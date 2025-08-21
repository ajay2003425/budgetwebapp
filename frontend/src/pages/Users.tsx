import React, { useEffect, useState } from 'react';
import { Plus, Edit, UserCheck, UserX, Shield } from 'lucide-react';
import { userService } from '../services/users';
import { departmentService } from '../services/departments';
import { useAuth } from '../context/AuthContext';
import { User, Department, PaginatedResponse } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Tag } from '../components/ui/Tag';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { UserForm } from '../components/users/UserForm';
import { formatDate, getInitials } from '../utils/format';

export const Users: React.FC = () => {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [selectedRole, pagination.page]);

  const loadDepartments = async () => {
    try {
      const response = await departmentService.list({ limit: 100 });
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (selectedRole) params.role = selectedRole;

      const response: PaginatedResponse<User> = await userService.list(params);
      setUsers(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages,
      }));
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleActivate = async (userId: string) => {
    setActionLoading(userId);
    try {
      await userService.activate(userId);
      loadUsers();
    } catch (error) {
      console.error('Failed to activate user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    
    setActionLoading(userId);
    try {
      await userService.deactivate(userId);
      loadUsers();
    } catch (error) {
      console.error('Failed to deactivate user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingUser(null);
    loadUsers();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const getRoleColor = (role: string): 'success' | 'info' | 'default' => {
    switch (role) {
      case 'ADMIN': return 'success';
      case 'MANAGER': return 'info';
      default: return 'default';
    }
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return '-';
    const department = departments.find(d => d._id === departmentId);
    return department?.name || '-';
  };

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'USER', label: 'User' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        {hasRole('ADMIN') && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center space-x-4">
          <Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            options={roleOptions}
          />
          <Button variant="outline" onClick={() => {
            setSelectedRole('');
            setPagination(prev => ({ ...prev, page: 1 }));
          }}>
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Shield className="w-12 h-12 text-gray-400" />}
          title="No users found"
          description="Get started by adding your first user."
          action={hasRole('ADMIN') ? {
            label: 'Add User',
            onClick: handleCreate
          } : undefined}
        />
      ) : (
        <Card padding={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Tag variant={getRoleColor(user.role)}>
                      {user.role}
                    </Tag>
                  </TableCell>
                  <TableCell>
                    {getDepartmentName(user.departmentId)}
                  </TableCell>
                  <TableCell>
                    <Tag variant={user.isActive ? 'success' : 'danger'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Tag>
                  </TableCell>
                  <TableCell>
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      {hasRole('ADMIN') && (
                        <>
                          {user.isActive ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeactivate(user._id)}
                              loading={actionLoading === user._id}
                              disabled={actionLoading !== null}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleActivate(user._id)}
                              loading={actionLoading === user._id}
                              disabled={actionLoading !== null}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center space-x-2 p-6">
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
      )}

      {/* User Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleFormCancel}
        title={editingUser ? 'Edit User' : 'Add User'}
        size="lg"
      >
        <UserForm
          user={editingUser}
          departments={departments}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>
    </div>
  );
};