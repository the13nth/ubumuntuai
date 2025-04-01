import { Card, CardContent } from "./ui/card"
import { IconPlus, IconActivity, IconBriefcase, IconCar, IconCheck, IconX, IconRobot, IconPencil, IconPower } from "@tabler/icons-react"
import { useState, useEffect } from "react"
import type { ReactElement } from "react"
import { db } from "../lib/firebase"
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, setDoc, doc, onSnapshot } from "firebase/firestore"

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
  isUpdating?: boolean;
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

interface CreateContextData {
  name: string;
  type: 'health' | 'work' | 'commute';
  subtype: string;
  apps: string[];
}

interface ContextUpdate {
  created_at: string;
  timestamp: Date;
  type: string;
}

interface HealthUpdate extends ContextUpdate {
  bloodSugar: string;
  medication: string;
  mealType: string;
  exerciseMinutes: string;
  notes: string;
}

interface WorkUpdate extends ContextUpdate {
  taskName: string;
  priority: string;
  deadline: string;
  status: string;
  collaborators: string;
  notes: string;
}

interface CommuteUpdate extends ContextUpdate {
  startLocation: string;
  endLocation: string;
  transportMode: string;
  duration: string;
  trafficCondition: string;
  notes: string;
}

interface UpdateStatus {
  loading: boolean;
  success: boolean;
  error: string | null;
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
  const [selectedContext] = useState<ContextData | null>(null);
  const [showCreateContext, setShowCreateContext] = useState(false);
  const [newContextData, setNewContextData] = useState<CreateContextData>({
    name: '',
    type: 'health',
    subtype: 'diabetes',
    apps: ['']
  });
  const [, setHealthRecommendation] = useState<HealthRecommendation | null>(null);
  const [, setWorkRecommendation] = useState<WorkRecommendation | null>(null);
  const [, setCommuteRecommendation] = useState<CommuteRecommendation | null>(null);
  
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

