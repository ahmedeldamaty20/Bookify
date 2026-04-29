import type { Document, Types } from "mongoose";

/* Global Type Declarations */
export interface BookCardProps {
  title: string;
  author: string;
  coverURL?: string;
  slug: string;
}

/* (Mongoose) Book Interface */
export interface IBook extends Document {
  _id: string;
  clerkId: string;
  title: string;
  slug: string;
  author: string;
  persona?: string;
  fileURL: string;
  fileBlobKey: string;
  coverURL?: string;
  coverBlobKey?: string;
  fileSize: number;
  totalSegments: number;
  createdAt: Date;
  updatedAt: Date;
}

/* (Mongoose) Book Segment Interface */
export interface IBookSegment extends Document {
  clerkId: string;
  bookId: Types.ObjectId;
  content: string;
  segmentIndex: number;
  pageNumber?: number;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/* (Mongoose) Voice Session Interface */
export interface IVoiceSession extends Document {
  _id: string;
  clerkId: string;
  bookId: Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds: number;
  billingPeriodStart: Date;
  createdAt: Date;
  updatedAt: Date;
}

/* (Action) Create Book Payload Interface */
export interface CreateBook {
  clerkId: string;
  title: string;
  author: string;
  persona?: string;
  fileURL: string;
  fileBlobKey: string;
  coverURL?: string;
  coverBlobKey?: string;
  fileSize: number;
}

/* (Action) Save Book Segments Payload Interface */
export interface TextSegment {
  text: string;
  segmentIndex: number;
  pageNumber?: number;
  wordCount: number;
}
