import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Ghost,
  MessageSquare,
  PieChart,
  Database,
  Bot,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react';
import BotStatus from './BotStatus';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const [showStatus, setShowStatus] = useState(true);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/groups', label: 'Groups', icon: MessageSquare },
    { path: '/analytics', label: 'Analytics', icon: PieChart },
    { path: '/summaries', label: 'AI Summaries', icon: Bot },
    { path: '/ghosts', label: 'Ghost Users', icon: Ghost },
    { path: '/export', label: 'Export Data', icon: Database },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-screen bg-wa-panel border-r border-gray-800 z-50
          transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-64'}
        `}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-wa-teal rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-wa-teal/20">
              A
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Alma</h1>
              <span className="text-xs text-wa-teal uppercase tracking-wider">Dashboard</span>
            </div>
          </Link>
          {/* Close button - mobile only */}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-wa-incoming lg:hidden"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                    ${
                      isActive(item.path)
                        ? 'bg-wa-teal/10 text-wa-teal border-l-4 border-wa-teal -ml-0.5'
                        : 'text-gray-400 hover:bg-wa-incoming/50 hover:text-gray-200'
                    }
                  `}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bot Status Widget */}
        <div className="px-2 pb-2">
          <button
            onClick={() => setShowStatus(!showStatus)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <span>Bot Status</span>
            <ChevronLeft
              size={14}
              className={`transition-transform ${showStatus ? 'rotate-90' : '-rotate-90'}`}
            />
          </button>
          {showStatus && (
            <div className="animate-fade-in">
              <BotStatus />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-500 text-center">
            <p>Created by Gerardo</p>
            <p className="mt-1 text-wa-teal/60">Alma's God 🛐</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
