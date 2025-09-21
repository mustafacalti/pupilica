import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  BarChart3,
  Calendar,
  MessageCircle,
  Users,
  Settings,
  ChevronRight,
  Brain
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Ana Sayfa',
      icon: Home,
      path: '/dashboard',
      description: 'Genel durum ve özet'
    },
    {
      id: 'analytics',
      label: 'Gelişim Analizi',
      icon: BarChart3,
      path: '/analytics',
      description: 'Detaylı performans raporları'
    },
    {
      id: 'calendar',
      label: 'Oyun Takvimi',
      icon: Calendar,
      path: '/calendar',
      description: 'Oyun seansları planlama'
    },
    {
      id: 'students',
      label: 'Çocuklarım',
      icon: Users,
      path: '/students',
      description: 'Çocuk profilleri ve detayları'
    },
    {
      id: 'chat',
      label: 'Uzman Chat',
      icon: MessageCircle,
      path: '/chat',
      description: 'AI uzman desteği'
    },
    {
      id: 'settings',
      label: 'Ayarlar',
      icon: Settings,
      path: '/settings',
      description: 'Hesap ve uygulama ayarları'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-40 transition-all duration-300 ${
        isHovered ? 'w-72' : 'w-16'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo/Brand */}
      <div className="h-16 flex items-center border-b border-gray-200 px-3">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <div className={`ml-3 overflow-hidden transition-all duration-300 ${
          isHovered ? 'w-48 opacity-100' : 'w-0 opacity-0'
        }`}>
          <div className="whitespace-nowrap">
            <div className="text-lg font-bold text-gray-800">PeakFokus</div>
            <div className="text-xs text-gray-500">AI Eğitim Platformu</div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center py-3 mx-2 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center justify-center w-10 h-10 ml-1 flex-shrink-0">
                <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'}`} />
              </div>

              <div className={`ml-3 flex-1 overflow-hidden transition-all duration-300 ${
                isHovered ? 'w-48 opacity-100' : 'w-0 opacity-0'
              }`}>
                <div className="whitespace-nowrap">
                  <div className={`font-medium ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.description}
                  </div>
                </div>
              </div>

              <div className={`mr-2 transition-all duration-300 ${
                isHovered ? 'w-4 opacity-100' : 'w-0 opacity-0'
              }`}>
                {isHovered && (
                  <ChevronRight className={`h-4 w-4 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                  }`} />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`absolute bottom-4 left-0 right-0 px-4 transition-all duration-300 overflow-hidden ${
        isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="text-sm font-medium whitespace-nowrap">AI Aktif</span>
          </div>
          <div className="text-xs text-gray-600 mt-1 whitespace-nowrap">
            Tüm sistemler çalışıyor
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;