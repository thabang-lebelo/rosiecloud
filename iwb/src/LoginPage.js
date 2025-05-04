import React, { useState } from 'react';
import axios from 'axios'; // Import axios

const LoginPage = ({ navigateTo, checkUserCredentials }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(""); // Keep role state
  const [successMessage, setSuccessMessage] = useState(""); // State for the success message
  const [errorMessage, setErrorMessage] = useState(""); // State for the error message

  const handleLogin = async (e) => {
    e.preventDefault();
    setSuccessMessage(""); // Clear previous success messages
    setErrorMessage(""); // Clear previous error messages

    try {
      const response = await axios.post("http://localhost:5000/login", {
        email,
        password,
        role // Include role if necessary
      });

      // If login is successful:
      if (response.data && response.data.user) {
        const userData = response.data.user;

        // Call the checkUserCredentials function to update the App component state
        checkUserCredentials(userData.email, userData.password, userData.role); 

        // Optionally, you can navigate with a delay
        setSuccessMessage("Login successful! Redirecting...");
      }
    } catch (error) {
      // If login fails, set error message
      setErrorMessage(error.response?.data?.error || "An error occurred. Please try again.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} required>
          <option value="">Select Role</option>
          <option value="sales">Sales Personnel</option>
          <option value="finance">Finance Personnel</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
        </select>
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <button onClick={() => navigateTo("register")}>Register</button>
      </p>
      
      {/* Display success message */}
      {successMessage && <div style={{ color: 'green', marginTop: '10px' }}>{successMessage}</div>}
      
      {/* Display error message */}
      {errorMessage && <div style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</div>}
    </div>
  );
};

export default LoginPage;