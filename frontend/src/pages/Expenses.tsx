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
import { MobileCardItem } from '../components/ui/MobileCard';

export const Expenses: React.FC = () => {
  const { user } = useAuth();
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]); // Store all expenses
  const [expenses, setExpenses] = useState<Expense[]>([]); // Filtered expenses for display
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
  }, []);

  // Client-side filtering effect
  useEffect(() => {
    applyFilters();
  }, [selectedBudget, selectedStatus, searchTerm, allExpenses]);

  const applyFilters = () => {
    let filtered = [...allExpenses];

    // Budget filter
    if (selectedBudget) {
      filtered = filtered.filter(expense => expense.budgetId?._id === selectedBudget);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(expense => expense.status === selectedStatus);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(search) ||
        expense.budgetId?.name?.toLowerCase().includes(search) ||
        expense.budgetId?.departmentId?.name?.toLowerCase().includes(search) ||
        expense.userId?.name?.toLowerCase().includes(search)
      );
    }

    setExpenses(filtered);
    setPagination(prev => ({
      ...prev,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / prev.limit),
      page: 1
    }));
  };

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
      // Fetch all expenses without filters for client-side filtering
      const response: PaginatedResponse<Expense> = await expenseService.list({
        limit: 1000 // Get all expenses
      });
      setAllExpenses(response.data || []);
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative lg:col-span-2">
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
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
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
                  {expenses
                    .slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit)
                    .map((expense) => (
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
                            href={`${(import.meta as any).env.VITE_API_BASE_URL}${expense.receiptUrl}`}
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

              {/* Desktop Pagination */}
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
          </div>

          {/* Mobile Cards */}
          <div className="block md:hidden space-y-4">
            {expenses
              .slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit)
              .map((expense) => (
              <MobileCardItem key={expense._id}>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {expense.description}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(expense.createdAt)} • {expense.userId?.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Tag variant={getStatusColor(expense.status)} size="sm">
                        {expense.status}
                      </Tag>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">Budget:</span>
                      <span>{expense.budgetId?.name}</span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">Department:</span>
                      <span>{expense.budgetId?.departmentId?.name}</span>
                    </div>
                    {expense.approvedBy && (
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{expense.status === 'APPROVED' ? 'Approved' : 'Rejected'} by:</span>
                        <span>{expense.approvedBy.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {expense.status === 'PENDING' && 
                       expense.userId?._id === user?._id && (
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      )}
                    </div>
                    
                    {expense.receiptUrl ? (
                      <a
                        href={`${(import.meta as any).env.VITE_API_BASE_URL}${expense.receiptUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Receipt
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">No receipt</span>
                    )}
                  </div>
                </div>
              </MobileCardItem>
            ))}

            {/* Mobile Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
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
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Expense Form Modal */}
      <Modal
        isOpen={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
        title="Add New Expense"
        size="lg"
      >
        <ExpenseForm
          budgetId={selectedBudget || undefined}
          onSuccess={handleExpenseCreated}
          onCancel={() => setShowExpenseForm(false)}
        />
      </Modal>
    </div>
  );
};