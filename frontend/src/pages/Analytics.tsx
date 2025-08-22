import React, { useEffect, useState } from 'react';
import { Calendar, TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import { analyticsService } from '../services/analytics';
import { OverviewData, TrendData, BreakdownData } from '../types';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency } from '../utils/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar, Pie, Legend } from 'recharts';

export const Analytics: React.FC = () => {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [trendsData, setTrendsData] = useState<TrendData | null>(null);
  const [departmentData, setDepartmentData] = useState<BreakdownData[]>([]);
  const [categoryData, setCategoryData] = useState<BreakdownData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overview, trends, departments, categories] = await Promise.all([
        analyticsService.overview({ period: selectedPeriod }),
        analyticsService.trends(),
        analyticsService.byDepartment(),
        analyticsService.byCategory(),
      ]);

      console.log('Department data received:', departments);
      console.log('Category data received:', categories);

      setOverviewData(overview);
      setTrendsData(trends);
      
      // Process department data to ensure proper structure
      const processedDepartments = (departments || []).map((dept: any) => ({
        ...dept,
        allocated: dept.allocated || 0,
        spent: dept.spent || 0,
        departmentName: dept.departmentName || 'Unknown Department'
      }));
      
      // Process category data to ensure proper structure
      const processedCategories = (categories || []).map((cat: any) => ({
        ...cat,
        allocated: cat.allocated || 0,
        spent: cat.spent || 0,
        categoryName: cat.categoryName || 'Unknown Category'
      }));
      
      console.log('Processed department data:', processedDepartments);
      console.log('Processed category data:', processedCategories);
      
      setDepartmentData(processedDepartments);
      setCategoryData(processedCategories);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      setError('Failed to load analytics data. Please try again later.');
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

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <BarChart3 className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
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
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-blue-100">
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

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-green-100">
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

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-red-100">
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

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-yellow-100">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(overviewData.totalRemaining)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {overviewData.totalAllocated > 0 
                    ? `${((overviewData.totalRemaining / overviewData.totalAllocated) * 100).toFixed(1)}% left`
                    : '0% left'
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Spending Trends */}
      {trendsData && trendsData.series && trendsData.series.length > 0 ? (
        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Spending Trends</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData.series} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Spent']}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return `Date: ${date.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}`;
                    }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="spent" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-center h-80">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Trend Data</h3>
              <p className="text-gray-600">Spending trends will appear here when data is available.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Department and Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        {departmentData && departmentData.length > 0 ? (
          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">By Department</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="departmentName" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value), 
                        name === 'allocated' ? 'Allocated Budget' : 'Amount Spent'
                      ]}
                      labelFormatter={(label) => `Department: ${label}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend 
                      formatter={(value) => value === 'allocated' ? 'Allocated Budget' : 'Amount Spent'}
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                    <Bar 
                      dataKey="allocated" 
                      fill="#10B981" 
                      name="allocated" 
                      radius={[4, 4, 0, 0]}
                      minPointSize={5}
                    />
                    <Bar 
                      dataKey="spent" 
                      fill="#EF4444" 
                      name="spent" 
                      radius={[4, 4, 0, 0]}
                      minPointSize={5}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Department Data</h3>
                <p className="text-gray-600">Department breakdown will appear here when data is available.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Category Breakdown */}
        {categoryData && categoryData.length > 0 ? (
          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">By Category</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      innerRadius={30}
                      dataKey="spent"
                      nameKey="categoryName"
                      label={({categoryName, percent}) => `${categoryName}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                {categoryData.map((item, index) => (
                  <div key={item.categoryId || index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {item.categoryName || 'Unknown'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {formatCurrency(item.spent)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Category Data</h3>
                <p className="text-gray-600">Category breakdown will appear here when data is available.</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Summary Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {departmentData && departmentData.length > 0 ? (
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
                    {departmentData.map((dept, index) => {
                      const usage = dept.allocated > 0 ? (dept.spent / dept.allocated) * 100 : 0;
                      return (
                        <tr key={dept.departmentId || `dept-${index}`}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {dept.departmentName || 'Unknown Department'}
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
        ) : (
          <Card>
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Department Summary</h3>
                <p className="text-gray-600">Department summary will appear here when data is available.</p>
              </div>
            </div>
          </Card>
        )}

        {categoryData && categoryData.length > 0 ? (
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
                    {categoryData.map((cat, index) => {
                      const usage = cat.allocated > 0 ? (cat.spent / cat.allocated) * 100 : 0;
                      return (
                        <tr key={cat.categoryId || `cat-${index}`}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {cat.categoryName || 'Unknown Category'}
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
        ) : (
          <Card>
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Category Summary</h3>
                <p className="text-gray-600">Category summary will appear here when data is available.</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};