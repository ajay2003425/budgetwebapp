import React, { useState } from 'react';
import { User, Lock, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/users';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Tag } from '../components/ui/Tag';
import { useForm } from 'react-hook-form';
import { formatDate, getInitials } from '../utils/format';

interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    setError: setProfileError,
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    setError: setPasswordError,
    reset: resetPasswordForm,
    watch,
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      const updatedUser = await userService.update(user._id, data);
      updateUser(updatedUser);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      setProfileError('root', { message: errorMessage });
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!user) return;
    
    setPasswordLoading(true);
    try {
      await userService.changePassword(user._id, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      resetPasswordForm();
      setShowPasswordForm(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      setPasswordError('root', { message: errorMessage });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleColor = (role: string): 'success' | 'info' | 'default' => {
    switch (role) {
      case 'ADMIN': return 'success';
      case 'MANAGER': return 'info';
      default: return 'default';
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card>
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-medium mx-auto">
              {getInitials(user.name)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              <p className="text-gray-600">{user.email}</p>
            </div>
            <div className="flex justify-center">
              <Tag variant={getRoleColor(user.role)}>
                {user.role}
              </Tag>
            </div>
            <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
              <p>Member since {formatDate(user.createdAt)}</p>
            </div>
          </div>
        </Card>

        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h2>
                <User className="w-5 h-5 text-gray-400" />
              </div>

              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  {...registerProfile('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                  error={profileErrors.name?.message}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email address"
                  {...registerProfile('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  error={profileErrors.email?.message}
                />

                {profileErrors.root && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{profileErrors.root.message}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" loading={profileLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </Card>

          {/* Password Section */}
          <Card>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Password</h2>
                  <p className="text-sm text-gray-600">Change your account password</p>
                </div>
                <Lock className="w-5 h-5 text-gray-400" />
              </div>

              {!showPasswordForm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordForm(true)}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              ) : (
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="Enter your current password"
                    {...registerPassword('currentPassword', {
                      required: 'Current password is required',
                    })}
                    error={passwordErrors.currentPassword?.message}
                  />

                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Enter your new password"
                    {...registerPassword('newPassword', {
                      required: 'New password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' },
                    })}
                    error={passwordErrors.newPassword?.message}
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Confirm your new password"
                    {...registerPassword('confirmPassword', {
                      required: 'Please confirm your new password',
                      validate: (value) =>
                        value === newPassword || 'Passwords do not match',
                    })}
                    error={passwordErrors.confirmPassword?.message}
                  />

                  {passwordErrors.root && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{passwordErrors.root.message}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        resetPasswordForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" loading={passwordLoading}>
                      Update Password
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};