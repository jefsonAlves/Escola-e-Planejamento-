import { db } from "../lib/firebase";
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, writeBatch } from "firebase/firestore";

export const migrateLegacyUserData = async (userId: string, targetSchoolId: string) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return false;

    const data = userSnap.data();
    if (data.migrationStatus === "completed") {
      console.log("Migration already completed for user:", userId);
      return true;
    }

    console.log("Starting legacy data migration for user:", userId);
    
    // Batch for atomic updates (though Firestore batch has limits, we assume legacy data fits in 500 ops)
    const batch = writeBatch(db);

    // 1. Migrate classes and students
    if (data.classesStr) {
      try {
        const classes = JSON.parse(data.classesStr);
        for (const cls of classes) {
           const classRef = doc(collection(db, `schools/${targetSchoolId}/classes`));
           batch.set(classRef, {
             name: cls.name,
             grade: cls.grade || cls.name,
             year: new Date().getFullYear(),
             teacherIds: [userId],
             active: true,
             legacyId: cls.id,
             createdAt: Date.now(),
             updatedAt: Date.now()
           });

           if (cls.students && Array.isArray(cls.students)) {
             for (const std of cls.students) {
               const stdRef = doc(collection(db, `schools/${targetSchoolId}/students`));
               batch.set(stdRef, {
                 name: std.name,
                 classId: classRef.id,
                 status: "active",
                 guardianIds: [],
                 legacyId: std.id,
                 createdAt: Date.now(),
                 updatedAt: Date.now()
               });

               // Optional: If student has attendance history in the same string, migrate it
               if (std.attendanceHistory) {
                 for (const [date, status] of Object.entries(std.attendanceHistory)) {
                   const attRef = doc(collection(db, `schools/${targetSchoolId}/attendance`));
                   batch.set(attRef, {
                     studentId: stdRef.id,
                     classId: classRef.id,
                     teacherId: userId,
                     date: date,
                     status: status,
                     createdAt: Date.now(),
                     updatedAt: Date.now()
                   });
                 }
               }

               // Optional: Grades / Evaluations
               if (std.evaluations && Array.isArray(std.evaluations)) {
                 for (const ev of std.evaluations) {
                   const grRef = doc(collection(db, `schools/${targetSchoolId}/grades`));
                   batch.set(grRef, {
                     studentId: stdRef.id,
                     classId: classRef.id,
                     teacherId: userId,
                     subject: ev.subject || "Geral",
                     bimester: ev.bimester || "1",
                     method: ev.evalType || "Nota",
                     points: ev.grade || 0,
                     date: ev.date || new Date().toISOString().split('T')[0],
                     visibleToGuardian: true,
                     createdAt: Date.now(),
                     updatedAt: Date.now()
                   });
                 }
               }
             }
           }
        }
      } catch (e) {
         console.warn("Failed to parse/migrate classesStr:", e);
      }
    }

    // Mark as completed
    batch.update(userDocRef, { migrationStatus: "completed", migratedAt: Date.now(), activeSchoolId: targetSchoolId });

    await batch.commit();
    console.log("Migration completed successfully.");
    return true;

  } catch (e) {
    console.error("Error migrating legacy data:", e);
    return false;
  }
};
