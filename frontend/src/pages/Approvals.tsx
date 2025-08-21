import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { approvalService } from '../services/approvals';
import { Expense, PaginatedResponse } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tag } from '../components/ui/Tag';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDate } from '../utils/format';

export const Approvals: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadApprovals();
  }, [pagination.page]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const response: PaginatedResponse<Expense> = await approvalService.list({
        page: pagination.page,
        limit: pagination.limit,
      });
      setExpenses(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages,
      }));
    } catch (error) {
      console.error('Failed to load approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (expenseId: string) => {
    setActionLoading(expenseId);
    try {
      await approvalService.approve(expenseId);
      loadApprovals();
    } catch (error) {
      console.error('Failed to approve expense:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedExpense) return;
    
    setActionLoading(selectedExpense._id);
    try {
      await approvalService.reject(selectedExpense._id, rejectReason);
      setShowRejectModal(false);
      setSelectedExpense(null);
      setRejectReason('');
      loadApprovals();
    } catch (error) {
      console.error('Failed to reject expense:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedExpense(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="text-gray-600">Review and approve pending expenses</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {pagination.total}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  expenses.reduce((sum, expense) => sum + expense.amount, 0)
                )}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {expenses.length > 0 
                  ? formatCurrency(
                      expenses.reduce((sum, expense) => sum + expense.amount, 0) / expenses.length
                    )
                  : formatCurrency(0)
                }
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Approvals Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="w-12 h-12 text-gray-400" />}
          title="No pending approvals"
          description="All expenses have been reviewed. Great job!"
        />
      ) : (
        <Card padding={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense._id}>
                  <TableCell>
                    {formatDate(expense.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{expense.userId?.name}</p>
                      <p className="text-xs text-gray-500">{expense.userId?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{expense.budgetId?.name}</p>
                      <p className="text-xs text-gray-500">
                        {expense.budgetId?.departmentId?.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-xs truncate" title={expense.description}>
                      {expense.description}
                    </p>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    {expense.receiptUrl ? (
                      <a
                        href={`${import.meta.env.VITE_API_BASE_URL}${expense.receiptUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Receipt
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">No receipt</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApprove(expense._id)}
                        loading={actionLoading === expense._id}
                        disabled={actionLoading !== null}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openRejectModal(expense)}
                        disabled={actionLoading !== null}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
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

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={closeRejectModal}
        title="Reject Expense"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to reject this expense? You can optionally provide a reason.
          </p>
          
          {selectedExpense && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">{selectedExpense.description}</p>
              <p className="text-sm text-gray-600">
                {formatCurrency(selectedExpense.amount)} • {selectedExpense.userId?.name}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Reason (Optional)
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={closeRejectModal}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={actionLoading === selectedExpense?._id}
            >
              Reject Expense
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};