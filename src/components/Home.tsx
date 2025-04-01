import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Card, CardContent } from "./ui/card";
import GridLayout, { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "../styles/grid.css";
import { 
  IconPlus, IconTool, IconBrain, IconSearch, IconCamera, IconShoppingCart, 
  IconMoodSmile, IconCode, IconRun, IconBriefcase, IconCar, IconBook, 
  IconDeviceAnalytics, IconPill, IconChartBar, IconCalendarTime, IconHome,
  IconLeaf, IconBell, IconX 
} from "@tabler/icons-react";
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface ContextTool {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
}

interface Context {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: ReactNode;
  tools: ContextTool[];
  actions: string[];
  isPublic: boolean;
  created_at: Date;
}

// Add new interface for expanded state
interface ExpandedState {
  isExpanded: boolean;
  templateId: string | null;
}

// Add new interface for stored layout
interface StoredLayout extends Layout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

// Update the GridConfig interface
interface GridConfig {
  layouts: StoredLayout[];
  cols: number;
  rowHeight: number;
  width: number;
  margin: [number, number];
}

// Pre-configured context templates
const contextTemplates = [
  {
    id: 'fitness',
    name: 'Fitness Tracker',
    type: 'health',
    description: 'Track workouts, set fitness goals, and monitor progress',
    icon: <IconRun className="text-emerald-500" />,
    suggestedTools: ['activity-tracker', 'goal-setting', 'progress-charts', 'workout-planner', 'nutrition-tracker'],
    defaultActions: ['Record Activity', 'Analyze Progress', 'Get Recommendations']
  },
  {
    id: 'work-management',
    name: 'Work Management',
    type: 'productivity',
    description: 'Manage tasks, track time, and collaborate with team',
    icon: <IconBriefcase className="text-blue-500" />,
    suggestedTools: ['task-tracker', 'time-logger', 'team-collaboration', 'deadline-reminder', 'meeting-scheduler'],
    defaultActions: ['Log Task', 'Track Time', 'Update Status']
  },
  {
    id: 'commute-assistant',
    name: 'Commute Assistant',
    type: 'transportation',
    description: 'Optimize your daily commute with real-time updates',
    icon: <IconCar className="text-amber-500" />,
    suggestedTools: ['route-optimizer', 'traffic-monitor', 'time-estimator', 'weather-checker', 'transport-selector'],
    defaultActions: ['Plan Route', 'Check Conditions', 'Log Journey']
  },
  {
    id: 'study-tracker',
    name: 'Study Tracker',
    type: 'education',
    description: 'Track study sessions and manage learning progress',
    icon: <IconBook className="text-purple-500" />,
    suggestedTools: ['study-timer', 'topic-tracker', 'quiz-maker', 'note-organizer', 'revision-scheduler'],
    defaultActions: ['Start Session', 'Take Notes', 'Review Progress']
  },
  {
    id: 'health-monitor',
    name: 'Health Monitor',
    type: 'health',
    description: 'Track health metrics and medication schedules',
    icon: <IconPill className="text-red-500" />,
    suggestedTools: ['medication-tracker', 'symptom-logger', 'appointment-scheduler', 'health-metrics', 'diet-tracker'],
    defaultActions: ['Log Health Data', 'Check Schedule', 'Get Insights']
  },
  {
    id: 'habit-builder',
    name: 'Habit Builder',
    type: 'lifestyle',
    description: 'Build and track daily habits for better living',
    icon: <IconChartBar className="text-indigo-500" />,
    suggestedTools: ['habit-tracker', 'streak-counter', 'reminder-system', 'progress-visualizer', 'motivation-booster'],
    defaultActions: ['Check In', 'View Progress', 'Get Motivation']
  },
  {
    id: 'project-manager',
    name: 'Project Manager',
    type: 'work',
    description: 'Manage projects and track deliverables',
    icon: <IconCalendarTime className="text-cyan-500" />,
    suggestedTools: ['task-board', 'timeline-tracker', 'resource-manager', 'milestone-tracker', 'report-generator'],
    defaultActions: ['Update Tasks', 'Check Timeline', 'Generate Report']
  },
  {
    id: 'home-automation',
    name: 'Home Assistant',
    type: 'lifestyle',
    description: 'Manage home tasks and automation schedules',
    icon: <IconHome className="text-orange-500" />,
    suggestedTools: ['task-scheduler', 'inventory-tracker', 'maintenance-logger', 'shopping-list', 'budget-tracker'],
    defaultActions: ['Add Task', 'Check Schedule', 'Update Inventory']
  },
  {
    id: 'eco-tracker',
    name: 'Eco Impact Tracker',
    type: 'sustainability',
    description: 'Track and reduce your environmental impact',
    icon: <IconLeaf className="text-green-500" />,
    suggestedTools: ['carbon-calculator', 'recycling-tracker', 'energy-monitor', 'water-usage', 'eco-tips'],
    defaultActions: ['Log Activity', 'Calculate Impact', 'Get Tips']
  },
  {
    id: 'developer-tools',
    name: 'Developer Assistant',
    type: 'development',
    description: 'Track coding time and manage development tasks',
    icon: <IconCode className="text-zinc-300" />,
    suggestedTools: ['code-timer', 'git-tracker', 'bug-logger', 'deployment-monitor', 'api-tester'],
    defaultActions: ['Start Coding', 'Log Issue', 'Track Deployment']
  }
];

// Available tools organized by category
const toolCategories = {
  input: [
    {
      id: 'image-recognition',
      name: 'Image Recognition',
      description: 'Analyze images to identify objects and text',
      icon: <IconCamera className="text-blue-500" />
    },
    {
      id: 'text-input',
      name: 'Text Input',
      description: 'Process natural language queries',
      icon: <IconMoodSmile className="text-green-500" />
    },
    {
      id: 'data-collector',
      name: 'Data Collector',
      description: 'Collect and validate various types of data',
      icon: <IconDeviceAnalytics className="text-purple-500" />
    }
  ],
  process: [
    {
      id: 'ai-processor',
      name: 'AI Processing',
      description: 'Advanced AI analysis and recommendations',
      icon: <IconBrain className="text-purple-500" />
    },
    {
      id: 'search',
      name: 'Search',
      description: 'Search across various data sources',
      icon: <IconSearch className="text-amber-500" />
    }
  ],
  automation: [
    {
      id: 'scheduler',
      name: 'Task Scheduler',
      description: 'Schedule and automate tasks',
      icon: <IconCalendarTime className="text-blue-500" />
    },
    {
      id: 'notifier',
      name: 'Smart Notifications',
      description: 'Intelligent notification system',
      icon: <IconBell className="text-amber-500" />
    }
  ]
};

// Add local storage functions near the other utility functions
const LOCAL_STORAGE_KEY = 'grid_layout_config';

const saveLayoutToLocalStorage = (layouts: StoredLayout[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(layouts));
  } catch (error) {
    console.error('Error saving to local storage:', error);
  }
};

