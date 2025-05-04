import React, { useState, useEffect } from 'react';

const FileManagement = () => {
  const [files, setFiles] = useState([]);

  // Load files from local storage when component mounts
  useEffect(() => {
    const storedFiles = localStorage.getItem('files');
    if (storedFiles) {
      setFiles(JSON.parse(storedFiles));
    }
  }, []);

  // Save files to local storage whenever the files state is updated
  useEffect(() => {
    localStorage.setItem('files', JSON.stringify(files));
  }, [files]);

  // Handle file upload
  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    
    // Prevent duplicate entries and maintain existing files
    const updatedFiles = [...files];
   
    newFiles.forEach(file => {
      if (!updatedFiles.some(existingFile => existingFile.name === file.name)) {
        updatedFiles.push(file);
      }
    });

    setFiles(updatedFiles);
  };

  // Handle delete file
  const handleDeleteFile = (fileToDelete) => {
    const updatedFiles = files.filter(file => file !== fileToDelete);
    setFiles(updatedFiles);
  };

  return (
    <div>
      <h2>File Management</h2>
      <input 
        type="file" 
        multiple 
        onChange={handleFileUpload} 
      />
      <ul>
        {files.map((file, index) => (
          <li key={index}>
            {file.name} 
            <button onClick={() => handleDeleteFile(file)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileManagement;