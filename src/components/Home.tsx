import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Card, CardContent } from "./ui/card";
import GridLayout, { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "../styles/grid.css";
import { 
  IconPlus, IconTool, IconBrain, IconSearch, IconCamera, 
   IconCode, IconRun, IconBriefcase, IconCar, IconBook, IconPill, IconChartBar, IconCalendarTime, IconHome,
  IconLeaf, IconBell, IconX 
} from "@tabler/icons-react";
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs} from "firebase/firestore";
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

// Add this type definition at the top with other interfaces
type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

// Update the StoredLayout interface to include resizeHandles
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
  resizeHandles?: ResizeHandle[];
}

// Add this new interface for stored positions
interface StoredPosition {
  id: string;
  layout: StoredLayout;
  lastModified: number;
}

// Update the GridConfig interface
interface GridConfig {
  layouts: StoredLayout[];
  cols: number;
  rowHeight: number;
  width: number;
  margin: [number, number];
}

// Update the Tool interface to make status optional with a default value
interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  status?: 'available' | 'coming_soon';
}

// Update the contextTemplates array to use dynamic tools
const baseContextTemplates = [
  {
    id: 'fitness',
    name: 'Fitness Tracker',
    type: 'health',
    description: 'Track workouts, set fitness goals, and monitor progress',
    icon: <IconRun className="text-emerald-500" />,
    defaultActions: ['Record Activity', 'Analyze Progress', 'Get Recommendations']
  },
  {
    id: 'work-management',
    name: 'Work Management',
    type: 'productivity',
    description: 'Manage tasks, track time, and collaborate with team',
    icon: <IconBriefcase className="text-blue-500" />,
    defaultActions: ['Log Task', 'Track Time', 'Update Status']
  },
  {
    id: 'commute-assistant',
    name: 'Commute Assistant',
    type: 'transportation',
    description: 'Optimize your daily commute with real-time updates',
    icon: <IconCar className="text-amber-500" />,
    defaultActions: ['Plan Route', 'Check Conditions', 'Log Journey']
  },
  {
    id: 'study-tracker',
    name: 'Study Tracker',
    type: 'education',
    description: 'Track study sessions and manage learning progress',
    icon: <IconBook className="text-purple-500" />,
    defaultActions: ['Start Session', 'Take Notes', 'Review Progress']
  },
  {
    id: 'health-monitor',
    name: 'Health Monitor',
    type: 'health',
    description: 'Track health metrics and medication schedules',
    icon: <IconPill className="text-red-500" />,
    defaultActions: ['Log Health Data', 'Check Schedule', 'Get Insights']
  },
  {
    id: 'habit-builder',
    name: 'Habit Builder',
    type: 'lifestyle',
    description: 'Build and track daily habits for better living',
    icon: <IconChartBar className="text-indigo-500" />,
    defaultActions: ['Check In', 'View Progress', 'Get Motivation']
  },
  {
    id: 'project-manager',
    name: 'Project Manager',
    type: 'work',
    description: 'Manage projects and track deliverables',
    icon: <IconCalendarTime className="text-cyan-500" />,
    defaultActions: ['Update Tasks', 'Check Timeline', 'Generate Report']
  },
  {
    id: 'home-automation',
    name: 'Home Assistant',
    type: 'lifestyle',
    description: 'Manage home tasks and automation schedules',
    icon: <IconHome className="text-orange-500" />,
    defaultActions: ['Add Task', 'Check Schedule', 'Update Inventory']
  },
  {
    id: 'eco-tracker',
    name: 'Eco Impact Tracker',
    type: 'sustainability',
    description: 'Track and reduce your environmental impact',
    icon: <IconLeaf className="text-green-500" />,
    defaultActions: ['Log Activity', 'Calculate Impact', 'Get Tips']
  },
  {
    id: 'developer-tools',
    name: 'Developer Assistant',
    type: 'development',
    description: 'Track coding time and manage development tasks',
    icon: <IconCode className="text-zinc-300" />,
    defaultActions: ['Start Coding', 'Log Issue', 'Track Deployment']
  }
];

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

