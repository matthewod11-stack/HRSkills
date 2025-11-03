import ChatInterface from '@/components/chat/ChatInterface'
import MetricsDashboard from '@/components/dashboard/MetricsDashboard'
import Header from '@/components/layout/Header'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Metrics Dashboard */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">HR Metrics</h2>
            <MetricsDashboard />
          </div>

          {/* Right: Chat Interface */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">HR Assistant</h2>
            <ChatInterface />
          </div>
        </div>
      </main>
    </div>
  )
}
