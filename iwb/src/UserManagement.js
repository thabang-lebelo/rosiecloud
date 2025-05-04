import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: '' });
  const [editUser, setEditUser] = useState(null); // State to track editing user
  const [isLoading, setIsLoading] = useState(true);

  // Load users from the API when the component mounts
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users');
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Save users to the API
  const saveUser = async (user) => {
    try {
      if (editUser) {
        // Update user
        const response = await axios.put(`http://localhost:5000/api/users/${editUser._id}`, user);
        const updatedUser = response.data; // Get the updated user details
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u._id === updatedUser._id ? updatedUser : u))
        );
        setEditUser(null); // Reset edit mode
      } else {
        // Add new user
        const response = await axios.post('http://localhost:5000/api/users', user);
        setUsers((prevUsers) => [...prevUsers, response.data]);
      }
      setNewUser({ name: '', email: '', password: '', role: '' }); // Reset the form
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Failed to save user: " + (error.response && error.response.data.error ? error.response.data.error : error.message));
    }
  };

  // Delete user
  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`);
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user: " + (error.response && error.response.data.error ? error.response.data.error : error.message));
    }
  };

  // Set form fields for editing
  const handleEditUser = (user) => {
    setNewUser({ name: user.name, email: user.email, password: '', role: user.role });
    setEditUser(user);
  };

  // Manage input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  return (
    <div>
      <h2>User Management</h2>
      <h3>{editUser ? "Edit User" : "Add New User"}</h3>
      <input 
        type="text" 
        name="name" 
        placeholder="Name" 
        value={newUser.name}
        onChange={handleChange} 
      />
      <input 
        type="email" 
        name="email" 
        placeholder="Email" 
        value={newUser.email}
        onChange={handleChange} 
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={newUser.password}
        onChange={handleChange}
      />
      <select 
        name="role" 
        value={newUser.role} 
        onChange={handleChange}>
          <option value="">Select Role</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
          <option value="sales person">Sales Person</option>
          <option value="finance person">Finance Person</option>
      </select>
      <button onClick={() => saveUser(newUser)}>{editUser ? "Update User" : "Add User"}</button>

      <h3>Existing Users</h3>
      {isLoading ? (
        <p>Loading users...</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user._id}>
              {`${user.name} - ${user.email} (${user.role})`}
              <button onClick={() => handleEditUser(user)}>Edit</button>
              <button onClick={() => handleDeleteUser(user._id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserManagement;