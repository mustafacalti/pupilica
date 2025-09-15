import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Student, EmotionResult } from '../../types';
import { User, Plus, Eye, Edit, Trash2 } from 'lucide-react';

interface StudentListProps {
  students: Student[];
  loading?: boolean;
  onAddStudent: () => void;
  onViewStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  getStudentLastEmotion?: (studentId: string) => EmotionResult | null;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  loading = false,
  onAddStudent,
  onViewStudent,
  onEditStudent,
  onDeleteStudent,
  getStudentLastEmotion
}) => {
  const getEmotionColor = (emotion: string) => {
    const colors = {
      happy: 'bg-green-100 text-green-800',
      sad: 'bg-blue-100 text-blue-800',
      angry: 'bg-red-100 text-red-800',
      neutral: 'bg-gray-100 text-gray-800',
      focused: 'bg-purple-100 text-purple-800',
      confused: 'bg-yellow-100 text-yellow-800'
    };
    return colors[emotion as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojis = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      neutral: '😐',
      focused: '🧐',
      confused: '😕'
    };
    return emojis[emotion as keyof typeof emojis] || '😐';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Öğrenciler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="animate-pulse flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded"></div>
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
        <div className="flex items-center justify-between">
          <CardTitle>Öğrenciler ({students.length})</CardTitle>
          <Button onClick={onAddStudent} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Öğrenci
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Henüz öğrenci eklenmemiş</p>
            <Button onClick={onAddStudent} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              İlk öğrenciyi ekle
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => {
              const lastEmotion = getStudentLastEmotion?.(student.id);

              return (
                <div
                  key={student.id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Student Avatar */}
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Student Info */}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{student.name}</h4>
                    <p className="text-sm text-gray-600">
                      {student.age} yaş
                      {student.notes && ` • ${student.notes.slice(0, 30)}${student.notes.length > 30 ? '...' : ''}`}
                    </p>
                  </div>

                  {/* Emotion Status */}
                  {lastEmotion && (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getEmotionColor(lastEmotion.emotion)}`}>
                      <span className="mr-1">{getEmotionEmoji(lastEmotion.emotion)}</span>
                      {lastEmotion.emotion}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewStudent(student)}
                      className="text-gray-600 hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditStudent(student)}
                      className="text-gray-600 hover:text-secondary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteStudent(student.id)}
                      className="text-gray-600 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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