import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Receipt, Calendar, User, Building2, Tag as TagIcon } from 'lucide-react';
import { budgetService } from '../services/budgets';
import { expenseService } from '../services/expenses';
import { useAuth } from '../context/AuthContext';
import { Budget, Expense, PaginatedResponse } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tag } from '../components/ui/Tag';
import { Spinner } from '../components/ui/Spinner';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { ExpenseForm } from '../components/expenses/ExpenseForm';
import { formatCurrency, formatDate } from '../utils/format';

export const BudgetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (id) {
      loadBudget();
      loadExpenses();
    }
  }, [id, pagination.page]);

  const loadBudget = async () => {
    try {
      const budgetData = await budgetService.get(id!);
      setBudget(budgetData);
    } catch (error) {
      console.error('Failed to load budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    setExpensesLoading(true);
    try {
      const response: PaginatedResponse<Expense> = await expenseService.list({
        budgetId: id,
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
      console.error('Failed to load expenses:', error);
    } finally {
      setExpensesLoading(false);
    }
  };

  const handleExpenseCreated = () => {
    setShowExpenseForm(false);
    loadBudget();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Budget not found</p>
        <Link to="/budgets">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Budgets
          </Button>
        </Link>
      </div>
    );
  }

  const spentPercentage = (budget.spent / budget.amount) * 100;
  const getProgressColor = (percentage: number): string => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/budgets">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{budget.name}</h1>
            <p className="text-gray-600">Budget Details</p>
          </div>
        </div>
        <Button onClick={() => setShowExpenseForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Budget Overview</h2>
                <Tag variant={budget.status === 'ACTIVE' ? 'success' : 'default'}>
                  {budget.status}
                </Tag>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Allocated</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(budget.amount)}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Spent</p>
                  <p className="text-2xl font-bold text-red-900">
                    {formatCurrency(budget.spent)}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Remaining</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(budget.remaining)}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-gray-600">{spentPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(spentPercentage)}`}
                    style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Details</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium">{budget.departmentId?.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <TagIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium">{budget.categoryId?.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Owner</p>
                    <p className="font-medium">{budget.ownerId?.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Period</p>
                    <p className="font-medium">{budget.period}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium">
                      {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Expenses Table */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
            <p className="text-sm text-gray-600">
              {pagination.total} total expenses
            </p>
          </div>

          {expensesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No expenses found for this budget</p>
              <Button onClick={() => setShowExpenseForm(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add First Expense
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Receipt</TableHead>
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
                              Approved by {expense.approvedBy.name}
                            </p>
                          )}
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
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View Receipt
                          </a>
                        ) : (
                          <span className="text-gray-400">No receipt</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center space-x-2 pt-4">
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
            </>
          )}
        </div>
      </Card>

      {/* Expense Form Modal */}
      <Modal
        isOpen={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
        title="Add New Expense"
        size="lg"
      >
        <ExpenseForm
          budgetId={budget._id}
          onSuccess={handleExpenseCreated}
          onCancel={() => setShowExpenseForm(false)}
        />
      </Modal>
    </div>
  );
};