import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Brain, LogOut, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  aiStatus?: 'connected' | 'disconnected' | 'processing';
}

export const Header: React.FC<HeaderProps> = ({ aiStatus = 'connected' }) => {
  const { currentUser, logout } = useAuth();

  const getAIStatusIcon = () => {
    switch (aiStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-success" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-danger" />;
      case 'processing':
        return <div className="h-4 w-4 border-2 border-warning border-t-transparent rounded-full animate-spin" />;
      default:
        return <Wifi className="h-4 w-4 text-success" />;
    }
  };

  const getAIStatusText = () => {
    switch (aiStatus) {
      case 'connected':
        return 'AI Bağlı';
      case 'disconnected':
        return 'AI Bağlantısı Yok';
      case 'processing':
        return 'AI İşlemde';
      default:
        return 'AI Bağlı';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">PeakFokus AI</h1>
              <p className="text-sm text-gray-600">Veli Paneli</p>
            </div>
          </div>
        </div>

        {/* Right side - AI Status and User info */}
        <div className="flex items-center space-x-6">
          {/* AI Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
            {getAIStatusIcon()}
            <span className="text-sm font-medium text-gray-700">
              {getAIStatusText()}
            </span>
          </div>

          {/* User info */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">
                {currentUser?.name || 'Veli'}
              </p>
              <p className="text-xs text-gray-600">
                {currentUser?.email}
              </p>
            </div>

            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {currentUser?.name?.charAt(0) || 'V'}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Çıkış
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};