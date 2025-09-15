import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { TrendingUp, Users, Target, Lightbulb } from 'lucide-react';
import { PerformanceStats } from '../../types';

interface StatsCardsProps {
  stats: PerformanceStats;
  loading?: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading = false }) => {
  const cards = [
    {
      title: 'Haftalık İlerleme',
      value: `%${stats.weeklyProgress}`,
      icon: TrendingUp,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Tamamlanan Aktivite',
      value: stats.completedActivities.toString(),
      icon: Target,
      color: 'bg-green-500',
      change: '+8',
      changeType: 'positive' as const
    },
    {
      title: 'Ortalama Başarı',
      value: `%${stats.averageSuccess}`,
      icon: Users,
      color: 'bg-purple-500',
      change: '+5%',
      changeType: 'positive' as const
    },
    {
      title: 'AI Önerileri',
      value: stats.aiRecommendations.toString(),
      icon: Lightbulb,
      color: 'bg-yellow-500',
      change: '+3',
      changeType: 'positive' as const
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((index) => (
          <Card key={index} className="animate-pulse">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              </div>
              <div className="mt-4">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${card.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.change}
                </span>
                <span className="text-sm text-gray-600 ml-2">
                  son 7 günde
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};