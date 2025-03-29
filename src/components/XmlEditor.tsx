import { useState, useEffect } from "react"
import { Card, CardContent } from "./ui/card"
import GridLayout, { Layout } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import * as Icons from "@tabler/icons-react"
import { XMLParser } from "fast-xml-parser"
import { useNavigate } from "react-router-dom"
import { currentUiXml, updateUiXml } from "../store/uiState"

interface AppCardProps {
  name: string
  percentage: number
  icon?: React.ReactNode
}

const AppCard = ({ name, percentage, icon }: AppCardProps) => {
  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50 transition-colors h-full cursor-move">
      <CardContent className="p-3 sm:p-4 flex items-center justify-between h-full">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-zinc-400">{name}</p>
          <p className="text-xs sm:text-sm font-medium text-zinc-300">{percentage}%</p>
        </div>
        {icon && <div className="text-zinc-400">{icon}</div>}
      </CardContent>
    </Card>
  )
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></div>
  </div>
)

export function XmlEditor() {
  const navigate = useNavigate()
  const [width, setWidth] = useState(0)
  const [xmlInput, setXmlInput] = useState("")
  const [isApplying, setIsApplying] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [newUiXml, setNewUiXml] = useState("")
  const [gridConfig, setGridConfig] = useState({
    cols: 5,
    rows: 10,
    rowHeight: 60,
    margin: [6, 6] as [number, number]
  })
  const [apps, setApps] = useState<Array<{ name: string; percentage: number; icon: string }>>([])
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [error, setError] = useState<string | null>(null)

  // Initialize with current UI XML
  useEffect(() => {
    if (currentUiXml) {
      setXmlInput(currentUiXml);
      console.log('Initializing editor with current XML:', currentUiXml);
    }
  }, [currentUiXml]);

  useEffect(() => {
    const updateWidth = () => {
      const containerWidth = document.querySelector('.grid-container')?.clientWidth || 0
      setWidth(containerWidth)
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Compare XML input with current UI XML
  const validateXml = (input: string) => {
    const normalizeXml = (xml: string) => xml.replace(/\s+/g, ' ').trim();
    const normalizedInput = normalizeXml(input);
    const normalizedCurrent = normalizeXml(currentUiXml);
    
    if (normalizedInput !== normalizedCurrent) {
      setNewUiXml(input);
      setHasChanges(true);
      console.log('XML Validation:');
      console.log('Current XML:', currentUiXml);
      console.log('New XML Input:', input);
      console.log('Differences detected');
    } else {
      setNewUiXml("");
      setHasChanges(false);
      console.log('XML Validation: No changes detected');
    }
  }

  const parseXml = async (xmlString: string) => {
    setIsApplying(true)
    setError(null)
    console.log('Starting XML Update:');
    console.log('Current XML:', currentUiXml);
    console.log('New XML to apply:', xmlString);
    
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
        parseAttributeValue: true,
        allowBooleanAttributes: true,
        trimValues: true
      })
      
      const parsed = parser.parse(xmlString)
      
      if (!parsed.AppDashboard) {
        throw new Error("Invalid XML: Root element must be AppDashboard")
      }

      // Parse grid configuration
      const gridLayout = parsed.AppDashboard.GridLayout
      if (gridLayout) {
        const columns = parseInt(gridLayout.columns) || 5
        const rows = parseInt(gridLayout.rows) || 10
        const rowHeight = parseInt(gridLayout.rowHeight) || 60
        let margin: [number, number] = [6, 6]
        
        if (gridLayout.margin) {
          try {
            const marginArray = JSON.parse(gridLayout.margin.replace(/px/g, ''))
            if (Array.isArray(marginArray) && marginArray.length === 2) {
              margin = marginArray as [number, number]
            }
          } catch (e) {
            console.warn("Failed to parse margin, using default")
          }
        }

        setGridConfig({
          cols: columns,
          rows: rows,
          rowHeight: rowHeight,
          margin: margin
        })
      }

      // Parse apps
      const appsSection = parsed.AppDashboard.Apps?.App || []
      const appsList = Array.isArray(appsSection) ? appsSection : [appsSection]
      
      const processedApps = appsList.map((app: any) => ({
        name: app.name || "",
        percentage: parseInt(app.percentage) || 0,
        icon: app.icon || ""
      }))

      setApps(processedApps)
      
      // Create layouts based on the XML structure
      const newLayouts = processedApps.map((app, i) => ({
        i: app.name,
        x: i % gridConfig.cols,
        y: Math.floor(i / gridConfig.cols),
        w: 1,
        h: 1,
        maxW: gridConfig.cols,
        maxH: gridConfig.rows,
        minW: 1,
        minH: 1
      }))

      setLayouts(newLayouts)
      
      // Simulate a brief delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update the global UI state with the new XML
      console.log('Applying XML Update...');
      updateUiXml(xmlString)
      
      // Navigate to the app page
      navigate('/')
      
    } catch (err) {
      console.error("XML parsing error:", err)
      setError(err instanceof Error ? err.message : "Failed to parse XML")
    } finally {
      setIsApplying(false)
    }
  }

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName]
    return IconComponent ? <IconComponent size={18} /> : null
  }

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 flex flex-col pb-32">
      <div className="w-full max-w-xl mx-auto space-y-6">
        <div className="w-full">
          <textarea
            className="w-full h-64 p-4 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-lg font-mono text-sm"
            value={xmlInput}
            onChange={(e) => {
              setXmlInput(e.target.value);
              validateXml(e.target.value);
            }}
            placeholder="Paste your XML here..."
            disabled={isApplying}
          />
          <div className="mt-2 flex items-center space-x-4">
            {hasChanges ? (
              <button
                className={`px-4 py-2 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isApplying ? 'cursor-not-allowed' : ''
                }`}
                onClick={() => parseXml(newUiXml)}
                disabled={isApplying || !xmlInput.trim()}
              >
                {isApplying ? 'Applying Changes...' : 'Apply New Layout'}
              </button>
            ) : (
              <p className="text-zinc-500">No changes detected</p>
            )}
            {isApplying && <LoadingSpinner />}
          </div>
          {error && (
            <p className="mt-2 text-red-500 text-sm">{error}</p>
          )}
        </div>

        <div className="grid-container w-full">
          {width > 0 && layouts.length > 0 && (
            <GridLayout
              className="layout"
              layout={layouts}
              cols={gridConfig.cols}
              maxRows={gridConfig.rows}
              rowHeight={gridConfig.rowHeight}
              width={width}
              margin={gridConfig.margin}
              onLayoutChange={(newLayout: Layout[]) => setLayouts(newLayout)}
              isResizable={true}
              resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
              compactType={null}
              preventCollision={true}
              isBounded={true}
            >
              {apps.map((app) => (
                <div key={app.name}>
                  <AppCard
                    name={app.name}
                    percentage={app.percentage}
                    icon={getIconComponent(app.icon)}
                  />
                </div>
              ))}
            </GridLayout>
          )}
        </div>
      </div>
    </div>
  )
} 