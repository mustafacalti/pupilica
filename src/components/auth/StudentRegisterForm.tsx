import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserPlus, Mail, Lock, User, Calendar, Users, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface StudentRegisterFormProps {
  onToggleMode: () => void;
  onToggleRole: () => void;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

export const StudentRegisterForm: React.FC<StudentRegisterFormProps> = ({
  onToggleMode,
  onToggleRole
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  // Öğretmenleri yükle
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const teachersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'teacher')
        );
        const querySnapshot = await getDocs(teachersQuery);
        const teachersList: Teacher[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          teachersList.push({
            id: doc.id,
            name: data.name,
            email: data.email
          });
        });
        setTeachers(teachersList);
      } catch (error) {
        console.error('Öğretmenler yüklenirken hata:', error);
      }
    };

    loadTeachers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (!teacherId) {
      setError('Lütfen bir öğretmen seçin');
      return;
    }

    const studentAge = parseInt(age);
    if (isNaN(studentAge) || studentAge < 3 || studentAge > 18) {
      setError('Yaş 3-18 arasında olmalıdır');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name, 'student', studentAge, teacherId);
    } catch (err: any) {
      setError(err.message || 'Kayıt olurken bir hata oluştu');
    }

    setLoading(false);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
          <UserPlus className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Öğrenci Kaydı</h2>
        <p className="text-gray-600 mt-2">Yeni öğrenci hesabı oluşturun</p>
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
            Ad Soyad
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Öğrenci Adı"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yaş
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="number"
              min="3"
              max="18"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Yaş"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Öğretmen Seçin
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
              required
            >
              <option value="">Öğretmen seçin...</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Şifre Tekrar
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? 'Kayıt oluşturuluyor...' : 'Öğrenci Kaydı Oluştur'}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-gray-600">
          Zaten hesabınız var mı?{' '}
          <button
            onClick={onToggleMode}
            className="text-primary font-medium hover:text-blue-700"
          >
            Giriş yapın
          </button>
        </p>
        <p className="text-gray-600">
          Öğretmen misiniz?{' '}
          <button
            onClick={onToggleRole}
            className="text-secondary font-medium hover:text-purple-700"
          >
            Öğretmen kaydı
          </button>
        </p>
      </div>
    </div>
  );
};