import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { expenseService } from '../../services/expenses';
import { uploadService } from '../../services/uploads';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { FileDropzone } from '../ui/FileDropzone';

interface ExpenseFormProps {
  budgetId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ExpenseFormData {
  amount: number;
  description: string;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  budgetId,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ExpenseFormData>();

  const handleFileSelect = async (file: File) => {
    setUploadError('');
    setUploadedFile(file);
    
    try {
      const response = await uploadService.uploadReceipt(file);
      setReceiptUrl(response.url);
    } catch (error: any) {
      setUploadError(error.response?.data?.message || 'Upload failed');
      setUploadedFile(null);
      setReceiptUrl('');
    }
  };

  const handleFileClear = () => {
    setUploadedFile(null);
    setReceiptUrl('');
    setUploadError('');
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setLoading(true);
    try {
      await expenseService.create({
        budgetId,
        amount: Number(data.amount),
        description: data.description,
        receiptUrl: receiptUrl || undefined,
      });
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create expense';
      setError('root', { message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Amount"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="0.00"
        {...register('amount', {
          required: 'Amount is required',
          min: { value: 0.01, message: 'Amount must be greater than 0' },
        })}
        error={errors.amount?.message}
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          rows={3}
          placeholder="Enter expense description..."
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          {...register('description', {
            required: 'Description is required',
            minLength: { value: 3, message: 'Description must be at least 3 characters' },
          })}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Receipt (Optional)
        </label>
        <FileDropzone
          onFileSelect={handleFileSelect}
          value={uploadedFile}
          onClear={handleFileClear}
          error={uploadError}
        />
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
          Create Expense
        </Button>
      </div>
    </form>
  );
};