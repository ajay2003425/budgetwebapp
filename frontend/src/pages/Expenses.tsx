import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Receipt, Eye } from 'lucide-react';
import { expenseService } from '../services/expenses';
import { budgetService } from '../services/budgets';
import { useAuth } from '../context/AuthContext';
import { Expense, Budget, PaginatedResponse } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Tag } from '../components/ui/Tag';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { ExpenseForm } from '../components/expenses/ExpenseForm';
import { formatCurrency, formatDate } from '../utils/format';

export const Expenses: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadBudgets();
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [selectedBudget, selectedStatus, searchTerm, pagination.page]);

  const loadBudgets = async () => {
    try {
      const response = await budgetService.list({ limit: 100 });
      setBudgets(response.data || []);
    } catch (error) {
      console.error('Failed to load budgets:', error);
    }
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (selectedBudget) params.budgetId = selectedBudget;
      if (selectedStatus) params.status = selectedStatus;
      if (searchTerm) params.search = searchTerm;

      const response: PaginatedResponse<Expense> = await expenseService.list(params);
      setExpenses(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages,
      }));
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseCreated = () => {
    setShowExpenseForm(false);
    loadExpenses();
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'danger';
      default: return 'default';
    }
  };

  const budgetOptions = [
    { value: '', label: 'All Budgets' },
    ...budgets.map(budget => ({ 
      value: budget._id, 
      label: `${budget.name} (${budget.departmentId?.name})` 
    }))
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Track and manage your expenses</p>
        </div>
        <Button onClick={() => setShowExpenseForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={selectedBudget}
            onChange={(e) => setSelectedBudget(e.target.value)}
            options={budgetOptions}
          />

          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={statusOptions}
          />

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setSelectedBudget('');
            setSelectedStatus('');
            setPagination(prev => ({ ...prev, page: 1 }));
          }}>
            <Filter className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </Card>

      {/* Expenses Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-12 h-12 text-gray-400" />}
          title="No expenses found"
          description="Get started by adding your first expense."
          action={{
            label: 'Add Expense',
            onClick: () => setShowExpenseForm(true)
          }}
        />
      ) : (
        <Card padding={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
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
                      <p className="font-medium">{expense.description}</p>
                      {expense.approvedBy && (
                        <p className="text-xs text-gray-500">
                          {expense.status === 'APPROVED' ? 'Approved' : 'Rejected'} by {expense.approvedBy.name}
                        </p>
                      )}
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
                  <TableCell>{expense.userId?.name}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    <Tag variant={getStatusColor(expense.status)}>
                      {expense.status}
                    </Tag>
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
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {expense.status === 'PENDING' && 
                       expense.userId?._id === user?._id && (
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
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
      )}

      {/* Expense Form Modal */}
      <Modal
        isOpen={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
        title="Add New Expense"
        size="lg"
      >
        <ExpenseForm
          budgetId={selectedBudget || budgets[0]?._id || ''}
          onSuccess={handleExpenseCreated}
          onCancel={() => setShowExpenseForm(false)}
        />
      </Modal>
    </div>
  );
};