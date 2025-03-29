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
import { currentUiXml, updateUiXml } from "../store/uiState"
import { XMLParser } from "fast-xml-parser"

const generateXmlDescription = (
  layouts: Layout[],
  apps: Array<{ name: string; percentage: number; icon: React.ReactNode }>,
  gridConfig: { cols: number; rows: number; rowHeight: number; margin: [number, number] }
) => {
  const xmlTemplate = `<AppDashboard>
    <!-- Main Container -->
    <Container class="min-h-screen bg-black padding-4-6 flex-col">
        <!-- Grid Container with max width xl and centered -->
        <GridContainer class="max-w-xl mx-auto">
            <!-- React Grid Layout Configuration -->
            <GridLayout
                columns="${gridConfig.cols}"
                rows="${gridConfig.rows}"
                rowHeight="${gridConfig.rowHeight}px"
                margin="[${gridConfig.margin[0]}, ${gridConfig.margin[1]}]"
                preventCollision="true"
                bounded="true"
                resizable="true"
                draggable="true">
                
                <!-- Grid Constraints -->
                <GridConstraints>
                    <Cell>
                        <MinWidth>1</MinWidth>
                        <MaxWidth>${gridConfig.cols}</MaxWidth>
                        <MinHeight>1</MinHeight>
                        <MaxHeight>${gridConfig.rows}</MaxHeight>
                    </Cell>
                </GridConstraints>

                <!-- App Cards - Total ${apps.length} cards -->
                <AppCards>
                    ${layouts.map(layout => `
                    <AppCard position="dynamic" class="bg-zinc-900 border-zinc-800">
                        <Layout>
                            <Width>${layout.w}</Width>
                            <Height>${layout.h}</Height>
                            <XPosition>${layout.x}</XPosition>
                            <YPosition>${layout.y}</YPosition>
                        </Layout>
                    </AppCard>`).join('\n                    ')}
                </AppCards>

                <!-- Interaction Features -->
                <InteractionFeatures>
                    <DragHandles>enabled</DragHandles>
                    <ResizeHandles>
                        <Handle>north</Handle>
                        <Handle>south</Handle>
                        <Handle>east</Handle>
                        <Handle>west</Handle>
                        <Handle>northwest</Handle>
                        <Handle>northeast</Handle>
                        <Handle>southwest</Handle>
                        <Handle>southeast</Handle>
                    </ResizeHandles>
                </InteractionFeatures>
            </GridLayout>
        </GridContainer>

        <!-- Available Apps -->
        <Apps>
            ${apps.map(app => {
              const iconComponent = app.icon as React.ReactElement | undefined;
              const iconName = iconComponent?.type?.toString().split('Icon')[1] || '';
              return `<App name="${app.name}" percentage="${app.percentage}" icon="Icon${iconName}" />`;
            }).join('\n            ')}
        </Apps>

        <!-- Navigation -->
        <Navigation class="fixed bottom-0 left-0 right-0 bg-zinc-900">
            <Container class="max-w-xl mx-auto space-y-4">
                <div className="flex items-center space-x-4 p-2">
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
                            const newConfig = {
                                ...gridConfig,
                                rows: parseInt(rowInput) || gridConfig.rows,
                                cols: parseInt(colInput) || gridConfig.cols
                            };
                            setGridConfig(newConfig);
                            const newLayouts = generateInitialLayout(newConfig);
                            setLayouts(newLayouts);
                        }}
                        className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors"
                    >
                        Apply
                    </button>
                </div>
                <Input
                    type="text"
                    placeholder="Type something..."
                    class="w-full p-2 bg-zinc-800 text-zinc-300"/>
                <Links class="flex justify-center space-x-8">
                    <Link to="/" class="text-sm text-zinc-300"/>
                    <Link to="/context" class="text-sm text-zinc-500"/>
                    <Link to="/xml-editor" class="text-sm text-zinc-500"/>
                </Links>
            </Container>
        </Navigation>

        <!-- Responsive Behavior -->
        <ResponsiveFeatures>
            <DynamicWidth>true</DynamicWidth>
            <AutoResize>true</AutoResize>
            <BreakpointClasses>
                <Small>sm:p-4</Small>
                <Default>p-3</Default>
            </BreakpointClasses>
        </ResponsiveFeatures>

        <!-- Swipe Navigation -->
        <SwipeNavigation>
            <SwipeIndicator/>
            <SwipeGestures>
                <Swipe direction="left" from="/" to="/context"/>
                <Swipe direction="right" from="/context" to="/"/>
            </SwipeGestures>
        </SwipeNavigation>
    </Container>
</AppDashboard>`;

  return xmlTemplate;
};

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

interface AppDashboardProps {
  defaultConfig?: {
    cols: number;
    rows: number;
    rowHeight: number;
    margin: [number, number];
    layouts?: any[];
  };
}

