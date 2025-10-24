import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  Firestore,
  Timestamp,
  writeBatch,
  runTransaction,
  Transaction,
  CollectionReference,
  DocumentReference,
  Query,
} from 'firebase/firestore'
import {
  FirestoreDocument,
  FirestoreResponse,
  FirestoreListResponse,
  PaginationOptions,
  QueryOptions,
} from '@/types/firestore'

export class FirestoreUtils {
  constructor(private db: Firestore) { }

  // CREATE operations

  /**
   * Create a new document with auto-generated ID
   */
  async create<T extends FirestoreDocument>(
    collectionPath: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<FirestoreResponse<T & { id: string }>> {
    try {
      const now = Timestamp.now()
      const docData = {
        ...data,
        createdAt: now,
        updatedAt: now,
      }

      const docRef = await addDoc(collection(this.db, collectionPath), docData)

      return {
        success: true,
        data: { ...docData, id: docRef.id } as T & { id: string },
        id: docRef.id,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Create a document with specific ID
   */
  async createWithId<T extends FirestoreDocument>(
    collectionPath: string,
    docId: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<FirestoreResponse<T & { id: string }>> {
    try {
      const now = Timestamp.now()
      const docData = {
        ...data,
        createdAt: now,
        updatedAt: now,
      }

      const docRef = doc(this.db, collectionPath, docId)
      await setDoc(docRef, docData)

      return {
        success: true,
        data: { ...docData, id: docId } as T & { id: string },
        id: docId,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // READ operations

  /**
   * Get a single document by ID
   */
  async getById<T extends FirestoreDocument>(
    collectionPath: string,
    docId: string,
  ): Promise<FirestoreResponse<T & { id: string }>> {
    try {
      const docRef = doc(this.db, collectionPath, docId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Document not found',
        }
      }

      return {
        success: true,
        data: { id: docSnap.id, ...docSnap.data() } as T & { id: string },
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Get all documents from a collection
   */
  async getAll<T extends FirestoreDocument>(
    collectionPath: string,
  ): Promise<FirestoreListResponse<T & { id: string }>> {
    try {
      const querySnapshot = await getDocs(collection(this.db, collectionPath))
      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (T & { id: string })[]

      return {
        success: true,
        data: documents,
        total: documents.length,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        firstDoc: querySnapshot.docs[0],
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Query documents with filters, ordering, and pagination
   */
  async query<T extends FirestoreDocument>(
    collectionPath: string,
    options: QueryOptions = {},
  ): Promise<FirestoreListResponse<T & { id: string }>> {
    try {
      let q: Query = collection(this.db, collectionPath)

      // Apply where clauses
      if (options.where) {
        options.where.forEach(({ field, operator, value }) => {
          q = query(q, where(field, operator, value))
        })
      }

      // Apply orderBy clauses
      if (options.orderBy) {
        options.orderBy.forEach(({ field, direction = 'asc' }) => {
          q = query(q, orderBy(field, direction))
        })
      }

      // Apply pagination
      if (options.startAfter) {
        q = query(q, startAfter(options.startAfter))
      }

      if (options.endBefore) {
        q = query(q, endBefore(options.endBefore))
      }

      // Apply limit
      if (options.limit) {
        q = query(q, limit(options.limit))
      }

      const querySnapshot = await getDocs(q)
      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (T & { id: string })[]

      return {
        success: true,
        data: documents,
        total: documents.length,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        firstDoc: querySnapshot.docs[0],
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Paginated query helper
   */
  async getPaginated<T extends FirestoreDocument>(
    collectionPath: string,
    pageSize: number,
    options: Omit<QueryOptions, 'limit'> & PaginationOptions = {},
  ): Promise<FirestoreListResponse<T & { id: string }>> {
    const queryOptions: QueryOptions = {
      ...options,
      limit: pageSize,
    }

    if (options.lastDoc) {
      queryOptions.startAfter = options.lastDoc
    }

    if (options.firstDoc) {
      queryOptions.endBefore = options.firstDoc
    }

    return this.query<T>(collectionPath, queryOptions)
  }

  // UPDATE operations

  /**
   * Update a document by ID
   */
  async update<T extends FirestoreDocument>(
    collectionPath: string,
    docId: string,
    data: Partial<Omit<T, 'id' | 'createdAt'>>,
  ): Promise<FirestoreResponse<void>> {
    try {
      const docRef = doc(this.db, collectionPath, docId)
      const updateData = {
        ...data,
        updatedAt: Timestamp.now(),
      }

      await updateDoc(docRef, updateData)

      return {
        success: true,
        id: docId,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Set (overwrite) a document by ID
   */
  async set<T extends FirestoreDocument>(
    collectionPath: string,
    docId: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<FirestoreResponse<void>> {
    try {
      const docRef = doc(this.db, collectionPath, docId)
      const now = Timestamp.now()
      const docData = {
        ...data,
        updatedAt: now,
      }

      await setDoc(docRef, docData, { merge: false })

      return {
        success: true,
        id: docId,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // DELETE operations

  /**
   * Delete a document by ID
   */
  async delete(
    collectionPath: string,
    docId: string,
  ): Promise<FirestoreResponse<void>> {
    try {
      const docRef = doc(this.db, collectionPath, docId)
      await deleteDoc(docRef)

      return {
        success: true,
        id: docId,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Delete multiple documents by query
   */
  async deleteByQuery(
    collectionPath: string,
    options: QueryOptions,
  ): Promise<FirestoreResponse<{ deletedCount: number }>> {
    try {
      const queryResult = await this.query(collectionPath, options)

      if (!queryResult.success || !queryResult.data) {
        return {
          success: false,
          error: queryResult.error || 'Failed to query documents',
        }
      }

      const batch = writeBatch(this.db)
      queryResult.data.forEach((document) => {
        const docRef = doc(this.db, collectionPath, document.id)
        batch.delete(docRef)
      })

      await batch.commit()

      return {
        success: true,
        data: { deletedCount: queryResult.data.length },
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // BATCH operations

  /**
   * Batch write operations
   */
  async batchWrite(
    operations: Array<{
      type: 'create' | 'update' | 'delete'
      collectionPath: string
      docId?: string
      data?: any
    }>,
  ): Promise<FirestoreResponse<{ operationsCount: number }>> {
    try {
      const batch = writeBatch(this.db)
      const now = Timestamp.now()

      operations.forEach(({ type, collectionPath, docId, data }) => {
        if (type === 'create') {
          const docRef = docId
            ? doc(this.db, collectionPath, docId)
            : doc(collection(this.db, collectionPath))
          batch.set(docRef, {
            ...data,
            createdAt: now,
            updatedAt: now,
          })
        } else if (type === 'update' && docId) {
          const docRef = doc(this.db, collectionPath, docId)
          batch.update(docRef, {
            ...data,
            updatedAt: now,
          })
        } else if (type === 'delete' && docId) {
          const docRef = doc(this.db, collectionPath, docId)
          batch.delete(docRef)
        }
      })

      await batch.commit()

      return {
        success: true,
        data: { operationsCount: operations.length },
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // TRANSACTION operations

  /**
   * Run a transaction
   */
  async runTransaction<T>(
    updateFunction: (transaction: Transaction) => Promise<T>,
  ): Promise<FirestoreResponse<T>> {
    try {
      const result = await runTransaction(this.db, updateFunction)

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // UTILITY methods

  /**
   * Check if a document exists
   */
  async exists(collectionPath: string, docId: string): Promise<boolean> {
    try {
      const docRef = doc(this.db, collectionPath, docId)
      const docSnap = await getDoc(docRef)
      return docSnap.exists()
    } catch (error) {
      return false
    }
  }

  /**
   * Count documents in a collection (with optional query)
   */
  async count(
    collectionPath: string,
    options: QueryOptions = {},
  ): Promise<FirestoreResponse<number>> {
    try {
      const result = await this.query(collectionPath, options)
      return {
        success: true,
        data: result.data?.length || 0,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Get collection reference
   */
  getCollection(collectionPath: string): CollectionReference {
    return collection(this.db, collectionPath)
  }

  /**
   * Get document reference
   */
  getDocRef(collectionPath: string, docId: string): DocumentReference {
    return doc(this.db, collectionPath, docId)
  }
}

// Usage examples:
/*

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create instance
const firestoreUtils = new FirestoreUtils(db);

// Define your data types
interface User {
  name: string;
  email: string;
  age: number;
}

interface Post {
  title: string;
  content: string;
  authorId: string;
  published: boolean;
}

// Usage examples:

// CREATE
const newUser = await firestoreUtils.create<User>('users', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// READ
const user = await firestoreUtils.getById<User>('users', 'userId123');

// QUERY
const activePosts = await firestoreUtils.query<Post>('posts', {
  where: [
    { field: 'published', operator: '==', value: true }
  ],
  orderBy: [
    { field: 'createdAt', direction: 'desc' }
  ],
  limit: 10
});

// UPDATE
const updatedUser = await firestoreUtils.update<User>('users', 'userId123', {
  age: 31
});

// DELETE
const deletedUser = await firestoreUtils.delete('users', 'userId123');

// PAGINATION
const firstPage = await firestoreUtils.getPaginated<Post>('posts', 5, {
  orderBy: [{ field: 'createdAt', direction: 'desc' }]
});

const nextPage = await firestoreUtils.getPaginated<Post>('posts', 5, {
  orderBy: [{ field: 'createdAt', direction: 'desc' }],
  lastDoc: firstPage.lastDoc
});

// BATCH OPERATIONS
const batchResult = await firestoreUtils.batchWrite([
  {
    type: 'create',
    collectionPath: 'posts',
    data: { title: 'Post 1', content: 'Content 1', published: true }
  },
  {
    type: 'update',
    collectionPath: 'users',
    docId: 'userId123',
    data: { name: 'Updated Name' }
  },
  {
    type: 'delete',
    collectionPath: 'posts',
    docId: 'postId456'
  }
]);

*/
