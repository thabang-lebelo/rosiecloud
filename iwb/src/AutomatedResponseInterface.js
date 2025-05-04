import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';

// REMOVE the following lines as 'natural' is a backend library:
// import natural from 'natural';
// const tokenizer = new natural.WordTokenizer();
// const { TfIdf } = natural;
// const calculateSimilarity = (text1, text2) => { ... };

// Accept handleDeleteQuery prop
const AutomatedResponseInterface = ({ queries, setQueries, handleDeleteQuery }) => {
    const [predefinedResponses, setPredefinedResponses] = useState([]);
    const [newResponse, setNewResponse] = useState({
        keywords: '',
        responseText: '',
        isDefault: false
    });
    const [editResponseId, setEditResponseId] = useState(null);
    const [backupStatus, setBackupStatus] = useState('');
    const [lastBackupDate, setLastBackupDate] = useState(null);
    const [showBackupModal, setShowBackupModal] = useState(false);
    const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
    const [backupLocation, setBackupLocation] = useState('cloud'); // 'cloud' or 'local'

    // Fetch automated responses
    useEffect(() => {
        const fetchResponses = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/automated-responses');
                setPredefinedResponses(res.data);
            } catch (err) {
                console.error('Error fetching automated responses:', err);
            }
        };

        fetchResponses();

        // Check last backup date from localStorage
        const storedBackupDate = localStorage.getItem('lastBackupDate');
        if (storedBackupDate) {
            setLastBackupDate(new Date(storedBackupDate));
        }

        const autoBackupSetting = localStorage.getItem('autoBackupEnabled');
        if (autoBackupSetting) {
            setAutoBackupEnabled(autoBackupSetting === 'true');
        }

        const storedBackupLocation = localStorage.getItem('backupLocation');
        if (storedBackupLocation) {
            setBackupLocation(storedBackupLocation);
        }

        // Note: Auto backup scheduling should ideally be done on the backend.
        // The frontend toggle might just communicate a preference to the backend.
        // For simplicity here, we'll just manage the setting in localStorage.
        // Remove the frontend setInterval logic for daily backup.
        // const intervalId = localStorage.getItem('backupIntervalId');
        // if (autoBackupEnabled && !intervalId) {
        //      // This logic should be on the backend
        // } else if (!autoBackupEnabled && intervalId) {
        //      clearInterval(parseInt(intervalId));
        //      localStorage.removeItem('backupIntervalId');
        // }

    }, []); // Empty dependency array means this runs only once on mount


    // --- Corrected Auto-Response Functions (Call Backend) ---

    // Handle automatic response to a query (calls backend endpoint)
    const triggerAutomaticResponse = async (queryId) => {
        try {
            // Make an API call to the backend to handle the auto-response logic
            const response = await axios.post(`http://localhost:5000/api/queries/${queryId}/auto-respond`); // New backend endpoint
            // Update queries in state with the updated query from the backend
            setQueries(prevQueries =>
                prevQueries.map(q =>
                    q._id === queryId ? response.data : q
                )
            );
            alert('Auto-response triggered successfully!');
        } catch (err) {
            console.error('Error triggering auto-response:', err);
            alert('Failed to trigger auto-response');
        }
    };

    // Auto-respond to all pending queries (calls backend endpoint)
    const autoRespondAll = async () => {
        if (!window.confirm('This will automatically respond to all pending queries. Continue?')) {
            return;
        }
        try {
            // Make an API call to the backend to handle auto-responding all pending queries
            const response = await axios.post('http://localhost:5000/api/queries/auto-respond-all-pending'); // New backend endpoint
            // Update queries in state with the updated queries from the backend
            setQueries(response.data.updatedQueries);
            alert(`Automatically responded to ${response.data.processedCount} queries`);
        } catch (err) {
            console.error('Error triggering auto-respond all:', err);
            alert('Failed to trigger auto-respond all');
        }
    };
     // --- End of Corrected Auto-Response Functions ---


    // Handle manual response to a query (still on frontend, but calls backend PUT)
    const handleManualResponse = async (queryId, responseText) => {
        try {
            const response = await axios.put(`http://localhost:5000/api/queries/${queryId}`, {
                status: 'resolved', // Mark as resolved (use lowercase 'resolved' to match schema enum)
                automatedResponse: responseText, // Store the manual response here
                autoResolved: false, // Manually resolved
                resolutionDate: new Date(), // Add resolution date
                resolvedBy: 'Manual' // Or the logged-in user's name/ID
            });

            // Update queries in state
            setQueries(prevQueries =>
                prevQueries.map(q =>
                    q._id === queryId ? response.data : q
                )
            );

            return true;
        } catch (err) {
            console.error('Error updating query status:', err);
            return false;
        }
    };

    // Add new automated response (calls backend POST)
    const handleAddResponse = async () => {
        if (!newResponse.responseText) {
            alert('Response text is required');
            return;
        }

        const keywordsArray = newResponse.keywords
            .split(',')
            .map(k => k.trim())
            .filter(k => k !== '');

        try {
            const response = await axios.post('http://localhost:5000/api/automated-responses', {
                keywords: keywordsArray,
                responseText: newResponse.responseText,
                isDefault: newResponse.isDefault
            });

            // If this is set as default, update other responses to not be default (optional, backend handles this)
            if (newResponse.isDefault) {
                setPredefinedResponses(prev =>
                    prev.map(r => ({...r, isDefault: false}))
                );
            }

            // Add the new response to the state
            setPredefinedResponses(prev => [...prev, response.data]);

            // Reset form
            setNewResponse({ keywords: '', responseText: '', isDefault: false });
        } catch (err) {
            console.error('Error adding automated response:', err);
            alert('Failed to add automated response');
        }
    };

    // Edit existing response (calls backend PUT)
    const handleEditResponse = async () => {
        if (!editResponseId || !newResponse.responseText) {
            alert('Invalid operation');
            return;
        }

        const keywordsArray = newResponse.keywords
            .split(',')
            .map(k => k.trim())
            .filter(k => k !== '');

        try {
            const response = await axios.put(`http://localhost:5000/api/automated-responses/${editResponseId}`, {
                keywords: keywordsArray,
                responseText: newResponse.responseText,
                isDefault: newResponse.isDefault
            });

            // If this is set as default, update other responses to not be default (optional, backend handles this)
             if (newResponse.isDefault) {
                 setPredefinedResponses(prev =>
                     prev.map(r => r._id !== editResponseId ? {...r, isDefault: false} : r)
                 );
             }

            // Update the response in the state
            setPredefinedResponses(prev =>
                prev.map(r => r._id === editResponseId ? response.data : r)
            );

            // Reset form
            setNewResponse({ keywords: '', responseText: '', isDefault: false });
            setEditResponseId(null);
        } catch (err) {
            console.error('Error updating automated response:', err);
            alert('Failed to update automated response');
        }
    };

    // Delete a response (calls backend DELETE)
    const handleDeleteResponse = async (id) => {
        if (!window.confirm('Are you sure you want to delete this response?')) {
            return;
        }

        try {
            await axios.delete(`http://localhost:5000/api/automated-responses/${id}`);
            setPredefinedResponses(prev => prev.filter(r => r._id !== id));
        } catch (err) {
            console.error('Error deleting response:', err);
            alert('Failed to delete response');
        }
    };

    // Prepare response for editing (frontend logic)
    const prepareEditResponse = (response) => {
        setNewResponse({
            keywords: response.keywords ? response.keywords.join(', ') : '',
            responseText: response.responseText || '',
            isDefault: response.isDefault || false
        });
        setEditResponseId(response._id);
    };

    // Backup data (queries and responses)
    const backupData = async () => {
        try {
            setBackupStatus('Backing up data...');

            if (backupLocation === 'cloud') {
                 // Trigger the backend endpoint for cloud backup
                // The backend will fetch data and handle storage
                await axios.post('http://localhost:5000/api/backup');
                setBackupStatus('Backup completed to cloud storage');
            } else {
                // Local backup (frontend fetches data and downloads)
                const queriesDataRes = await axios.get('http://localhost:5000/api/queries');
                const responsesDataRes = await axios.get('http://localhost:5000/api/automated-responses');

                const backupData = {
                    queries: queriesDataRes.data,
                    responses: responsesDataRes.data,
                    timestamp: new Date().toISOString()
                };

                const blob = new Blob([JSON.stringify(backupData, null, 2)], {
                    type: 'application/json'
                });
                saveAs(blob, `queries-backup-${new Date().toISOString()}.json`);
                setBackupStatus('Backup file downloaded');
            }

            // Update last backup date
            const now = new Date();
            setLastBackupDate(now);
            localStorage.setItem('lastBackupDate', now.toISOString());

            // Hide modal after 2 seconds
            setTimeout(() => {
                setShowBackupModal(false);
                setBackupStatus('');
            }, 2000);
        } catch (err) {
            console.error('Error backing up data:', err);
            setBackupStatus('Backup failed: ' + (err.message || 'Unknown error'));
        }
    };

    // Toggle automatic backups (frontend setting, backend scheduling needed)
    const toggleAutoBackup = (value) => {
        setAutoBackupEnabled(value);
        localStorage.setItem('autoBackupEnabled', value);

        // IMPORTANT: Scheduling server-side tasks like daily backups
        // should be done on the backend (e.g., using cron jobs, node-schedule).
        // This frontend toggle should ideally send a request to the backend
        // to enable/disable the backend's scheduled backup task.
        // For this example, we're just storing the preference locally.
         if (value) {
              console.log("Auto backup enabled preference saved. Implement backend scheduling.");
              // Example: await axios.post('/api/auto-backup/enable');
         } else {
              console.log("Auto backup disabled preference saved. Implement backend scheduling.");
              // Example: await axios.post('/api/auto-backup/disable');
         }

         // Remove the frontend setInterval logic for daily backup
         const intervalId = localStorage.getItem('backupIntervalId');
         if (intervalId) {
             clearInterval(parseInt(intervalId));
             localStorage.removeItem('backupIntervalId');
         }
    };

    // Change backup location (frontend setting)
    const changeBackupLocation = (location) => {
        setBackupLocation(location);
        localStorage.setItem('backupLocation', location);
         // You might send this setting to the backend if auto-backup is enabled
         // Example: await axios.post('/api/backup-location', { location });
    };


    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Customer Queries Management</h3>
                <div>
                    <button
                        onClick={() => setShowBackupModal(true)}
                        style={{
                            backgroundColor: '#4682b4',
                            color: 'white',
                            marginRight: '10px',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: 'none'
                        }}
                    >
                        Backup Data
                    </button>
                    <button
                        onClick={autoRespondAll} // Call the new frontend function
                        style={{
                            backgroundColor: '#4caf50',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: 'none'
                        }}
                    >
                        Auto-Respond All Pending
                    </button>
                </div>
            </div>

            {/* Backup Modal */}
            {showBackupModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 100
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        width: '400px'
                    }}>
                        <h3>Backup Settings</h3>

                        {backupStatus && (
                            <div style={{
                                marginBottom: '15px',
                                padding: '10px',
                                backgroundColor: backupStatus.includes('failed') ? '#ffebee' : '#e8f5e9',
                                borderRadius: '4px'
                            }}>
                                {backupStatus}
                            </div>
                        )}

                        <div style={{ marginBottom: '15px' }}>
                            <p>Last backup: {lastBackupDate ? lastBackupDate.toLocaleString() : 'Never'}</p>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Backup Location</label>
                            <select
                                value={backupLocation}
                                onChange={(e) => changeBackupLocation(e.target.value)}
                                style={{ width: '100%', padding: '8px' }}
                            >
                                <option value="cloud">Cloud Storage</option>
                                <option value="local">Local Download</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={autoBackupEnabled}
                                    onChange={(e) => toggleAutoBackup(e.target.checked)}
                                    style={{ marginRight: '8px' }}
                                />
                                Enable Automatic Daily Backup
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={() => setShowBackupModal(false)}
                                style={{ padding: '8px 12px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={backupData}
                                style={{
                                    backgroundColor: '#4682b4',
                                    color: 'white',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: 'none'
                                }}
                            >
                                Backup Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Query list */}
            <div style={{ display: 'flex', marginBottom: '20px' }}>
                <div style={{ flex: 1, marginRight: '20px' }}>
                    <h4>Customer Queries</h4>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                        {queries && queries.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Customer</th>
                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Message</th>
                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {queries.map((query) => (
                                        <tr key={query._id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>
                                                <div>{query.name}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{query.email}</div>
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {query.message}
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '3px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    backgroundColor: query.status === 'resolved' ? '#e6f7e6' : '#fff3e0',
                                                    color: query.status === 'resolved' ? '#2e7d32' : '#e65100'
                                                }}>
                                                    {query.status || 'open'}
                                                    {query.autoResolved && query.status === 'resolved' && ' (Auto)'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                {query.status !== 'resolved' && (
                                                    <button
                                                        onClick={() => triggerAutomaticResponse(query._id)} // Call the new frontend function
                                                        style={{ padding: '5px 8px', marginRight: '5px', fontSize: '12px' }}
                                                    >
                                                        Auto Reply
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        const response = prompt('Enter manual response:', '');
                                                        if (response) {
                                                            handleManualResponse(query._id, response);
                                                        }
                                                    }}
                                                    style={{ padding: '5px 8px', marginRight: '5px', fontSize: '12px' }} // Added marginRight
                                                >
                                                    Respond
                                                </button>
                                                {/* Add the Delete button here */}
                                                {/* Ensure handleDeleteQuery is a function before calling it */}
                                                {typeof handleDeleteQuery === 'function' && (
                                                     <button
                                                        onClick={() => {
                                                             if (window.confirm("Are you sure you want to delete this query?")) {
                                                                 handleDeleteQuery(query._id);
                                                             }
                                                        }}
                                                        style={{ padding: '5px 8px', fontSize: '12px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center' }}>No queries found</div>
                        )}
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    <h4>Automated Responses</h4>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '15px' }}>
                        {predefinedResponses && predefinedResponses.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Keywords</th>
                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Response</th>
                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Default</th>
                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {predefinedResponses.map((response) => (
                                        <tr key={response._id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>
                                                {response.keywords && response.keywords.join(', ')}
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {response.responseText}
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                {response.isDefault ? '✓' : ''}
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <button
                                                    onClick={() => prepareEditResponse(response)}
                                                    style={{ padding: '5px 8px', marginRight: '5px', fontSize: '12px' }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteResponse(response._id)}
                                                    style={{ padding: '5px 8px', fontSize: '12px' }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center' }}>No automated responses found</div>
                        )}
                    </div>

                    <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '15px' }}>
                        <h4>{editResponseId ? 'Edit Response' : 'Add New Response'}</h4>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Keywords (comma-separated)</label>
                            <input
                                type="text"
                                value={newResponse.keywords}
                                onChange={(e) => setNewResponse({ ...newResponse, keywords: e.target.value })}
                                style={{ width: '100%', padding: '8px' }}
                                placeholder="product, pricing, delivery, etc."
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Response Text</label>
                            <textarea
                                value={newResponse.responseText}
                                onChange={(e) => setNewResponse({ ...newResponse, responseText: e.target.value })}
                                style={{ width: '100%', padding: '8px', minHeight: '100px' }}
                                placeholder="Thank you for your query about our products..."
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={newResponse.isDefault}
                                    onChange={(e) => setNewResponse({ ...newResponse, isDefault: e.target.checked })}
                                    style={{ marginRight: '8px' }}
                                />
                                Set as default response (used when no match found)
                            </label>
                        </div>
                        <div>
                            {editResponseId ? (
                                <>
                                    <button
                                        onClick={handleEditResponse}
                                        style={{ padding: '8px 12px', marginRight: '10px', backgroundColor: '#4682b4', color: 'white', border: 'none', borderRadius: '4px' }}
                                    >
                                        Update Response
                                    </button>
                                    <button
                                        onClick={() => {
                                            setNewResponse({ keywords: '', responseText: '', isDefault: false });
                                            setEditResponseId(null);
                                        }}
                                        style={{ padding: '8px 12px' }}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleAddResponse}
                                    style={{ padding: '8px 12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px' }}
                                >
                                    Add Response
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutomatedResponseInterface;