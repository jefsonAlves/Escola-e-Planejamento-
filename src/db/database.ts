import Dexie, { Table } from 'dexie';

export interface BaseRecord {
  localId: string;
  remoteId?: string;
  userId: string;
  isSynced: boolean;
  syncStatus: 'synced' | 'pending' | 'error' | 'conflict';
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  lastSyncAt?: number;
}

export interface User extends BaseRecord {
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
}

export interface School extends BaseRecord {
  name: string;
}

export interface ClassRoom extends BaseRecord {
  name: string;
  schoolId: string;
  googleCourseId?: string;
}

export interface Student extends BaseRecord {
  name: string;
  classId: string;
  googleUserId?: string;
  avatarUrl?: string;
}

export interface Attendance extends BaseRecord {
  classId: string;
  date: string;
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'justified';
  notes?: string;
}

export interface SyncQueueItem {
  id: string; // uuid
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: string;
  localId: string;
  payload: any;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

export interface Grade extends BaseRecord {
  classId: string;
  studentId: string;
  subject: string;
  bimester: string;
  method: string;
  points: number;
  date: string;
}

export interface Occurrence extends BaseRecord {
  classId: string;
  studentId: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
}

export interface Notification extends BaseRecord {
  recipientUserId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
}

export interface MeetingRequest extends BaseRecord {
  guardianId: string;
  studentId: string;
  teacherId?: string;
  schoolId: string;
  requestedDate: string;
  status: string;
}

export class AppDatabase extends Dexie {
  users!: Table<User, string>;
  schools!: Table<School, string>;
  classes!: Table<ClassRoom, string>;
  students!: Table<Student, string>;
  attendance!: Table<Attendance, string>;
  grades!: Table<Grade, string>;
  occurrences!: Table<Occurrence, string>;
  notifications!: Table<Notification, string>;
  meetingRequests!: Table<MeetingRequest, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super('TarefaFlowDB');
    this.version(2).stores({
      users: 'localId, remoteId, userId, syncStatus',
      schools: 'localId, remoteId, userId, syncStatus',
      classes: 'localId, remoteId, userId, schoolId, syncStatus',
      students: 'localId, remoteId, userId, classId, syncStatus',
      attendance: 'localId, remoteId, userId, classId, date, syncStatus',
      grades: 'localId, remoteId, userId, classId, studentId, syncStatus',
      occurrences: 'localId, remoteId, userId, classId, studentId, syncStatus',
      notifications: 'localId, remoteId, userId, recipientUserId, read, syncStatus',
      meetingRequests: 'localId, remoteId, userId, schoolId, studentId, status, syncStatus',
      syncQueue: 'id, collection, operation, createdAt'
    });
  }
}


export const db = new AppDatabase();
