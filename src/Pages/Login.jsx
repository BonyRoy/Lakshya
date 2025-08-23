import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { facultyService } from "../firebase/dbService.js";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const adminCredentials = {
    admin: "admin123",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for incomplete fields
    if (!username.trim() || !password.trim()) {
      toast.info("Please enter both username and password!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setLoading(true);

    try {
      // Check for admin login
      if (username === "admin" && password === adminCredentials.admin) {
        toast.success("Welcome Admin! Redirecting to admin panel...", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setTimeout(() => {
          navigate("/admin");
        }, 1000);
        return;
      }

      // Check for faculty login
      console.log("Attempting faculty login for:", username);
      const faculties = await facultyService.getAll();
      console.log("Available faculties:", faculties);

      const faculty = faculties.find(
        (f) =>
          f.name &&
          f.name.toLowerCase().trim() === username.toLowerCase().trim()
      );

      if (!faculty) {
        toast.error("Faculty not found! Please check your name spelling.", {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }

      if (faculty.uuid !== password.toUpperCase().trim()) {
        toast.error("Invalid login UUID! Please check your password.", {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }

      // Successful faculty login
      toast.success(
        `Welcome ${faculty.name}! Redirecting to faculty portal...`,
        {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );

      // Store faculty info in localStorage for use in /user page
      localStorage.setItem("currentFaculty", JSON.stringify(faculty));

      setTimeout(() => {
        navigate("/user");
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed! Please check your connection and try again.", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Eye icons as SVG components
  const EyeIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  const EyeOffIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );

  return (
    <>
      <div
        style={{
          display: "flex",
          height: "100vh",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
          flexDirection: "column",
          gap: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "2.5rem",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                color: "#1976d2", // Blue like button color
              }}
            >
              Edu
            </span>
            <span
              style={{
                color: "#333",
              }}
            >
              Flow
            </span>
          </h1>
          <h2
            style={{
              margin: 0,
              fontSize: "1rem",
              color: "#666",
            }}
          >
            Powered By{" "}
            <span
              style={{
                fontFamily: "cursive",
                background: "linear-gradient(45deg, #ffb300, #ff6f00)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: "bold",
                fontSize: "1.1rem",
              }}
            >
              Lakshya
            </span>
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "30px",
            backgroundColor: "#fff",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            gap: "15px",
            minWidth: "350px",
            maxWidth: "400px",
          }}
        >
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <h2 style={{ margin: 0, color: "#333", fontSize: "24px" }}>
              Login
            </h2>
          </div>

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            style={{
              padding: "12px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              backgroundColor: loading ? "#f9f9f9" : "white",
            }}
          />

          {/* Password input with visibility toggle */}
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{
                padding: "12px",
                paddingRight: "40px", // Make space for the icon
                fontSize: "16px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                width: "100%",
                boxSizing: "border-box",
                backgroundColor: loading ? "#f9f9f9" : "white",
              }}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              disabled={loading}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                color: loading ? "#ccc" : "#666",
                padding: "0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              fontSize: "16px",
              backgroundColor: loading ? "#ccc" : "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #fff",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                ></div>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          backgroundColor: "#007bff",
          padding: "16px 20px",
          textAlign: "center",
          fontSize: "14px",
          color: "#fff",
          fontWeight: "bold",
          boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "1200px",
            margin: "0 auto",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              flex: 1,
              minWidth: "200px",
            }}
          >
            <span>© 2025 EduFlow</span>
            <span style={{ color: "#66b3ff" }}>|</span>
            <span>All Rights Reserved</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              fontSize: "13px",
            }}
          >
            <span>Version 1.0.0</span>
          </div>
        </div>

        {/* Mobile responsive layout */}
        <style>{`
          @media (max-width: 768px) {
            footer > div {
              flex-direction: column !important;
              text-align: center !important;
            }
            footer > div > div:first-child {
              justify-content: center !important;
            }
            footer > div > div:last-child {
              justify-content: center !important;
            }
          }
        `}</style>
      </footer>

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

      {/* CSS for loading spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default Login;
