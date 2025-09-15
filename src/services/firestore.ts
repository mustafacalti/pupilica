import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Student, Activity, AIInsight } from '../types';

// User operations
export const createUser = async (uid: string, data: { email: string; name: string }) => {
  if (!uid) throw new Error("UID boş geldi");
  const ref = doc(db, "users", uid); // belge id = UID
  await setDoc(ref, { uid, ...data, createdAt: serverTimestamp() }, { merge: true });
  const snap = await getDoc(ref);
  return snap.data();
};

export const getUser = async (userId: string): Promise<User | null> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt.toDate()
    } as User;
  }
  return null;
};

// Student operations
export const createStudent = async (studentData: Omit<Student, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'students'), {
    ...studentData,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const getStudentsByTeacher = async (teacherId: string): Promise<Student[]> => {
  const q = query(
    collection(db, 'students'),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate()
  })) as Student[];
};

export const updateStudent = async (studentId: string, data: Partial<Student>) => {
  const docRef = doc(db, 'students', studentId);
  await updateDoc(docRef, data);
};

export const deleteStudent = async (studentId: string) => {
  await deleteDoc(doc(db, 'students', studentId));
};

// Activity operations
export const createActivity = async (activityData: Omit<Activity, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'activities'), {
    ...activityData,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const getActivitiesByStudent = async (studentId: string): Promise<Activity[]> => {
  const q = query(
    collection(db, 'activities'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate()
  })) as Activity[];
};

// AI Insights operations
export const createAIInsight = async (insightData: Omit<AIInsight, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'ai_insights'), {
    ...insightData,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const getAIInsightsByStudent = async (studentId: string): Promise<AIInsight[]> => {
  const q = query(
    collection(db, 'ai_insights'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate()
  })) as AIInsight[];
};

// Real-time listeners
export const subscribeToStudents = (teacherId: string, callback: (students: Student[]) => void) => {
  const q = query(
    collection(db, 'students'),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const students = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Student[];
    callback(students);
  });
};