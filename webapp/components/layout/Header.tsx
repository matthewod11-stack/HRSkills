'use client'

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">HR</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">HR Command Center</h1>
              <p className="text-sm text-gray-600">Powered by Claude AI</p>
            </div>
          </div>

          <nav className="flex items-center space-x-6">
            <button className="text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </button>
            <button className="text-gray-600 hover:text-gray-900 transition-colors">
              Skills
            </button>
            <button className="text-gray-600 hover:text-gray-900 transition-colors">
              Agents
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
