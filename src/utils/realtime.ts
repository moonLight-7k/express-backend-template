import { realtimeDb } from '../config/firebase'
import admin from 'firebase-admin'
import {
    FirestoreDocument,
    FirestoreResponse,
    FirestoreListResponse,
    QueryOptions,
    PaginationOptions,
} from '../types/firestore'
import { logger } from '../utils/logger'

/**
 * Create a new document with auto-generated ID
 */
async function createDocument<T extends FirestoreDocument>(
    path: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<FirestoreResponse<T & { id: string }>> {
    try {
        logger.info(`Creating document in path: ${path}`)
        const now = Date.now()
        const docData = {
            ...data,
            createdAt: now,
            updatedAt: now,
        }

        const ref = realtimeDb.ref(path).push()
        await ref.set(docData)
        const docId = ref.key!
        logger.info(`Document created with ID: ${docId} in path: ${path}`)

        return {
            success: true,
            data: { ...docData, id: docId } as unknown as T & { id: string },
            id: docId,
        }
    } catch (error) {
        logger.error(
            `Error creating document in path ${path}: ${error instanceof Error ? error.message : 'Unknown error'
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
    path: string,
    docId: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<FirestoreResponse<T & { id: string }>> {
    try {
        logger.info(`Creating document with ID: ${docId} in path: ${path}`)
        const now = Date.now()
        const docData = {
            ...data,
            createdAt: now,
            updatedAt: now,
        }

        await realtimeDb.ref(`${path}/${docId}`).set(docData)
        logger.info(`Document created with ID: ${docId} in path: ${path}`)

        return {
            success: true,
            data: { ...docData, id: docId } as unknown as T & { id: string },
            id: docId,
        }
    } catch (error) {
        logger.error(
            `Error creating document with ID: ${docId} in path ${path}: ${error instanceof Error ? error.message : 'Unknown error'
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
    path: string,
    docId: string,
): Promise<FirestoreResponse<T & { id: string }>> {
    try {
        logger.info(`Fetching document with ID: ${docId} from path: ${path}`)
        const snapshot = await realtimeDb.ref(`${path}/${docId}`).once('value')

        if (!snapshot.exists()) {
            logger.info(`Document with ID: ${docId} not found in path: ${path}`)
            return {
                success: false,
                error: 'Document not found',
            }
        }

        const data = snapshot.val()
        logger.info(`Document with ID: ${docId} retrieved from path: ${path}`)
        return {
            success: true,
            data: { id: docId, ...data } as T & { id: string },
        }
    } catch (error) {
        logger.error(
            `Error fetching document with ID: ${docId} from path ${path}: ${error instanceof Error ? error.message : 'Unknown error'
            }`,
        )
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        }
    }
}

/**
 * Get all documents from a path
 */
async function getAllDocuments<T extends FirestoreDocument>(
    path: string,
): Promise<FirestoreListResponse<T & { id: string }>> {
    try {
        logger.info(`Fetching all documents from path: ${path}`)
        const snapshot = await realtimeDb.ref(path).once('value')

        if (!snapshot.exists()) {
            logger.info(`No documents found in path: ${path}`)
            return {
                success: true,
                data: [],
                total: 0,
            }
        }

        const documents: (T & { id: string })[] = []
        snapshot.forEach((childSnapshot: admin.database.DataSnapshot) => {
            documents.push({
                id: childSnapshot.key!,
                ...childSnapshot.val(),
            } as T & { id: string })
        })

        logger.info(`Retrieved ${documents.length} documents from path: ${path}`)
        return {
            success: true,
            data: documents,
            total: documents.length,
        }
    } catch (error) {
        logger.error(
            `Error fetching all documents from path ${path}: ${error instanceof Error ? error.message : 'Unknown error'
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
    path: string,
    options: QueryOptions = {},
): Promise<FirestoreListResponse<T & { id: string }>> {
    try {
        logger.info(
            `Querying documents from path: ${path} with options: ${JSON.stringify(
                options,
            )}`,
        )

        let query: admin.database.Query = realtimeDb.ref(path)

        // Apply orderBy clauses
        if (options.orderBy && options.orderBy.length > 0) {
            const { field, direction = 'asc' } = options.orderBy[0]
            query = query.orderByChild(field)
        } else {
            query = query.orderByKey()
        }

        // Apply pagination
        // For Realtime DB, startAfter and endBefore should be primitive values (string, number, boolean)
        if (options.startAfter !== undefined) {
            const startValue = typeof options.startAfter === 'object' ? (options.startAfter as any).id : options.startAfter
            query = query.startAfter(startValue)
        }

        if (options.endBefore !== undefined) {
            const endValue = typeof options.endBefore === 'object' ? (options.endBefore as any).id : options.endBefore
            query = query.endBefore(endValue)
        }

        // Apply limit
        if (options.limit) {
            query = query.limitToFirst(options.limit)
        }

        const snapshot = await query.once('value')
        let documents: (T & { id: string })[] = []

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot: admin.database.DataSnapshot) => {
                documents.push({
                    id: childSnapshot.key!,
                    ...childSnapshot.val(),
                } as T & { id: string })
            })
        }

        // Apply where filters in memory (Realtime DB has limited query capabilities)
        if (options.where) {
            documents = documents.filter((doc) => {
                return options.where!.every(({ field, operator, value }) => {
                    const docValue = (doc as any)[field]
                    switch (operator) {
                        case '==':
                            return docValue === value
                        case '!=':
                            return docValue !== value
                        case '<':
                            return docValue < value
                        case '<=':
                            return docValue <= value
                        case '>':
                            return docValue > value
                        case '>=':
                            return docValue >= value
                        case 'array-contains':
                            return Array.isArray(docValue) && docValue.includes(value)
                        case 'in':
                            return Array.isArray(value) && value.includes(docValue)
                        case 'array-contains-any':
                            return (
                                Array.isArray(docValue) &&
                                Array.isArray(value) &&
                                docValue.some((item) => value.includes(item))
                            )
                        case 'not-in':
                            return Array.isArray(value) && !value.includes(docValue)
                        default:
                            return true
                    }
                })
            })
        }

        logger.info(`Query returned ${documents.length} documents from path: ${path}`)
        return {
            success: true,
            data: documents,
            total: documents.length,
        }
    } catch (error) {
        logger.error(
            `Error querying documents from path ${path}: ${error instanceof Error ? error.message : 'Unknown error'
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
    path: string,
    pageSize: number,
    options: Omit<QueryOptions, 'limit'> & PaginationOptions = {},
): Promise<FirestoreListResponse<T & { id: string }>> {
    logger.info(
        `Getting paginated documents from path: ${path}, pageSize: ${pageSize}`,
    )
    const queryOptions: QueryOptions = {
        ...options,
        limit: pageSize,
    }

    if (options.lastDoc) {
        queryOptions.startAfter = options.lastDoc
        logger.info(`Using lastDoc for pagination in path: ${path}`)
    }

    if (options.firstDoc) {
        queryOptions.endBefore = options.firstDoc
        logger.info(`Using firstDoc for pagination in path: ${path}`)
    }

    return queryDocuments<T>(path, queryOptions)
}

/**
 * Update a document by ID
 */
async function updateDocument<T extends FirestoreDocument>(
    path: string,
    docId: string,
    data: Partial<Omit<T, 'id' | 'createdAt'>>,
): Promise<FirestoreResponse<void>> {
    try {
        logger.info(`Updating document with ID: ${docId} in path: ${path}`)
        const updateData = {
            ...data,
            updatedAt: Date.now(),
        }

        await realtimeDb.ref(`${path}/${docId}`).update(updateData)
        logger.info(`Document with ID: ${docId} updated in path: ${path}`)

        return {
            success: true,
            id: docId,
        }
    } catch (error) {
        logger.error(
            `Error updating document with ID: ${docId} in path ${path}: ${error instanceof Error ? error.message : 'Unknown error'
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
    path: string,
    docId: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<FirestoreResponse<void>> {
    try {
        logger.info(`Setting document with ID: ${docId} in path: ${path}`)
        const docData = {
            ...data,
            updatedAt: Date.now(),
        }

        await realtimeDb.ref(`${path}/${docId}`).set(docData)
        logger.info(`Document with ID: ${docId} set in path: ${path}`)

        return {
            success: true,
            id: docId,
        }
    } catch (error) {
        logger.error(
            `Error setting document with ID: ${docId} in path ${path}: ${error instanceof Error ? error.message : 'Unknown error'
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
    path: string,
    docId: string,
): Promise<FirestoreResponse<void>> {
    try {
        logger.info(`Deleting document with ID: ${docId} from path: ${path}`)
        await realtimeDb.ref(`${path}/${docId}`).remove()
        logger.info(`Document with ID: ${docId} deleted from path: ${path}`)

        return {
            success: true,
            id: docId,
        }
    } catch (error) {
        logger.error(
            `Error deleting document with ID: ${docId} from path ${path}: ${error instanceof Error ? error.message : 'Unknown error'
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
    path: string,
    options: QueryOptions,
): Promise<FirestoreResponse<{ deletedCount: number }>> {
    try {
        logger.info(
            `Deleting documents by query from path: ${path}, options: ${JSON.stringify(
                options,
            )}`,
        )
        const queryResult = await queryDocuments(path, options)

        if (!queryResult.success || !queryResult.data) {
            logger.warn(`Failed to query documents for deletion in path: ${path}`)
            return {
                success: false,
                error: queryResult.error || 'Failed to query documents',
            }
        }

        const updates: { [key: string]: null } = {}
        queryResult.data.forEach((document) => {
            updates[`${path}/${document.id}`] = null
            logger.debug(`Adding document ${document.id} to deletion batch`)
        })

        await realtimeDb.ref().update(updates)
        logger.info(
            `Deleted ${queryResult.data.length} documents from path: ${path}`,
        )

        return {
            success: true,
            data: { deletedCount: queryResult.data.length },
        }
    } catch (error) {
        logger.error(
            `Error deleting documents by query from path ${path}: ${error instanceof Error ? error.message : 'Unknown error'
            }`,
        )
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
        path: string
        docId?: string
        data?: any
    }>,
): Promise<FirestoreResponse<{ operationsCount: number }>> {
    try {
        logger.info(`Executing batch operation with ${operations.length} operations`)
        const updates: { [key: string]: any } = {}
        const now = Date.now()

        for (const { type, path, docId, data } of operations) {
            if (type === 'create') {
                const id = docId || realtimeDb.ref(path).push().key!
                updates[`${path}/${id}`] = {
                    ...data,
                    createdAt: now,
                    updatedAt: now,
                }
            } else if (type === 'update' && docId) {
                const currentData = (await realtimeDb.ref(`${path}/${docId}`).once('value')).val() || {}
                updates[`${path}/${docId}`] = {
                    ...currentData,
                    ...data,
                    updatedAt: now,
                }
            } else if (type === 'delete' && docId) {
                updates[`${path}/${docId}`] = null
            }
        }

        await realtimeDb.ref().update(updates)
        logger.info(
            `Batch operation completed successfully with ${operations.length} operations`,
        )

        return {
            success: true,
            data: { operationsCount: operations.length },
        }
    } catch (error) {
        logger.error(
            `Error executing batch operations: ${error instanceof Error ? error.message : 'Unknown error'
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
    path: string,
    updateFunction: (currentData: any) => T,
): Promise<FirestoreResponse<T>> {
    try {
        logger.info(`Starting database transaction on path: ${path}`)
        const result = await realtimeDb.ref(path).transaction(updateFunction)

        if (!result.committed) {
            logger.warn(`Transaction aborted on path: ${path}`)
            return {
                success: false,
                error: 'Transaction aborted',
            }
        }

        logger.info(`Database transaction completed successfully on path: ${path}`)
        return {
            success: true,
            data: result.snapshot.val() as T,
        }
    } catch (error) {
        logger.error(
            `Error executing database transaction on path ${path}: ${error instanceof Error ? error.message : 'Unknown error'
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
async function documentExists(path: string, docId: string): Promise<boolean> {
    try {
        logger.info(`Checking if document with ID: ${docId} exists in path: ${path}`)
        const snapshot = await realtimeDb.ref(`${path}/${docId}`).once('value')
        const exists = snapshot.exists()
        logger.info(
            `Document with ID: ${docId} in path ${path} exists: ${exists}`,
        )
        return exists
    } catch (error) {
        logger.error(
            `Error checking if document with ID: ${docId} exists in path ${path}: ${error instanceof Error ? error.message : 'Unknown error'
            }`,
        )
        return false
    }
}

/**
 * Count documents in a path (with optional query)
 */
async function countDocuments(
    path: string,
    options: QueryOptions = {},
): Promise<FirestoreResponse<number>> {
    try {
        logger.info(
            `Counting documents in path: ${path} with options: ${JSON.stringify(
                options,
            )}`,
        )
        const result = await queryDocuments(path, options)
        const count = result.data?.length || 0
        logger.info(`Found ${count} documents in path: ${path}`)
        return {
            success: true,
            data: count,
        }
    } catch (error) {
        logger.error(
            `Error counting documents in path ${path}: ${error instanceof Error ? error.message : 'Unknown error'
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
 * // Create a new user
 * const userData = {
 *   name: "John Doe",
 *   email: "john@example.com",
 *   age: 30
 * };
 *
 * const userResult = await createDocument('users', userData);
 *
 * if (userResult.success) {
 *   console.log(`Created user with ID: ${userResult.id}`);
 * } else {
 *   console.error(`Failed to create user: ${userResult.error}`);
 * }
 *
 * // Get a user
 * const user = await getDocumentById('users', 'userId123');
 *
 * // Update a user
 * await updateDocument('users', 'userId123', {
 *   name: 'Updated Name'
 * });
 *
 * // Delete a user
 * await deleteDocument('users', 'userId123');
 */
