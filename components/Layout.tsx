import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Bell } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-wa-dark text-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Top Bar - Mobile */}
        <header className="sticky top-0 z-30 bg-wa-panel/95 backdrop-blur border-b border-gray-800 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-wa-incoming transition-colors"
            >
              <Menu size={24} className="text-gray-300" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-wa-teal rounded-full flex items-center justify-center text-white font-bold">
                A
              </div>
              <span className="font-bold text-white">Alma</span>
            </div>
            <button className="p-2 rounded-lg hover:bg-wa-incoming transition-colors relative">
              <Bell size={20} className="text-gray-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-wa-teal rounded-full" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Footer - Desktop */}
        <footer className="hidden lg:block py-4 px-8 border-t border-gray-800 text-center text-xs text-gray-600">
          <p>
            Alma Dashboard v1.0.0 • Built with React, Supabase & OpenAI •{' '}
            <a
              href="https://github.com/workofger/alma-whatsapp-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-wa-teal hover:underline"
            >
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
