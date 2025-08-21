import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  Receipt, 
  CheckSquare, 
  TrendingUp,
  Plus,
  Users,
  Building2
} from 'lucide-react';
import { analyticsService } from '../services/analytics';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency } from '../utils/format';
import { OverviewData } from '../types';

export const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      const overview = await analyticsService.overview();
      setData(overview);
    } catch (error) {
      console.error('Failed to load overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Add Expense',
      description: 'Create a new expense entry',
      href: '/expenses?new=true',
      icon: Receipt,
      color: 'bg-blue-500',
      roles: ['ADMIN', 'MANAGER', 'USER'],
    },
    {
      title: 'Create Budget',
      description: 'Set up a new budget',
      href: '/budgets?new=true',
      icon: Wallet,
      color: 'bg-green-500',
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: 'Review Approvals',
      description: 'Approve pending expenses',
      href: '/approvals',
      icon: CheckSquare,
      color: 'bg-yellow-500',
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: 'Manage Users',
      description: 'Add or edit user accounts',
      href: '/users',
      icon: Users,
      color: 'bg-purple-500',
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: 'Manage Departments',
      description: 'Configure departments',
      href: '/departments',
      icon: Building2,
      color: 'bg-indigo-500',
      roles: ['ADMIN'],
    },
  ];

  const filteredActions = quickActions.filter(action =>
    hasRole(action.roles)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's an overview of your budgeting activities
        </p>
      </div>

      {/* Overview Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Budgets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.totalBudgets}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Allocated</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.totalAllocated)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <Receipt className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.totalSpent)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <CheckSquare className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.pendingApprovals}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActions.map((action) => (
          <Card key={action.title} className="hover:shadow-md transition-shadow duration-200">
            <Link to={action.href}>
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${action.color}`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-500">
            Recent activity will appear here once you start using the platform.
          </p>
          <Link to="/expenses">
            <Button className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Expense
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};