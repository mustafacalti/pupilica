import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

interface StudentLoginFormProps {
  onToggleMode: () => void;
  onToggleRole: () => void;
}

export const StudentLoginForm: React.FC<StudentLoginFormProps> = ({
  onToggleMode,
  onToggleRole
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Giriş yapılırken bir hata oluştu');
    }

    setLoading(false);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
          <LogIn className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Öğrenci Girişi</h2>
        <p className="text-gray-600 mt-2">Hesabınıza giriş yapın</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            E-posta Adresi
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="ogrenci@email.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Şifre
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-gray-600">
          Henüz hesabınız yok mu?{' '}
          <button
            onClick={onToggleMode}
            className="text-primary font-medium hover:text-blue-700"
          >
            Kayıt olun
          </button>
        </p>
        <p className="text-gray-600">
          Veli misiniz?{' '}
          <button
            onClick={onToggleRole}
            className="text-secondary font-medium hover:text-purple-700"
          >
            Veli girişi
          </button>
        </p>
      </div>
    </div>
  );
};