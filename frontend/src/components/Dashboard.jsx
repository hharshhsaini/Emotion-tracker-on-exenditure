import { Lightbulb, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function Dashboard({ data, onReset }) {
  // Prepare chart data - group by date and mark anomalies
  const chartData = data.transactions.map((t) => ({
    date: t.Date,
    amount: Math.abs(t.Amount),
    isAnomaly: t.is_anomaly,
    description: t.Description,
  }));

  return (
    <div className="space-y-6">
      {/* AI Insight Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              AI Emotional Insight
            </h3>
            <p className="text-amber-800 leading-relaxed">{data.insight}</p>
          </div>
        </div>
      </div>

      {/* Daily Spending Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Spending</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.slice(5)}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
              <Tooltip
                formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isAnomaly ? '#ef4444' : '#6366f1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded" />
            <span className="text-gray-600">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-gray-600">Anomaly (Emotional Spending)</span>
          </div>
        </div>
      </div>

      {/* Anomalies Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-800">
            Flagged Transactions ({data.anomalies.length})
          </h3>
        </div>
        {data.anomalies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.anomalies.map((t, index) => (
                  <tr key={index} className="bg-red-50 hover:bg-red-100 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">{t.Date}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {t.Description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.Category}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                      ${Math.abs(t.Amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No anomalies detected. Your spending looks healthy!
          </div>
        )}
      </div>

      {/* Reset Button */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Analyze Another Statement
        </button>
      </div>
    </div>
  );
}
