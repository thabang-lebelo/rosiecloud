import React, { useState, useEffect } from 'react';

const FileManagement = () => {
  const [files, setFiles] = useState([]);

  // Load files from local storage on mount
  useEffect(() => {
    const storedFiles = localStorage.getItem('files');
    if (storedFiles) {
      setFiles(JSON.parse(storedFiles));
    }
  }, []);

  // Save files to local storage on change
  useEffect(() => {
    localStorage.setItem('files', JSON.stringify(files));
  }, [files]);

  // Convert file to Base64
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          name: file.name,
          type: file.type,
          content: reader.result,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Handle Upload
  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const encodedFiles = await Promise.all(selectedFiles.map(toBase64));

    const uniqueFiles = [...files];
    encodedFiles.forEach((newFile) => {
      if (!uniqueFiles.some((f) => f.name === newFile.name)) {
        uniqueFiles.push(newFile);
      }
    });

    setFiles(uniqueFiles);
  };

  // Handle Delete
  const handleDeleteFile = (fileToDelete) => {
    const updatedFiles = files.filter((file) => file.name !== fileToDelete.name);
    setFiles(updatedFiles);
  };

  // Render Preview
  const renderPreview = (file) => {
    const { type, content, name } = file;

    if (type.startsWith('image/')) {
      return <img src={content} alt={name} style={{ maxWidth: '200px', display: 'block' }} />;
    } else if (type === 'text/csv' || name.endsWith('.csv') || type.startsWith('text/')) {
      try {
        const text = atob(content.split(',')[1]);
        return (
          <textarea
            value={text}
            readOnly
            style={{ width: '100%', height: '100px', whiteSpace: 'pre' }}
          />
        );
      } catch {
        return <p>Cannot display text preview</p>;
      }
    } else if (type === 'application/pdf') {
      return (
        <iframe
          src={content}
          title={name}
          style={{ width: '100%', height: '300px', border: '1px solid #ccc' }}
        />
      );
    } else {
      return (
        <a href={content} download={name}>
          Download {name}
        </a>
      );
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>📁 File Management</h2>
      <input type="file" multiple onChange={handleFileUpload} />
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {files.map((file, index) => (
          <li key={index} style={{ marginTop: '20px', borderBottom: '1px solid #ccc' }}>
            <strong>{file.name}</strong>
            <div>{renderPreview(file)}</div>
            <button onClick={() => handleDeleteFile(file)} style={{ marginTop: '10px' }}>
              ❌ Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileManagement;
