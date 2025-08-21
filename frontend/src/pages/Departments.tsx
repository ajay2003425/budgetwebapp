import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { departmentService } from '../services/departments';
import { Department, PaginatedResponse } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { DepartmentForm } from '../components/departments/DepartmentForm';
import { formatDate } from '../utils/format';

export const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const response: PaginatedResponse<Department> = await departmentService.list({ limit: 100 });
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDepartment(null);
    setShowForm(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    setDeletingId(id);
    try {
      await departmentService.delete(id);
      loadDepartments();
    } catch (error) {
      console.error('Failed to delete department:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingDepartment(null);
    loadDepartments();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingDepartment(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600">Manage organizational departments</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Departments Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-12 h-12 text-gray-400" />}
          title="No departments found"
          description="Get started by creating your first department."
          action={{
            label: 'Add Department',
            onClick: handleCreate
          }}
        />
      ) : (
        <Card padding={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department._id}>
                  <TableCell className="font-medium">
                    {department.name}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-mono rounded">
                      {department.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-xs truncate" title={department.description}>
                      {department.description || '-'}
                    </p>
                  </TableCell>
                  <TableCell>
                    {formatDate(department.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(department)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(department._id)}
                        loading={deletingId === department._id}
                        disabled={deletingId !== null}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Department Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleFormCancel}
        title={editingDepartment ? 'Edit Department' : 'Add Department'}
        size="md"
      >
        <DepartmentForm
          department={editingDepartment}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>
    </div>
  );
};