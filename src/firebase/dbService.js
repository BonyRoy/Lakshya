import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './config.js'

// Collection names
export const COLLECTIONS = {
  FACULTIES: 'faculties',
  SUBJECTS: 'subjects', 
  BRANCHES: 'branches',
  CHAPTERS: 'chapters',
  LECTURES: 'lectures',
  FACULTY_ASSIGNMENTS: 'facultyAssignments',
  LECTURE_PROGRESS: 'lectureProgress'
}

// Generic CRUD operations
export const dbService = {
  // Get all documents from a collection
  async getAll(collectionName) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName))
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error(`Error getting ${collectionName}:`, error)
      throw error
    }
  },

  // Add a document to a collection
  async add(collectionName, data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error(`Error adding to ${collectionName}:`, error)
      throw error
    }
  },

  // Update a document in a collection
  async update(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId)
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
      return true
    } catch (error) {
      console.error(`Error updating ${collectionName}:`, error)
      throw error
    }
  },

  // Delete a document from a collection
  async delete(collectionName, docId) {
    try {
      await deleteDoc(doc(db, collectionName, docId))
      return true
    } catch (error) {
      console.error(`Error deleting from ${collectionName}:`, error)
      throw error
    }
  },

  // Listen to real-time updates for a collection
  onCollectionChange(collectionName, callback) {
    return onSnapshot(collection(db, collectionName), (querySnapshot) => {
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      callback(docs)
    })
  }
}

// Specific service functions for each data type
export const facultyService = {
  getAll: () => dbService.getAll(COLLECTIONS.FACULTIES),
  add: (faculty) => dbService.add(COLLECTIONS.FACULTIES, faculty),
  update: (id, faculty) => dbService.update(COLLECTIONS.FACULTIES, id, faculty),
  delete: (id) => dbService.delete(COLLECTIONS.FACULTIES, id),
  onSnapshot: (callback) => dbService.onCollectionChange(COLLECTIONS.FACULTIES, callback)
}

export const subjectService = {
  getAll: () => dbService.getAll(COLLECTIONS.SUBJECTS),
  add: (subject) => dbService.add(COLLECTIONS.SUBJECTS, subject),
  update: (id, subject) => dbService.update(COLLECTIONS.SUBJECTS, id, subject),
  delete: (id) => dbService.delete(COLLECTIONS.SUBJECTS, id),
  onSnapshot: (callback) => dbService.onCollectionChange(COLLECTIONS.SUBJECTS, callback)
}

export const branchService = {
  getAll: () => dbService.getAll(COLLECTIONS.BRANCHES),
  add: (branch) => dbService.add(COLLECTIONS.BRANCHES, branch),
  update: (id, branch) => dbService.update(COLLECTIONS.BRANCHES, id, branch),
  delete: (id) => dbService.delete(COLLECTIONS.BRANCHES, id),
  onSnapshot: (callback) => dbService.onCollectionChange(COLLECTIONS.BRANCHES, callback)
}

export const chapterService = {
  getAll: () => dbService.getAll(COLLECTIONS.CHAPTERS),
  add: (chapter) => dbService.add(COLLECTIONS.CHAPTERS, chapter),
  update: (id, chapter) => dbService.update(COLLECTIONS.CHAPTERS, id, chapter),
  delete: (id) => dbService.delete(COLLECTIONS.CHAPTERS, id),
  onSnapshot: (callback) => dbService.onCollectionChange(COLLECTIONS.CHAPTERS, callback)
}

export const lectureService = {
  getAll: () => dbService.getAll(COLLECTIONS.LECTURES),
  add: (lecture) => dbService.add(COLLECTIONS.LECTURES, lecture),
  update: (id, lecture) => dbService.update(COLLECTIONS.LECTURES, id, lecture),
  delete: (id) => dbService.delete(COLLECTIONS.LECTURES, id),
  onSnapshot: (callback) => dbService.onCollectionChange(COLLECTIONS.LECTURES, callback)
}

export const facultyAssignmentService = {
  getAll: () => dbService.getAll(COLLECTIONS.FACULTY_ASSIGNMENTS),
  add: (assignment) => dbService.add(COLLECTIONS.FACULTY_ASSIGNMENTS, assignment),
  update: (id, assignment) => dbService.update(COLLECTIONS.FACULTY_ASSIGNMENTS, id, assignment),
  delete: (id) => dbService.delete(COLLECTIONS.FACULTY_ASSIGNMENTS, id),
  onSnapshot: (callback) => dbService.onCollectionChange(COLLECTIONS.FACULTY_ASSIGNMENTS, callback)
}

