'use server'

import { TextSegment } from './../../types.d';
import { connectToDatabase } from "@/database/mongoose";
import { CreateBook } from "@/types";
import { escapeRegex, generateSlug, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from '@/database/models/book-segment.model';

export const checkBookExists = async (title: string) => {
  try {
    await connectToDatabase();
    const slug = generateSlug(title);
    const book = await Book.findOne({ slug }).lean();
    return { success: true, exists: !!book, data: serializeData(book) };
  }
  catch(error){
    console.error("Error checking book existence:", error);
    return { success: false, error: "Failed to check book existence" };
  }
}

export const createBook = async (data: CreateBook) => {
  try{
    await connectToDatabase();

    const slug = generateSlug(data.title);
    const existingBook = await Book.findOne({ slug }).lean();
    if (existingBook) {
      return { 
        success: true,
        data: serializeData(existingBook),
        alreadyExists: true  
      };
    }

    // Todo: check subscription limits before creating the book

    const book = await Book.create({ ...data, slug, totalSegments: 0 });

    return { success: true, data: serializeData(book), alreadyExists: false };
  }
  catch(error){
    console.error("Error creating book:", error);
    return { success: false, error: "Failed to create book" };
  }
}

export const saveBookSegments = async (bookId: string, clerkId: string, segments: TextSegment[]) => {
  try {
    await connectToDatabase();
    
    console.log(`Saving ${segments.length} segments for book ${bookId} and clerk ${clerkId} ...`);

    const segmentsToInsert = segments.map(segment => ({
      clerkId,
      bookId,
      content: segment.text,
      segmentIndex: segment.segmentIndex,
      pageNumber: segment.pageNumber,
      wordCount: segment.wordCount,
    }));
    
    const insertedSegments = await BookSegment.insertMany(segmentsToInsert);

    // Update the totalSegments count in the Book document
    await Book.findByIdAndUpdate(bookId, { $inc: { totalSegments: insertedSegments.length } });

    console.log(`Successfully saved ${insertedSegments.length} segments for book ${bookId}.`);

    return { success: true, data: serializeData(insertedSegments) };
  }
  catch(error){
    console.error("Error saving book segments:", error);
    await BookSegment.deleteMany({ bookId });
    await Book.findByIdAndDelete(bookId);
    console.error("Rolled back book and segments due to error");
    return { success: false, error: "Failed to save book segments" };
  }

}

export const getAllBooks = async (search?: string) => {
  try {
      await connectToDatabase();

      let query = {};

      if (search) {
          const escapedSearch = escapeRegex(search);
          const regex = new RegExp(escapedSearch, 'i');
          query = {
              $or: [
                  { title: { $regex: regex } },
                  { author: { $regex: regex } },
              ]
          };
      }

      const books = await Book.find(query).sort({ createdAt: -1 }).lean();

      return {
          success: true,
          data: serializeData(books)
      }
  } catch (e) {
      console.error('Error connecting to database', e);
      return {
          success: false, error: e
      }
  }
}

