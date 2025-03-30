import { Card, CardContent } from "./ui/card"
import { IconPlus, IconActivity, IconBriefcase, IconCar, IconCheck, IconX, IconRobot } from "@tabler/icons-react"
import { useState, useEffect } from "react"
import { db } from "../lib/firebase"
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, setDoc, doc, getDoc } from "firebase/firestore"

interface TodoItem {
  id: string;
  time: string;
  task: string;
  completed: boolean;
}

interface HealthRecommendation {
  text?: string;
  recommendations: string[];
  timestamp: Date;
  status: string;
}

interface WorkRecommendation {
  recommendations: string[];
  timestamp: Date;
  status: string;
  taskName: string;
  priority: string;
  deadline: string;
}

interface CommuteRecommendation {
  recommendations: string[];
  timestamp: Date;
  startLocation: string;
  endLocation: string;
  duration: string;
  trafficCondition: string;
  transportMode: string;
}

interface ContextData {
  id: string;
  name: string;
  icon: React.ReactNode;
  apps: string[];
  active?: boolean;
  dailyPlan?: TodoItem[];
  recommendation?: HealthRecommendation;
  workRecommendation?: WorkRecommendation;
  commuteRecommendation?: CommuteRecommendation;
}

interface DiabetesTracking {
  bloodSugar: string;
  medication: string;
  mealType: string;
  exerciseMinutes: string;
  notes: string;
  timestamp: Date;
}

interface WorkTracking {
  taskName: string;
  priority: string;
  deadline: string;
  status: string;
  collaborators: string;
  notes: string;
  timestamp: Date;
}

interface CommuteTracking {
  startLocation: string;
  endLocation: string;
  transportMode: string;
  duration: string;
  trafficCondition: string;
  notes: string;
  timestamp: Date;
}

