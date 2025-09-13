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
import { MobileCardItem } from '../components/ui/MobileCard';

export const Users: React.FC = () => {
  const { hasRole, user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]); // Store all users
  const [users, setUsers] = useState<User[]>([]); // Filtered users for display
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadDepartments();
    loadUsers(); // Load all users initially
  }, []);

  // Apply filter when selectedRole changes
  useEffect(() => {
    if (allUsers.length > 0) {
      console.log('🔄 Role filter changed, applying client-side filter...');
      applyClientFilter(allUsers, selectedRole);
    }
  }, [selectedRole, allUsers]);

  const loadDepartments = async () => {
    try {
      const response = await departmentService.list({ limit: 100 });
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadUsers = async () => {
    console.log('🔄 Loading all users...');
    setLoading(true);
    setFeedbackMessage(null);
    
    try {
      // Load ALL users without filtering (let backend return all)
      const params = {
        page: 1,
        limit: 1000, // Get all users
      };

      console.log('📤 API call params:', params);
      const response: PaginatedResponse<User> = await userService.list(params);
      
      console.log('📥 Received users:', response.data?.length || 0);
      console.log('📋 All user roles:', response.data?.map(u => u.role) || []);
      
      const fetchedUsers = response.data || [];
      setAllUsers(fetchedUsers);
      
      // Apply client-side filtering
      applyClientFilter(fetchedUsers, selectedRole);
      
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      setFeedbackMessage({ 
        type: 'error', 
        message: 'Failed to load users. Please refresh the page.' 
      });
      setTimeout(() => setFeedbackMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const applyClientFilter = (userList: User[], roleFilter: string) => {
    console.log('🔍 Applying client-side filter:', roleFilter);
    console.log('🔍 Total users to filter:', userList.length);
    
    let filteredUsers = userList;
    
    if (roleFilter && roleFilter.trim() !== '') {
      filteredUsers = userList.filter(user => {
        const matches = user.role === roleFilter;
        console.log(`🔍 User ${user.name} (${user.role}) matches filter ${roleFilter}:`, matches);
        return matches;
      });
    }
    
    console.log('✅ Filtered users count:', filteredUsers.length);
    console.log('✅ Filtered user roles:', filteredUsers.map(u => u.role));
    
    setUsers(filteredUsers);
    
    // Update pagination for display
    setPagination(prev => ({
      ...prev,
      total: filteredUsers.length,
      totalPages: Math.ceil(filteredUsers.length / prev.limit),
    }));
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    console.log('Editing user:', user);
    console.log('Current user has edit permissions:', hasRole('ADMIN') || hasRole('MANAGER'));
    setEditingUser(user);
    setShowForm(true);
  };

  const handleActivate = async (userId: string) => {
    setActionLoading(userId);
    try {
      await userService.activate(userId);
      setFeedbackMessage({ type: 'success', message: 'User activated successfully!' });
      loadUsers(); // Reload all users
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (error) {
      console.error('Failed to activate user:', error);
      setFeedbackMessage({ type: 'error', message: 'Failed to activate user. Please try again.' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    
    setActionLoading(userId);
    try {
      await userService.deactivate(userId);
      setFeedbackMessage({ type: 'success', message: 'User deactivated successfully!' });
      loadUsers(); // Reload all users
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      setFeedbackMessage({ type: 'error', message: 'Failed to deactivate user. Please try again.' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleFilterChange = (newRole: string) => {
    console.log('🔄 Role filter changed from:', `"${selectedRole}"`, 'to:', `"${newRole}"`);
    setSelectedRole(newRole);
  };

  const handleClearFilters = () => {
    console.log('🧹 Clearing filters');
    setSelectedRole('');
  };

  const handleFormSuccess = () => {
    console.log('User form submitted successfully');
    setShowForm(false);
    setEditingUser(null);
    setFeedbackMessage({ type: 'success', message: 'User saved successfully!' });
    loadUsers(); // Reload all users
    
    // Clear feedback after 3 seconds
    setTimeout(() => setFeedbackMessage(null), 3000);
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

  const getDepartmentName = (departmentId?: string | any) => {
    console.log('getDepartmentName called with:', departmentId, 'type:', typeof departmentId);
    
    if (!departmentId) return '-';
    
    // If departmentId is an object (populated), get the name
    if (typeof departmentId === 'object' && departmentId.name) {
      console.log('Found department name:', departmentId.name);
      return departmentId.name;
    }
    
    // If departmentId is a string, find it in the departments array
    if (typeof departmentId === 'string') {
      const department = departments.find(d => d._id === departmentId);
      console.log('Found department by ID:', department);
      return department?.name || '-';
    }
    
    console.log('Returning default dash');
    return '-';
  };

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'USER', label: 'User' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  return (
    <div className="space-y-6">
      {/* Feedback Message */}
      {feedbackMessage && (
        <div className={`p-4 rounded-lg border ${
          feedbackMessage.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedbackMessage.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="min-w-[200px] flex-shrink-0">
            <Select
              value={selectedRole}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
              options={roleOptions}
              placeholder="Select role to filter"
              disabled={filterLoading}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={handleClearFilters}
            disabled={filterLoading}
            className="sm:flex-shrink-0"
          >
            {filterLoading ? 'Filtering...' : 'Clear Filters'}
          </Button>
          <div className="text-sm text-gray-500 break-words">
            Current filter: "{selectedRole}" | 
            Users shown: {users.length} | 
            {selectedRole && selectedRole.trim() !== '' ? `Filtering by: ${selectedRole}` : 'Showing all users'}
          </div>
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
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
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
                        {(hasRole('ADMIN') || hasRole('MANAGER') || user._id === currentUser?._id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        
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
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {users.map((user) => (
            <MobileCardItem key={user._id}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Tag variant={user.isActive ? 'success' : 'danger'} size="sm">
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Tag>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Role:</span>
                    <Tag variant={getRoleColor(user.role)} size="sm" className="ml-2">
                      {user.role}
                    </Tag>
                  </div>
                  <div>
                    <span className="text-gray-500">Department:</span>
                    <span className="ml-2 text-gray-900">{getDepartmentName(user.departmentId)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 text-gray-900">{formatDate(user.createdAt)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                  {(hasRole('ADMIN') || hasRole('MANAGER') || user._id === currentUser?._id) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  
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
                          <UserX className="w-4 h-4 mr-2" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleActivate(user._id)}
                          loading={actionLoading === user._id}
                          disabled={actionLoading !== null}
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Activate
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </MobileCardItem>
          ))}

          {/* Mobile Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center space-x-2 pt-4">
              <Button
                variant="outline"
                size="sm"
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
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
        </>
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