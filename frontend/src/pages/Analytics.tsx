import React, { useEffect, useState } from 'react';
import { Calendar, TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import { analyticsService } from '../services/analytics';
import { OverviewData, TrendData, BreakdownData } from '../types';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency } from '../utils/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts';

export const Analytics: React.FC = () => {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [trendsData, setTrendsData] = useState<TrendData | null>(null);
  const [departmentData, setDepartmentData] = useState<BreakdownData[]>([]);
  const [categoryData, setCategoryData] = useState<BreakdownData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [overview, trends, departments, categories] = await Promise.all([
        analyticsService.overview({ period: selectedPeriod }),
        analyticsService.trends(),
        analyticsService.byDepartment(),
        analyticsService.byCategory(),
      ]);

      setOverviewData(overview);
      setTrendsData(trends);
      setDepartmentData(departments);
      setCategoryData(categories);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const periodOptions = [
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Insights into your budget performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            options={periodOptions}
          />
        </div>
      </div>

      {/* Overview Cards */}
      {overviewData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Budgets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overviewData.totalBudgets}
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
                  {formatCurrency(overviewData.totalAllocated)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <PieChart className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(overviewData.totalSpent)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(overviewData.totalRemaining)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Spending Trends */}
      {trendsData && trendsData.series.length > 0 && (
        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Spending Trends</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData.series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Spent']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="spent" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      )}

      {/* Department and Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        {departmentData.length > 0 && (
          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">By Department</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="departmentName" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value), 
                        name === 'allocated' ? 'Allocated' : 'Spent'
                      ]}
                    />
                    <Bar dataKey="allocated" fill="#10B981" name="allocated" />
                    <Bar dataKey="spent" fill="#EF4444" name="spent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        )}

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">By Category</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="spent"
                      nameKey="categoryName"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {categoryData.map((item, index) => (
                  <div key={item.categoryId} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600 truncate">
                      {item.categoryName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Summary Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {departmentData.length > 0 && (
          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Department Summary</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Allocated
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Spent
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Usage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {departmentData.map((dept) => {
                      const usage = dept.allocated > 0 ? (dept.spent / dept.allocated) * 100 : 0;
                      return (
                        <tr key={dept.departmentId}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {dept.departmentName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatCurrency(dept.allocated)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatCurrency(dept.spent)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {usage.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {categoryData.length > 0 && (
          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Category Summary</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Allocated
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Spent
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Usage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categoryData.map((cat) => {
                      const usage = cat.allocated > 0 ? (cat.spent / cat.allocated) * 100 : 0;
                      return (
                        <tr key={cat.categoryId}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {cat.categoryName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatCurrency(cat.allocated)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatCurrency(cat.spent)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {usage.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};