  // Add new state for updates
  const [healthUpdates, setHealthUpdates] = useState<HealthUpdate[]>([]);
  const [workUpdates, setWorkUpdates] = useState<WorkUpdate[]>([]);
  const [commuteUpdates, setCommuteUpdates] = useState<CommuteUpdate[]>([]);

  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    loading: false,
    success: false,
    error: null
  });

  useEffect(() => {
    // Fetch initial context statuses and set up real-time listeners
    const fetchAndSetupListeners = async () => {
      try {
        // Fetch context statuses
        const contextStatusesRef = collection(db, 'context_status');
        const statusSnapshot = await getDocs(contextStatusesRef);
        const statusData = new Map(
          statusSnapshot.docs.map(doc => [doc.id, doc.data().active])
        );

        // Set up real-time listeners for recommendations
        const unsubscribeHealth = onSnapshot(
          query(collection(db, 'health_ai_recommendation'), orderBy('timestamp', 'desc'), limit(1)),
          (snapshot) => {
            if (!snapshot.empty) {
              const data = snapshot.docs[0].data();
              const recommendation = {
                recommendations: data.recommendations || [],
                timestamp: data.timestamp.toDate(),
                status: data.status || 'Normal'
              };
              setHealthRecommendation(recommendation);
              
              // Update context with latest recommendation
              setContexts(prevContexts =>
                prevContexts.map(context =>
                  context.id === 'health'
                    ? { ...context, recommendation, active: statusData.get('health') ?? false }
                    : context
                )
              );
            }
          },
          (error) => console.error('Error listening to health recommendations:', error)
        );

        const unsubscribeWork = onSnapshot(
          query(collection(db, 'work_ai_recommendation'), orderBy('timestamp', 'desc'), limit(1)),
          (snapshot) => {
            if (!snapshot.empty) {
              const data = snapshot.docs[0].data();
              const workRecommendation = {
                recommendations: data.recommendations || [],
                timestamp: data.timestamp.toDate(),
                status: data.status || '',
                taskName: data.taskName || '',
                priority: data.priority || '',
                deadline: data.deadline || ''
              };
              setWorkRecommendation(workRecommendation);
              
              // Update context with latest recommendation
              setContexts(prevContexts =>
                prevContexts.map(context =>
                  context.id === 'work'
                    ? { ...context, workRecommendation, active: statusData.get('work') ?? false }
                    : context
                )
              );
            }
          },
          (error) => console.error('Error listening to work recommendations:', error)
        );

        const unsubscribeCommute = onSnapshot(
          query(collection(db, 'commute_ai_recommendation'), orderBy('timestamp', 'desc'), limit(1)),
          (snapshot) => {
            if (!snapshot.empty) {
              const data = snapshot.docs[0].data();
              const commuteRecommendation = {
                recommendations: data.recommendations || [],
                timestamp: data.timestamp.toDate(),
                startLocation: data.startLocation || '',
                endLocation: data.endLocation || '',
                duration: data.duration || '',
                trafficCondition: data.trafficCondition || '',
                transportMode: data.transportMode || ''
              };
              setCommuteRecommendation(commuteRecommendation);
              
              // Update context with latest recommendation
              setContexts(prevContexts =>
                prevContexts.map(context =>
                  context.id === 'commute'
                    ? { ...context, commuteRecommendation, active: statusData.get('commute') ?? false }
                    : context
                )
              );
            }
          },
          (error) => console.error('Error listening to commute recommendations:', error)
        );

        // Set up listener for context status changes
        const unsubscribeStatus = onSnapshot(
          collection(db, 'context_status'),
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'modified') {
                const contextId = change.doc.id;
                const isActive = change.doc.data().active;
                
                setContexts(prevContexts =>
                  prevContexts.map(context =>
                    context.id === contextId
                      ? { ...context, active: isActive }
                      : context
                  )
                );
              }
            });
          },
          (error) => console.error('Error listening to context status changes:', error)
        );

        return () => {
          unsubscribeHealth();
          unsubscribeWork();
          unsubscribeCommute();
          unsubscribeStatus();
        };
      } catch (error) {
        console.error('Error setting up context listeners:', error);
      }
    };

    fetchAndSetupListeners();
  }, []);

  useEffect(() => {
    // Add this to your existing useEffect or create a new one
    const fetchContextUpdates = async () => {
      try {
        // Fetch health updates
        const healthQuery = query(
          collection(db, 'health_context'),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        const healthSnapshot = await getDocs(healthQuery);
        setHealthUpdates(
          healthSnapshot.docs.map(doc => ({
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate()
          })) as HealthUpdate[]
        );

        // Fetch work updates
        const workQuery = query(
          collection(db, 'work_context'),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        const workSnapshot = await getDocs(workQuery);
        setWorkUpdates(
          workSnapshot.docs.map(doc => ({
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate()
          })) as WorkUpdate[]
        );

        // Fetch commute updates
        const commuteQuery = query(
          collection(db, 'commute_context'),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        const commuteSnapshot = await getDocs(commuteQuery);
        setCommuteUpdates(
          commuteSnapshot.docs.map(doc => ({
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate()
          })) as CommuteUpdate[]
        );
      } catch (error) {
        console.error('Error fetching context updates:', error);
      }
    };

    fetchContextUpdates();
  }, []);

  const toggleContextActive = async (contextId: string) => {
    try {
      const newActive = !contexts.find(c => c.id === contextId)?.active;
      
      // Update status in Firebase
      await setDoc(doc(db, 'context_status', contextId), {
        active: newActive,
        updated_at: serverTimestamp()
      });

      // Local state will be updated by the context_status listener
    } catch (error) {
      console.error('Error updating context status:', error);
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

  const handleTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateStatus({ loading: true, success: false, error: null });
    
    try {
      const now = new Date();
      const created_at = now.toISOString();

      const healthContextRef = collection(db, 'health_context');
      await addDoc(healthContextRef, {
        created_at,
        bloodSugar: trackingData.bloodSugar,
        medication: trackingData.medication,
        mealType: trackingData.mealType,
        exerciseMinutes: trackingData.exerciseMinutes,
        notes: trackingData.notes,
        timestamp: serverTimestamp(),
        type: 'diabetes_tracking'
      });

      setUpdateStatus({ loading: false, success: true, error: null });
      
      // Reset form after a short delay to show success message
      setTimeout(() => {
        setContexts(prevContexts =>
          prevContexts.map(context =>
            context.id === 'health'
              ? { ...context, isUpdating: false }
              : context
          )
        );
        
        setTrackingData({
          bloodSugar: '',
          medication: '',
          mealType: '',
          exerciseMinutes: '',
          notes: '',
          timestamp: new Date()
        });
        
        setUpdateStatus({ loading: false, success: false, error: null });
      }, 2000);
    } catch (error) {
      console.error('Error saving health event:', error);
      setUpdateStatus({ loading: false, success: false, error: 'Failed to save update. Please try again.' });
    }
  };

  const handleWorkTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateStatus({ loading: true, success: false, error: null });
    
    try {
      const now = new Date();
      const created_at = now.toISOString();

      const workContextRef = collection(db, 'work_context');
      await addDoc(workContextRef, {
        created_at,
        taskName: workTrackingData.taskName,
        priority: workTrackingData.priority,
        deadline: workTrackingData.deadline,
        status: workTrackingData.status,
        collaborators: workTrackingData.collaborators,
        notes: workTrackingData.notes,
        timestamp: serverTimestamp(),
        type: 'work_tracking'
      });

      setUpdateStatus({ loading: false, success: true, error: null });
      
      setTimeout(() => {
        setContexts(prevContexts =>
          prevContexts.map(context =>
            context.id === 'work'
              ? { ...context, isUpdating: false }
              : context
          )
        );
        
        setWorkTrackingData({
          taskName: '',
          priority: '',
          deadline: '',
          status: '',
          collaborators: '',
          notes: '',
          timestamp: new Date()
        });
        
        setUpdateStatus({ loading: false, success: false, error: null });
      }, 2000);
    } catch (error) {
      console.error('Error saving work event:', error);
      setUpdateStatus({ loading: false, success: false, error: 'Failed to save update. Please try again.' });
    }
  };

  const handleCommuteTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateStatus({ loading: true, success: false, error: null });
    
    try {
      const now = new Date();
      const created_at = now.toISOString();

      const commuteContextRef = collection(db, 'commute_context');
      await addDoc(commuteContextRef, {
        created_at,
        duration: commuteTrackingData.duration,
        endLocation: commuteTrackingData.endLocation,
        notes: commuteTrackingData.notes,
        startLocation: commuteTrackingData.startLocation,
        timestamp: serverTimestamp(),
        trafficCondition: commuteTrackingData.trafficCondition,
        transportMode: commuteTrackingData.transportMode,
        type: 'commute_tracking'
      });

      setUpdateStatus({ loading: false, success: true, error: null });
      
      setTimeout(() => {
        setContexts(prevContexts =>
          prevContexts.map(context =>
            context.id === 'commute'
              ? { ...context, isUpdating: false }
              : context
          )
        );
        
        setCommuteTrackingData({
          startLocation: '',
          endLocation: '',
          transportMode: '',
          duration: '',
          trafficCondition: '',
          notes: '',
          timestamp: new Date()
        });
        
        setUpdateStatus({ loading: false, success: false, error: null });
      }, 2000);
    } catch (error) {
      console.error('Error saving commute event:', error);
      setUpdateStatus({ loading: false, success: false, error: 'Failed to save update. Please try again.' });
    }
  };

  const getSubtypeOptions = (type: 'health' | 'work' | 'commute'): { value: string; label: string }[] => {
    switch (type) {
      case 'health':
        return [
          { value: 'diabetes', label: 'Diabetes Management' },
          { value: 'fitness', label: 'Fitness Tracking' },
          { value: 'medication', label: 'Medication Management' },
          { value: 'nutrition', label: 'Nutrition Tracking' },
          { value: 'mental', label: 'Mental Health' }
        ];
      case 'work':
        return [
          { value: 'project', label: 'Project Management' },
          { value: 'meetings', label: 'Meeting Schedule' },
          { value: 'tasks', label: 'Task Management' },
          { value: 'collaboration', label: 'Team Collaboration' },
          { value: 'deadlines', label: 'Deadline Tracking' }
        ];
      case 'commute':
        return [
          { value: 'daily', label: 'Daily Commute' },
          { value: 'business', label: 'Business Travel' },
          { value: 'school', label: 'School Transport' },
          { value: 'delivery', label: 'Delivery Route' },
          { value: 'carpool', label: 'Carpool Management' }
        ];
    }
  };

  const handleCreateContext = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create a new context document in Firebase
      const contextRef = await addDoc(collection(db, 'contexts'), {
        name: newContextData.name,
        type: newContextData.type,
        subtype: newContextData.subtype,
        apps: newContextData.apps.filter(app => app.trim() !== ''),
        active: false,
        created_at: serverTimestamp()
      });

      // Add to local state
      const iconComponent = () => {
        switch(newContextData.type) {
          case 'health':
            return <IconActivity className="text-emerald-500" size={24} />;
          case 'work':
            return <IconBriefcase className="text-blue-500" size={24} />;
          case 'commute':
            return <IconCar className="text-amber-500" size={24} />;
        }
      };

      const newContext: ContextData = {
        id: contextRef.id,
        name: newContextData.name,
        icon: iconComponent(),
        apps: newContextData.apps.filter(app => app.trim() !== ''),
        active: false
      };

      setContexts(prev => [...prev, newContext]);
      setShowCreateContext(false);
      setNewContextData({ name: '', type: 'health', subtype: 'diabetes', apps: [''] });
    } catch (error) {
      console.error('Error creating context:', error);
    }
  };

  const handleAddApp = () => {
    setNewContextData(prev => ({
      ...prev,
      apps: [...prev.apps, '']
    }));
  };

  const handleRemoveApp = (index: number) => {
    setNewContextData(prev => ({
      ...prev,
      apps: prev.apps.filter((_, i) => i !== index)
    }));
  };

  const handleAppChange = (index: number, value: string) => {
    setNewContextData(prev => ({
      ...prev,
      apps: prev.apps.map((app, i) => i === index ? value : app)
    }));
  };

  const renderFormButtons = (contextId: string) => (
    <div className="flex justify-end gap-3 mt-6">
      <button
        type="button"
        onClick={() => {
          toggleUpdateForm(contextId);
          setUpdateStatus({ loading: false, success: false, error: null });
        }}
        className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        disabled={updateStatus.loading}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={updateStatus.loading || updateStatus.success}
        className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
          updateStatus.success
            ? 'bg-emerald-600 text-white'
            : updateStatus.loading
            ? 'bg-zinc-700 text-zinc-300 cursor-not-allowed'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }`}
      >
        {updateStatus.loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving...
          </>
        ) : updateStatus.success ? (
          <>
            <IconCheck size={16} />
            Saved!
          </>
        ) : (
          'Save Entry'
        )}
      </button>
    </div>
  );

  const renderForm = (contextId: string) => {
    const formContent = (formJsx: ReactElement) => (
      <div className="space-y-4">
        {formJsx}
        {updateStatus.error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-400">
            {updateStatus.error}
          </div>
        )}
        {renderFormButtons(contextId)}
      </div>
    );

    switch (contextId) {
      case 'work':
        return formContent(
          <form onSubmit={handleWorkTrackingSubmit} className="space-y-4">
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
          </form>
        );

      case 'commute':
        return formContent(
          <form onSubmit={handleCommuteTrackingSubmit} className="space-y-4">
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
          </form>
        );

      case 'health':
      default:
        return formContent(
          <form onSubmit={handleTrackingSubmit} className="space-y-4">
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
          </form>
        );
    }
  };

  const toggleUpdateForm = (contextId: string) => {
    setContexts(prevContexts =>
      prevContexts.map(context =>
        context.id === contextId
          ? { ...context, isUpdating: !context.isUpdating }
          : context
      )
    );
  };

  // Add this function to render updates
  const renderContextUpdates = (contextId: string) => {
    switch (contextId) {
      case 'health':
        return healthUpdates.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-zinc-300">Recent Updates</h4>
              <span className="text-xs text-zinc-500">{healthUpdates.length} entries</span>
            </div>
            <div className="space-y-2">
              {healthUpdates.map((update, index) => (
                <div key={index} className="bg-zinc-800/30 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">
                        {update.bloodSugar} mg/dL
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">
                        {update.mealType}
                      </span>
                    </div>
                    <time className="text-xs text-zinc-500">
                      {new Date(update.created_at).toLocaleString()}
                    </time>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="text-zinc-300">
                      <span className="text-zinc-500">Medication:</span> {update.medication}
                    </div>
                    {update.exerciseMinutes && (
                      <div className="text-zinc-300">
                        <span className="text-zinc-500">Exercise:</span> {update.exerciseMinutes} mins
                      </div>
                    )}
                  </div>
                  {update.notes && (
                    <div className="mt-2 text-xs text-zinc-400 italic border-t border-zinc-800/50 pt-2">
                      {update.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'work':
        return workUpdates.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-zinc-300">Recent Updates</h4>
              <span className="text-xs text-zinc-500">{workUpdates.length} entries</span>
            </div>
            <div className="space-y-2">
              {workUpdates.map((update, index) => (
                <div key={index} className="bg-zinc-800/30 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="text-sm text-zinc-200 font-medium">{update.taskName}</div>
                    <time className="text-xs text-zinc-500">
                      {new Date(update.created_at).toLocaleString()}
                    </time>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      update.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      update.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {update.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      update.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      update.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {update.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="text-zinc-300">
                      <span className="text-zinc-500">Deadline:</span> {new Date(update.deadline).toLocaleString()}
                    </div>
                    {update.collaborators && (
                      <div className="text-zinc-300">
                        <span className="text-zinc-500">Team:</span> {update.collaborators}
                      </div>
                    )}
                  </div>
                  {update.notes && (
                    <div className="mt-2 text-xs text-zinc-400 italic border-t border-zinc-800/50 pt-2">
                      {update.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'commute':
        return commuteUpdates.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-zinc-300">Recent Updates</h4>
              <span className="text-xs text-zinc-500">{commuteUpdates.length} entries</span>
            </div>
            <div className="space-y-2">
              {commuteUpdates.map((update, index) => (
                <div key={index} className="bg-zinc-800/30 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">
                        {update.transportMode}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        update.trafficCondition === 'light' ? 'bg-emerald-500/20 text-emerald-400' :
                        update.trafficCondition === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {update.trafficCondition} traffic
                      </span>
                    </div>
                    <time className="text-xs text-zinc-500">
                      {new Date(update.created_at).toLocaleString()}
                    </time>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="text-zinc-300">
                      <span className="text-zinc-500">From:</span> {update.startLocation}
                    </div>
                    <div className="text-zinc-300">
                      <span className="text-zinc-500">To:</span> {update.endLocation}
                    </div>
                    <div className="text-zinc-300">
                      <span className="text-zinc-500">Duration:</span> {update.duration} mins
                    </div>
                  </div>
                  {update.notes && (
                    <div className="mt-2 text-xs text-zinc-400 italic border-t border-zinc-800/50 pt-2">
                      {update.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black pt-6 pb-28 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">Contexts</h1>
          <button
            onClick={() => setShowCreateContext(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-sm"
          >
            <IconPlus size={16} />
            Create Context
          </button>
        </div>

        {/* Create Context Modal */}
        {showCreateContext && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-zinc-100 mb-4">Create New Context</h2>
              <form onSubmit={handleCreateContext} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Context Type
                  </label>
                  <select
                    value={newContextData.type}
                    onChange={(e) => setNewContextData(prev => ({ 
                      ...prev, 
                      type: e.target.value as 'health' | 'work' | 'commute',
                      subtype: getSubtypeOptions(e.target.value as 'health' | 'work' | 'commute')[0].value,
                      apps: getDefaultApps(e.target.value as 'health' | 'work' | 'commute')
                    }))}
                    className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="health">Health Context</option>
                    <option value="work">Work Context</option>
                    <option value="commute">Commute Context</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Context Subtype
                  </label>
                  <select
                    value={newContextData.subtype}
                    onChange={(e) => setNewContextData(prev => ({ 
                      ...prev, 
                      subtype: e.target.value,
                      // Optionally update apps based on subtype if needed
                    }))}
                    className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getSubtypeOptions(newContextData.type).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Context Name
                  </label>
                  <input
                    type="text"
                    value={newContextData.name}
                    onChange={(e) => setNewContextData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${newContextData.type} context name`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Apps
                  </label>
                  {newContextData.apps.map((app, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={app}
                        onChange={(e) => handleAppChange(index, e.target.value)}
                        className="flex-1 bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="App name"
                        required
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveApp(index)}
                          className="p-2 text-zinc-400 hover:text-zinc-200"
                        >
                          <IconX size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddApp}
                    className="text-sm text-blue-500 hover:text-blue-400 flex items-center gap-1"
                  >
                    <IconPlus size={14} />
                    Add App
                  </button>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateContext(false)}
                    className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
                  >
                    Create Context
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Active Contexts Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-100">Active Contexts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contexts.filter(context => context.active).map((context) => (
              <Card 
                key={context.id} 
                className="bg-zinc-900 border-zinc-800 border-l-4 border-l-emerald-500 transition-colors"
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
                      <button
                        onClick={() => toggleUpdateForm(context.id)}
                        className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Update Context"
                      >
                        <IconPencil size={18} />
                      </button>
                      <button 
                        onClick={() => toggleContextActive(context.id)}
                        className="p-1.5 rounded-lg bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors"
                        title="Deactivate Context"
                      >
                        <IconPower size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Update Form */}
                  {context.isUpdating && (
                    <div className="mb-4 bg-zinc-800/50 rounded-lg p-4">
                      {renderForm(context.id)}
                    </div>
                  )}

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

                  {/* Context Updates */}
                  {renderContextUpdates(context.id)}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Inactive Contexts Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-100">Available Contexts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contexts.filter(context => !context.active).map((context) => (
              <Card 
                key={context.id} 
                className="bg-zinc-900 border-zinc-800 transition-colors"
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
                      <button
                        onClick={() => toggleUpdateForm(context.id)}
                        className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Update Context"
                      >
                        <IconPencil size={18} />
                      </button>
                      <button 
                        onClick={() => toggleContextActive(context.id)}
                        className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Activate Context"
                      >
                        <IconPower size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Update Form */}
                  {context.isUpdating && (
                    <div className="mb-4 bg-zinc-800/50 rounded-lg p-4">
                      {renderForm(context.id)}
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

                  {/* Context Updates */}
                  {renderContextUpdates(context.id)}
                </CardContent>
              </Card>
            ))}
          </div>
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
    </div>
  )
}

// Helper function to get default apps based on context type
function getDefaultApps(type: 'health' | 'work' | 'commute'): string[] {
  switch (type) {
    case 'health':
      return ['Blood Sugar Monitor', 'Meal Planner', 'Exercise Tracker', 'Medication Reminder'];
    case 'work':
      return ['Calendar', 'Task Manager', 'Email Dashboard', 'Meeting Notes'];
    case 'commute':
      return ['Traffic Monitor', 'Weather', 'Transit Times', 'Fuel Tracker'];
  }
} 