import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { categoryService } from '../../services/categories';
import { Category } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface CategoryFormProps {
  category?: Category | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface CategoryFormData {
  name: string;
  description?: string;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
    },
  });

  const onSubmit = async (data: CategoryFormData) => {
    setLoading(true);
    try {
      if (isEditing) {
        await categoryService.update(category._id, data);
      } else {
        await categoryService.create(data);
      }
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save category';
      setError('root', { message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Category Name"
        placeholder="Enter category name"
        {...register('name', {
          required: 'Category name is required',
          minLength: { value: 2, message: 'Name must be at least 2 characters' },
        })}
        error={errors.name?.message}
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Description (Optional)
        </label>
        <textarea
          rows={3}
          placeholder="Enter category description..."
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
          {isEditing ? 'Update' : 'Create'} Category
        </Button>
      </div>
    </form>
  );
};