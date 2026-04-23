import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { register } from '../lib/api'
import type { RegisterPayload } from '../lib/api'

type StringFormKeys = 'email' | 'password' | 'name' | 'age' | 'height_cm' | 'weight_kg'

export default function Register() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    email: '', password: '', name: '',
    age: '', gender: '', height_cm: '', weight_kg: '',
    goal: 'maintain', activity_level: 'moderate',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload: RegisterPayload = {
        ...form,
        age: form.age.trim() !== '' ? Number(form.age) : undefined,
        height_cm: form.height_cm.trim() !== '' ? Number(form.height_cm) : undefined,
        weight_kg: form.weight_kg.trim() !== '' ? Number(form.weight_kg) : undefined,
      }
      const user = await register(payload)
      queryClient.setQueryData(['me'], user)
      navigate('/')
    } catch (err) {
      console.error('[register]', err)
      setError('Registration failed. Email may already be in use.')
    } finally {
      setLoading(false)
    }
  }

  const field = (label: string, key: StringFormKeys, type = 'text', required = false) => (
    <div>
      <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <input
        id={key} type={type} required={required} value={form[key]}
        onChange={set(key)}
        autoComplete={type === 'password' ? 'new-password' : undefined}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">Set up your diet profile</p>
        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {field('Name', 'name', 'text', true)}
          {field('Email', 'email', 'email', true)}
          {field('Password', 'password', 'password', true)}
          <div className="grid grid-cols-2 gap-4">
            {field('Age', 'age', 'number')}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select id="gender" value={form.gender} onChange={set('gender')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('Height (cm)', 'height_cm', 'number')}
            {field('Weight (kg)', 'weight_kg', 'number')}
          </div>
          <div>
            <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
            <select id="goal" value={form.goal} onChange={set('goal')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="lose">Lose weight</option>
              <option value="maintain">Maintain weight</option>
              <option value="gain">Gain weight</option>
            </select>
          </div>
          <div>
            <label htmlFor="activity_level" className="block text-sm font-medium text-gray-700 mb-1">Activity level</label>
            <select id="activity_level" value={form.activity_level} onChange={set('activity_level')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="sedentary">Sedentary</option>
              <option value="light">Lightly active</option>
              <option value="moderate">Moderately active</option>
              <option value="active">Active</option>
              <option value="very_active">Very active</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-60">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Have an account? <Link to="/login" className="text-brand-600 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
