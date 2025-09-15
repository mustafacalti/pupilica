import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { AIInsight } from '../../types';
import { AlertTriangle, CheckCircle, Info, Lightbulb, Clock } from 'lucide-react';

interface AIInsightsPanelProps {
  insights: AIInsight[];
  loading?: boolean;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  insights,
  loading = false
}) => {
  const getInsightIcon = (type: string) => {
    const icons = {
      progress: CheckCircle,
      attention: AlertTriangle,
      recommendation: Lightbulb,
      warning: AlertTriangle
    };
    return icons[type as keyof typeof icons] || Info;
  };

  const getInsightColor = (priority: string, type: string) => {
    if (type === 'warning' || priority === 'high') {
      return 'bg-red-50 border-red-200 text-red-800';
    }
    if (type === 'attention' || priority === 'medium') {
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
    if (type === 'progress') {
      return 'bg-green-50 border-green-200 text-green-800';
    }
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  const getInsightTitle = (type: string) => {
    const titles = {
      progress: 'İlerleme',
      attention: 'Dikkat',
      recommendation: 'Öneri',
      warning: 'Uyarı'
    };
    return titles[type as keyof typeof titles] || 'Bilgi';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} gün önce`;
    if (hours > 0) return `${hours} saat önce`;
    if (minutes > 0) return `${minutes} dakika önce`;
    return 'Az önce';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Öngörüleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="animate-pulse border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-primary" />
          AI Öngörüleri ({insights.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Henüz AI öngörüsü yok</p>
            <p className="text-sm text-gray-500">
              Öğrenciler aktivite yaptıkça AI öngörüleri burada görünecek
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {insights.map((insight) => {
              const Icon = getInsightIcon(insight.type);

              return (
                <div
                  key={insight.id}
                  className={`border rounded-lg p-4 ${getInsightColor(insight.priority, insight.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">
                          {getInsightTitle(insight.type)}
                        </h4>
                        <div className="flex items-center text-xs opacity-75">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(insight.createdAt)}
                        </div>
                      </div>
                      <p className="text-sm opacity-90">
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};