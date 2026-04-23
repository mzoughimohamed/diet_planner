// frontend/src/pages/Dashboard.tsx
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getMealPlans, getMealPlan } from '../lib/api'
import CalorieRing from '../components/CalorieRing'
import MacroBar from '../components/MacroBar'
import type { MealPlanEntry } from '../lib/types'

export default function Dashboard() {
  const { user } = useAuth()
  const today = new Date()
  const dayOfWeek = (today.getDay() + 6) % 7  // 0=Mon

  const { data: plans = [] } = useQuery({ queryKey: ['meal-plans'], queryFn: getMealPlans })

  const activePlan = plans.find((p) => {
    const start = new Date(p.week_start_date + 'T00:00:00')
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return today >= start && today <= end
  })

  const { data: planDetail } = useQuery({
    queryKey: ['meal-plan', activePlan?.id],
    queryFn: () => getMealPlan(activePlan!.id),
    enabled: !!activePlan,
  })

  const todayEntries: MealPlanEntry[] = planDetail?.entries.filter((e) => e.day_of_week === dayOfWeek) ?? []

  const todayCalories = todayEntries.reduce((sum, e) => sum + (e.calories_override ?? 0), 0)

  const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Good {today.getHours() < 12 ? 'morning' : today.getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name}!</h1>
        <p className="text-gray-500 text-sm mt-1">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Today's Calories</h2>
          <CalorieRing eaten={todayCalories} target={user?.daily_calorie_target ?? 2000} />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Macros Today</h2>
          <MacroBar protein={0} carbs={0} fat={0} />
          <p className="text-xs text-gray-400 mt-3">Macro breakdown available when meals have recipe nutrition data.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Today's Meals</h2>
        {activePlan ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MEAL_TYPES.map((type) => {
              const entry = todayEntries.find((e) => e.meal_type === type)
              return (
                <div key={type} className="rounded-xl border p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{type}</p>
                  {entry ? (
                    <p className="text-sm font-medium text-gray-800">{entry.custom_meal_name ?? `Recipe #${entry.recipe_id}`}</p>
                  ) : (
                    <p className="text-sm text-gray-300 italic">Not planned</p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No meal plan for this week. <a href="/meal-planner" className="text-brand-600 underline">Create one</a>.</p>
        )}
      </div>
    </div>
  )
}