export function AppDashboard({ defaultConfig }: AppDashboardProps) {
  const initialConfig = defaultConfig || {
    cols: 5,
    rows: 10,
    rowHeight: 60,
    margin: [6, 6] as [number, number]
  };

  const [width, setWidth] = useState(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [gridConfig, setGridConfig] = useState(initialConfig);
  const [rowInput, setRowInput] = useState(initialConfig.rows.toString())
  const [colInput, setColInput] = useState(initialConfig.cols.toString())
  
  useEffect(() => {
    const updateWidth = () => {
      const containerWidth = document.querySelector('.grid-container')?.clientWidth || 0
      setWidth(containerWidth)
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const apps = [
    { name: "Facebook", percentage: 29, icon: <IconBrandFacebook size={18} /> },
    { name: "Google Mail", percentage: 13, icon: <IconBrandGmail size={18} /> },
    { name: "Instagram", percentage: 31, icon: <IconBrandInstagram size={18} /> },
    { name: "Number 26", percentage: 0, icon: <IconNumber size={18} /> },
    { name: "Whatsapp", percentage: 15, icon: <IconBrandWhatsapp size={18} /> },
    { name: "Twitter", percentage: 13, icon: <IconBrandX size={18} /> },
    { name: "Google Maps", percentage: 24, icon: <IconMap size={18} /> },
    { name: "Spotify", percentage: 21, icon: <IconBrandSpotify size={18} /> },
    { name: "Uber", percentage: 0, icon: <IconCar size={18} /> },
    { name: "Drive Now", percentage: 9, icon: <IconCarSuv size={18} /> },
    { name: "New York Times", percentage: 27, icon: <IconNews size={18} /> },
    { name: "Skype", percentage: 18, icon: <IconBrandSkype size={18} /> },
  ]

  const generateInitialLayout = (config: typeof gridConfig) => {
    return apps.map((app, i) => ({
      i: app.name,
      x: i % config.cols,
      y: Math.floor(i / config.cols),
      w: 1,
      h: 1,
      maxW: config.cols,
      maxH: config.rows,
      minW: 1,
      minH: 1,
    }));
  };

  const [layouts, setLayouts] = useState<Layout[]>(() => generateInitialLayout(initialConfig));

  // Initialize with default XML
  useEffect(() => {
    if (isInitialLoad) {
      const defaultXml = generateXmlDescription(layouts, apps, initialConfig);
      updateUiXml(defaultXml);
      setIsInitialLoad(false);
    }
  }, []);

  // Listen for XML changes and update grid configuration
  useEffect(() => {
    if (currentUiXml && !isInitialLoad) {
      try {
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "",
          parseAttributeValue: true,
          allowBooleanAttributes: true,
          trimValues: true
        });
        
        const parsed = parser.parse(currentUiXml);
        
        if (parsed.AppDashboard?.GridLayout) {
          const gridLayout = parsed.AppDashboard.GridLayout;
          const columns = parseInt(gridLayout.columns) || 5;
          const rows = parseInt(gridLayout.rows) || 10;
          const rowHeight = parseInt(gridLayout.rowHeight) || 60;
          let margin: [number, number] = [6, 6];
          
          if (gridLayout.margin) {
            try {
              const marginArray = JSON.parse(gridLayout.margin.replace(/px/g, ''));
              if (Array.isArray(marginArray) && marginArray.length === 2) {
                margin = marginArray as [number, number];
              }
            } catch (e) {
              console.warn("Failed to parse margin, using default");
            }
          }

          console.log('Updating grid config:', { columns, rows, rowHeight, margin });
          
          const newConfig = {
            cols: columns,
            rows: rows,
            rowHeight: rowHeight,
            margin: margin
          };

          setGridConfig(newConfig);

          // Update layouts based on new grid configuration
          const newLayouts = generateInitialLayout(newConfig);
          console.log('New layouts:', newLayouts);
          
          setLayouts(newLayouts);
        }
      } catch (error) {
        console.error("Error parsing XML in AppDashboard:", error);
      }
    }
  }, [currentUiXml, isInitialLoad]);

  // Only update XML on manual layout changes, not during initial load or XML updates
  useEffect(() => {
    if (!isInitialLoad) {
      const xml = generateXmlDescription(layouts, apps, gridConfig);
      if (xml !== currentUiXml) {
        console.log('Layout manually changed, updating XML');
        updateUiXml(xml);
      }
    }
  }, [layouts, isInitialLoad]);

  console.log('Rendering grid with config:', gridConfig);
  console.log('Current layouts:', layouts);

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 flex flex-col pb-32">
      <div className="grid-container w-full max-w-xl mx-auto" style={{ minHeight: `${gridConfig.rows * gridConfig.rowHeight}px` }}>
        <GridLayout
          className="layout"
          layout={layouts}
          cols={gridConfig.cols}
          rowHeight={gridConfig.rowHeight}
          width={width}
          margin={gridConfig.margin}
          onLayoutChange={(newLayout: Layout[]) => {
            console.log('Layout changed:', newLayout);
            setLayouts(newLayout);
          }}
          isResizable={true}
          resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
          compactType={null}
          preventCollision={true}
          isBounded={true}
          maxRows={gridConfig.rows}
          verticalCompact={false}
        >
          {apps.map((app) => (
            <div key={app.name}>
              <AppCard
                name={app.name}
                percentage={app.percentage}
                icon={app.icon}
              />
            </div>
          ))}
        </GridLayout>
      </div>
      
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
                const newConfig = {
                  ...gridConfig,
                  rows: parseInt(rowInput) || gridConfig.rows,
                  cols: parseInt(colInput) || gridConfig.cols
                };
                setGridConfig(newConfig);
                const newLayouts = generateInitialLayout(newConfig);
                setLayouts(newLayouts);
              }}
              className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors"
            >
              Apply
            </button>
          </div>
          <input
            type="text"
            placeholder="Type something..."
            className="w-full p-2 bg-zinc-800 text-zinc-300 rounded"
          />
          <div className="flex justify-center space-x-8">
            <a href="/" className="text-sm text-zinc-300">Home</a>
            <a href="/context" className="text-sm text-zinc-500">Context</a>
            <a href="/xml-editor" className="text-sm text-zinc-500">XML Editor</a>
          </div>
        </div>
      </div>
    </div>
  )
} 