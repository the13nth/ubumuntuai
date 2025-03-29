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
  IconHome,
  IconSearch,
  IconUser,
  IconSettings,
} from "@tabler/icons-react"
import { useState, useEffect } from "react"

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

export function AppDashboard() {
  const [width, setWidth] = useState(0)
  
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

  const [layouts, setLayouts] = useState<Layout[]>(() => {
    return apps.map((app, i) => ({
      i: app.name,
      x: i % 3,
      y: Math.floor(i / 3),
      w: 1,
      h: 1,
    }))
  })

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 flex flex-col pb-32">
      <div className="grid-container w-full max-w-md mx-auto">
        <GridLayout
          className="layout"
          layout={layouts}
          cols={3}
          rowHeight={70}
          width={width}
          margin={[8, 8]}
          onLayoutChange={(newLayout: Layout[]) => setLayouts(newLayout)}
          isResizable={true}
          resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
          compactType={null}
          preventCollision={true}
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
    </div>
  )
} 