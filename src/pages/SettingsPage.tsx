import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/dashboard/Header';
import { ArrowLeft, User, Bell, Shield, Palette, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [aiStatus] = useState<'connected' | 'disconnected' | 'processing'>('connected');
  const [activeTab, setActiveTab] = useState('profile');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'privacy', label: 'Gizlilik', icon: Shield },
    { id: 'appearance', label: 'Görünüm', icon: Palette },
  ];

  return (
    <>
      <Header aiStatus={aiStatus} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    ⚙️ Ayarlar
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {currentUser?.name} - Hesap ve uygulama ayarlarınızı yönetin
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>

          {/* Settings Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800">Profil Bilgileri</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
                        <input
                          type="text"
                          defaultValue={currentUser?.name}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                        <input
                          type="email"
                          defaultValue={currentUser?.email}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Değişiklikleri Kaydet
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800">Bildirim Ayarları</h2>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-800">E-posta Bildirimleri</h3>
                          <p className="text-sm text-gray-600">Çocuğunuzun gelişimi hakkında e-posta alın</p>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-800">Haftalık Rapor</h3>
                          <p className="text-sm text-gray-600">Haftalık gelişim raporu e-postası</p>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-800">AI Önerileri</h3>
                          <p className="text-sm text-gray-600">Yeni oyun önerileri ve ipuçları</p>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800">Gizlilik Ayarları</h2>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-800">Veri Paylaşımı</h3>
                          <p className="text-sm text-gray-600">Gelişim verilerinin anonim olarak paylaşılması</p>
                        </div>
                        <input type="checkbox" className="rounded" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-800">Analitik Çerezler</h3>
                          <p className="text-sm text-gray-600">Uygulama performansını iyileştirmek için</p>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800">Görünüm Ayarları</h2>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-800 mb-2">Tema</h3>
                        <div className="flex space-x-4">
                          <button className="p-3 border-2 border-blue-500 rounded-lg bg-white">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
                            <span className="text-sm mt-1 block">Açık</span>
                          </button>
                          <button className="p-3 border-2 border-gray-200 rounded-lg bg-gray-800">
                            <div className="w-8 h-8 bg-gray-600 rounded"></div>
                            <span className="text-sm mt-1 block text-white">Koyu</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};