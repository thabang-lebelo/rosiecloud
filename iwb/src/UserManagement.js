import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = () => {
  const BASE_URL = 'https://rosiecloud.onrender.com';

  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: '' });
  const [editUser, setEditUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/users`);
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

  const saveUser = async (user) => {
    try {
      if (editUser) {
        const response = await axios.put(`${BASE_URL}/api/users/${editUser._id}`, user);
        const updatedUser = response.data;
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u._id === updatedUser._id ? updatedUser : u))
        );
        setEditUser(null);
      } else {
        const response = await axios.post(`${BASE_URL}/api/users`, user);
        setUsers((prevUsers) => [...prevUsers, response.data]);
      }
      setNewUser({ name: '', email: '', password: '', role: '' });
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Failed to save user: " + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/api/users/${id}`);
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user: " + (error.response?.data?.error || error.message));
    }
  };

  const handleEditUser = (user) => {
    setNewUser({ name: user.name, email: user.email, password: '', role: user.role });
    setEditUser(user);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  return (
    <div>
      <h2>User Management</h2>
      <h3>{editUser ? "Edit User" : "Add New User"}</h3>
      <input type="text" name="name" placeholder="Name" value={newUser.name} onChange={handleChange} />
      <input type="email" name="email" placeholder="Email" value={newUser.email} onChange={handleChange} />
      <input type="password" name="password" placeholder="Password" value={newUser.password} onChange={handleChange} />
      <select name="role" value={newUser.role} onChange={handleChange}>
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
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button onClick={() => handleEditUser(user)}>Edit</button>
                  <button onClick={() => handleDeleteUser(user._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagement;
