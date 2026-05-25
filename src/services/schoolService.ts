import { db } from "../lib/firebase";
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, serverTimestamp } from "firebase/firestore";
import { School, SchoolMember, Student, ClassRoom } from "../types";

export const getSchool = async (schoolId: string): Promise<School | null> => {
  try {
    const docRef = doc(db, "schools", schoolId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as School;
  } catch (e) {
    console.error("Error getting school", e);
    return null;
  }
};

export const getSchoolMembers = async (schoolId: string): Promise<SchoolMember[]> => {
  try {
    const collRef = collection(db, `schools/${schoolId}/members`);
    const snap = await getDocs(collRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolMember));
  } catch (e) {
    console.error("Error getting school members", e);
    return [];
  }
};

export const addSchoolMember = async (schoolId: string, memberData: Omit<SchoolMember, "id" | "createdAt">): Promise<boolean> => {
  try {
    const collRef = collection(db, `schools/${schoolId}/members`);
    await addDoc(collRef, {
      ...memberData,
      createdAt: Date.now()
    });
    return true;
  } catch (e) {
    console.error("Error adding school member", e);
    return false;
  }
};

// Getting classes for a school
export const getSchoolClasses = async (schoolId: string): Promise<ClassRoom[]> => {
  try {
    const collRef = collection(db, `schools/${schoolId}/classes`);
    const q = query(collRef, where("active", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassRoom));
  } catch (e) {
    console.error("Error getting school classes", e);
    return [];
  }
};
