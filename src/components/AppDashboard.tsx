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
} from "@tabler/icons-react"
import { useState, useEffect } from "react"
import type { DashboardConfig } from '../agent'

interface AppCardProps {
  name: string
  percentage: number
  category?: string
  icon?: React.ReactNode
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
  
  // Update grid config when defaultConfig changes
  useEffect(() => {
    console.log('Default config changed:', defaultConfig);
    setGridConfig(defaultConfig);
    setRowInput(defaultConfig.rows.toString());
    setColInput(defaultConfig.cols.toString());
  }, [defaultConfig]);

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