import React, { useState, useEffect } from 'react';
import UserManagement from './UserManagement'; // Component for managing users
import FileManagement from './FileManagement'; // Component for managing files
import BackupManagement from './BackupManagement'; // Component for managing backups

const AdminDashboard = ({ currentUser }) => {
  // Initialize state and set default tab
  const [activeTab, setActiveTab] = useState(() => {
    // Load the active tab from local storage, or default to 'userManagement'
    return localStorage.getItem('activeTab') || 'userManagement';
  });

  // Effect to store the active tab in local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  if (!currentUser || currentUser.role !== 'admin') {
    return <div>You do not have permission to access this dashboard.</div>;
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <nav style={{ marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('userManagement')}>User Management</button>
        <button onClick={() => setActiveTab('fileManagement')}>File Management</button>
        <button onClick={() => setActiveTab('backupManagement')}>Backup Management</button>
      </nav>
      
      <div>
        {activeTab === 'userManagement' && <UserManagement />}
        {activeTab === 'fileManagement' && <FileManagement />}
        {activeTab === 'backupManagement' && <BackupManagement />}
      </div>
    </div>
  );
};

export default AdminDashboard;