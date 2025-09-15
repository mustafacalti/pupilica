import React, { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { StudentLoginForm } from '../components/auth/StudentLoginForm';
import { StudentRegisterForm } from '../components/auth/StudentRegisterForm';
import { Brain, Sparkles } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userRole, setUserRole] = useState<'teacher' | 'student'>('teacher');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center gap-12">
        {/* Left side - Branding */}
        <div className="hidden lg:block flex-1 max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-primary to-secondary rounded-full mb-6">
              <Brain className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              NeuroLearn AI
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Otizmli öğrenciler için yapay zeka destekli eğitim platformu
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center mb-3">
                <Sparkles className="h-6 w-6 text-primary mr-3" />
                <h3 className="font-semibold text-gray-800">AI Destekli İçerik</h3>
              </div>
              <p className="text-gray-600">
                Yapay zeka ile öğrenciye özel sorular ve aktiviteler üretilir
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-success rounded-full mr-3"></div>
                <h3 className="font-semibold text-gray-800">Duygu Analizi</h3>
              </div>
              <p className="text-gray-600">
                Gerçek zamanlı duygu tanıma ile öğrencinin durumu takip edilir
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-warning rounded-full mr-3"></div>
                <h3 className="font-semibold text-gray-800">Akıllı Raporlama</h3>
              </div>
              <p className="text-gray-600">
                Detaylı analitik ve öğrenci gelişim raporları
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <div className="flex-1 max-w-md">
          {/* Role Toggle */}
          <div className="bg-white p-1 rounded-lg shadow-sm mb-6 flex">
            <button
              onClick={() => setUserRole('teacher')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                userRole === 'teacher'
                  ? 'bg-secondary text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Öğretmen
            </button>
            <button
              onClick={() => setUserRole('student')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                userRole === 'student'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Öğrenci
            </button>
          </div>

          {/* Auth Forms */}
          {userRole === 'teacher' ? (
            isLogin ? (
              <LoginForm onToggleMode={() => setIsLogin(false)} />
            ) : (
              <RegisterForm onToggleMode={() => setIsLogin(true)} />
            )
          ) : (
            isLogin ? (
              <StudentLoginForm
                onToggleMode={() => setIsLogin(false)}
                onToggleRole={() => setUserRole('teacher')}
              />
            ) : (
              <StudentRegisterForm
                onToggleMode={() => setIsLogin(true)}
                onToggleRole={() => setUserRole('teacher')}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};