const loadLayoutFromLocalStorage = (): StoredLayout[] | null => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading from local storage:', error);
    return null;
  }
};

// Update the saveLayoutToFirebase function to use local storage as fallback
const saveLayoutToFirebase = async (layouts: StoredLayout[]) => {
  try {
    await setDoc(doc(db, 'layouts', 'grid_config'), {
      layouts,
      updated_at: serverTimestamp()
    });
    // Also save to local storage as backup
    saveLayoutToLocalStorage(layouts);
  } catch (error) {
    console.error('Error saving to Firebase, falling back to local storage:', error);
    saveLayoutToLocalStorage(layouts);
  }
};

// Update the loadLayoutFromFirebase function to use local storage as fallback
const loadLayoutFromFirebase = async (): Promise<StoredLayout[] | null> => {
  try {
    const docRef = doc(db, 'layouts', 'grid_config');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const layouts = docSnap.data().layouts;
      // Save to local storage as backup
      saveLayoutToLocalStorage(layouts);
      return layouts;
    }
    
    // Try loading from local storage if Firebase fails
    const localLayouts = loadLayoutFromLocalStorage();
    if (localLayouts) {
      return localLayouts;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading from Firebase, trying local storage:', error);
    return loadLayoutFromLocalStorage();
  }
};

