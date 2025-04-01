import { useState } from 'react';
import RagResponseViewer from './RagResponseViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { IconChartBar, IconHistory } from '@tabler/icons-react';

export default function RagPage() {
  const [, setActiveTab] = useState('history');

  return (
    <div className="min-h-screen bg-black pt-6 pb-28 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">RAG Analytics</h1>
          <p className="text-sm text-zinc-400">View and analyze query responses</p>
        </div>
        
        <Tabs defaultValue="history" onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 bg-zinc-800/50 text-zinc-400 p-1 gap-1">
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100"
            >
              <IconHistory size={16} />
              History
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="flex items-center gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100"
            >
              <IconChartBar size={16} />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="mt-0">
            <RagResponseViewer />
          </TabsContent>
          
          <TabsContent value="stats" className="mt-0">
            <div className="text-center py-12 bg-zinc-800/50 rounded-lg">
              <div className="max-w-md mx-auto px-6">
                <h3 className="text-xl font-medium text-zinc-100 mb-3">Analytics Coming Soon</h3>
                <p className="text-sm text-zinc-400">
                  Detailed insights will be available once sufficient data has been collected.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 