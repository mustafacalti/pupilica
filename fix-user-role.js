// Tek seferlik kullanıcı role güncellemesi
// Bu kodu browser console'da çalıştır

import { doc, updateDoc } from 'firebase/firestore';
import { db } from './src/services/firebase';

const updateUserRole = async () => {
  try {
    const userRef = doc(db, 'users', 'L2ayvV7dYgUppKdgpNSGxHBhYwi2');
    await updateDoc(userRef, {
      role: 'teacher' // veya 'student'
    });
    console.log('Kullanıcı role güncellendi!');
  } catch (error) {
    console.error('Hata:', error);
  }
};

// Çalıştır
updateUserRole();