// Add debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function Home() {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [expanded, setExpanded] = useState<ExpandedState>({
    isExpanded: false,
    templateId: null
  });
  const [newContext, setNewContext] = useState({
    name: '',
    type: '',
    description: '',
    selectedTools: [] as string[],
    isPublic: false
  });
  const [width, setWidth] = useState(0);
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    layouts: contextTemplates.map((template, i) => ({
      i: template.id,
      x: (i % 3) * 4,  // More space between items horizontally
      y: Math.floor(i / 3) * 4,  // More space between items vertically
      w: 3,  // Slightly wider default size
      h: 3,  // Slightly taller default size
      minW: 2,
      minH: 2,
      maxW: 6,  // Limit maximum width
      maxH: 6,  // Limit maximum height
      isDraggable: true,
      isResizable: true
    })),
    cols: 12,
    rowHeight: 80,  // Smaller row height for finer control
    width: 0,
    margin: [20, 20]  // Increased margins between items
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Update grid width on window resize
  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('.grid-container');
      if (container) {
        setWidth(container.clientWidth);
        setGridConfig(prev => ({ ...prev, width: container.clientWidth }));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Update the useEffect for initial layout loading to handle errors better
  useEffect(() => {
    const loadInitialLayout = async () => {
      try {
        const savedLayout = await loadLayoutFromFirebase();
        
        if (savedLayout) {
          setGridConfig(prev => ({
            ...prev,
            layouts: savedLayout.map(layout => ({
              ...layout,
              isDraggable: true,
              isResizable: true
            }))
          }));
        } else {
          // Use default layout if no saved layout exists
          const defaultLayout = contextTemplates.map((template, i) => ({
            i: template.id,
            x: (i % 3) * 4,
            y: Math.floor(i / 3) * 4,
            w: 3,
            h: 3,
            minW: 2,
            minH: 2,
            maxW: 6,
            maxH: 6,
            isDraggable: true,
            isResizable: true
          }));
          
          setGridConfig(prev => ({
            ...prev,
            layouts: defaultLayout
          }));
          
          // Save default layout
          await saveLayoutToFirebase(defaultLayout);
        }
      } catch (error) {
        console.error('Error in loadInitialLayout:', error);
        // Use default layout as last resort
        const defaultLayout = contextTemplates.map((template, i) => ({
          i: template.id,
          x: (i % 3) * 4,
          y: Math.floor(i / 3) * 4,
          w: 3,
          h: 3,
          minW: 2,
          minH: 2,
          maxW: 6,
          maxH: 6,
          isDraggable: true,
          isResizable: true
        }));
        
        setGridConfig(prev => ({
          ...prev,
          layouts: defaultLayout
        }));
      }
    };

    loadInitialLayout();
  }, []);

  const handleTemplateClick = (templateId: string) => {
    if (!isEditMode && !isResizing && !isDragging) {
      if (expanded.templateId === templateId) {
        setExpanded({ isExpanded: false, templateId: null });
      } else {
        setExpanded({ isExpanded: true, templateId: templateId });
      }
    }
  };

  const handleCreateContext = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const template = contextTemplates.find(t => t.id === selectedTemplate);
      
      // Convert string tool IDs to ContextTool objects
      const contextTools: ContextTool[] = newContext.selectedTools.map(toolId => {
        const tool = Object.values(toolCategories)
          .flat()
          .find(t => t.id === toolId);
        
        return {
          id: toolId,
          name: tool?.name || toolId,
          description: tool?.description || '',
          icon: tool?.icon || <IconTool />
        };
      });

      const contextData = {
        name: newContext.name,
        type: newContext.type,
        description: newContext.description,
        tools: contextTools,
        actions: template?.defaultActions || [],
        isPublic: newContext.isPublic,
        created_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'contexts'), contextData);
      
      const newContextObj: Context = {
        id: docRef.id,
        ...contextData,
        icon: getContextIcon(newContext.type),
        created_at: new Date()
      };

      setContexts([...contexts, newContextObj]);
      setSelectedTemplate('');
      setNewContext({
        name: '',
        type: '',
        description: '',
        selectedTools: [],
        isPublic: false
      });
    } catch (error) {
      console.error('Error creating context:', error);
    }
  };

  const getContextIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'shopping':
        return <IconShoppingCart className="text-emerald-500" />;
      case 'development':
        return <IconCode className="text-blue-500" />;
      default:
        return <IconTool className="text-zinc-500" />;
    }
  };

  const handleContextClick = (contextId: string) => {
    // Add your context click handling logic here
    console.log('Context clicked:', contextId);
    // For example, you could navigate to a context detail page
    // or open a modal with context details
  };

  useEffect(() => {
    const preventDrag = (e: DragEvent) => {
      if (isResizing || isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const preventNavigation = (e: MouseEvent) => {
      if (isResizing || isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('click', preventNavigation, true);
    
    return () => {
      document.removeEventListener('dragstart', preventDrag);
      document.removeEventListener('click', preventNavigation, true);
    };
  }, [isResizing, isDragging]);

  return (
    <div className="min-h-screen bg-black pt-6 pb-28 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Context Templates Grid */}
        <div className="grid-container relative min-h-[400px]">
          {isEditMode && (
            <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg p-4 flex items-center gap-4">
                <p className="text-sm text-zinc-400">
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full text-xs mr-2">!</span>
                  Edit mode active - Layout changes will be saved when you finish editing
                </p>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-sm"
                >
                  Finish Editing
                </button>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Contexts</h1>
              <p className="text-sm text-zinc-400 mt-1">Create and manage your context-based tools</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  isEditMode 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                }`}
              >
                {isEditMode ? 'Finish Editing' : 'Edit Layout'}
              </button>
              <button
                onClick={() => setSelectedTemplate('')}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-sm"
                disabled={isEditMode}
              >
                <IconPlus size={16} />
                New Context
              </button>
            </div>
          </div>
          <GridLayout
            className="layout"
            layout={gridConfig.layouts}
            cols={gridConfig.cols}
            rowHeight={gridConfig.rowHeight}
            width={width}
            margin={gridConfig.margin}
            onLayoutChange={(newLayout: Layout[]) => {
              if (isEditMode) {
                const updatedLayouts = newLayout.map(layout => ({
                  ...layout,
                  isDraggable: true,
                  isResizable: true
                }));
                setGridConfig(prev => ({ ...prev, layouts: updatedLayouts }));
                debounce((layouts: StoredLayout[]) => saveLayoutToFirebase(layouts), 1000)(updatedLayouts);
              }
            }}
            isResizable={isEditMode}
            isDraggable={isEditMode}
            resizeHandles={['se', 'sw', 'ne', 'nw']}
            compactType="vertical"
            preventCollision={false}
            isBounded={true}
            draggableHandle={isEditMode ? ".cursor-move" : ""}
            useCSSTransforms={true}
            transformScale={1}
            autoSize={true}
            verticalCompact={true}
            onResizeStart={() => setIsResizing(true)}
            onResizeStop={() => setIsResizing(false)}
            onDragStart={() => setIsDragging(true)}
            onDragStop={() => setIsDragging(false)}
          >
            {contextTemplates.map((template) => (
              <div key={template.id}>
                <Card 
                  className="h-full group bg-zinc-900 hover:bg-zinc-800 transition-colors"
                >
                  <CardContent className="h-full p-4">
                    <div 
                      className="h-full flex flex-col items-center justify-center text-center cursor-pointer"
                      onClick={() => handleTemplateClick(template.id)}
                    >
                      <div className="p-4 bg-zinc-800/50 rounded-xl mb-3 group-hover:bg-zinc-700/50 transition-colors">
                        {template.icon}
                      </div>
                      <h3 className="text-sm font-medium text-zinc-100 mb-1">{template.name}</h3>
                      <p className="text-xs text-zinc-400">{template.type}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </GridLayout>
        </div>

        {/* User's Active Contexts */}
        {contexts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-zinc-100 mb-4">Your Contexts</h2>
            <div className="grid-container relative min-h-[400px]">
              <GridLayout
                className="layout"
                layout={contexts.map((context, i) => {
                  const savedLayout = gridConfig.layouts.find(l => l.i === context.id);
                  return savedLayout || {
                    i: context.id,
                    x: (i % 3) * 4,
                    y: Math.floor(i / 3) * 4,
                    w: 3,
                    h: 3,
                    minW: 2,
                    minH: 2,
                    maxW: 6,
                    maxH: 6,
                    isDraggable: isEditMode,
                    isResizable: isEditMode
                  };
                })}
                cols={gridConfig.cols}
                rowHeight={gridConfig.rowHeight}
                width={width}
                margin={gridConfig.margin}
                onLayoutChange={(newLayout: Layout[]) => {
                  if (isEditMode) {
                    const updatedLayouts = newLayout.map(layout => ({
                      ...layout,
                      isDraggable: true,
                      isResizable: true
                    }));
                    setGridConfig(prev => ({ ...prev, layouts: updatedLayouts }));
                    debounce((layouts: StoredLayout[]) => saveLayoutToFirebase(layouts), 1000)(updatedLayouts);
                  }
                }}
                isResizable={isEditMode}
                isDraggable={isEditMode}
                resizeHandles={['se', 'sw', 'ne', 'nw']}
                compactType="vertical"
                preventCollision={false}
                isBounded={true}
                draggableHandle={isEditMode ? ".cursor-move" : ""}
                useCSSTransforms={true}
                transformScale={1}
                autoSize={true}
                verticalCompact={true}
                onResizeStart={() => setIsResizing(true)}
                onResizeStop={() => setIsResizing(false)}
                onDragStart={() => setIsDragging(true)}
                onDragStop={() => setIsDragging(false)}
              >
                {contexts.map((context) => (
                  <div key={context.id}>
                    <Card 
                      className="h-full bg-zinc-900 hover:bg-zinc-800 transition-colors group"
                    >
                      <CardContent className="h-full p-4">
                        <div className="h-full">
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-2 bg-zinc-800 rounded-lg cursor-move">
                              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8M8 15h8" />
                              </svg>
                            </div>
                          </div>
                          <div 
                            className="h-full flex flex-col items-center justify-center text-center cursor-pointer"
                            onClick={() => handleContextClick(context.id)}
                          >
                            <div className="p-4 bg-zinc-800/50 rounded-xl mb-3">
                              {context.icon}
                            </div>
                            <h3 className="text-sm font-medium text-zinc-100 mb-1">{context.name}</h3>
                            <p className="text-xs text-zinc-400">{context.type}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </GridLayout>
            </div>
          </div>
        )}

        {/* Modal for expanded view */}
        {expanded.isExpanded && !isEditMode && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setExpanded({ isExpanded: false, templateId: null })} />
            <div className="relative min-h-screen flex items-center justify-center p-4">
              <div className="relative bg-zinc-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {contextTemplates.map((template) => {
                  if (template.id === expanded.templateId) {
                    return (
                      <div key={template.id} className="p-6">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-zinc-800 rounded-xl">
                              {template.icon}
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-zinc-100">{template.name}</h3>
                              <p className="text-sm text-zinc-400">{template.type}</p>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpanded({ isExpanded: false, templateId: null });
                            }}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <IconX className="text-zinc-400" size={20} />
                          </button>
                        </div>

                        <p className="text-sm text-zinc-300 mb-6">{template.description}</p>

                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-medium text-zinc-400 mb-3">Suggested Tools</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {template.suggestedTools.map((tool) => (
                                <div
                                  key={tool}
                                  className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-lg"
                                >
                                  <IconTool size={16} className="text-zinc-400" />
                                  <span className="text-sm text-zinc-300">
                                    {tool.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-zinc-400 mb-3">Default Actions</h4>
                            <div className="space-y-2">
                              {template.defaultActions.map((action, index) => (
                                <div
                                  key={action}
                                  className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
                                >
                                  <span className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">
                                    {index + 1}
                                  </span>
                                  <span className="text-sm text-zinc-300">{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleCreateContext(e);
                              setSelectedTemplate('');
                              setExpanded({ isExpanded: false, templateId: null });
                            }}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Use This Template
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        )}

        {/* Update the navigation section at the bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800">
          <div className="max-w-xl mx-auto p-4">
            <div className="flex justify-center space-x-8">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  if (!isEditMode && !isResizing && !isDragging) {
                    window.location.href = '/';
                  }
                }}
                disabled={isEditMode || isResizing || isDragging}
                className={`text-sm ${
                  isEditMode || isResizing || isDragging
                    ? 'text-zinc-600 cursor-not-allowed' 
                    : 'text-zinc-300 hover:text-zinc-100'
                }`}
              >
                Home
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!isEditMode && !isResizing && !isDragging) {
                    window.location.href = '/context';
                  }
                }}
                disabled={isEditMode || isResizing || isDragging}
                className={`text-sm ${
                  isEditMode || isResizing || isDragging
                    ? 'text-zinc-600 cursor-not-allowed' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Context
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 