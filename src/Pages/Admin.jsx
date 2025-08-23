import React, { useState } from 'react'
import { BarChart2, Database, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

const Admin = () => {
  const greeting = getGreeting()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  const handleLogout = () => {
    setShowModal(false)
    navigate('/')
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9f9f9',
        padding: '20px',
      }}
    >
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
        }}
      >
        <LogOut size={16} />
        Logout
      </button>

      {/* Main Content */}
      <h3>{greeting},</h3>
      <h2 style={{ marginBottom: '30px' }}>Admin</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          width: '100%',
          maxWidth: '600px',
        }}
      >
        <div
          onClick={() => navigate('/Analysis')}
          style={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '10px',
            padding: '30px',
            textAlign: 'center',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
          }}
        >
          <BarChart2 size={32} style={{ marginBottom: '10px' }} />
          <h4>Analysis</h4>
        </div>

        <div
          onClick={() => navigate('/MaintainDb')}
          style={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '10px',
            padding: '30px',
            textAlign: 'center',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
          }}
        >
          <Database size={32} style={{ marginBottom: '10px' }} />
          <h4>Maintain Data</h4>
        </div>
      </div>

      {/* Confirmation Modal */}
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
    </div>
  )
}

export default Admin
