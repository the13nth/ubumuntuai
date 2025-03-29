import { Card, CardContent } from "./ui/card"
import { IconPlus } from "@tabler/icons-react"

export function Context() {
  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 flex flex-col pb-32">
      <div className="w-full max-w-md mx-auto">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <button className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-3 px-4 rounded-lg transition-colors">
              <IconPlus size={20} />
              <span className="text-sm font-medium">Add Context</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 