import { LogOut } from 'lucide-react'
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  facultyAssignmentService,
  lectureService,
  lectureProgressService
} from '../firebase/dbService.js'

const ZigZagClipPath = () => (
  <svg width="0" height="0">
    <defs>
      <clipPath id="zigzag" clipPathUnits="objectBoundingBox">
        <path
          d="
            M0,0 
            H1 
            V0.95 
            L0.95,1 
            L0.9,0.95 
            L0.85,1 
            L0.8,0.95 
            L0.75,1 
            L0.7,0.95 
            L0.65,1 
            L0.6,0.95 
            L0.55,1 
            L0.5,0.95 
            L0.45,1 
            L0.4,0.95 
            L0.35,1 
            L0.3,0.95 
            L0.25,1 
            L0.2,0.95 
            L0.15,1 
            L0.1,0.95 
            L0.05,1 
            L0,0.95 
            Z
          "
        />
      </clipPath>
    </defs>
  </svg>
)

// Remove the localStorage service - everything will use Firebase now
const User = () => {
  const navigate = useNavigate()

  // Get faculty info from localStorage (set during login)
  const [currentFaculty, setCurrentFaculty] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [lectureData, setLectureData] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [selectedChapter, setSelectedChapter] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [contentTaught, setContentTaught] = useState('')
  const [overshootRemark, setOvershootRemark] = useState('')
  const [substituteRemark, setSubstituteRemark] = useState('')
  const [showModal, setShowModal] = useState(false)

  // Progress tracking
  const [previousRemarks, setPreviousRemarks] = useState([])
  const [lectureTypes, setLectureTypes] = useState([])

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Get faculty from localStorage
        const facultyData = localStorage.getItem('currentFaculty')
        if (!facultyData) {
          toast.error('Please login first!')
          navigate('/')
          return
        }
        
        const faculty = JSON.parse(facultyData)
        setCurrentFaculty(faculty)
        
        // Load assignments and lectures
        const [assignmentsData, lecturesData] = await Promise.all([
          facultyAssignmentService.getAll(),
          lectureService.getAll()
        ])
        
        // Store all assignments (needed for substitute teaching)
        setAssignments(assignmentsData)
        setLectureData(lecturesData)
        
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [navigate])

  // Define functions first before useEffect hooks
  const loadPreviousProgress = useCallback(async () => {
    try {
      // Get ALL progress records for this chapter + branch combination (from any faculty)
      const progressRecords = await lectureProgressService.getAllByChapterBranch(
        selectedChapter, 
        selectedBranch
      )
      
      console.log(`📚 Found ${progressRecords.length} progress records for ${selectedChapter} in ${selectedBranch}`)
      
      if (progressRecords.length > 0) {
        // Combine all PROGRESS entries from all faculty members
        const allProgressEntries = []
        
        progressRecords.forEach(record => {
          if (record.PROGRESS && record.PROGRESS.length > 0) {
            record.PROGRESS.forEach(p => {
              allProgressEntries.push({
                faculty: p['Faculty name'] || p.facultyName,
                contentTaught: p.CONTENTTAUGHT,
                lectureTypes: Array.isArray(p.lectureTypes) ? p.lectureTypes : ['REGULAR'],
                overshootRemark: p.overshootRemark || '',
                substituteRemark: p.substituteRemark || '',
                date: p.DATE,
                id: p.id || Date.now()
              })
            })
          }
        })
        
        // Sort by date (oldest first)
        allProgressEntries.sort((a, b) => new Date(a.date) - new Date(b.date))
        
        setPreviousRemarks(allProgressEntries)
        console.log('📚 Combined progress entries:', allProgressEntries.length, 'total lectures')
      } else {
        setPreviousRemarks([])
        console.log('📚 No previous progress found for this chapter/branch combination')
      }
      
    } catch (error) {
      console.error('Error loading previous progress:', error)
      setPreviousRemarks([])
    }
  }, [selectedChapter, selectedBranch])

  // Use useCallback to prevent unnecessary re-renders and ensure stable reference
  const calculateLectureTypes = useCallback(() => {
    // More robust validation
    if (!selectedChapter || !selectedBranch || !currentFaculty || !lectureData.length || !assignments.length || !previousRemarks) {
      console.log('❌ calculateLectureTypes: Missing required data', {
        selectedChapter: !!selectedChapter,
        selectedBranch: !!selectedBranch, 
        currentFaculty: !!currentFaculty,
        lectureDataLength: lectureData.length,
        assignmentsLength: assignments.length,
        previousRemarksLength: previousRemarks?.length
      })
      return
    }
    
    const types = []
    const completedLectures = previousRemarks.length
    const chapterLecture = lectureData.find(l => l.chapterName === selectedChapter)
    
    if (!chapterLecture) {
      console.log('❌ No chapter lecture data found for:', selectedChapter)
      return
    }
    
    const requiredLectures = parseInt(chapterLecture.nooflecturesrequired) || 0
    
    // DEBUGGING - Log all the raw values
    console.log('🔍 DEBUG - calculateLectureTypes:', {
      selectedChapter,
      selectedBranch,
      previousRemarksLength: previousRemarks.length,
      chapterLecture,
      requiredLecturesRaw: chapterLecture?.nooflecturesrequired,
      requiredLecturesParsed: requiredLectures
    })
    
    // Calculate what the NEXT lecture submission will be (completedLectures + 1)
    const nextLectureNumber = completedLectures + 1
    
    console.log('🔍 CALCULATION LOGIC:')
    console.log(`  Completed: ${completedLectures}`)
    console.log(`  Next: ${nextLectureNumber}`)  
    console.log(`  Required: ${requiredLectures}`)
    console.log(`  Overshoot threshold: ${requiredLectures}`)
    console.log(`  Check: completed >= required? ${completedLectures} >= ${requiredLectures} = ${completedLectures >= requiredLectures}`)
    
    // UPDATED: Overshoot only when you actually exceed required lectures
    if (completedLectures >= requiredLectures) {
      types.push('OVERSHOOT')
      console.log('🚨 OVERSHOOT: Beyond required lectures')
      console.log(`🚨 ${completedLectures} >= ${requiredLectures} = TRUE`)
    } else {
      types.push('REGULAR')
      console.log('🚨 REGULAR: Within required lectures')  
      console.log(`🚨 ${completedLectures} >= ${requiredLectures} = FALSE`)
    }
    
    // IMPROVED SUBSTITUTE LOGIC: Check if current faculty is different from previous faculty
    const isSubstitute = (() => {
      // If there are previous lectures, check if they were taught by a different faculty
      if (previousRemarks.length > 0) {
        const lastPreviousFaculty = previousRemarks[previousRemarks.length - 1].faculty
        if (lastPreviousFaculty && lastPreviousFaculty !== currentFaculty.name) {
          console.log(`📝 SUBSTITUTE: Previous faculty was "${lastPreviousFaculty}", current is "${currentFaculty.name}"`)
          return true
        }
      }
      
      // Fallback: Check if this faculty is assigned to this chapter/branch
      const assignment = assignments.find(a => 
        a.faculty === currentFaculty.name && 
        a.chapter === selectedChapter && 
        a.branch === selectedBranch
      )
      
      if (!assignment) {
        console.log(`📝 SUBSTITUTE: No assignment found for ${currentFaculty.name} in ${selectedChapter} at ${selectedBranch}`)
        return true
      }
      
      console.log(`📝 REGULAR: ${currentFaculty.name} is assigned to teach ${selectedChapter} at ${selectedBranch}`)
      return false
    })()
    
    if (isSubstitute) {
      types.push('SUBSTITUTE')
      console.log('🔄 Adding SUBSTITUTE')
    }
    
    setLectureTypes(types)
    
    console.log('🎯 FINAL RESULT:', {
      completedLectures,
      nextLectureNumber,
      requiredLectures,
      previousFaculty: previousRemarks.length > 0 ? previousRemarks[previousRemarks.length - 1].faculty : 'None',
      currentFaculty: currentFaculty.name,
      isSubstitute,
      calculatedTypes: types
    })
  }, [selectedChapter, selectedBranch, currentFaculty, lectureData, assignments, previousRemarks])

  // Load previous progress when chapter/branch changes
  useEffect(() => {
    if (selectedChapter && selectedBranch && currentFaculty && lectureData.length > 0 && assignments.length > 0) {
      console.log('🔄 Loading progress for:', selectedChapter, selectedBranch)
      loadPreviousProgress()
    }
  }, [selectedChapter, selectedBranch, currentFaculty, lectureData, assignments, loadPreviousProgress])

  // Calculate lecture types when previousRemarks changes or when other dependencies change
  useEffect(() => {
    if (selectedChapter && selectedBranch && currentFaculty && lectureData.length > 0 && assignments.length > 0 && previousRemarks !== undefined) {
      console.log('🔄 Calculating lecture types due to data change')
      calculateLectureTypes()
    }
  }, [calculateLectureTypes, selectedChapter, selectedBranch, currentFaculty, lectureData, assignments, previousRemarks])

  const getGreeting = () => {
    const hour = new Date().getHours()
    let greeting = ''
    if (hour < 12) greeting = 'Good Morning'
    else if (hour < 18) greeting = 'Good Afternoon'
    else greeting = 'Good Evening'
    
    return `${greeting}, ${currentFaculty?.name || 'Faculty'}`
  }

  // Get chapters and branches assigned to current faculty
  // Note: For substitute teaching, faculty can teach any unassigned chapter/branch combination
  const getAvailableChapters = () => {
    if (!currentFaculty) return []
    
    const chapters = new Set()
    
    // FIXED: Only add chapters assigned to the CURRENT faculty
    assignments.forEach(a => {
      if (a.faculty === currentFaculty.name && a.chapter) {
        chapters.add(a.chapter)
      }
    })
    
    console.log('📚 Available chapters for', currentFaculty.name, ':', Array.from(chapters))
    return Array.from(chapters)
  }

  const getAvailableBranches = () => {
    if (!selectedChapter || !currentFaculty) return []
    
    const branches = new Set()
    
    // FIXED: Only add branches where the CURRENT faculty is assigned to teach the selected chapter
    assignments.forEach(a => {
      if (a.faculty === currentFaculty.name && a.chapter === selectedChapter && a.branch) {
        branches.add(a.branch)
      }
    })
    
    console.log('🏢 Available branches for', currentFaculty.name, 'teaching', selectedChapter, ':', Array.from(branches))
    return Array.from(branches)
  }

  const handleSubmit = async () => {
    if (!selectedChapter || !selectedBranch || !contentTaught.trim()) {
      toast.info('Please fill all required fields!')
      return
    }
    
    if (lectureTypes.includes('OVERSHOOT') && !overshootRemark.trim()) {
      toast.info('Please provide overshoot remark!')
      return
    }
    
    if (lectureTypes.includes('SUBSTITUTE') && !substituteRemark.trim()) {
      toast.info('Please provide substitute remark!')
      return
    }
    
    try {
      setLoading(true)
      
      // Get total lectures required for this chapter
      const chapterLecture = lectureData.find(l => l.chapterName === selectedChapter)
      const totalLectures = chapterLecture ? chapterLecture.nooflecturesrequired : '0'
      
      const progressEntry = {
        'Faculty name': currentFaculty.name,
        facultyName: currentFaculty.name,
        facultyCode: currentFaculty.code,
        subject: currentFaculty.subject,
        DATE: new Date().toISOString(),
        CONTENTTAUGHT: contentTaught.trim(),
        lectureTypes: lectureTypes,
        overshootRemark: overshootRemark.trim(),
        substituteRemark: substituteRemark.trim(),
        totalLectures: totalLectures
      }
      
      await lectureProgressService.addProgressEntry(
        currentFaculty.name, 
        selectedChapter, 
        selectedBranch, 
        progressEntry
      )
      
      // Reload previous progress (this will automatically trigger calculateLectureTypes)
      await loadPreviousProgress()
      
      // Reset form
      setContentTaught('')
      setOvershootRemark('')
      setSubstituteRemark('')
      
      toast.success('Lecture progress submitted successfully!')
      
    } catch (error) {
      console.error('Error submitting:', error)
      toast.error('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('currentFaculty')
    setShowModal(false)
    navigate('/')
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#000',
        color: '#fff'
      }}>
        <div>Loading faculty data...</div>
      </div>
    )
  }

  if (!currentFaculty) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#000',
        color: '#fff'
      }}>
        <div>Please login first!</div>
      </div>
    )
  }

  const availableChapters = getAvailableChapters()
  const availableBranches = getAvailableBranches()

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#000',
        color: '#000',
        position: 'relative',
        fontFamily: 'monospace',
      }}
    >
      <ZigZagClipPath />

      {/* Logout Button */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#ff4d4f',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 12px',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        <LogOut size={16} />
        Logout
      </button>

      <div
        style={{
          padding: '20px',
          marginTop: '80px',
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        {/* Main Form */}
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            backgroundColor: '#fff',
            borderRadius: '12px 12px 0 0',
            boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            fontFamily: 'monospace',
            clipPath: 'url(#zigzag)',
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: '#f7f7f7',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <h2 style={{ margin: 0 }}>{getGreeting()}</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
              Subject: {currentFaculty.subject} | Code: {currentFaculty.code}
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: '20px', lineHeight: 1.6 }}>
            {/* Chapter Selection */}
            <div style={{ marginBottom: '15px' }}>
              <strong>Chapter:</strong>
              <select
                value={selectedChapter}
                disabled={!!selectedChapter} // Disable once selected
                onChange={(e) => {
                  setSelectedChapter(e.target.value)
                  setSelectedBranch('') // Reset branch when chapter changes
                }}
                style={{
                  marginTop: '4px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  width: '100%',
                  border: selectedChapter ? '2px solid #10b981' : '1px solid #ccc',
                  backgroundColor: selectedChapter ? '#f0fdf4' : 'white',
                  cursor: selectedChapter ? 'not-allowed' : 'pointer',
                  opacity: selectedChapter ? 0.8 : 1,
                }}
              >
                <option value="">Select a chapter</option>
                {availableChapters.map((chapter, idx) => (
                  <option key={idx} value={chapter}>
                    {chapter}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Selection */}
            {selectedChapter && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Branch:</strong>
                <select
                  value={selectedBranch}
                  disabled={!!selectedBranch} // Disable once selected
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  style={{
                    marginTop: '4px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    width: '100%',
                    border: selectedBranch ? '2px solid #10b981' : '1px solid #ccc',
                    backgroundColor: selectedBranch ? '#f0fdf4' : 'white',
                    cursor: selectedBranch ? 'not-allowed' : 'pointer',
                    opacity: selectedBranch ? 0.8 : 1,
                  }}
                >
                  <option value="">Select a branch</option>
                  {availableBranches.map((branch, idx) => (
                    <option key={idx} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
            )}



            {/* Show lecture info and types */}
            {selectedChapter && selectedBranch && (
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd', 
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <strong>Lecture Info:</strong>
                <div style={{ marginTop: '8px', fontSize: '14px' }}>
                  <div>Progress: {previousRemarks.length} lectures completed</div>
                  <div>Next lecture will be: #{previousRemarks.length + 1}</div>
                  <div>Required: {lectureData.find(l => l.chapterName === selectedChapter)?.nooflecturesrequired || 0} lectures</div>
                  <div>Type: {lectureTypes.join(' + ')}</div>
                  {lectureTypes.length > 0 && (
                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '13px', 
                      fontStyle: 'italic', 
                      color: '#475569' 
                    }}>
                      {lectureTypes.includes('REGULAR') && (
                        <div>• Regular: Within assigned lecture count</div>
                      )}
                      {lectureTypes.includes('OVERSHOOT') && (
                        <div>• Overshoot: Beyond required lectures (remark needed)</div>
                      )}
                      {lectureTypes.includes('SUBSTITUTE') && (
                        <div>• Substitute: Teaching unassigned chapter/branch (remark needed)</div>
                      )}
                    </div>
              )}
            </div>
              </div>
            )}

            {/* Content Taught */}
            {selectedChapter && selectedBranch && (
              <div style={{ marginBottom: '15px' }}>
              <strong>Content Taught:</strong>
              <input
                type="text"
                value={contentTaught}
                onChange={(e) => setContentTaught(e.target.value)}
                  placeholder="Enter content taught today"
                style={{
                  marginTop: '4px',
                    padding: '8px 10px',
                  width: '100%',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                }}
              />
            </div>
            )}

            {/* Overshoot Remark */}
            {lectureTypes.includes('OVERSHOOT') && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Overshoot Remark:</strong>
                <input
                  type="text"
                  value={overshootRemark}
                  onChange={(e) => setOvershootRemark(e.target.value)}
                  placeholder="Why are you teaching beyond required lectures?"
                style={{
                  marginTop: '4px',
                    padding: '8px 10px',
                    width: '100%',
                  borderRadius: '6px',
                    border: '1px solid #ffa940',
                    backgroundColor: '#fff7e6'
                }}
                />
              </div>
            )}

            {/* Substitute Remark */}
            {lectureTypes.includes('SUBSTITUTE') && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Substitute Remark:</strong>
                <input
                  type="text"
                  value={substituteRemark}
                  onChange={(e) => setSubstituteRemark(e.target.value)}
                  placeholder="Why are you substituting for another faculty?"
                  style={{
                    marginTop: '4px',
                    padding: '8px 10px',
                    width: '100%',
                    borderRadius: '6px',
                    border: '1px solid #ff7875',
                    backgroundColor: '#fff1f0'
                  }}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          {selectedChapter && selectedBranch && (
          <div
            style={{
              borderTop: '1px dashed #ccc',
                padding: '20px',
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
            }}
          >
            <button
              onClick={handleSubmit}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                  marginBottom:"20px"
                }}
              >
                Submit Lecture
              </button>
            </div>
          )}
        </div>

        {/* Previous Remarks Table */}
        {selectedChapter && selectedBranch && previousRemarks.length > 0 && (
          <div
            style={{
              width: '100%',
              maxWidth: '600px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                backgroundColor: '#f7f7f7',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <h3 style={{ margin: 0 }}>Previous Lectures</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                {selectedChapter} - {selectedBranch}
              </p>
            </div>
            
            <div style={{ 
              maxHeight: 'clamp(400px, 60vh, 80vh)', 
              overflowY: 'auto',
              minHeight: '200px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e8e8e8' }}>
                      Faculty
                    </th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e8e8e8' }}>
                      Content
                    </th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e8e8e8' }}>
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previousRemarks.map((remark, idx) => (
                    <tr key={remark.id || idx}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ fontWeight: 'bold' }}>{remark.faculty}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          {remark.lectureTypes?.join(' + ')}
                        </div>
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
                        <div>{remark.contentTaught}</div>
                        {remark.overshootRemark && (
                          <div style={{ fontSize: '11px', color: '#fa8c16' }}>
                            Overshoot: {remark.overshootRemark}
                          </div>
                        )}
                        {remark.substituteRemark && (
                          <div style={{ fontSize: '11px', color: '#f5222d' }}>
                            Substitute: {remark.substituteRemark}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                        {new Date(remark.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '10px',
              textAlign: 'center',
              width: '90%',
              maxWidth: '320px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <h4>Confirm Logout</h4>
            <p>Are you sure you want to logout?</p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                marginTop: '10px',
                gap: '10px',
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ccc',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff4d4f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

export default User
