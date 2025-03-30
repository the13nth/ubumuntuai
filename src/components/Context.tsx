import { Card, CardContent } from "./ui/card"
import { IconPlus, IconActivity, IconBriefcase, IconCar, IconCheck } from "@tabler/icons-react"
import { useState } from "react"

interface TodoItem {
  id: string;
  time: string;
  task: string;
  completed: boolean;
}

interface ContextData {
  id: string;
  name: string;
  icon: React.ReactNode;
  apps: string[];
  active?: boolean;
  dailyPlan?: TodoItem[];
}

const mockContexts: ContextData[] = [
  {
    id: 'health',
    name: 'Health: Diabetes',
    icon: <IconActivity className="text-emerald-500" size={24} />,
    apps: ['Blood Sugar Monitor', 'Meal Planner', 'Exercise Tracker', 'Medication Reminder'],
    active: true,
    dailyPlan: [
      { id: '1', time: '8:00 AM', task: 'Check blood sugar', completed: true },
      { id: '2', time: '8:30 AM', task: 'Take morning medication', completed: true },
      { id: '3', time: '12:30 PM', task: 'Pre-lunch blood sugar check', completed: false },
      { id: '4', time: '1:00 PM', task: 'Lunch + medication', completed: false },
      { id: '5', time: '4:00 PM', task: 'Afternoon walk (30 mins)', completed: false },
      { id: '6', time: '6:00 PM', task: 'Evening blood sugar check', completed: false },
      { id: '7', time: '7:00 PM', task: 'Dinner + medication', completed: false },
    ]
  },
  {
    id: 'work',
    name: 'Work',
    icon: <IconBriefcase className="text-blue-500" size={24} />,
    apps: ['Calendar', 'Task Manager', 'Email Dashboard', 'Meeting Notes'],
    active: false
  },
  {
    id: 'commute',
    name: 'Commute',
    icon: <IconCar className="text-amber-500" size={24} />,
    apps: ['Traffic Monitor', 'Weather', 'Transit Times', 'Fuel Tracker'],
    active: false
  }
];

export function Context() {
  const [contexts, setContexts] = useState(mockContexts);
  const [showDailyPlan, setShowDailyPlan] = useState(false);
  const [selectedContext, setSelectedContext] = useState<ContextData | null>(null);

  const toggleContextActive = (contextId: string) => {
    setContexts(prevContexts => 
      prevContexts.map(context => 
        context.id === contextId 
          ? { ...context, active: !context.active }
          : context
      )
    );
  };

  const toggleTodoCompleted = (contextId: string, todoId: string) => {
    setContexts(prevContexts =>
      prevContexts.map(context =>
        context.id === contextId
          ? {
              ...context,
              dailyPlan: context.dailyPlan?.map(todo =>
                todo.id === todoId
                  ? { ...todo, completed: !todo.completed }
                  : todo
              )
            }
          : context
      )
    );
  };

  const handleViewNextStep = (context: ContextData) => {
    setSelectedContext(context);
    setShowDailyPlan(true);
  };

  return (
    <div className="min-h-screen bg-black p-3 sm:p-6 flex flex-col pb-24">
      <div className="w-full max-w-2xl mx-auto space-y-3 sm:space-y-4">
        {contexts.map((context) => (
          <Card 
            key={context.id} 
            className={`bg-zinc-900 border-zinc-800 transition-colors ${
              context.active ? 'border-l-4 border-l-emerald-500' : ''
            }`}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                {context.icon}
                <h3 className="text-base sm:text-lg font-medium text-zinc-100 truncate">
                  {context.name}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {context.apps.map((app) => (
                  <div 
                    key={app}
                    className="bg-zinc-800 text-zinc-300 px-3 py-2 rounded text-sm truncate"
                  >
                    {app}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:justify-end sm:items-center">
                {context.id === 'health' && (
                  <button 
                    onClick={() => handleViewNextStep(context)}
                    className="w-full sm:w-auto text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors order-1 sm:order-none"
                  >
                    View Next Step
                  </button>
                )}
                <button 
                  onClick={() => toggleContextActive(context.id)}
                  className={`w-full sm:w-auto text-sm px-4 py-2 rounded-lg transition-colors ${
                    context.active 
                      ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600' 
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {context.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 sm:p-6">
            <button className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-3 px-4 rounded-lg transition-colors">
              <IconPlus size={20} />
              <span className="text-sm font-medium">Add Context</span>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Daily Plan Modal */}
      {showDailyPlan && selectedContext && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-medium text-zinc-100">Daily Plan - {selectedContext.name}</h3>
              <button 
                onClick={() => setShowDailyPlan(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {selectedContext.dailyPlan?.map((todo) => (
                <div 
                  key={todo.id}
                  onClick={() => toggleTodoCompleted(selectedContext.id, todo.id)}
                  className={`flex items-start gap-3 py-3 px-3 border-b border-zinc-800 last:border-0 rounded-lg cursor-pointer transition-colors ${
                    todo.completed ? 'bg-zinc-800/50' : 'hover:bg-zinc-800/30'
                  }`}
                >
                  <div
                    className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                      todo.completed 
                        ? 'bg-emerald-600 border-emerald-600' 
                        : 'border-zinc-600'
                    }`}
                  >
                    {todo.completed && <IconCheck size={14} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-zinc-400">{todo.time}</div>
                    <div className="text-sm text-zinc-200">
                      {todo.task}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => setShowDailyPlan(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Save is automatic since we're using state
                  setShowDailyPlan(false);
                }}
                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 