// LoginPage.js
import React, { useState } from 'react';
import axios from 'axios';

const LoginPage = ({ navigateTo, checkUserCredentials }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await axios.post("http://localhost:5000/login", {
        email,
        password,
        role,
      });

      if (response.data && response.data.user) {
        const userData = response.data.user;
        checkUserCredentials(userData.email, userData.password, userData.role);
        setSuccessMessage("Login successful! Redirecting...");
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || "An error occurred. Please try again.");
    }
  };

  return (
    <div
      className="login-container"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#f1f5f9',
      }}
    >
      {/* Header */}
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h1 
          style={{ 
            fontSize: '22px', 
            color: '#0f172a',
            cursor: 'pointer',
          }}
          onClick={() => navigateTo("home")}
        >
          Innovative Waste Bins
        </h1>
        <button
          onClick={() => navigateTo("home")}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#1e40af',
            border: '1px solid #1e40af',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Return to Home
        </button>
      </div>

      {/* Login Form Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          padding: '40px',
        }}
      >
        <h2
          style={{
            color: '#0f172a',
            fontSize: '24px',
            marginBottom: '24px',
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          Account Login
        </h2>

        {successMessage && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #10b981',
              borderRadius: '4px',
              color: '#065f46',
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #ef4444',
              borderRadius: '4px',
              color: '#b91c1c',
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#334155',
                fontWeight: '500',
              }}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontSize: '16px',
                color: '#0f172a',
                outline: 'none',
                transition: 'border-color 0.15s ease-in-out',
                boxSizing: 'border-box',
              }}
              placeholder="example@company.com"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#334155',
                fontWeight: '500',
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontSize: '16px',
                color: '#0f172a',
                outline: 'none',
                transition: 'border-color 0.15s ease-in-out',
                boxSizing: 'border-box',
              }}
              placeholder="Enter your password"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="role"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#334155',
                fontWeight: '500',
              }}
            >
              User Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontSize: '16px',
                color: '#0f172a',
                backgroundColor: '#fff',
                outline: 'none',
                transition: 'border-color 0.15s ease-in-out',
                boxSizing: 'border-box',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23334155' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              <option value="">Select Role</option>
              <option value="sales">Sales Personnel</option>
              <option value="finance">Finance Personnel</option>
              <option value="admin">Administrator</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#1e40af',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease-in-out',
            }}
          >
            Sign In
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          <p>
            Don't have an account?
            <button
              onClick={() => navigateTo("register")}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#1e40af',
                textDecoration: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                marginLeft: '4px',
              }}
            >
              Create Account
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '40px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '12px',
        }}
      >
        <p>© {new Date().getFullYear()} Innovative Waste Bins. All rights reserved.</p>
        <p style={{ marginTop: '8px' }}>
          <span style={{ margin: '0 8px', cursor: 'pointer' }}>Privacy Policy</span>
          <span style={{ margin: '0 8px', cursor: 'pointer' }}>Terms of Service</span>
          <span style={{ margin: '0 8px', cursor: 'pointer' }}>Support</span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;