import { useEffect, useState } from 'react';
import { analyticsService, AnalyticsOverview } from '../services/analytics.service';

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const data = await analyticsService.getOverview(startDate, endDate);
      setOverview(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading analytics...</div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('7d')}
            className={`px-4 py-2 rounded ${
              dateRange === '7d' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setDateRange('30d')}
            className={`px-4 py-2 rounded ${
              dateRange === '30d' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setDateRange('90d')}
            className={`px-4 py-2 rounded ${
              dateRange === '90d' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tasks Overview */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Tasks</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total:</span>
              <span className="font-bold">{overview.tasks.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Completed:</span>
              <span className="font-bold text-green-400">{overview.tasks.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Failed:</span>
              <span className="font-bold text-red-400">{overview.tasks.failed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pending:</span>
              <span className="font-bold text-yellow-400">{overview.tasks.pending}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-400">Success Rate:</span>
                <span className="font-bold text-green-400">
                  {overview.tasks.completionRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Conversations Overview */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-purple-400">Conversations</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total:</span>
              <span className="font-bold">{overview.conversations.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Messages:</span>
              <span className="font-bold">
                {overview.conversations.avgMessagesPerConversation.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Agents Overview */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">Agents</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Executions:</span>
              <span className="font-bold">{overview.agents.totalExecutions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Most Used:</span>
              <span className="font-bold text-cyan-400">{overview.agents.mostUsedAgent}</span>
            </div>
          </div>
        </div>

        {/* Tools Overview */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-orange-400">Tools</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Calls:</span>
              <span className="font-bold">{overview.tools.totalCalls}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Most Used:</span>
              <span className="font-bold text-orange-400">{overview.tools.mostUsedTool}</span>
            </div>
          </div>
        </div>

        {/* Cost Tracking */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">Costs</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Cost:</span>
              <span className="font-bold">${overview.costs.totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg per Task:</span>
              <span className="font-bold">${overview.costs.avgCostPerTask.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Performance</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Task Duration:</span>
              <span className="font-bold">{overview.performance.avgTaskDuration.toFixed(2)}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Response Time:</span>
              <span className="font-bold">{overview.performance.avgResponseTime.toFixed(2)}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
