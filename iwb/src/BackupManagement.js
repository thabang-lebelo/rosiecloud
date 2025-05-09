import React, { useState } from 'react';

const BackupManagement = () => {
  const [data, setData] = useState('');
  const [fileName, setFileName] = useState('backup.txt');

  // Convert file to Base64 and load content
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(`backup_${file.name}`);

    const reader = new FileReader();
    reader.onload = () => {
      const base64Content = reader.result;
      setData(base64Content);
    };
    reader.readAsDataURL(file);
  };

  // Backup data to localStorage and trigger download
  const handleBackup = () => {
    if (!data) {
      alert('No data to backup!');
      return;
    }

    // Save to local storage
    localStorage.setItem('backupData', JSON.stringify({ content: data, name: fileName }));

    // Trigger download
    const element = document.createElement('a');
    element.setAttribute('href', data);
    element.setAttribute('download', fileName);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    alert('Backup complete. File has been downloaded and saved in localStorage.');
  };

  // Restore from local storage
  const handleRestore = () => {
    const stored = localStorage.getItem('backupData');
    if (stored) {
      const parsed = JSON.parse(stored);
      setData(parsed.content);
      setFileName(parsed.name);
      alert('Backup restored from localStorage.');
    } else {
      alert('No backup found in localStorage.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>🛡️ Backup Management</h2>

      <input type="file" onChange={handleFileChange} />
      <br /><br />

      <button onClick={handleBackup}>📦 Create Backup</button>
      <button onClick={handleRestore} style={{ marginLeft: '10px' }}>
        ♻️ Restore Backup
      </button>

      <h3 style={{ marginTop: '20px' }}>🔍 Preview:</h3>
      {data ? (
        <>
          {data.startsWith('data:image') && (
            <img src={data} alt="preview" style={{ maxWidth: '300px', display: 'block' }} />
          )}
          {data.startsWith('data:text') && (
            <textarea
              readOnly
              value={atob(data.split(',')[1])}
              style={{ width: '100%', height: '150px' }}
            />
          )}
          {data.startsWith('data:application/pdf') && (
            <iframe
              src={data}
              style={{ width: '100%', height: '300px', border: '1px solid #ccc' }}
              title="PDF Preview"
            />
          )}
        </>
      ) : (
        <p>No data loaded.</p>
      )}
    </div>
  );
};

export default BackupManagement;
