import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { updateMe } from '../lib/api'

export default function Profile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '', age: '', gender: '', height_cm: '', weight_kg: '',
    goal: 'maintain', activity_level: 'moderate',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        age: user.age ? String(user.age) : '',
        gender: user.gender ?? '',
        height_cm: user.height_cm ? String(user.height_cm) : '',
        weight_kg: user.weight_kg ? String(user.weight_kg) : '',
        goal: user.goal,
        activity_level: user.activity_level,
      })
    }
  }, [user])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const saveMutation = useMutation({
    mutationFn: () => updateMe({
      name: form.name,
      age: form.age.trim() !== '' ? Number(form.age) : null,
      gender: form.gender || null,
      height_cm: form.height_cm.trim() !== '' ? Number(form.height_cm) : null,
      weight_kg: form.weight_kg.trim() !== '' ? Number(form.weight_kg) : null,
      goal: form.goal,
      activity_level: form.activity_level,
    }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['me'], updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      {saved && <p className="text-sm text-brand-600 bg-brand-50 rounded-lg px-3 py-2">Profile saved!</p>}

      <div className="bg-white rounded-2xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={form.name} onChange={set('name')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <p className="text-sm text-gray-500">Email: {user?.email}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input type="number" value={form.age} onChange={set('age')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select value={form.gender} onChange={set('gender')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input type="number" value={form.height_cm} onChange={set('height_cm')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input type="number" step="0.1" value={form.weight_kg} onChange={set('weight_kg')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
          <select value={form.goal} onChange={set('goal')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="lose">Lose weight</option>
            <option value="maintain">Maintain weight</option>
            <option value="gain">Gain weight</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Activity level</label>
          <select value={form.activity_level} onChange={set('activity_level')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="sedentary">Sedentary</option>
            <option value="light">Lightly active</option>
            <option value="moderate">Moderately active</option>
            <option value="active">Active</option>
            <option value="very_active">Very active</option>
          </select>
        </div>
        <div className="pt-2 border-t">
          <p className="text-sm text-gray-500">Calorie target: <strong className="text-brand-600">{user?.daily_calorie_target} kcal/day</strong> (recalculated on save)</p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full bg-brand-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