interface ContextStatus {
  id: string;
  active: boolean;
  updated_at: Date;
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFormContext, setSelectedFormContext] = useState<'health' | 'work' | 'commute'>('health');
  const [healthRecommendation, setHealthRecommendation] = useState<HealthRecommendation | null>(null);
  const [workRecommendation, setWorkRecommendation] = useState<WorkRecommendation | null>(null);
  const [commuteRecommendation, setCommuteRecommendation] = useState<CommuteRecommendation | null>(null);
  
  // Separate state for each context type
  const [workTrackingData, setWorkTrackingData] = useState<WorkTracking>({
    taskName: '',
    priority: '',
    deadline: '',
    status: '',
    collaborators: '',
    notes: '',
    timestamp: new Date()
  });

  const [commuteTrackingData, setCommuteTrackingData] = useState<CommuteTracking>({
    startLocation: '',
    endLocation: '',
    transportMode: '',
    duration: '',
    trafficCondition: '',
    notes: '',
    timestamp: new Date()
  });

  const [trackingData, setTrackingData] = useState<DiabetesTracking>({
    bloodSugar: '',
    medication: '',
    mealType: '',
    exerciseMinutes: '',
    notes: '',
    timestamp: new Date()
  });

  useEffect(() => {
    const fetchLatestRecommendation = async () => {
      try {
        const recommendationsRef = collection(db, 'health_ai_recommendation');
        const q = query(recommendationsRef, orderBy('timestamp', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          setHealthRecommendation({
            recommendations: data.recommendations || [],
            timestamp: data.timestamp.toDate(),
            status: data.status || 'Normal'
          });
          
          // Update the health context with the recommendation
          setContexts(prevContexts =>
            prevContexts.map(context =>
              context.id === 'health'
                ? { ...context, recommendation: {
                    recommendations: data.recommendations || [],
                    timestamp: data.timestamp.toDate(),
                    status: data.status || 'Normal'
                  }}
                : context
            )
          );
        }
      } catch (error) {
        console.error('Error fetching health recommendation:', error);
      }
    };

    const fetchLatestWorkRecommendation = async () => {
      try {
        const workRecommendationsRef = collection(db, 'work_ai_recommendation');
        const q = query(workRecommendationsRef, orderBy('timestamp', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          setWorkRecommendation({
            recommendations: data.recommendations || [],
            timestamp: data.timestamp.toDate(),
            status: data.status || '',
            taskName: data.taskName || '',
            priority: data.priority || '',
            deadline: data.deadline || ''
          });
          
          // Update the work context with the recommendation
          setContexts(prevContexts =>
            prevContexts.map(context =>
              context.id === 'work'
                ? { ...context, workRecommendation: {
                    recommendations: data.recommendations || [],
                    timestamp: data.timestamp.toDate(),
                    status: data.status || '',
                    taskName: data.taskName || '',
                    priority: data.priority || '',
                    deadline: data.deadline || ''
                  }}
                : context
            )
          );
        }
      } catch (error) {
        console.error('Error fetching work recommendation:', error);
      }
    };

    const fetchLatestCommuteRecommendation = async () => {
      try {
        const commuteRecommendationsRef = collection(db, 'commute_ai_recommendation');
        const q = query(commuteRecommendationsRef, orderBy('timestamp', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          setCommuteRecommendation({
            recommendations: data.recommendations || [],
            timestamp: data.timestamp.toDate(),
            startLocation: data.startLocation || '',
            endLocation: data.endLocation || '',
            duration: data.duration || '',
            trafficCondition: data.trafficCondition || '',
            transportMode: data.transportMode || ''
          });
          
          // Update the commute context with the recommendation
          setContexts(prevContexts =>
            prevContexts.map(context =>
              context.id === 'commute'
                ? { ...context, commuteRecommendation: {
                    recommendations: data.recommendations || [],
                    timestamp: data.timestamp.toDate(),
                    startLocation: data.startLocation || '',
                    endLocation: data.endLocation || '',
                    duration: data.duration || '',
                    trafficCondition: data.trafficCondition || '',
                    transportMode: data.transportMode || ''
                  }}
                : context
            )
          );
        }
      } catch (error) {
        console.error('Error fetching commute recommendation:', error);
      }
    };

    const fetchContextStatuses = async () => {
      try {
        const contextPromises = mockContexts.map(async (context) => {
          const statusDoc = await getDoc(doc(db, 'context_status', context.id));
          return {
            ...context,
            active: statusDoc.exists() ? statusDoc.data().active : false
          };
        });

        const updatedContexts = await Promise.all(contextPromises);
        setContexts(updatedContexts);
      } catch (error) {
        console.error('Error fetching context statuses:', error);
      }
    };

    fetchLatestRecommendation();
    fetchLatestWorkRecommendation();
    fetchLatestCommuteRecommendation();
    fetchContextStatuses();
  }, []);

  const toggleContextActive = async (contextId: string) => {
    try {
      const updatedContexts = contexts.map(context => {
        if (context.id === contextId) {
          return { ...context, active: !context.active };
        }
        return context;
      });
      setContexts(updatedContexts);

      // Update status in Firebase
      await setDoc(doc(db, 'context_status', contextId), {
        active: updatedContexts.find(c => c.id === contextId)?.active || false,
        updated_at: serverTimestamp()
      });

    } catch (error) {
      console.error('Error updating context status:', error);
      // Revert the state if Firebase update fails
      setContexts(contexts);
    }
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

  const handleTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Add to Firestore
      const healthContextRef = collection(db, 'health_context');
      await addDoc(healthContextRef, {
        ...trackingData,
        timestamp: serverTimestamp(),
        type: 'diabetes_tracking',
        created_at: new Date().toISOString()
      });

      console.log('Successfully saved tracking data to Firebase');
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
    } catch (error) {
      console.error('Error saving tracking data:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleFormOpen = (contextId: 'health' | 'work' | 'commute') => {
    setSelectedFormContext(contextId);
    setShowAddForm(true);
  };

  const handleWorkTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const workContextRef = collection(db, 'work_context');
      await addDoc(workContextRef, {
        ...workTrackingData,
        timestamp: serverTimestamp(),
        type: 'work_tracking',
        created_at: new Date().toISOString()
      });

      console.log('Successfully saved work tracking data to Firebase');
      setShowAddForm(false);
      
      setWorkTrackingData({
        taskName: '',
        priority: '',
        deadline: '',
        status: '',
        collaborators: '',
        notes: '',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error saving work tracking data:', error);
    }
  };

  const handleCommuteTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const commuteContextRef = collection(db, 'commute_context');
      await addDoc(commuteContextRef, {
        ...commuteTrackingData,
        timestamp: serverTimestamp(),
        type: 'commute_tracking',
        created_at: new Date().toISOString()
      });

      console.log('Successfully saved commute tracking data to Firebase');
      setShowAddForm(false);
      
      setCommuteTrackingData({
        startLocation: '',
        endLocation: '',
        transportMode: '',
        duration: '',
        trafficCondition: '',
        notes: '',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error saving commute tracking data:', error);
    }
  };

  const renderForm = () => {
    switch (selectedFormContext) {
      case 'work':
        return (
          <form onSubmit={handleWorkTrackingSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Task Name
              </label>
              <input
                type="text"
                value={workTrackingData.taskName}
                onChange={(e) => setWorkTrackingData({...workTrackingData, taskName: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                placeholder="Enter task name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Priority
              </label>
              <select
                value={workTrackingData.priority}
                onChange={(e) => setWorkTrackingData({...workTrackingData, priority: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="">Select priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Deadline
              </label>
              <input
                type="datetime-local"
                value={workTrackingData.deadline}
                onChange={(e) => setWorkTrackingData({...workTrackingData, deadline: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Status
              </label>
              <select
                value={workTrackingData.status}
                onChange={(e) => setWorkTrackingData({...workTrackingData, status: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="">Select status</option>
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Collaborators
              </label>
              <input
                type="text"
                value={workTrackingData.collaborators}
                onChange={(e) => setWorkTrackingData({...workTrackingData, collaborators: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                placeholder="Enter collaborators (comma-separated)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Notes
              </label>
              <textarea
                value={workTrackingData.notes}
                onChange={(e) => setWorkTrackingData({...workTrackingData, notes: e.target.value})}
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
        );

      case 'commute':
        return (
          <form onSubmit={handleCommuteTrackingSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Start Location
              </label>
              <input
                type="text"
                value={commuteTrackingData.startLocation}
                onChange={(e) => setCommuteTrackingData({...commuteTrackingData, startLocation: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                placeholder="Enter start location"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                End Location
              </label>
              <input
                type="text"
                value={commuteTrackingData.endLocation}
                onChange={(e) => setCommuteTrackingData({...commuteTrackingData, endLocation: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                placeholder="Enter end location"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Transport Mode
              </label>
              <select
                value={commuteTrackingData.transportMode}
                onChange={(e) => setCommuteTrackingData({...commuteTrackingData, transportMode: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="">Select transport mode</option>
                <option value="car">Car</option>
                <option value="bus">Bus</option>
                <option value="train">Train</option>
                <option value="walk">Walk</option>
                <option value="bike">Bike</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={commuteTrackingData.duration}
                onChange={(e) => setCommuteTrackingData({...commuteTrackingData, duration: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                placeholder="Enter duration in minutes"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Traffic Condition
              </label>
              <select
                value={commuteTrackingData.trafficCondition}
                onChange={(e) => setCommuteTrackingData({...commuteTrackingData, trafficCondition: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="">Select traffic condition</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
                <option value="standstill">Standstill</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Notes
              </label>
              <textarea
                value={commuteTrackingData.notes}
                onChange={(e) => setCommuteTrackingData({...commuteTrackingData, notes: e.target.value})}
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
        );

      default:
        return (
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
        );
    }
  };

  return (
    <div className="min-h-screen bg-black p-2 sm:p-4 md:p-6 flex flex-col pb-16 sm:pb-24">
      <div className="w-full max-w-3xl mx-auto space-y-3 sm:space-y-4">
        {contexts.map((context) => (
          <Card 
            key={context.id} 
            className={`bg-zinc-900 border-zinc-800 transition-colors ${
              context.active ? 'border-l-4 border-l-emerald-500' : ''
            }`}
          >
            <CardContent className="p-3 sm:p-4 md:p-6">
              {/* Context Header */}
              <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  {context.icon}
                  <h3 className="text-sm sm:text-base md:text-lg font-medium text-zinc-100 truncate">
                    {context.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {context.id === 'health' && (
                    <button 
                      onClick={() => handleViewNextStep(context)}
                      className="text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      View Next Step
                    </button>
                  )}
                  <button 
                    onClick={() => toggleContextActive(context.id)}
                    className={`text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors whitespace-nowrap ${
                      context.active 
                        ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600' 
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {context.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>

              {/* Health Recommendations */}
              {context.id === 'health' && context.recommendation && (
                <div className="mb-3 sm:mb-4 bg-zinc-800/50 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <IconRobot className="text-emerald-500" size={18} />
                      <h4 className="text-xs sm:text-sm font-medium text-emerald-500">AI Recommendations</h4>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      context.recommendation.status === 'Normal' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {context.recommendation.status}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {context.recommendation.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span>
                        <p className="text-xs sm:text-sm text-zinc-300">{rec}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-zinc-500 mt-2">
                    Last updated: {context.recommendation.timestamp.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Work Recommendations */}
              {context.id === 'work' && context.workRecommendation && (
                <div className="mb-3 sm:mb-4 bg-zinc-800/50 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <IconRobot className="text-blue-500" size={18} />
                      <h4 className="text-xs sm:text-sm font-medium text-blue-500">Task Status</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        context.workRecommendation.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {context.workRecommendation.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        context.workRecommendation.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {context.workRecommendation.priority} priority
                      </span>
                    </div>
                  </div>
                  <div className="mb-3 text-xs sm:text-sm">
                    <p className="text-zinc-200 font-medium">{context.workRecommendation.taskName}</p>
                    <p className="text-zinc-400 text-xs mt-1">
                      Deadline: {new Date(context.workRecommendation.deadline).toLocaleString()}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {context.workRecommendation.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <p className="text-xs sm:text-sm text-zinc-300">{rec}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-zinc-500 mt-2">
                    Last updated: {context.workRecommendation.timestamp.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Commute Recommendations */}
              {context.id === 'commute' && context.commuteRecommendation && (
                <div className="mb-3 sm:mb-4 bg-zinc-800/50 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <IconRobot className="text-amber-500" size={18} />
                      <h4 className="text-xs sm:text-sm font-medium text-amber-500">Route Status</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400`}>
                        {context.commuteRecommendation.transportMode}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        context.commuteRecommendation.trafficCondition === 'light' 
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : context.commuteRecommendation.trafficCondition === 'moderate'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {context.commuteRecommendation.trafficCondition} traffic
                      </span>
                    </div>
                  </div>
                  <div className="mb-3 text-xs sm:text-sm space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-zinc-400">From:</span>
                      <span className="text-zinc-300">{context.commuteRecommendation.startLocation}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-zinc-400">To:</span>
                      <span className="text-zinc-300">{context.commuteRecommendation.endLocation}</span>
                    </div>
                    <p className="text-zinc-400 text-xs">
                      Duration: {context.commuteRecommendation.duration} minutes
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {context.commuteRecommendation.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-1">•</span>
                        <p className="text-xs sm:text-sm text-zinc-300">{rec}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-zinc-500 mt-2">
                    Last updated: {context.commuteRecommendation.timestamp.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Apps Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 mb-3 sm:mb-4">
                {context.apps.map((app) => (
                  <div 
                    key={app}
                    className="bg-zinc-800 text-zinc-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm truncate"
                  >
                    {app}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Context Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {['health', 'work', 'commute'].map((type) => (
            <Card key={type} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-2 sm:p-4">
                <button 
                  onClick={() => handleFormOpen(type as 'health' | 'work' | 'commute')}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors"
                >
                  <IconPlus size={18} />
                  <span className="text-xs sm:text-sm font-medium">Add {type.charAt(0).toUpperCase() + type.slice(1)} Entry</span>
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Context Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 rounded-xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-lg font-medium text-zinc-100">
                  {selectedFormContext === 'health' && 'Add Diabetes Tracking'}
                  {selectedFormContext === 'work' && 'Add Work Task'}
                  {selectedFormContext === 'commute' && 'Add Commute Record'}
                </h3>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  <IconX size={20} />
                </button>
              </div>
              {renderForm()}
            </div>
          </div>
        )}

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
    </div>
  )
} 