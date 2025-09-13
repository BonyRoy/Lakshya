import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { facultyService } from "../firebase/dbService.js";
import packageJson from "../../package.json";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const adminCredentials = {
    admin: "admin123",
  };

  // Load saved credentials on component mount
  React.useEffect(() => {
    const savedCredentials = localStorage.getItem("rememberedCredentials");
    if (savedCredentials) {
      try {
        const { username: savedUsername, password: savedPassword } =
          JSON.parse(savedCredentials);
        setUsername(savedUsername || "");
        setPassword(savedPassword || "");
        setRememberMe(true);
      } catch (error) {
        console.error("Error loading saved credentials:", error);
        localStorage.removeItem("rememberedCredentials");
      }
    }
  }, []);

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
      // Handle Remember Me functionality
      if (rememberMe) {
        localStorage.setItem(
          "rememberedCredentials",
          JSON.stringify({
            username: username.trim(),
            password: password.trim(),
          })
        );
      } else {
        localStorage.removeItem("rememberedCredentials");
      }

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
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        {/* Main container - responsive flex direction */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "60px",
            maxWidth: "1200px",
            width: "100%",
          }}
          className="main-container"
        >
          {/* Branding Section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              flex: "1",
              minWidth: "300px",
            }}
            className="branding-section animate-slide-in-left"
          >
            <h1
              style={{
                margin: 0,
                fontSize: "3.5rem",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
              className="main-title animate-fade-in-up"
            >
              <span
                style={{
                  color: "#1976d2",
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
                fontSize: "1.2rem",
                color: "#666",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              className="subtitle animate-fade-in-up animate-delay-200"
            >
              Powered By{" "}
              <span
                style={{
                  fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
                  background:
                    "linear-gradient(135deg, #ffb300, #ff6f00, #ff8f00)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontWeight: "600",
                  fontSize: "1.5rem",
                  letterSpacing: "1px",
                }}
              >
                Lakshya
              </span>
            </h2>
          </div>

          {/* Login Form Section */}
          <div
            style={{
              flex: "1",
              display: "flex",
              justifyContent: "center",
              minWidth: "350px",
            }}
            className="form-section animate-slide-in-right"
          >
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
                width: "100%",
                maxWidth: "400px",
              }}
              className="animate-form-hover"
            >
              {/* Title */}
              <div
                style={{ textAlign: "center", marginBottom: "10px" }}
                className="animate-fade-in-up animate-delay-400"
              >
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
                className="animate-fade-in-up animate-delay-500 animate-input-focus"
              />

              {/* Password input with visibility toggle */}
              <div
                style={{ position: "relative" }}
                className="animate-fade-in-up animate-delay-600"
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    padding: "12px",
                    paddingRight: "40px",
                    fontSize: "16px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    width: "100%",
                    boxSizing: "border-box",
                    backgroundColor: loading ? "#f9f9f9" : "white",
                  }}
                  className="animate-input-focus"
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
                  className="animate-button-hover"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {/* Remember Me Checkbox */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  color: "#666",
                }}
                className="animate-fade-in-up animate-delay-700"
              >
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  style={{
                    width: "16px",
                    height: "16px",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                  className="animate-checkbox"
                />
                <label
                  htmlFor="rememberMe"
                  style={{
                    cursor: loading ? "not-allowed" : "pointer",
                    userSelect: "none",
                  }}
                  className="animate-label-hover"
                >
                  Remember Me
                </label>
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
                className="animate-fade-in-up animate-delay-800 animate-button-primary"
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
        </div>
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
            <span>Version {packageJson.version}</span>
          </div>
        </div>
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

      {/* CSS for animations and responsive design */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Page Load Animations */
        @keyframes slideInLeft {
          0% {
            opacity: 0;
            transform: translateX(-50px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          0% {
            opacity: 0;
            transform: translateX(50px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes bounce {
          0%, 20%, 60%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          80% {
            transform: translateY(-5px);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }

        /* Animation Classes */
        .animate-slide-in-left {
          animation: slideInLeft 0.8s ease-out forwards;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.8s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-form-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .animate-form-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .animate-input-focus {
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
        }

        .animate-input-focus:focus {
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
          transform: translateY(-2px);
          outline: none;
        }

        .animate-button-hover {
          transition: all 0.3s ease;
        }

        .animate-button-hover:hover {
          transform: scale(1.1);
          color: #007bff;
        }

        .animate-button-primary {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .animate-button-primary:hover:not(:disabled) {
          background-color: #0056b3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .animate-button-primary:active:not(:disabled) {
          transform: translateY(0);
          animation: pulse 0.3s ease;
        }

        .animate-checkbox {
          transition: transform 0.2s ease;
        }

        .animate-checkbox:checked {
          animation: bounce 0.5s ease;
        }

        .animate-label-hover {
          transition: color 0.3s ease;
        }

        .animate-label-hover:hover {
          color: #007bff;
        }

        /* Animation Delays */
        .animate-delay-200 {
          animation-delay: 0.2s;
        }

        .animate-delay-400 {
          animation-delay: 0.4s;
        }

        .animate-delay-500 {
          animation-delay: 0.5s;
        }

        .animate-delay-600 {
          animation-delay: 0.6s;
        }

        .animate-delay-700 {
          animation-delay: 0.7s;
        }

        .animate-delay-800 {
          animation-delay: 0.8s;
        }

        /* Error Animation */
        .animate-error {
          animation: shake 0.5s ease-in-out;
          border-color: #dc3545 !important;
        }

        /* Loading Animation Enhancement */
        .animate-loading {
          animation: pulse 2s ease-in-out infinite;
        }

        /* Mobile responsive design */
        @media (max-width: 768px) {
          .main-container {
            flex-direction: column !important;
            gap: 40px !important;
            padding: 0 !important;
          }
          
          .branding-section {
            order: 1;
          }
          
          .form-section {
            order: 2;
            min-width: auto !important;
          }
          
          .main-title {
            font-size: 2.5rem !important;
          }
          
          .subtitle {
            font-size: 1rem !important;
          }

          /* Adjust animations for mobile */
          .animate-slide-in-left,
          .animate-slide-in-right {
            animation: fadeInUp 0.8s ease-out forwards;
          }
          
          /* Footer mobile layout */
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

        /* Tablet responsive design */
        @media (max-width: 1024px) and (min-width: 769px) {
          .main-container {
            gap: 40px !important;
          }
          
          .main-title {
            font-size: 3rem !important;
          }
        }

        /* Large desktop optimization */
        @media (min-width: 1200px) {
          .main-container {
            gap: 80px !important;
          }
        }

        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
};

export default Login;
