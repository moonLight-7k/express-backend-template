import { db } from '@/config/firebase'
import admin from 'firebase-admin'
import {
  FirestoreDocument,
  FirestoreResponse,
  FirestoreListResponse,
  QueryOptions,
  PaginationOptions,
} from '@/types/firestore'
import { logger } from '@/utils/logger'

/**
 * Create a new document with auto-generated ID
 */
async function createDocument<T extends FirestoreDocument>(
  collectionPath: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<FirestoreResponse<T & { id: string }>> {
  try {
    logger.info(`Creating document in collection: ${collectionPath}`)
    const now = admin.firestore.Timestamp.now()
    const docData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await db.collection(collectionPath).add(docData)
    logger.info(
      `Document created with ID: ${docRef.id} in collection: ${collectionPath}`,
    )

    return {
      success: true,
      data: { ...docData, id: docRef.id } as T & { id: string },
      id: docRef.id,
    }
  } catch (error) {
    logger.error(
      `Error creating document in collection ${collectionPath}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Create a document with specific ID
 */
async function createDocumentWithId<T extends FirestoreDocument>(
  collectionPath: string,
  docId: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<FirestoreResponse<T & { id: string }>> {
  try {
    logger.info(
      `Creating document with ID: ${docId} in collection: ${collectionPath}`,
    )
    const now = admin.firestore.Timestamp.now()
    const docData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    }

    await db.collection(collectionPath).doc(docId).set(docData)
    logger.info(
      `Document created with ID: ${docId} in collection: ${collectionPath}`,
    )

    return {
      success: true,
      data: { ...docData, id: docId } as T & { id: string },
      id: docId,
    }
  } catch (error) {
    logger.error(
      `Error creating document with ID: ${docId} in collection ${collectionPath}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get a single document by ID
 */
async function getDocumentById<T extends FirestoreDocument>(
  collectionPath: string,
  docId: string,
): Promise<FirestoreResponse<T & { id: string }>> {
  try {
    logger.info(
      `Fetching document with ID: ${docId} from collection: ${collectionPath}`,
    )
    const docRef = db.collection(collectionPath).doc(docId)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      logger.info(
        `Document with ID: ${docId} not found in collection: ${collectionPath}`,
      )
      return {
        success: false,
        error: 'Document not found',
      }
    }

    logger.info(
      `Document with ID: ${docId} retrieved from collection: ${collectionPath}`,
    )
    return {
      success: true,
      data: { id: docSnap.id, ...docSnap.data() } as T & { id: string },
    }
  } catch (error) {
    logger.error(
      `Error fetching document with ID: ${docId} from collection ${collectionPath}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get all documents from a collection
 */
async function getAllDocuments<T extends FirestoreDocument>(
  collectionPath: string,
): Promise<FirestoreListResponse<T & { id: string }>> {
  try {
    logger.info(`Fetching all documents from collection: ${collectionPath}`)
    const querySnapshot = await db.collection(collectionPath).get()
    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (T & { id: string })[]

    logger.info(
      `Retrieved ${documents.length} documents from collection: ${collectionPath}`,
    )
    return {
      success: true,
      data: documents,
      total: documents.length,
    }
  } catch (error) {
    logger.error(
      `Error fetching all documents from collection ${collectionPath}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Query documents with filters, ordering, and pagination
 */
async function queryDocuments<T extends FirestoreDocument>(
  collectionPath: string,
  options: QueryOptions = {},
): Promise<FirestoreListResponse<T & { id: string }>> {
  try {
    logger.info(
      `Querying documents from collection: ${collectionPath} with options: ${JSON.stringify(
        options,
      )}`,
    )
    // Starting with a collection reference and then building a query
    let query: admin.firestore.Query = db.collection(collectionPath)

    // Apply where clauses
    if (options.where) {
      options.where.forEach(({ field, operator, value }) => {
        query = query.where(field, operator, value)
      })
    }

    // Apply orderBy clauses
    if (options.orderBy) {
      options.orderBy.forEach(({ field, direction = 'asc' }) => {
        query = query.orderBy(field, direction)
      })
    }

    // Apply pagination
    if (options.startAfter) {
      query = query.startAfter(options.startAfter)
    }

    if (options.endBefore) {
      query = query.endBefore(options.endBefore)
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit)
    }

    const querySnapshot = await query.get()
    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (T & { id: string })[]

    logger.info(
      `Query returned ${documents.length} documents from collection: ${collectionPath}`,
    )
    return {
      success: true,
      data: documents,
      total: documents.length,
    }
  } catch (error) {
    logger.error(
      `Error querying documents from collection ${collectionPath}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Paginated query helper
 */
async function getPaginatedDocuments<T extends FirestoreDocument>(
  collectionPath: string,
  pageSize: number,
  options: Omit<QueryOptions, 'limit'> & PaginationOptions = {},
): Promise<FirestoreListResponse<T & { id: string }>> {
  logger.info(
    `Getting paginated documents from collection: ${collectionPath}, pageSize: ${pageSize}`,
  )
  const queryOptions: QueryOptions = {
    ...options,
    limit: pageSize,
  }

  if (options.lastDoc) {
    queryOptions.startAfter = options.lastDoc
    logger.info(`Using lastDoc for pagination in collection: ${collectionPath}`)
  }

  if (options.firstDoc) {
    queryOptions.endBefore = options.firstDoc
    logger.info(
      `Using firstDoc for pagination in collection: ${collectionPath}`,
    )
  }

  return queryDocuments<T>(collectionPath, queryOptions)
}

/**
 * Update a document by ID
 */
async function updateDocument<T extends FirestoreDocument>(
  collectionPath: string,
  docId: string,
  data: Partial<Omit<T, 'id' | 'createdAt'>>,
): Promise<FirestoreResponse<void>> {
  try {
    logger.info(
      `Updating document with ID: ${docId} in collection: ${collectionPath}`,
    )
    const docRef = db.collection(collectionPath).doc(docId)
    const updateData = {
      ...data,
      updatedAt: admin.firestore.Timestamp.now(),
    }

    await docRef.update(updateData)
    logger.info(
      `Document with ID: ${docId} updated in collection: ${collectionPath}`,
    )

    return {
      success: true,
      id: docId,
    }
  } catch (error) {
    logger.error(
      `Error updating document with ID: ${docId} in collection ${collectionPath}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Set (overwrite) a document by ID
 */
async function setDocument<T extends FirestoreDocument>(
  collectionPath: string,
  docId: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<FirestoreResponse<void>> {
  try {
    logger.info(
      `Setting document with ID: ${docId} in collection: ${collectionPath}`,
    )
    const docRef = db.collection(collectionPath).doc(docId)
    const now = admin.firestore.Timestamp.now()
    const docData = {
      ...data,
      updatedAt: now,
    }

    await docRef.set(docData, { merge: false })
    logger.info(
      `Document with ID: ${docId} set in collection: ${collectionPath}`,
    )

    return {
      success: true,
      id: docId,
    }
  } catch (error) {
    logger.error(
      `Error setting document with ID: ${docId} in collection ${collectionPath}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Delete a document by ID
 */
async function deleteDocument(
  collectionPath: string,
  docId: string,
): Promise<FirestoreResponse<void>> {
  try {
    logger.info(
      `Deleting document with ID: ${docId} from collection: ${collectionPath}`,
    )
    const docRef = db.collection(collectionPath).doc(docId)
    await docRef.delete()
    logger.info(
      `Document with ID: ${docId} deleted from collection: ${collectionPath}`,
    )

    return {
      success: true,
      id: docId,
    }
  } catch (error) {
    logger.error(
      `Error deleting document with ID: ${docId} from collection ${collectionPath}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Delete multiple documents by query
 */
async function deleteDocumentsByQuery(
  collectionPath: string,
  options: QueryOptions,
): Promise<FirestoreResponse<{ deletedCount: number }>> {
  try {
    logger.info(
      `Deleting documents by query from collection: ${collectionPath}, options: ${JSON.stringify(
        options,
      )}`,
    )
    const queryResult = await queryDocuments(collectionPath, options)

    if (!queryResult.success || !queryResult.data) {
      logger.warn(
        `Failed to query documents for deletion in collection: ${collectionPath}`,
      )
      return {
        success: false,
        error: queryResult.error || 'Failed to query documents',
      }
    }

    const batch = db.batch()
    queryResult.data.forEach((document) => {
      const docRef = db.collection(collectionPath).doc(document.id)
      batch.delete(docRef)
      logger.debug(`Adding document ${document.id} to deletion batch`)
    })

    await batch.commit()
    logger.info(
      `Deleted ${queryResult.data.length} documents from collection: ${collectionPath}`,
    )

    return {
      success: true,
      data: { deletedCount: queryResult.data.length },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Batch write operations
 */
async function batchWriteDocuments(
  operations: Array<{
    type: 'create' | 'update' | 'delete'
    collectionPath: string
    docId?: string
    data?: any
  }>,
): Promise<FirestoreResponse<{ operationsCount: number }>> {
  try {
    logger.info(
      `Executing batch operation with ${operations.length} operations`,
    )
    const batch = db.batch()
    const now = admin.firestore.Timestamp.now()

    operations.forEach(({ type, collectionPath, docId, data }) => {
      if (type === 'create') {
        const docRef = docId
          ? db.collection(collectionPath).doc(docId)
          : db.collection(collectionPath).doc()
        batch.set(docRef, {
          ...data,
          createdAt: now,
          updatedAt: now,
        })
      } else if (type === 'update' && docId) {
        const docRef = db.collection(collectionPath).doc(docId)
        batch.update(docRef, {
          ...data,
          updatedAt: now,
        })
      } else if (type === 'delete' && docId) {
        const docRef = db.collection(collectionPath).doc(docId)
        batch.delete(docRef)
      }
    })

    await batch.commit()
    logger.info(
      `Batch operation completed successfully with ${operations.length} operations`,
    )

    return {
      success: true,
      data: { operationsCount: operations.length },
    }
  } catch (error) {
    logger.error(
      `Error executing batch operations: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Run a transaction
 */
async function runDbTransaction<T>(
  updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>,
): Promise<FirestoreResponse<T>> {
  try {
    logger.info(`Starting database transaction`)
    const result = await db.runTransaction(updateFunction)
    logger.info(`Database transaction completed successfully`)

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    logger.error(
      `Error executing database transaction: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Check if a document exists
 */
async function documentExists(
  collectionPath: string,
  docId: string,
): Promise<boolean> {
  try {
    logger.info(
      `Checking if document with ID: ${docId} exists in collection: ${collectionPath}`,
    )
    const docRef = db.collection(collectionPath).doc(docId)
    const docSnap = await docRef.get()
    const exists = docSnap.exists
    logger.info(
      `Document with ID: ${docId} in collection ${collectionPath} exists: ${exists}`,
    )
    return exists
  } catch (error) {
    logger.error(
      `Error checking if document with ID: ${docId} exists in collection ${collectionPath}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return false
  }
}

/**
 * Count documents in a collection (with optional query)
 */
async function countDocuments(
  collectionPath: string,
  options: QueryOptions = {},
): Promise<FirestoreResponse<number>> {
  try {
    logger.info(
      `Counting documents in collection: ${collectionPath} with options: ${JSON.stringify(
        options,
      )}`,
    )
    const result = await queryDocuments(collectionPath, options)
    const count = result.data?.length || 0
    logger.info(`Found ${count} documents in collection: ${collectionPath}`)
    return {
      success: true,
      data: count,
    }
  } catch (error) {
    logger.error(
      `Error counting documents in collection ${collectionPath}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export {
  createDocument,
  createDocumentWithId,
  getDocumentById,
  getAllDocuments,
  queryDocuments,
  getPaginatedDocuments,
  updateDocument,
  setDocument,
  deleteDocument,
  deleteDocumentsByQuery,
  batchWriteDocuments,
  runDbTransaction,
  documentExists,
  countDocuments,
}

/**
 * Example usage:
 *
 * // Create a new course
 * const courseData = {
 *   name: "English Grammar 101",
 *   modules: [
 *     {
 *       name: "Basic Tenses",
 *       questions: []
 *     }
 *   ]
 * };
 *
 * const courseResult = await createCourse(courseData);
 *
 * if (courseResult.success) {
 *   console.log(`Created course with ID: ${courseResult.id}`);
 * } else {
 *   console.error(`Failed to create course: ${courseResult.error}`);
 * }
 *
 * // Get a course
 * const course = await getCourse("courseId123");
 *
 * // Update a course
 * await updateCourse("courseId123", {
 *   name: "Updated Course Name"
 * });
 *
 * // Delete a course
 * await deleteCourse("courseId123");
 */
