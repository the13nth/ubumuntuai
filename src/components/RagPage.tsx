import { useState } from 'react';
import RagResponseViewer from './RagResponseViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export default function RagPage() {
  const [activeTab, setActiveTab] = useState('history');

  return (
    <div className="min-h-screen bg-black pt-6 pb-28 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-100 mb-6">Firebase RAG Responses</h1>
        <p className="text-zinc-400 mb-4">Displaying data directly from Firebase Firestore collection: rag_responses</p>
        
        <Tabs defaultValue="history" onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-zinc-800 text-zinc-400">
            <TabsTrigger value="history" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100">
              Response History
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100">
              Statistics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="history">
            <div className="mt-8">
              <RagResponseViewer />
            </div>
          </TabsContent>
          
          <TabsContent value="stats">
            <div className="text-center py-8 bg-zinc-800 rounded-lg p-10 mt-8">
              <h3 className="text-xl font-medium text-zinc-100 mb-2">Statistics Coming Soon</h3>
              <p className="text-zinc-400">
                Dashboard analytics will be available once sufficient query data has been collected in Firebase.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 