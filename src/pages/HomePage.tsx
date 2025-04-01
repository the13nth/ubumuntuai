import { getLatestConfig } from '../lib/db';
import { Responsive as ResponsiveGridLayout, Layouts } from 'react-grid-layout';
import { Card, CardContent } from "../components/ui/card";
import { IconPlus, IconActivity, IconBriefcase, IconCar, IconCheck, IconX } from "@tabler/icons-react";
import { useState } from "react";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { DashboardConfig } from '../agent';

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

interface ExtendedDashboardConfig extends DashboardConfig {
  configSource?: 'firebase' | 'gemini';
}

// interface AppConfig {
//   name: string;
//   [key: string]: any;
// }

// interface Config {
//   configSource: 'firebase' | 'gemini';
//   layouts: {
//     [key: string]: {
//       i: string;
//       x: number;
//       y: number;
//       w: number;
//       h: number;
//       static?: boolean;
//     }[];
//   };
//   cols: number;
//   rowHeight: number;
//   margin: [number, number];
//   apps: AppConfig[];
// }

interface DiabetesTracking {
  bloodSugar: string;
  medication: string;
  mealType: string;
  exerciseMinutes: string;
  notes: string;
  timestamp: Date;
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

export default function HomePage() {
  const config = getLatestConfig() as ExtendedDashboardConfig | null;
  const [contexts, setContexts] = useState(mockContexts);
  const [showDailyPlan, setShowDailyPlan] = useState(false);
  const [selectedContext, setSelectedContext] = useState<ContextData | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [trackingData, setTrackingData] = useState<DiabetesTracking>({
    bloodSugar: '',
    medication: '',
    mealType: '',
    exerciseMinutes: '',
    notes: '',
    timestamp: new Date()
  });

  // Convert config.layouts to the expected Layouts type
  const layouts: Layouts = config?.layouts ? {
    lg: config.layouts,
    md: config.layouts,
    sm: config.layouts,
    xs: config.layouts,
    xxs: config.layouts
  } : {};

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



  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the tracking data
    console.log('Tracking data:', trackingData);
    setShowAddForm(false);
    // Reset form
    setTrackingData({
      bloodSugar: '',
      medication: '',
      mealType: '',
      exerciseMinutes: '',
      notes: '',
      timestamp: new Date()
    });
  };

  return (
    <div className="p-4 min-h-screen bg-black">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        {config?.configSource && (
          <div className={`px-3 py-1 rounded text-sm ${
            config.configSource === 'firebase' 
              ? 'bg-blue-600 text-white' 
              : 'bg-emerald-600 text-white'
          }`}>
            Configuration from {config.configSource === 'firebase' ? 'Firebase RAG' : 'Gemini AI'}
          </div>
        )}
      </div>
      
      {/* Grid Layout Section */}
      <div className="relative mb-8">
        {config ? (
          <div style={{ height: `${config.rows * config.rowHeight + (config.rows - 1) * config.margin[1]}px` }}>
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: config.cols, md: config.cols, sm: config.cols, xs: 1, xxs: 1 }}
              rowHeight={config.rowHeight}
              margin={config.margin}
              containerPadding={config.margin}
              isResizable={false}
              isDraggable={false}
            >
              {config.apps.map((app: any) => (
                <div key={app.name}>
                  <div className="h-full bg-zinc-900 rounded-lg border border-zinc-800 p-4">
                    <h3 className="text-zinc-100 font-medium mb-2">{app.name}</h3>
                    <div className="text-zinc-400 text-sm">App content here</div>
                  </div>
                </div>
              ))}
            </ResponsiveGridLayout>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </div>

      {/* Contexts Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-zinc-100 mb-4">ubumuntu</h2>
        <div className="w-full space-y-3 sm:space-y-4">
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

          {/* Add Context Form Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-zinc-900 rounded-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-zinc-100">Add Diabetes Tracking</h3>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="text-zinc-400 hover:text-zinc-200"
                  >
                    <IconX size={20} />
                  </button>
                </div>
                <form onSubmit={handleTrackingSubmit} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Blood Sugar Level (mg/dL)
                    </label>
                    <input
                      type="number"
                      value={trackingData.bloodSugar}
                      onChange={(e) => setTrackingData({...trackingData, bloodSugar: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                      placeholder="Enter blood sugar level"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Medication Taken
                    </label>
                    <input
                      type="text"
                      value={trackingData.medication}
                      onChange={(e) => setTrackingData({...trackingData, medication: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                      placeholder="Enter medication details"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Meal Type
                    </label>
                    <select
                      value={trackingData.mealType}
                      onChange={(e) => setTrackingData({...trackingData, mealType: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                      required
                    >
                      <option value="">Select meal type</option>
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Exercise Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={trackingData.exerciseMinutes}
                      onChange={(e) => setTrackingData({...trackingData, exerciseMinutes: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                      placeholder="Enter exercise duration"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={trackingData.notes}
                      onChange={(e) => setTrackingData({...trackingData, notes: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                      placeholder="Enter any additional notes"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                      Save Entry
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 sm:p-6">
              <button 
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-3 px-4 rounded-lg transition-colors"
              >
                <IconPlus size={20} />
                <span className="text-sm font-medium">Add Tracking Entry</span>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Daily Plan Modal */}
      {showDailyPlan && selectedContext && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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

      <div className="mt-8">
        <h2 className="text-xl font-bold text-zinc-100 mb-4">Problems</h2>
        <div className="w-full space-y-3 sm:space-y-4">
          <p>
            Problem 1
            Artificial Intelligence systems often struggle with understanding and incorporating cultural context, particularly in healthcare applications. Traditional AI models lack the nuanced understanding of cultural practices, beliefs, and social dynamics that are crucial for providing personalized and culturally sensitive healthcare recommendations.
          </p>
          <p>
            Problem 2
            Current healthcare management systems are rigid and fail to adapt to individual patient contexts. While they can track basic health metrics, they don't consider the holistic nature of health management, including social determinants, daily routines, and personal preferences that significantly impact treatment adherence and outcomes.
          </p>
          <p>
            Problem 3
            There's a significant gap in integrating traditional knowledge systems with modern healthcare technology. Many communities have valuable traditional healthcare practices and wisdom that are not effectively incorporated into digital health solutions, leading to a disconnect between technological solutions and cultural healing practices.
          </p>
        </div>
      </div>
    </div>
  );
} 