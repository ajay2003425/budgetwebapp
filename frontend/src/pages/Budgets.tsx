import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { budgetService } from '../services/budgets';
import { departmentService } from '../services/departments';
import { categoryService } from '../services/categories';
import { useAuth } from '../context/AuthContext';
import { Budget, Department, Category, PaginatedResponse } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Tag } from '../components/ui/Tag';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../utils/format';

export const Budgets: React.FC = () => {
  const { hasRole } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [searchTerm, selectedDepartment, selectedCategory, selectedStatus, pagination.page]);

  const loadDependencies = async () => {
    try {
      const [departmentsRes, categoriesRes] = await Promise.all([
        departmentService.list({ limit: 100 }),
        categoryService.list({ limit: 100 }),
      ]);
      setDepartments(departmentsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Failed to load dependencies:', error);
    }
  };

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedDepartment) params.departmentId = selectedDepartment;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;

      const response: PaginatedResponse<Budget> = await budgetService.list(params);
      setBudgets(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages,
      }));
    } catch (error) {
      console.error('Failed to load budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): 'success' | 'default' => {
    return status === 'ACTIVE' ? 'success' : 'default';
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map(dept => ({ value: dept._id, label: dept.name }))
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat._id, label: cat.name }))
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ARCHIVED', label: 'Archived' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-600">Manage your budget allocations</p>
        </div>
        {hasRole(['ADMIN', 'MANAGER']) && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Budget
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search budgets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            options={departmentOptions}
          />

          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={categoryOptions}
          />

          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={statusOptions}
          />

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setSelectedDepartment('');
            setSelectedCategory('');
            setSelectedStatus('');
            setPagination(prev => ({ ...prev, page: 1 }));
          }}>
            <Filter className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </Card>

      {/* Budget Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          title="No budgets found"
          description="Get started by creating your first budget."
          action={
            hasRole(['ADMIN', 'MANAGER']) ? {
              label: 'Create Budget',
              onClick: () => {/* Handle create */}
            } : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => {
            const spentPercentage = (budget.spent / budget.amount) * 100;
            return (
              <Card key={budget._id} className="hover:shadow-md transition-shadow duration-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {budget.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {budget.departmentId?.name} • {budget.categoryId?.name}
                      </p>
                    </div>
                    <Tag variant={getStatusColor(budget.status)}>
                      {budget.status}
                    </Tag>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        {formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}
                      </span>
                      <span className="text-gray-600">
                        {spentPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(spentPercentage)}`}
                        style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Remaining: {formatCurrency(budget.remaining)}</span>
                      <span>{budget.period}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500">
                      Owner: {budget.ownerId?.name}
                    </span>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
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
    </div>
  );
};