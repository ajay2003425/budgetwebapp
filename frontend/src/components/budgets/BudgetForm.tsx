import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { budgetService } from '../../services/budgets';
import { departmentService } from '../../services/departments';
import { categoryService } from '../../services/categories';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Toast } from '../ui/Toast';
import { Department, Category } from '../../types';

interface BudgetFormData {
  name: string;
  description?: string;
  amount: number;
  departmentId: string;
  categoryId: string;
  period: string;
  startDate: string;
  endDate: string;
}

interface BudgetFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({ onSuccess, onCancel }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<BudgetFormData>();

  useEffect(() => {
    loadDependencies();
  }, []);

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
      setError('Failed to load form dependencies');
    }
  };

  const onSubmit = async (data: BudgetFormData) => {
    setLoading(true);
    setError(null);

    try {
      await budgetService.create({
        ...data,
        amount: Number(data.amount),
      });
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create budget');
    } finally {
      setLoading(false);
    }
  };

  const periodOptions = [
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'YEARLY', label: 'Yearly' },
  ];

  const departmentOptions = [
    { value: '', label: 'Select Department' },
    ...departments.map(dept => ({ value: dept._id, label: dept.name }))
  ];

  const categoryOptions = [
    { value: '', label: 'Select Category' },
    ...categories.map(cat => ({ value: cat._id, label: cat.name }))
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Budget Name *
            </label>
            <Input
              id="name"
              {...register('name', { required: 'Budget name is required' })}
              error={errors.name?.message}
              placeholder="Enter budget name"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              {...register('amount', { 
                required: 'Amount is required',
                min: { value: 0, message: 'Amount must be positive' }
              })}
              error={errors.amount?.message}
              placeholder="Enter budget amount"
            />
            {errors.amount && (
              <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">
              Department *
            </label>
            <Select
              {...register('departmentId', { required: 'Department is required' })}
              options={departmentOptions}
              error={errors.departmentId?.message}
            />
            {errors.departmentId && (
              <p className="text-red-600 text-sm mt-1">{errors.departmentId.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <Select
              {...register('categoryId', { required: 'Category is required' })}
              options={categoryOptions}
              error={errors.categoryId?.message}
            />
            {errors.categoryId && (
              <p className="text-red-600 text-sm mt-1">{errors.categoryId.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
              Period *
            </label>
            <Select
              {...register('period', { required: 'Period is required' })}
              options={periodOptions}
              error={errors.period?.message}
            />
            {errors.period && (
              <p className="text-red-600 text-sm mt-1">{errors.period.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <Input
              id="startDate"
              type="date"
              {...register('startDate', { required: 'Start date is required' })}
              error={errors.startDate?.message}
            />
            {errors.startDate && (
              <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <Input
              id="endDate"
              type="date"
              {...register('endDate', { 
                required: 'End date is required',
                validate: (value) => {
                  const startDate = watch('startDate');
                  if (startDate && value && new Date(value) <= new Date(startDate)) {
                    return 'End date must be after start date';
                  }
                }
              })}
              error={errors.endDate?.message}
            />
            {errors.endDate && (
              <p className="text-red-600 text-sm mt-1">{errors.endDate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter budget description (optional)"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Budget'}
        </Button>
      </div>
    </form>
  );
};
