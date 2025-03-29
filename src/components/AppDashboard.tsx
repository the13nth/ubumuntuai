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
  IconGripHorizontal,
} from "@tabler/icons-react"
import { useState } from "react"

interface AppCardProps {
  name: string
  percentage: number
  icon?: React.ReactNode
  onResizeStart?: () => void
}

const AppCard = ({ name, percentage, icon, onResizeStart }: AppCardProps) => {
  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50 transition-colors h-full">
      <CardContent className="p-4 flex items-center justify-between h-full">
        <div className="space-y-1.5">
          <p className="text-sm text-zinc-400">{name}</p>
          <p className="text-sm font-medium text-zinc-300">{percentage}%</p>
        </div>
        <div className="flex flex-col items-end justify-between h-full">
          {icon && <div className="text-zinc-400">{icon}</div>}
          <div 
            className="text-zinc-600 cursor-move mt-auto" 
            onMouseDown={onResizeStart}
          >
            <IconGripHorizontal size={16} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AppDashboard() {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const apps = [
    { name: "Facebook", percentage: 29, icon: <IconBrandFacebook size={20} /> },
    { name: "Google Mail", percentage: 13, icon: <IconBrandGmail size={20} /> },
    { name: "Instagram", percentage: 31, icon: <IconBrandInstagram size={20} /> },
    { name: "Number 26", percentage: 0, icon: <IconNumber size={20} /> },
    { name: "Whatsapp", percentage: 15, icon: <IconBrandWhatsapp size={20} /> },
    { name: "Twitter", percentage: 13, icon: <IconBrandX size={20} /> },
    { name: "Google Maps", percentage: 24, icon: <IconMap size={20} /> },
    { name: "Spotify", percentage: 21, icon: <IconBrandSpotify size={20} /> },
    { name: "Uber", percentage: 0, icon: <IconCar size={20} /> },
    { name: "Drive Now", percentage: 9, icon: <IconCarSuv size={20} /> },
    { name: "New York Times", percentage: 27, icon: <IconNews size={20} /> },
    { name: "Skype", percentage: 18, icon: <IconBrandSkype size={20} /> },
  ]

  const [layouts, setLayouts] = useState<Layout[]>(() => {
    return apps.map((app, i) => ({
      i: app.name,
      x: i % 5,
      y: Math.floor(i / 5),
      w: 1,
      h: 1,
    }))
  })

  return (
    <div className="min-h-screen bg-black p-6 flex flex-col pb-32">
      <h1 className="text-2xl font-semibold text-zinc-100 mb-6 text-center">
        {getGreeting()}, Germain
      </h1>
      <div className="max-w-2xl mx-auto w-full">
        <GridLayout
          className="layout"
          layout={layouts}
          cols={5}
          rowHeight={80}
          width={600}
          margin={[12, 12]}
          onLayoutChange={(newLayout: Layout[]) => setLayouts(newLayout)}
          draggableHandle=".cursor-move"
          isResizable={true}
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
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 p-4">
        <input
          type="text"
          placeholder="Type something..."
          className="w-full max-w-sm mx-auto block mb-4 bg-zinc-800 border-0 rounded-lg px-4 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700"
        />
        <nav className="flex justify-around items-center max-w-sm mx-auto">
          <button className="p-2 text-zinc-400 hover:text-zinc-100">
            <IconHome size={24} />
          </button>
          <button className="p-2 text-zinc-400 hover:text-zinc-100">
            <IconSearch size={24} />
          </button>
          <button className="p-2 text-zinc-400 hover:text-zinc-100">
            <IconUser size={24} />
          </button>
          <button className="p-2 text-zinc-400 hover:text-zinc-100">
            <IconSettings size={24} />
          </button>
        </nav>
      </div>
    </div>
  )
} 