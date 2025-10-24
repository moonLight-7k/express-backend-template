import {
  DocumentSnapshot,
  OrderByDirection,
  Timestamp,
  WhereFilterOp,
} from 'firebase/firestore'

export interface FirestoreDocument {
  id?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
  [key: string]: any
}

export interface QueryOptions {
  where?: WhereClause[]
  orderBy?: OrderByClause[]
  limit?: number
  startAfter?: DocumentSnapshot
  endBefore?: DocumentSnapshot
}

export interface WhereClause {
  field: string
  operator: WhereFilterOp
  value: any
}

export interface OrderByClause {
  field: string
  direction?: OrderByDirection
}

export interface PaginationOptions {
  limit?: number
  lastDoc?: DocumentSnapshot
  firstDoc?: DocumentSnapshot
}

export interface FirestoreResponse<T> {
  success: boolean
  data?: T
  error?: string
  id?: string
}

export interface FirestoreListResponse<T> {
  success: boolean
  data?: T[]
  error?: string
  lastDoc?: DocumentSnapshot
  firstDoc?: DocumentSnapshot
  total?: number
}
