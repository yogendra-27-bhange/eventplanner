
export type UserRole = 'user' | 'admin';

export interface User {
  id: string; // Will be email for mock auth, Firebase Auth UID for real auth
  email: string;
  name?: string;
  role: UserRole;
}

export type EventStatus = 'active' | 'cancelled' | 'featured' | 'past';

export interface Event {
  id: string; // Firestore document ID
  title: string;
  date: string; // ISO string for date (converted from/to Firestore Timestamp)
  time: string; 
  location: string;
  description: string;
  category: string;
  maxRegistrants?: number;
  registeredCount: number;
  status: EventStatus;
  createdBy: string; // User ID (email or Firebase Auth UID)
  imageUrl?: string; // Can be a regular URL or a data URI for AI-generated images
}

export interface Registration {
  id?: string; // Firestore document ID for the registration itself (optional on client if not needed)
  userId: string;
  eventId: string;
  registrationDate: string; // ISO string (converted from/to Firestore Timestamp)
}

export interface Feedback {
  id: string; // Firestore document ID
  eventId: string;
  userId: string;
  rating: number; // e.g., 1-5
  comment?: string;
  submittedAt: string; // ISO string
}
