import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getProgress, logProgress, deleteProgress } from '../lib/api'
import { Trash2 } from 'lucide-react'

export default function Progress() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    logged_at: new Date().toISOString().split('T')[0],
    weight_kg: '',
    body_fat_pct: '',
    notes: '',
  })
  const [error, setError] = useState('')

  const { data: logs = [] } = useQuery({ queryKey: ['progress'], queryFn: getProgress })

  const logMutation = useMutation({
    mutationFn: () => logProgress({
      logged_at: form.logged_at,
      weight_kg: form.weight_kg.trim() !== '' ? Number(form.weight_kg) : null,
      body_fat_pct: form.body_fat_pct.trim() !== '' ? Number(form.body_fat_pct) : null,
      notes: form.notes || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] })
      setForm((f) => ({ ...f, weight_kg: '', body_fat_pct: '', notes: '' }))
      setError('')
    },
    onError: () => setError('Already logged for this date or an error occurred.'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProgress,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['progress'] }),
  })

  const chartData = [...logs]
    .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
    .filter((l) => l.weight_kg !== null)
    .map((l) => ({ date: l.logged_at, weight: l.weight_kg }))

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Progress</h1>

      {/* Log form */}
      <div className="bg-white rounded-2xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Log Today</h2>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={form.logged_at}
              onChange={(e) => setForm((f) => ({ ...f, logged_at: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input type="number" step="0.1" placeholder="75.0" value={form.weight_kg}
              onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body fat %</label>
            <input type="number" step="0.1" placeholder="18.0" value={form.body_fat_pct}
              onChange={(e) => setForm((f) => ({ ...f, body_fat_pct: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input type="text" placeholder="Optional…" value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
        <button onClick={() => logMutation.mutate()} disabled={logMutation.isPending}
          className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
          {logMutation.isPending ? 'Saving…' : 'Log Progress'}
        </button>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Weight Over Time</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log table */}
      {logs.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Weight</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Body Fat</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {[...logs].sort((a, b) => b.logged_at.localeCompare(a.logged_at)).map((log) => (
                <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{log.logged_at}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{log.weight_kg ? `${log.weight_kg} kg` : '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{log.body_fat_pct ? `${log.body_fat_pct}%` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{log.notes ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteMutation.mutate(log.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1 text-gray-300 hover:text-red-500 disabled:opacity-40"
                      aria-label="Delete log entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