export const lectureProgressService = {
  getAll: () => dbService.getAll(COLLECTIONS.LECTURE_PROGRESS),
  add: (progress) => dbService.add(COLLECTIONS.LECTURE_PROGRESS, progress),
  update: (id, progress) => dbService.update(COLLECTIONS.LECTURE_PROGRESS, id, progress),
  delete: (id) => dbService.delete(COLLECTIONS.LECTURE_PROGRESS, id),
  onSnapshot: (callback) => dbService.onCollectionChange(COLLECTIONS.LECTURE_PROGRESS, callback),
  
  // Specific methods for lecture progress management
  async getByFacultyChapterBranch(facultyName, chapterName, branchName) {
    try {
      const allProgress = await this.getAll()
      return allProgress.find(p => 
        p.facultyName === facultyName && 
        p.chapterName === chapterName && 
        p.branchName === branchName
      )
    } catch (error) {
      console.error('Error getting progress by faculty/chapter/branch:', error)
      throw error
    }
  },

  async getAllByChapterBranch(chapterName, branchName) {
    try {
      const allProgress = await this.getAll()
      return allProgress.filter(p => 
        p.chapterName === chapterName && 
        p.branchName === branchName
      )
    } catch (error) {
      console.error('Error getting progress by chapter/branch:', error)
      throw error
    }
  },

  async addProgressEntry(facultyName, chapterName, branchName, progressEntry) {
    try {
      // Look for ANY existing record for this chapter-branch combination (regardless of faculty)
      const existingRecords = await this.getAllByChapterBranch(chapterName, branchName)
      
      if (existingRecords && existingRecords.length > 0) {
        // Use the first (and should be only) record for this chapter-branch combination
        const existingProgress = existingRecords[0]
        
        // Update existing progress record by adding new entry to PROGRESS array
        const updatedProgress = [...existingProgress.PROGRESS, progressEntry]
        const updatedData = {
          ...existingProgress,
          PROGRESS: updatedProgress,
          LECTURENUMBER: updatedProgress.length.toString(),
          // Update the main faculty name to the current one (for display purposes)
          'Faculty name': `${chapterName} - ${branchName}`, // Generic name for the record
          updatedAt: new Date().toISOString()
        }
        
        await this.update(existingProgress.id, updatedData)
        return { ...updatedData, id: existingProgress.id }
      } else {
        // Create new progress record (first entry for this chapter-branch combination)
        const newProgressData = {
          'Faculty name': `${chapterName} - ${branchName}`, // Generic record name
          'Faculty code': progressEntry.facultyCode || '',
          SUBJECT: progressEntry.subject || '',
          'BRANCH NAME': branchName,
          CHAPTERNAME: chapterName,
          LECTURENUMBER: '1',
          PROGRESS: [progressEntry],
          LECTURETYPE: progressEntry.lectureTypes || ['REGULAR'],
          OVERSHOOTREMARK: progressEntry.overshootRemark || '',
          UUID: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          'TOTALNOOF LECTURES': progressEntry.totalLectures || '0',
          facultyName: `${chapterName} - ${branchName}`, // Generic record name
          chapterName,
          branchName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        const newId = await this.add(newProgressData)
        return { ...newProgressData, id: newId }
      }
    } catch (error) {
      console.error('Error adding progress entry:', error)
      throw error
    }
  },

  async deleteByFilter(facultyName = null, chapterName = null, branchName = null) {
    try {
      const allProgress = await this.getAll()
      const toDelete = allProgress.filter(p => {
        let matches = true
        if (facultyName) matches = matches && p.facultyName === facultyName
        if (chapterName) matches = matches && p.chapterName === chapterName
        if (branchName) matches = matches && p.branchName === branchName
        return matches
      })
      
      const deletePromises = toDelete.map(p => this.delete(p.id))
      await Promise.all(deletePromises)
      
      return toDelete.length
    } catch (error) {
      console.error('Error deleting progress by filter:', error)
      throw error
    }
  },

  async truncateAll() {
    try {
      const allProgress = await this.getAll()
      const deletePromises = allProgress.map(p => this.delete(p.id))
      await Promise.all(deletePromises)
      
      return allProgress.length
    } catch (error) {
      console.error('Error truncating all progress data:', error)
      throw error
    }
  }
} 