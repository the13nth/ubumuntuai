import { Card, CardContent } from "./ui/card"
import GridLayout, { Layout } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import {
  IconBrandFacebook,
  IconBrandGmail,
  IconBrandInstagram,
  IconNumber,
  IconBrandWhatsapp,
  IconBrandX,
  IconMap,
  IconBrandSpotify,
  IconCar,
  IconCarSuv,
  IconNews,
  IconBrandSkype,
  IconRobot,
  IconActivity,
  IconBriefcase,
} from "@tabler/icons-react"
import { useState, useEffect } from "react"
import type { DashboardConfig } from '../agent'
import { collection, query, orderBy, limit, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore"
import { db } from "../lib/firebase"

interface AppCardProps {
  name: string
  percentage: number
  category?: string
  icon?: React.ReactNode
}

interface HealthRecommendation {
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

interface ActiveContext {
  id: string;
  name: string;
  icon: React.ReactNode;
  recommendation?: HealthRecommendation;
  workRecommendation?: WorkRecommendation;
  commuteRecommendation?: CommuteRecommendation;
}


const AppCard = ({ name, percentage, category, icon }: AppCardProps) => {
  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50 transition-colors h-full cursor-move">
      <CardContent className="p-3 sm:p-4 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-zinc-400">{name}</p>
            <p className="text-xs sm:text-sm font-medium text-zinc-300">{percentage}%</p>
          </div>
          {icon && <div className="text-zinc-400">{icon}</div>}
        </div>
        {category && (
          <div className="mt-2 inline-flex">
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full capitalize">
              {category}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const getIconForApp = (name: string) => {
  switch (name) {
    case "Facebook":
      return <IconBrandFacebook size={18} />;
    case "Google Mail":
      return <IconBrandGmail size={18} />;
    case "Instagram":
      return <IconBrandInstagram size={18} />;
    case "Number 26":
      return <IconNumber size={18} />;
    case "Whatsapp":
      return <IconBrandWhatsapp size={18} />;
    case "Twitter":
      return <IconBrandX size={18} />;
    case "Google Maps":
      return <IconMap size={18} />;
    case "Spotify":
      return <IconBrandSpotify size={18} />;
    case "Uber":
      return <IconCar size={18} />;
    case "Drive Now":
      return <IconCarSuv size={18} />;
    case "New York Times":
      return <IconNews size={18} />;
    case "Skype":
      return <IconBrandSkype size={18} />;
    default:
      return null;
  }
};

export interface AppDashboardProps {
  defaultConfig: DashboardConfig;
  hideControls?: boolean;
}

export function AppDashboard({ defaultConfig, hideControls = false }: AppDashboardProps) {
  const [width, setWidth] = useState(0)
  const [gridConfig, setGridConfig] = useState<DashboardConfig>(defaultConfig);
  const [rowInput, setRowInput] = useState(defaultConfig.rows.toString())
  const [colInput, setColInput] = useState(defaultConfig.cols.toString())
  const [activeContexts, setActiveContexts] = useState<ActiveContext[]>([])
  
  // Update grid config when defaultConfig changes
  useEffect(() => {
    console.log('Default config changed:', defaultConfig);
    setGridConfig(defaultConfig);
    setRowInput(defaultConfig.rows.toString());
    setColInput(defaultConfig.cols.toString());
  }, [defaultConfig]);

  useEffect(() => {
    const fetchActiveContexts = async () => {
      try {
        // First, get all context statuses
        const healthStatusDoc = await getDoc(doc(db, 'context_status', 'health'));
        const workStatusDoc = await getDoc(doc(db, 'context_status', 'work'));
        const commuteStatusDoc = await getDoc(doc(db, 'context_status', 'commute'));

        const contexts: ActiveContext[] = [];

        // Only fetch and add health context if it's active
        if (healthStatusDoc.exists() && healthStatusDoc.data().active) {
          const healthRef = collection(db, 'health_ai_recommendation');
          const healthQuery = query(healthRef, orderBy('timestamp', 'desc'), limit(1));
          const healthSnapshot = await getDocs(healthQuery);
          
          if (!healthSnapshot.empty) {
            const healthData = healthSnapshot.docs[0].data();
            contexts.push({
              id: 'health',
              name: 'Health: Diabetes',
              icon: <IconActivity className="text-emerald-500" size={24} />,
              recommendation: {
                recommendations: healthData.recommendations || [],
                timestamp: healthData.timestamp.toDate(),
                status: healthData.status || 'Normal'
              }
            });
          }
        }

        // Only fetch and add work context if it's active
        if (workStatusDoc.exists() && workStatusDoc.data().active) {
          const workRef = collection(db, 'work_ai_recommendation');
          const workQuery = query(workRef, orderBy('timestamp', 'desc'), limit(1));
          const workSnapshot = await getDocs(workQuery);
          
          if (!workSnapshot.empty) {
            const workData = workSnapshot.docs[0].data();
            contexts.push({
              id: 'work',
              name: 'Work',
              icon: <IconBriefcase className="text-blue-500" size={24} />,
              workRecommendation: {
                recommendations: workData.recommendations || [],
                timestamp: workData.timestamp.toDate(),
                status: workData.status || '',
                taskName: workData.taskName || '',
                priority: workData.priority || '',
                deadline: workData.deadline || ''
              }
            });
          }
        }

        // Only fetch and add commute context if it's active
        if (commuteStatusDoc.exists() && commuteStatusDoc.data().active) {
          const commuteRef = collection(db, 'commute_ai_recommendation');
          const commuteQuery = query(commuteRef, orderBy('timestamp', 'desc'), limit(1));
          const commuteSnapshot = await getDocs(commuteQuery);
          
          if (!commuteSnapshot.empty) {
            const commuteData = commuteSnapshot.docs[0].data();
            contexts.push({
              id: 'commute',
              name: 'Commute',
              icon: <IconCar className="text-amber-500" size={24} />,
              commuteRecommendation: {
                recommendations: commuteData.recommendations || [],
                timestamp: commuteData.timestamp.toDate(),
                startLocation: commuteData.startLocation || '',
                endLocation: commuteData.endLocation || '',
                duration: commuteData.duration || '',
                trafficCondition: commuteData.trafficCondition || '',
                transportMode: commuteData.transportMode || ''
              }
            });
          }
        }

        setActiveContexts(contexts);
      } catch (error) {
        console.error('Error fetching active contexts:', error);
      }
    };

    fetchActiveContexts();

    // Set up real-time listener for context status changes
    const statusCollection = collection(db, 'context_status');
    const unsubscribe = onSnapshot(statusCollection, () => {
      fetchActiveContexts();
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      const containerWidth = document.querySelector('.grid-container')?.clientWidth || 0
      setWidth(containerWidth)
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  console.log('Rendering grid with config:', gridConfig);
  console.log('Current layouts:', gridConfig.layouts);

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 flex flex-col pb-32">
      <div className="grid-container w-full max-w-xl mx-auto" style={{ minHeight: `${gridConfig.rows * gridConfig.rowHeight}px` }}>
        <GridLayout
          className="layout"
          layout={gridConfig.layouts || []}
          cols={gridConfig.cols}
          rowHeight={gridConfig.rowHeight}
          width={width}
          margin={gridConfig.margin}
          onLayoutChange={(newLayout: Layout[]) => {
            console.log('Layout changed:', newLayout);
            setGridConfig((prev: DashboardConfig) => ({ ...prev, layouts: newLayout }));
          }}
          isResizable={true}
          resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
          compactType={null}
          preventCollision={true}
          isBounded={true}
          maxRows={gridConfig.rows}
          verticalCompact={false}
        >
          {gridConfig.apps.map((app: { name: string; percentage: number; category?: string }) => (
            <div key={app.name}>
              <AppCard
                name={app.name}
                percentage={app.percentage}
                category={app.category}
                icon={getIconForApp(app.name)}
              />
            </div>
          ))}
        </GridLayout>

        {/* Active Contexts Section */}
        {activeContexts.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-lg font-medium text-zinc-100 px-1">Active Contexts</h2>
            <div className="space-y-4">
              {activeContexts.map((context) => (
                <Card 
                  key={context.id} 
                  className="bg-zinc-900 border-zinc-800 border-l-4 border-l-emerald-500"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      {context.icon}
                      <h3 className="text-base font-medium text-zinc-100">{context.name}</h3>
                    </div>

                    {/* Health Context */}
                    {context.id === 'health' && context.recommendation && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <IconRobot className="text-emerald-500" size={18} />
                            <h4 className="text-sm font-medium text-emerald-500">AI Recommendations</h4>
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
                              <p className="text-sm text-zinc-300">{rec}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Work Context */}
                    {context.id === 'work' && context.workRecommendation && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <IconRobot className="text-blue-500" size={18} />
                            <h4 className="text-sm font-medium text-blue-500">Task Status</h4>
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
                        <div className="mb-3 text-sm">
                          <p className="text-zinc-200 font-medium">{context.workRecommendation.taskName}</p>
                          <p className="text-zinc-400 text-xs mt-1">
                            Deadline: {new Date(context.workRecommendation.deadline).toLocaleString()}
                          </p>
                        </div>
                        <ul className="space-y-2">
                          {context.workRecommendation.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <p className="text-sm text-zinc-300">{rec}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Commute Context */}
                    {context.id === 'commute' && context.commuteRecommendation && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <IconRobot className="text-amber-500" size={18} />
                            <h4 className="text-sm font-medium text-amber-500">Route Status</h4>
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
                        <div className="mb-3 text-sm space-y-1">
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
                              <p className="text-sm text-zinc-300">{rec}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {!hideControls && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900">
          <div className="max-w-xl mx-auto space-y-4 p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-zinc-400">Rows:</label>
                <input
                  type="number"
                  value={rowInput}
                  onChange={(e) => setRowInput(e.target.value)}
                  className="w-16 p-1 bg-zinc-800 text-zinc-300 rounded"
                  min="1"
                  max="20"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-zinc-400">Columns:</label>
                <input
                  type="number"
                  value={colInput}
                  onChange={(e) => setColInput(e.target.value)}
                  className="w-16 p-1 bg-zinc-800 text-zinc-300 rounded"
                  min="1"
                  max="12"
                />
              </div>
              <button
                onClick={() => {
                  const newConfig: DashboardConfig = {
                    ...gridConfig,
                    rows: parseInt(rowInput) || gridConfig.rows,
                    cols: parseInt(colInput) || gridConfig.cols,
                  };
                  setGridConfig(newConfig);
                }}
                className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors"
              >
                Apply
              </button>
            </div>
            <div className="flex justify-center space-x-8">
              <a href="/" className="text-sm text-zinc-300">Home</a>
              <a href="/context" className="text-sm text-zinc-500">Context</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 