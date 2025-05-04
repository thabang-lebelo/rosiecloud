import React, { useState } from 'react';

const BackupManagement = () => {
  const [data, setData] = useState('');

  const handleBackup = () => {
    // Save current data to local storage
    localStorage.setItem('backupData', JSON.stringify(data));
    alert('Backup process initiated! Data has been saved.');
  };

  const handleRestore = () => {
    // Restore data from local storage
    const restoredData = localStorage.getItem('backupData');
    if (restoredData) {
      setData(JSON.parse(restoredData));
      alert('Restore process initiated! Data has been restored.');
    } else {
      alert('No backup found.');
    }
  };

  const handleChange = (e) => {
    setData(e.target.value);
  };

  return (
    <div>
      <h2>Backup Management</h2>
      <textarea
        value={data}
        onChange={handleChange}
        placeholder="Enter data to backup..."
        rows="5"
        cols="30"
      />
      <br />
      <button onClick={handleBackup}>Create Backup</button>
      <button onClick={handleRestore}>Restore Backup</button>
      <h3>Current Data:</h3>
      <p>{data || 'No data available.'}</p>
    </div>
  );
};

export default BackupManagement;