// Add these utility functions near the other storage functions
const POSITIONS_STORAGE_KEY = 'card_positions';

const savePositionsToLocalStorage = (layouts: StoredLayout[]) => {
  try {
    const positions: StoredPosition[] = layouts.map(layout => ({
      id: layout.i,
      layout,
      lastModified: Date.now()
    }));
    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
  } catch (error) {
    console.error('Error saving positions to local storage:', error);
  }
};

const loadPositionsFromLocalStorage = (): StoredLayout[] | null => {
  try {
    const saved = localStorage.getItem(POSITIONS_STORAGE_KEY);
    if (!saved) return null;
    
    const positions: StoredPosition[] = JSON.parse(saved);
    return positions.map(p => p.layout);
  } catch (error) {
    console.error('Error loading positions from local storage:', error);
    return null;
  }
};

// Update the saveLayoutToFirebase function
const saveLayoutToFirebase = async (layouts: StoredLayout[]) => {
  try {
    await setDoc(doc(db, 'layouts', 'grid_config'), {
      layouts,
      updated_at: serverTimestamp()
    });
    // Save to both local storage systems
    saveLayoutToLocalStorage(layouts);
    savePositionsToLocalStorage(layouts);
  } catch (error) {
    console.error('Error saving to Firebase, falling back to local storage:', error);
    saveLayoutToLocalStorage(layouts);
    savePositionsToLocalStorage(layouts);
  }
};

// Update the loadLayoutFromFirebase function
const loadLayoutFromFirebase = async (): Promise<StoredLayout[] | null> => {
  try {
    const docRef = doc(db, 'layouts', 'grid_config');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const layouts = docSnap.data().layouts;
      saveLayoutToLocalStorage(layouts);
      savePositionsToLocalStorage(layouts);
      return layouts;
    }
    
    // Try loading from positions storage first
    const positionLayouts = loadPositionsFromLocalStorage();
    if (positionLayouts) {
      return positionLayouts;
    }
    
    // Fall back to regular layout storage
    const localLayouts = loadLayoutFromLocalStorage();
    if (localLayouts) {
      return localLayouts;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading from Firebase, trying local storage:', error);
    const positionLayouts = loadPositionsFromLocalStorage();
    return positionLayouts || loadLayoutFromLocalStorage();
  }
};

