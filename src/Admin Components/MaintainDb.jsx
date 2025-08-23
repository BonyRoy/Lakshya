import {
  CircleChevronLeft,
  BookOpen,
  Users,
  GraduationCap,
  FolderOpen,
  FileSignature,
  Trash2,
  Plus,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  facultyService,
  subjectService,
  branchService,
  chapterService,
  lectureService,
  facultyAssignmentService,
  lectureProgressService
} from '../firebase/dbService.js'

const MaintainDb = () => {
  const navigate = useNavigate()

  // Data states
  const [faculties, setFaculties] = useState([])
  const [subjects, setSubjects] = useState([])
  const [branches, setBranches] = useState([])
  const [chapters, setChapters] = useState([])
  const [lectures, setLectures] = useState([])
  const [facultyAssignments, setFacultyAssignments] = useState([])
  
  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [operationLoading, setOperationLoading] = useState(false)

  const [selected, setSelected] = useState('Faculty')

  // Search state for all cards
  const [searchTerm, setSearchTerm] = useState('')

  // New entry states for each table type
  const [newFacultyEntry, setNewFacultyEntry] = useState({ name: '', code: '', subject: '', uuid: '' })
  const [newSubjectEntry, setNewSubjectEntry] = useState({ name: '' })
  const [newBranchEntry, setNewBranchEntry] = useState({ name: '' })
  const [newChapterEntry, setNewChapterEntry] = useState({ subject: '', chapterName: '' })
  const [newLectureEntry, setNewLectureEntry] = useState({ chapterName: '', nooflecturesrequired: '' })
  const [newAssignmentEntry, setNewAssignmentEntry] = useState({ faculty: '', chapter: '', branch: '' })

  // Reset user data states
  const [resetFaculty, setResetFaculty] = useState('')
  const [resetChapter, setResetChapter] = useState('')
  const [resetBranch, setResetBranch] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmationData, setConfirmationData] = useState(null)

  // UUID generation functions
  const generateAlphanumericUUID = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const isUUIDUnique = async (uuid) => {
    try {
      const existingFaculties = await facultyService.getAll()
      return !existingFaculties.some(faculty => faculty.uuid === uuid)
    } catch (error) {
      console.error('Error checking UUID uniqueness:', error)
      return false
    }
  }

  const generateUniqueUUID = async () => {
    let uuid
    let attempts = 0
    const maxAttempts = 10 // Prevent infinite loops
    
    do {
      uuid = generateAlphanumericUUID()
      attempts++
    } while (!(await isUUIDUnique(uuid)) && attempts < maxAttempts)
    
    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique UUID after multiple attempts')
    }
    
    return uuid
  }

  // Load data from Firebase on component mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true)
        const [
          facultiesData,
          subjectsData,
          branchesData,
          chaptersData,
          lecturesData,
          assignmentsData
        ] = await Promise.all([
          facultyService.getAll(),
          subjectService.getAll(),
          branchService.getAll(),
          chapterService.getAll(),
          lectureService.getAll(),
          facultyAssignmentService.getAll()
        ])

        console.log('Loaded data:', {
          faculties: facultiesData,
          subjects: subjectsData,
          branches: branchesData,
          chapters: chaptersData,
          lectures: lecturesData,
          assignments: assignmentsData
        })

        setFaculties(facultiesData)
        setSubjects(subjectsData)
        setBranches(branchesData)
        setChapters(chaptersData)
        setLectures(lecturesData)
        setFacultyAssignments(assignmentsData)
      } catch (err) {
        setError('Failed to load data from database')
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAllData()
  }, [])

  const ManageItems = [
    {
      label: 'Faculty',
      icon: <Users size={18} />,
      color: '#f87171',
      bg: '#fee2e2',
    },
    {
      label: 'Subject',
      icon: <BookOpen size={18} />,
      color: '#fb923c',
      bg: '#ffedd5',
    },
    {
      label: 'Branches',
      icon: <GraduationCap size={18} />,
      color: '#34d399',
      bg: '#d1fae5',
    },
    {
      label: 'Chapter',
      icon: <FolderOpen size={18} />,
      color: '#60a5fa',
      bg: '#dbeafe',
    },
    {
      label: 'Assign Lecture Numbers',
      icon: <FileSignature size={18} />,
      color: '#a78bfa',
      bg: '#ede9fe',
    },
    {
      label: 'Faculty Assignment',
      icon: <Users size={18} />,
      color: '#ec4899',
      bg: '#fce7f3',
    },
    {
      label: 'Reset User Data',
      icon: <RotateCcw size={18} />,
      color: '#ef4444',
      bg: '#fef2f2',
    },
  ]

  // Function to clear user data
  const handleResetUserData = () => {
    // Build filter description based on selections
    const filters = []
    if (resetFaculty) filters.push(`Faculty: ${resetFaculty}`)
    if (resetChapter) filters.push(`Chapter: ${resetChapter}`)
    if (resetBranch) filters.push(`Branch: ${resetBranch}`)
    
    const filterDescription = filters.length > 0 
      ? `Filters applied:\n• ${filters.join('\n• ')}`
      : 'No filters selected - this will clear ALL user data!'
    
    // Set confirmation data and show confirmation modal
    setConfirmationData({
      filters,
      filterDescription,
      hasFilters: filters.length > 0
    })
    setShowConfirmModal(true)
  }

  // Function to actually perform the reset after confirmation
  const performReset = async () => {
    try {
      setOperationLoading(true)
      console.log('Performing reset with filters:', confirmationData.filters)

      // Use the Firebase service to delete by filter
      const deletedCount = await lectureProgressService.deleteByFilter(
        resetFaculty || null,
        resetChapter || null, 
        resetBranch || null
      )

      // Also clear faculty login session if specific faculty is selected
      if (resetFaculty) {
        const currentFacultyData = localStorage.getItem('currentFaculty')
        if (currentFacultyData) {
          try {
            const faculty = JSON.parse(currentFacultyData)
            if (faculty.name === resetFaculty) {
              localStorage.removeItem('currentFaculty')
              console.log('Cleared current faculty session for:', resetFaculty)
            }
          } catch (e) {
            console.error('Error parsing currentFaculty data:', e)
          }
        }
      }

      // If no filters, also clear all login sessions
      if (!resetFaculty && !resetChapter && !resetBranch) {
        localStorage.removeItem('currentFaculty')
        console.log('Cleared all faculty login sessions')
      }
      
      // Reset form and close modals
      setResetFaculty('')
      setResetChapter('')
      setResetBranch('')
      setShowResetModal(false)
      setShowConfirmModal(false)
      setConfirmationData(null)
      
      const filterSummary = confirmationData?.filters?.length > 0 
        ? ` (${confirmationData.filters.join(', ')})` 
        : ''
      setSuccessMessage(`Successfully cleared ${deletedCount} lecture progress records${filterSummary}!`)
      setTimeout(() => setSuccessMessage(null), 5000)
      
      console.log('Cleared lecture progress records:', deletedCount)
    } catch (error) {
      console.error('Error clearing user data:', error)
      setError('Failed to clear user data. Please try again.')
    } finally {
      setOperationLoading(false)
    }
  }

  // Common styles for the table
  const commonStyles = {
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      tableLayout: 'fixed',
    },
    th: {
      position: 'sticky',
      top: 0,
      backgroundColor: '#f3f4f6',
      color: '#111827',
      textAlign: 'left',
      padding: 8,
      borderBottom: '2px solid #e5e7eb',
      zIndex: 10,
      userSelect: 'none',
    },
    td: {
      padding: 8,
      borderBottom: '1px solid #e5e7eb',
      wordBreak: 'break-word',
    },
    input: {
      width: '100%',
      padding: '4px 6px',
      fontSize: 14,
      boxSizing: 'border-box',
      border: '1px solid #d1d5db',
      borderRadius: 4,
    },
    actionBtn: {
      cursor: 'pointer',
      marginLeft: 6,
      color: '#ef4444', // red for delete icon
    },
  }

  // Get service based on selected table
  const getService = (label) => {
    switch (label) {
      case 'Faculty': return facultyService
      case 'Subject': return subjectService  
      case 'Branches': return branchService
      case 'Chapter': return chapterService
      case 'Lectures': return lectureService  // This was the missing case!
      case 'Faculty Assignment': return facultyAssignmentService
      default: 
        console.error('No service found for label:', label)
        return null
    }
  }

  // Render editable table with add, edit, delete features
  const renderEditableTable = (label, data, setData, fields, newEntry, setNewEntry, fieldTypes = {}) => {
    const service = getService(label)

    const handleChange = async (index, field, value) => {
      try {
        setOperationLoading(true)
        const item = data[index]
        const updatedItem = { ...item, [field]: value }
        
        // Remove id from the data to update (Firebase doesn't allow updating id field)
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...dataToUpdate } = updatedItem
        
        await service.update(item.id, dataToUpdate)
        
        const updated = [...data]
        updated[index] = updatedItem
        setData(updated)
      } catch (err) {
        console.error('Error updating item:', err)
        setError('Failed to update item')
      } finally {
        setOperationLoading(false)
      }
    }

    const handleAdd = async () => {
      // Improved validation that handles both regular inputs and dropdowns
      const hasEmptyFields = fields.some((field) => {
        const value = newEntry[field]
        // Skip UUID validation for faculties as it will be auto-generated
        if (label === 'Faculty' && field === 'uuid') return false
        return !value || (typeof value === 'string' && value.trim() === '')
      })
      
      if (hasEmptyFields) {
        console.log('Validation failed - empty fields:', newEntry)
        return
      }
      
      try {
        setOperationLoading(true)
        console.log('Adding item:', { label, newEntry, service: service ? 'found' : 'not found' })
        
        let dataToAdd = { ...newEntry }
        
        // Generate unique UUID for faculties
        if (label === 'Faculty') {
          const uniqueUUID = await generateUniqueUUID()
          dataToAdd.uuid = uniqueUUID
          console.log('Generated UUID for faculty:', uniqueUUID)
          
          // Show the generated UUID to admin
          setError(null) // Clear any previous errors
          setSuccessMessage(`Faculty "${dataToAdd.name}" added successfully! Share this login UUID: ${uniqueUUID}`)
          setTimeout(() => setSuccessMessage(null), 10000) // Clear after 10 seconds
        }
        
        const newId = await service.add(dataToAdd)
        console.log('Successfully added item with ID:', newId)
        
        const newItem = { ...dataToAdd, id: newId }
        setData([...data, newItem])
        setNewEntry(Object.fromEntries(fields.map((f) => [f, ''])))
      } catch (err) {
        console.error('Error adding item:', err)
        setError(`Failed to add ${label}: ${err.message || 'Unknown error'}`)
      } finally {
        setOperationLoading(false)
      }
    }

    const handleDelete = async (index) => {
      try {
        setOperationLoading(true)
        const item = data[index]
        await service.delete(item.id)
        
        const updated = [...data]
        updated.splice(index, 1)
        setData(updated)
      } catch (err) {
        console.error('Error deleting item:', err)
        setError('Failed to delete item')
      } finally {
        setOperationLoading(false)
      }
    }

    const renderInputField = (field, value, onChange, isDisabled, placeholder = '', isNewEntry = false) => {
      // Handle UUID field for faculties - make it read-only and show auto-generated message
      if (label === 'Faculty' && field === 'uuid') {
        if (isNewEntry) {
          return (
            <input
              style={{
                ...commonStyles.input,
                backgroundColor: '#f9fafb',
                color: '#6b7280',
                fontStyle: 'italic'
              }}
              value="Auto-generated"
              disabled={true}
              placeholder="Auto-generated login UUID"
              readOnly
            />
          )
        } else {
          // For existing faculty, show the actual UUID
          return (
            <input
              style={{
                ...commonStyles.input,
                backgroundColor: '#f0f9ff',
                color: '#1e40af',
                fontWeight: 'bold',
                fontFamily: 'monospace'
              }}
              value={value || ''}
              readOnly
              title="Faculty Login UUID - Share this with the faculty member"
            />
          )
        }
      }
      
      if (fieldTypes[field] === 'dropdown') {
        const options = fieldTypes[field + '_options'] || []
        
        // Debug log for dropdown options
        if (field === 'chapterName' && options.length === 0) {
          console.log('No chapters available for dropdown. Current chapters data:', chapters)
        }
        
        return (
          <select
            style={{
              ...commonStyles.input,
              backgroundColor: isDisabled ? '#f9fafb' : 'white'
            }}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={isDisabled || options.length === 0}
          >
            <option value="">
              {options.length === 0 
                ? `No ${field} available` 
                : (placeholder || `Select ${field}`)
              }
            </option>
            {options.map((option) => (
              <option key={option.id || option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        )
      }
      
      return (
        <input
          style={commonStyles.input}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          placeholder={placeholder}
        />
      )
    }

    // Filter data based on search term for all tables
    const getFilteredData = (data, label, searchTerm) => {
      if (!searchTerm) return data
      
      const term = searchTerm.toLowerCase()
      
      return data.filter(item => {
        switch (label) {
          case 'Faculty':
            return (item.name && item.name.toLowerCase().includes(term)) ||
                   (item.code && item.code.toLowerCase().includes(term)) ||
                   (item.subject && item.subject.toLowerCase().includes(term))
          
          case 'Subject':
          case 'Branches':
            return item.name && item.name.toLowerCase().includes(term)
          
          case 'Chapter':
            return (item.subject && item.subject.toLowerCase().includes(term)) ||
                   (item.chapterName && item.chapterName.toLowerCase().includes(term))
          
          case 'Lectures':
            return (item.chapterName && item.chapterName.toLowerCase().includes(term)) ||
                   (item.nooflecturesrequired && item.nooflecturesrequired.toString().includes(term))
          
          case 'Faculty Assignment':
            return (item.faculty && item.faculty.toLowerCase().includes(term)) ||
                   (item.chapter && item.chapter.toLowerCase().includes(term)) ||
                   (item.branch && item.branch.toLowerCase().includes(term))
          
          default:
            return true
        }
      })
    }

    const filteredData = getFilteredData(data, label, searchTerm)

    // Get search theme colors based on card type
    const getSearchTheme = (label) => {
      const themes = {
        'Faculty': {
          backgroundColor: '#fef2f2',
          borderColor: '#fecaca', 
          focusColor: '#ef4444',
          textColor: '#dc2626'
        },
        'Subject': {
          backgroundColor: '#fef7ed',
          borderColor: '#fed7aa',
          focusColor: '#f97316',
          textColor: '#c2410c'
        },
        'Branches': {
          backgroundColor: '#f0fdf4',
          borderColor: '#bbf7d0',
          focusColor: '#22c55e',
          textColor: '#16a34a'
        },
        'Chapter': {
          backgroundColor: '#eff6ff',
          borderColor: '#bfdbfe',
          focusColor: '#3b82f6',
          textColor: '#2563eb'
        },
        'Lectures': {
          backgroundColor: '#f3f4f6',
          borderColor: '#d1d5db',
          focusColor: '#6b7280',
          textColor: '#4b5563'
        },
        'Faculty Assignment': {
          backgroundColor: '#fdf2f8',
          borderColor: '#f9a8d4',
          focusColor: '#ec4899',
          textColor: '#be185d'
        }
      }
      return themes[label] || themes['Faculty']
    }

    // Get search labels with full names now that we have space
    const getSearchLabel = (label) => {
      return `Search ${label}`
    }

    // Get descriptive placeholder text
    const getSearchPlaceholder = (label) => {
      const placeholders = {
        'Faculty': 'Type to search by name, code, or subject...',
        'Subject': 'Type to search subjects...',
        'Branches': 'Type to search branches...',
        'Chapter': 'Type to search by subject or chapter name...',
        'Lectures': 'Type to search by chapter or lecture count...',
        'Faculty Assignment': 'Type to search by faculty, chapter, or branch...'
      }
      return placeholders[label] || `Type to search ${label.toLowerCase()}...`
    }

    // Get item name for search results
    const getSearchItemName = (label) => {
      const names = {
        'Faculty': 'faculties',
        'Subject': 'subjects',
        'Branches': 'branches', 
        'Chapter': 'chapters',
        'Lectures': 'lectures',
        'Faculty Assignment': 'assignments'
      }
      return names[label] || 'items'
    }

    return (
      <>
        {/* Search input for all tables except Reset */}
        {label !== 'Reset User Data' && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px',
            backgroundColor: getSearchTheme(label).backgroundColor,
            border: `1px solid ${getSearchTheme(label).borderColor}`,
            borderRadius: '8px'
          }}>
            <div>
              <div style={{
                marginBottom: '8px'
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: getSearchTheme(label).textColor
                }}>
                  🔍 {getSearchLabel(label)}:
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px'
              }}>
                <input
                  type="text"
                  placeholder={getSearchPlaceholder(label)}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: `2px solid ${getSearchTheme(label).borderColor}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: '#fff'
                  }}
                  onFocus={(e) => e.target.style.borderColor = getSearchTheme(label).focusColor}
                  onBlur={(e) => e.target.style.borderColor = getSearchTheme(label).borderColor}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: getSearchTheme(label).focusColor,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {searchTerm && (
              <div style={{ 
                marginTop: '8px', 
                fontSize: '12px', 
                color: getSearchTheme(label).textColor,
                fontStyle: 'italic'
              }}>
                Showing {filteredData.length} of {data.length} {getSearchItemName(label)}
              </div>
            )}
          </div>
        )}
        
        <table style={commonStyles.table}>
          <thead>
            <tr>
              {fields.map((field) => (
                <th key={field} style={commonStyles.th}>
                  {field === 'uuid' ? 'Login UUID' : field.charAt(0).toUpperCase() + field.slice(1)}
                </th>
              ))}
              <th style={commonStyles.th}>Actions</th>
            </tr>
          </thead>
        </table>

        {/* Scrollable tbody with fixed height */}
        <div
          style={{
            height: 420,
            overflowY: 'auto',
            border: '1px solid #e5e7eb',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
          }}
          className="tbody-scroll"
        >
          <table style={{ ...commonStyles.table, marginTop: 0 }}>
            <tbody>
              {filteredData.map((row, i) => {
                // Get the original index for handleChange function
                const originalIndex = data.findIndex(item => item.id === row.id || item === row)
                return (
                  <tr key={row.id || i}>
                    {fields.map((field) => (
                      <td key={field} style={commonStyles.td}>
                        {renderInputField(
                          field,
                          row[field],
                          (value) => handleChange(originalIndex, field, value),
                          operationLoading,
                          '',
                        false
                      )}
                    </td>
                  ))}
                  <td style={commonStyles.td}>
                    <Trash2
                      size={16}
                      style={{
                        ...commonStyles.actionBtn,
                        opacity: operationLoading ? 0.5 : 1,
                        pointerEvents: operationLoading ? 'none' : 'auto'
                      }}
                      onClick={() => handleDelete(originalIndex)}
                      title="Delete row"
                    />
                  </td>
                </tr>
                )
              })}
              <tr>
                {fields.map((field) => (
                  <td key={field} style={commonStyles.td}>
                    {renderInputField(
                      field,
                      newEntry[field],
                      (value) => setNewEntry((prev) => ({ ...prev, [field]: value })),
                      operationLoading,
                      `Add ${field}`,
                      true
                    )}
                  </td>
                ))}
                <td style={commonStyles.td}>
                  <Plus
                    size={16}
                    style={{ 
                      cursor: operationLoading ? 'not-allowed' : 'pointer', 
                      color: operationLoading ? '#9ca3af' : '#10b981',
                      opacity: operationLoading ? 0.5 : 1
                    }}
                    onClick={handleAdd}
                    title="Add row"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    )
  }

  const getCurrentTable = () => {
    switch (selected) {
      case 'Faculty':
        return renderEditableTable('Faculty', faculties, setFaculties, [
          'name',
          'code',
          'subject',
          'uuid',
        ], newFacultyEntry, setNewFacultyEntry, {
          subject: 'dropdown',
          subject_options: subjects
        })
      case 'Subject':
        return renderEditableTable('Subject', subjects, setSubjects, ['name'], newSubjectEntry, setNewSubjectEntry)
      case 'Branches':
        return renderEditableTable('Branches', branches, setBranches, ['name'], newBranchEntry, setNewBranchEntry)
      case 'Chapter':
        return renderEditableTable('Chapter', chapters, setChapters, [
          'subject',
          'chapterName',
        ], newChapterEntry, setNewChapterEntry, {
          subject: 'dropdown',
          subject_options: subjects
        })
      case 'Assign Lecture Numbers':
        return renderEditableTable('Lectures', lectures, setLectures, [
          'chapterName',
          'nooflecturesrequired',
        ], newLectureEntry, setNewLectureEntry, {
          chapterName: 'dropdown',
          chapterName_options: chapters && chapters.length > 0 
            ? chapters.filter(ch => ch.chapterName).map(ch => ({ 
                name: ch.chapterName, 
                id: ch.id || ch.chapterName 
              }))
            : []
        })
      case 'Faculty Assignment':
        return renderEditableTable('Faculty Assignment', facultyAssignments, setFacultyAssignments, [
          'faculty',
          'chapter',
          'branch',
        ], newAssignmentEntry, setNewAssignmentEntry, {
          faculty: 'dropdown',
          faculty_options: faculties && faculties.length > 0 
            ? faculties.filter(f => f.name).map(f => ({ 
                name: f.name, 
                id: f.id || f.name 
              }))
            : [],
          chapter: 'dropdown',
          chapter_options: chapters && chapters.length > 0 
            ? chapters.filter(ch => ch.chapterName).map(ch => ({ 
                name: ch.chapterName, 
                id: ch.id || ch.chapterName 
              }))
            : [],
          branch: 'dropdown',
          branch_options: branches && branches.length > 0 
            ? branches.filter(b => b.name).map(b => ({
                name: b.name,
                id: b.id || b.name
              }))
            : []
        })
      case 'Reset User Data':
        return (
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            gap: '20px'
          }}>
            <div style={{
              backgroundColor: '#fef2f2',
              border: '2px solid #fecaca',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '350px'
            }}>
              <RotateCcw size={48} style={{ color: '#dc2626', marginBottom: '16px' }} />
              <h3 style={{ 
                color: '#dc2626', 
                margin: '0 0 12px 0',
                fontSize: '20px'
              }}>
                Reset User Data
              </h3>
              <p style={{ 
                color: '#7f1d1d', 
                fontSize: '14px', 
                lineHeight: '1.5',
                margin: '0 0 20px 0'
              }}>
                Clear faculty lecture progress data with precise control over what gets reset.
              </p>
              <button
                onClick={() => setShowResetModal(true)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#b91c1c'
                  e.target.style.transform = 'translateY(-1px)'
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#dc2626'
                  e.target.style.transform = 'translateY(0)'
                }}
              >
                <RotateCcw size={16} />
                Open Reset Panel
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 16
      }}>
        <Loader2 size={48} className="animate-spin" />
        <p>Loading data from database...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 16
      }}>
        <p style={{ color: '#ef4444', fontSize: 18 }}>❌ {error}</p>
        <p style={{ color: '#6b7280' }}>
          Please check your Firebase configuration and try again.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <div
        style={{
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
            Admin Database Management
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            Manage faculty data, subjects, branches, chapters, and lectures
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            padding: 10,
          }}
          onClick={() => navigate('/admin')}
        >
          <CircleChevronLeft />
          <p style={{ margin: 0 }}>Back</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div style={{
          margin: '20px',
          padding: '12px 16px',
          backgroundColor: '#dcfce7',
          border: '1px solid #22c55e',
          borderRadius: '8px',
          color: '#166534',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: '18px' }}>✅</span>
          <div>
            {successMessage}
            <div style={{ fontSize: '12px', color: '#15803d', marginTop: 4 }}>
              💡 Tip: Copy this UUID and share it securely with the faculty member as their login password.
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          margin: '20px',
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          color: '#b91c1c',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: '18px' }}>❌</span>
          {error}
        </div>
      )}

      <div style={{ padding: 20 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}
        >
          {/* Tabs on left */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              backgroundColor: '#f9fafb',
              padding: 16,
              borderRadius: 10,
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }}
          >
            {ManageItems.map((item) => (
              <div
                key={item.label}
                onClick={() => {
                  setSelected(item.label)
                  setError(null)
                  setSuccessMessage(null)
                  // Clear search term when switching cards
                  setSearchTerm('')
                  // Clear reset form when switching tabs
                  setResetFaculty('')
                  setResetChapter('')
                  setResetBranch('')
                  setShowResetModal(false)
                  setShowConfirmModal(false)
                  setConfirmationData(null)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: item.bg,
                  color: item.color,
                  fontWeight: 500,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow:
                    selected === item.label
                      ? `0 0 0 2px ${item.color}`
                      : '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: '0.3s ease',
                  textAlign: 'center',
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Right panel with sticky header table */}
          <div
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 10,
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minHeight: 100,
              maxHeight: 540, // 20 padding top + 500 scroll + 20 padding bottom
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {ManageItems.find((i) => i.label === selected)?.icon}
              <h2 style={{ margin: 0 }}>{selected}</h2>
            </div>
            {getCurrentTable()}
          </div>
        </div>
      </div>

      {/* Minimal CSS for hiding scrollbar on webkit */}
      <style>{`
        .tbody-scroll::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Reset User Data Modal */}
      {showResetModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowResetModal(false)
            }
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#fef2f2',
              border: '0 0 1px solid #fecaca',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h2 style={{ 
                color: '#dc2626', 
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '20px'
              }}>
                <RotateCcw size={24} />
                Reset User Data
              </h2>
              <p style={{ 
                color: '#7f1d1d', 
                fontSize: '14px', 
                margin: '0',
                lineHeight: '1.5'
              }}>
                Select specific criteria to reset data precisely
              </p>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1
            }}>
              {/* Filter Controls */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>Filter Options:</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Faculty Filter */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '600', 
                      marginBottom: '6px',
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Faculty:
                    </label>
                    <select
                      value={resetFaculty}
                      onChange={(e) => setResetFaculty(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="">All Faculties</option>
                      {faculties.map((faculty, idx) => (
                        <option key={faculty.id || idx} value={faculty.name}>
                          {faculty.name} ({faculty.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Chapter Filter */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '600', 
                      marginBottom: '6px',
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Chapter:
                    </label>
                    <select
                      value={resetChapter}
                      onChange={(e) => setResetChapter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="">All Chapters</option>
                      {chapters.map((chapter, idx) => (
                        <option key={chapter.id || idx} value={chapter.chapterName}>
                          {chapter.chapterName} ({chapter.subject})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Branch Filter */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '600', 
                      marginBottom: '6px',
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Branch:
                    </label>
                    <select
                      value={resetBranch}
                      onChange={(e) => setResetBranch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="">All Branches</option>
                      {branches.map((branch, idx) => (
                        <option key={branch.id || idx} value={branch.name}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preview */}
                {(resetFaculty || resetChapter || resetBranch) && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: '#e0f2fe',
                    border: '1px solid #81d4fa',
                    borderRadius: '6px'
                  }}>
                    <p style={{ margin: '0', fontSize: '14px', color: '#0277bd' }}>
                      <strong>Will reset data for:</strong><br />
                      {[
                        resetFaculty && `Faculty: ${resetFaculty}`,
                        resetChapter && `Chapter: ${resetChapter}`,
                        resetBranch && `Branch: ${resetBranch}`
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: '0', fontSize: '13px', color: '#856404' }}>
                  ⚠️ <strong>Warning:</strong> This action cannot be undone. {
                    !resetFaculty && !resetChapter && !resetBranch 
                      ? 'All user data will be cleared!'
                      : 'Only data matching your filters will be cleared.'
                  }
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              borderTop: '1px solid #e5e7eb',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#f9fafb'
            }}>
              <button
                onClick={() => {
                  setResetFaculty('')
                  setResetChapter('')
                  setResetBranch('')
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                disabled={operationLoading}
              >
                Clear Filters
              </button>

              <button
                onClick={() => setShowResetModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                disabled={operationLoading}
              >
                Cancel
              </button>
              
              <button
                onClick={() => {
                  handleResetUserData()
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                }}
                disabled={operationLoading}
              >
                {operationLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} />
                    Reset Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmationData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              width: '90%',
              maxWidth: '480px',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#fef2f2',
              padding: '20px',
              textAlign: 'center',
              borderBottom: '1px solid #fecaca'
            }}>
              <h3 style={{ 
                color: '#dc2626', 
                margin: '0 0 8px 0',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                🗑️ Confirm Reset Action
              </h3>
              <p style={{ 
                color: '#7f1d1d', 
                fontSize: '14px', 
                margin: '0',
                lineHeight: '1.4'
              }}>
                This will clear faculty lecture progress data from the database.
              </p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              {/* Filters Applied */}
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#0369a1', fontSize: '14px' }}>
                  {confirmationData.hasFilters ? 'Filters Applied:' : 'No Filters Applied:'}
                </h4>
                {confirmationData.hasFilters ? (
                  <ul style={{ margin: '0', paddingLeft: '16px', color: '#075985' }}>
                    {confirmationData.filters.map((filter, idx) => (
                      <li key={idx} style={{ fontSize: '13px', marginBottom: '4px' }}>
                        {filter}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: '0', color: '#dc2626', fontSize: '13px', fontWeight: '500' }}>
                    ⚠️ All user data will be cleared!
                  </p>
                )}
              </div>

              {/* What will be cleared */}
              <div style={{
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#c2410c', fontSize: '14px' }}>
                  This includes:
                </h4>
                <ul style={{ margin: '0', paddingLeft: '16px', color: '#9a3412' }}>
                  <li style={{ fontSize: '13px', marginBottom: '4px' }}>Lecture progress records</li>
                  <li style={{ fontSize: '13px', marginBottom: '4px' }}>
                    Faculty login sessions {confirmationData.hasFilters ? '(if faculty selected)' : ''}
                  </li>
                </ul>
                <p style={{ 
                  margin: '12px 0 0 0', 
                  fontSize: '12px', 
                  fontStyle: 'italic', 
                  color: '#dc2626',
                  fontWeight: '500'
                }}>
                  ⚠️ This action cannot be undone and will permanently delete data from the Firebase database.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              borderTop: '1px solid #e5e7eb',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#f9fafb'
            }}>
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setConfirmationData(null)
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={performReset}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
                }}
              >
                <RotateCcw size={16} />
                OK, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MaintainDb
