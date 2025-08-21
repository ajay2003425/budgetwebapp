import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { departmentService } from '../../services/departments';
import { Department } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface DepartmentFormProps {
  department?: Department | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface DepartmentFormData {
  name: string;
  code: string;
  description?: string;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  department,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const isEditing = !!department;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<DepartmentFormData>({
    defaultValues: {
      name: department?.name || '',
      code: department?.code || '',
      description: department?.description || '',
    },
  });

  const onSubmit = async (data: DepartmentFormData) => {
    setLoading(true);
    try {
      if (isEditing) {
        await departmentService.update(department._id, data);
      } else {
        await departmentService.create(data);
      }
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save department';
      setError('root', { message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Department Name"
        placeholder="Enter department name"
        {...register('name', {
          required: 'Department name is required',
          minLength: { value: 2, message: 'Name must be at least 2 characters' },
        })}
        error={errors.name?.message}
      />

      <Input
        label="Department Code"
        placeholder="Enter department code (e.g., IT, HR, FIN)"
        {...register('code', {
          required: 'Department code is required',
          minLength: { value: 2, message: 'Code must be at least 2 characters' },
          maxLength: { value: 10, message: 'Code must be at most 10 characters' },
          pattern: {
            value: /^[A-Z0-9]+$/,
            message: 'Code must contain only uppercase letters and numbers',
          },
        })}
        error={errors.code?.message}
        style={{ textTransform: 'uppercase' }}
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Description (Optional)
        </label>
        <textarea
          rows={3}
          placeholder="Enter department description..."
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {errors.root && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{errors.root.message}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEditing ? 'Update' : 'Create'} Department
        </Button>
      </div>
    </form>
  );
};