export default function Home() {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [, setSelectedTemplate] = useState<string>('');
  const [expanded, setExpanded] = useState<ExpandedState>({
    isExpanded: false,
    templateId: null
  });

  const [width, setWidth] = useState(0);
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    layouts: baseContextTemplates.map((template, i) => ({
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

  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [comingSoonTools, setComingSoonTools] = useState<Tool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [toolsError, setToolsError] = useState<string | null>(null);

  const [contextTemplates, setContextTemplates] = useState(baseContextTemplates);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());

  // Add useEffect to update templates when tools are loaded
  useEffect(() => {
    if (availableTools.length > 0) {
      const updatedTemplates = baseContextTemplates.map(template => ({
        ...template,
        suggestedTools: availableTools.map(tool => tool.id)
      }));
      setContextTemplates(updatedTemplates);
    }
  }, [availableTools]);

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
          const defaultLayout = baseContextTemplates.map((template, i) => ({
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
        const defaultLayout = baseContextTemplates.map((template, i) => ({
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

  // Update useEffect to handle tools without status
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setToolsLoading(true);
        setToolsError(null);

        const toolsRef = collection(db, 'tools');
        const toolsSnapshot = await getDocs(toolsRef);
        
        const available: Tool[] = [];
        const comingSoon: Tool[] = [];

        toolsSnapshot.forEach((doc) => {
          const tool = { id: doc.id, ...doc.data() } as Tool;
          // If status is not specified or is 'available', treat as available
          if (!tool.status || tool.status === 'available') {
            available.push(tool);
          } else {
            comingSoon.push(tool);
          }
        });

        console.log('Available tools:', available);
        console.log('Coming soon tools:', comingSoon);

        setAvailableTools(available);
        setComingSoonTools(comingSoon);
      } catch (error) {
        console.error('Error fetching tools:', error);
        setToolsError('Failed to load tools. Please try again later.');
      } finally {
        setToolsLoading(false);
      }
    };

    fetchTools();
  }, []);

  const handleTemplateClick = (templateId: string) => {
    if (!isEditMode) {
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
      const template = contextTemplates.find(t => t.id === expanded.templateId);
      if (!template) return;

      // Get the selected tools data
      const selectedToolsData = Array.from(selectedTools).map(toolId => {
        const tool = availableTools.find(t => t.id === toolId);
        return {
          id: toolId,
          name: tool?.name || '',
          description: tool?.description || '',
          icon: tool?.icon || 'default'
        };
      });

      const contextData = {
        name: template.name,
        type: template.type,
        description: template.description,
        tools: selectedToolsData,
        actions: template.defaultActions,
        isPublic: false,
        created_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'contexts'), contextData);
      
      const newContextObj: Context = {
        id: docRef.id,
        ...contextData,
        icon: template.icon,
        created_at: new Date()
      };

      setContexts(prev => [...prev, newContextObj]);
      setSelectedTemplate('');
      setExpanded({ isExpanded: false, templateId: null });
      setSelectedTools(new Set()); // Reset selections
    } catch (error) {
      console.error('Error creating context:', error);
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
      if (isEditMode) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const preventNavigation = (e: MouseEvent) => {
      if (isEditMode) {
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
  }, [isEditMode]);

  // Add helper function to get tool icon component
  const getToolIcon = (iconName: string): ReactNode => {
    switch (iconName) {
      case 'camera':
        return <IconCamera className="text-blue-500" />;
      case 'brain':
        return <IconBrain className="text-purple-500" />;
      case 'search':
        return <IconSearch className="text-amber-500" />;
      case 'calendar':
        return <IconCalendarTime className="text-blue-500" />;
      case 'bell':
        return <IconBell className="text-amber-500" />;
      default:
        return <IconTool className="text-zinc-500" />;
    }
  };

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
                const resizeHandles: ResizeHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
                const updatedLayouts = newLayout.map(layout => ({
                  ...layout,
                  isDraggable: true,
                  isResizable: true,
                  resizeHandles
                }));
                setGridConfig(prev => ({ ...prev, layouts: updatedLayouts }));
                saveLayoutToFirebase(updatedLayouts);
              }
            }}
            isResizable={isEditMode}
            isDraggable={isEditMode}
            resizeHandles={['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as ResizeHandle[]}
            compactType={null}
            preventCollision={true}
            isBounded={true}
            draggableHandle=".drag-handle"
            useCSSTransforms={true}
            transformScale={1}
            autoSize={true}
          >
            {contextTemplates.map((template) => (
              <div key={template.id}>
                <Card 
                  className="h-full group bg-zinc-900 hover:bg-zinc-800 transition-colors"
                >
                  <CardContent className="h-full p-4 relative">
                    {isEditMode && (
                      <div className="drag-handle absolute top-2 right-2 p-2 bg-zinc-800/80 rounded-lg cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8M8 15h8" />
                          </svg>
                          <span className="text-xs text-zinc-400">Drag</span>
                        </div>
                      </div>
                    )}
                    <div 
                      className={`h-full flex flex-col items-center justify-center text-center ${!isEditMode ? 'cursor-pointer' : ''}`}
                      onClick={() => !isEditMode && handleTemplateClick(template.id)}
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
                    saveLayoutToFirebase(updatedLayouts);
                  }
                }}
                isResizable={isEditMode}
                isDraggable={isEditMode}
                resizeHandles={['se']}
                compactType={null}
                preventCollision={true}
                isBounded={true}
                draggableHandle=".drag-handle"
                useCSSTransforms={true}
                transformScale={1}
                autoSize={true}
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
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-sm" 
              onClick={() => {
                setExpanded({ isExpanded: false, templateId: null });
                setSelectedTools(new Set()); // Reset selections when closing
              }} 
            />
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
                              setSelectedTools(new Set()); // Reset selections
                            }}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <IconX className="text-zinc-400" size={20} />
                          </button>
                        </div>

                        <p className="text-sm text-zinc-300 mb-6">{template.description}</p>

                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-medium text-zinc-400">Available Tools</h4>
                              <span className="text-xs text-zinc-500">
                                {selectedTools.size} tool{selectedTools.size !== 1 ? 's' : ''} selected
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {availableTools.map((tool) => (
                                <div
                                  key={tool.id}
                                  onClick={() => {
                                    setSelectedTools(prev => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(tool.id)) {
                                        newSet.delete(tool.id);
                                      } else {
                                        newSet.add(tool.id);
                                      }
                                      return newSet;
                                    });
                                  }}
                                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                    selectedTools.has(tool.id)
                                      ? 'bg-blue-500/20 border border-blue-500/50'
                                      : 'bg-zinc-800/50 hover:bg-zinc-700/50'
                                  }`}
                                >
                                  <div className={`flex items-center justify-center w-5 h-5 rounded border ${
                                    selectedTools.has(tool.id)
                                      ? 'border-blue-500 bg-blue-500'
                                      : 'border-zinc-600'
                                  }`}>
                                    {selectedTools.has(tool.id) && (
                                      <svg
                                        className="w-3 h-3 text-white"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <span className={`text-sm ${
                                      selectedTools.has(tool.id) ? 'text-blue-400' : 'text-zinc-300'
                                    }`}>
                                      {tool.name}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-zinc-400 mb-3">Default Actions</h4>
                            <div className="space-y-2">
                              {template.defaultActions.map((action, index) => (
                                <div
                                  key={index}
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
                              if (selectedTools.size === 0) {
                                return; // Don't proceed if no tools selected
                              }
                              await handleCreateContext(e);
                              setSelectedTemplate('');
                              setExpanded({ isExpanded: false, templateId: null });
                              setSelectedTools(new Set()); // Reset selections
                            }}
                            className={`w-full py-3 ${
                              selectedTools.size > 0
                                ? 'bg-blue-600 hover:bg-blue-500'
                                : 'bg-zinc-600 cursor-not-allowed'
                            } text-white rounded-lg text-sm font-medium transition-colors`}
                          >
                            {selectedTools.size > 0 
                              ? `Use Template with ${selectedTools.size} Tool${selectedTools.size !== 1 ? 's' : ''}`
                              : 'Select Tools to Continue'
                            }
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

        {/* Update Available Tools section */}
        {availableTools.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-zinc-100 mb-4">Available Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTools.map((tool) => (
                <Card key={tool.id} className="bg-zinc-900 hover:bg-zinc-800 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-800 rounded-lg">
                        {getToolIcon(tool.icon)}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-zinc-100">{tool.name}</h3>
                        <p className="text-xs text-zinc-400">{tool.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Update Coming Soon section */}
        {comingSoonTools.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-zinc-100 mb-4">Coming Soon</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comingSoonTools.map((tool) => (
                <Card key={tool.id} className="bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-800/50 rounded-lg">
                        {getToolIcon(tool.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-zinc-400">{tool.name}</h3>
                          <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-500">Coming Soon</span>
                        </div>
                        <p className="text-xs text-zinc-500">{tool.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Show message when no tools are available */}
        {!toolsLoading && availableTools.length === 0 && comingSoonTools.length === 0 && !toolsError && (
          <div className="mt-8 text-center py-12 bg-zinc-800/50 rounded-lg">
            <p className="text-zinc-400">No tools available at the moment.</p>
          </div>
        )}

        {/* Update the navigation section at the bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800">
          <div className="max-w-xl mx-auto p-4">
            <div className="flex justify-center space-x-8">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  if (!isEditMode) {
                    window.location.href = '/';
                  }
                }}
                disabled={isEditMode}
                className={`text-sm ${
                  isEditMode
                    ? 'text-zinc-600 cursor-not-allowed' 
                    : 'text-zinc-300 hover:text-zinc-100'
                }`}
              >
                Home
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!isEditMode) {
                    window.location.href = '/context';
                  }
                }}
                disabled={isEditMode}
                className={`text-sm ${
                  isEditMode
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