import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authService } from '../../services/auth';
import { userService } from '../../services/users';
import { useAuth } from '../../context/AuthContext';
import { User, Department } from '../../types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface UserFormProps {
  user?: User | null;
  departments: Department[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: string;
  departmentId?: string;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  departments,
  onSuccess,
  onCancel,
}) => {
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<UserFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'USER',
      departmentId: user?.departmentId || '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    try {
      if (isEditing) {
        const updateData: any = {
          name: data.name,
          email: data.email,
        };
        
        if (hasRole('ADMIN')) {
          updateData.role = data.role;
          updateData.departmentId = data.departmentId || undefined;
        }
        
        await userService.update(user._id, updateData);
      } else {
        await authService.register({
          name: data.name,
          email: data.email,
          password: data.password!,
          role: data.role,
          departmentId: data.departmentId || undefined,
        });
      }
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save user';
      setError('root', { message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'USER', label: 'User' },
    { value: 'MANAGER', label: 'Manager' },
    ...(hasRole('ADMIN') ? [{ value: 'ADMIN', label: 'Admin' }] : []),
  ];

  const departmentOptions = [
    { value: '', label: 'No Department' },
    ...departments.map(dept => ({ value: dept._id, label: dept.name }))
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Full Name"
        placeholder="Enter full name"
        {...register('name', {
          required: 'Name is required',
          minLength: { value: 2, message: 'Name must be at least 2 characters' },
        })}
        error={errors.name?.message}
      />

      <Input
        label="Email Address"
        type="email"
        placeholder="Enter email address"
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address',
          },
        })}
        error={errors.email?.message}
      />

      {!isEditing && (
        <Input
          label="Password"
          type="password"
          placeholder="Enter password"
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
          })}
          error={errors.password?.message}
        />
      )}

      {hasRole('ADMIN') && (
        <Select
          label="Role"
          value={selectedRole}
          {...register('role', { required: 'Role is required' })}
          options={roleOptions}
          error={errors.role?.message}
        />
      )}

      {(selectedRole === 'MANAGER' || selectedRole === 'USER') && (
        <Select
          label="Department"
          {...register('departmentId')}
          options={departmentOptions}
          error={errors.departmentId?.message}
        />
      )}

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
          {isEditing ? 'Update' : 'Create'} User
        </Button>
      </div>
    </form>
  );
};