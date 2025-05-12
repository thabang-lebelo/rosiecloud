import React, { useState, useEffect } from 'react';
import axios from 'axios'; // <-- Add this line
import { saveAs } from 'file-saver';

const AutomatedResponseInterface = ({ queries, setQueries, handleDeleteQuery }) => {
  const BASE_URL = 'https://rosiecloud.onrender.com';

  const [predefinedResponses, setPredefinedResponses] = useState([]);
  const [newResponse, setNewResponse] = useState({ keywords: '', responseText: '', isDefault: false });
  const [editResponseId, setEditResponseId] = useState(null);
  const [lastBackupDate, setLastBackupDate] = useState(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [backupLocation, setBackupLocation] = useState('cloud'); // 'cloud' or 'local'
  const [responseLoading, setResponseLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');

  // Fetch responses & load settings on mount
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/automated-responses`);
        if (Array.isArray(res.data)) setPredefinedResponses(res.data);
        else setPredefinedResponses([]);
      } catch (err) {
        console.error('Error fetching responses:', err);
        setPredefinedResponses([]);
      }
    };
    fetchResponses();

    // Load last backup date & settings
    const storedBackupDate = localStorage.getItem('lastBackupDate');
    if (storedBackupDate) {
      try { setLastBackupDate(new Date(storedBackupDate)); } catch { localStorage.removeItem('lastBackupDate'); }
    }
    setAutoBackupEnabled(localStorage.getItem('autoBackupEnabled') === 'true');
    setBackupLocation(localStorage.getItem('backupLocation') || 'cloud');
  }, []);

  // Trigger auto-respond for a specific query
  const triggerAutoResponse = async (queryId) => {
    setResponseLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/queries/${queryId}/auto-respond`);
      setQueries(prev => Array.isArray(prev) ? prev.map(q => q._id === queryId ? res.data : q) : []);
      alert('Auto-response triggered successfully!');
    } catch (err) {
      console.error('Auto-response error:', err);
      alert('Failed to trigger auto-response.');
    } finally {
      setResponseLoading(false);
    }
  };

  // Auto-respond all pending queries
  const autoRespondAll = async () => {
    if (!window.confirm('This will automatically respond to all pending queries. Continue?')) return;
    setResponseLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/queries/auto-respond-all-pending`);
      if (res.data?.updatedQueries) {
        setQueries(res.data.updatedQueries);
        alert(`Auto-responded to ${res.data.processedCount || 0} queries`);
      } else {
        alert('Auto-respond completed, but response data was unexpected.');
      }
    } catch (err) {
      console.error('Auto-respond all error:', err);
      alert('Failed to auto-respond to all.');
    } finally {
      setResponseLoading(false);
    }
  };

  // Manually update a query with a response
  const handleManualResponse = async (queryId, responseText) => {
    setResponseLoading(true);
    try {
      const res = await axios.put(`${BASE_URL}/api/queries/${queryId}`, {
        status: 'resolved',
        automatedResponse: responseText,
        autoResolved: false,
        resolutionDate: new Date().toISOString(),
        resolvedBy: 'Manual'
      });
      setQueries(prev => Array.isArray(prev) ? prev.map(q => q._id === queryId ? res.data : q) : []);
      alert('Query manually updated.');
      return true;
    } catch (err) {
      console.error('Manual response error:', err);
      alert('Failed to update query.');
      return false;
    } finally {
      setResponseLoading(false);
    }
  };

  // Add new automated response
  const handleAddResponse = async () => {
    if (!newResponse.responseText.trim()) {
      alert('Response text required');
      return;
    }
    const keywords = newResponse.keywords.split(',').map(k => k.trim()).filter(k => k);
    setResponseLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/automated-responses`, {
        keywords,
        responseText: newResponse.responseText.trim(),
        isDefault: newResponse.isDefault
      });
      setPredefinedResponses(prev => [...(prev || []), res.data]);
      if (res.data.isDefault) {
        setPredefinedResponses(prev => prev.map(r => r._id !== res.data._id ? { ...r, isDefault: false } : r));
      }
      setNewResponse({ keywords: '', responseText: '', isDefault: false });
      alert('Response added');
    } catch (err) {
      console.error('Add response error:', err);
      alert('Failed to add response');
    } finally {
      setResponseLoading(false);
    }
  };

  // Edit existing automated response
  const handleEditResponse = async () => {
    if (!editResponseId || !newResponse.responseText.trim()) {
      alert('Response text required');
      return;
    }
    const keywords = newResponse.keywords.split(',').map(k => k.trim()).filter(k => k);
    setResponseLoading(true);
    try {
      const res = await axios.put(`${BASE_URL}/api/automated-responses/${editResponseId}`, {
        keywords,
        responseText: newResponse.responseText.trim(),
        isDefault: newResponse.isDefault
      });
      setPredefinedResponses(prev => prev.map(r => r._id === editResponseId ? res.data : r));
      if (res.data.isDefault) {
        setPredefinedResponses(prev => prev.map(r => r._id !== res.data._id ? { ...r, isDefault: false } : r));
      }
      setNewResponse({ keywords: '', responseText: '', isDefault: false });
      setEditResponseId(null);
      alert('Response updated');
    } catch (err) {
      console.error('Update response error:', err);
      alert('Failed to update response');
    } finally {
      setResponseLoading(false);
    }
  };

  // Delete a response
  const handleDeleteResponse = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    setResponseLoading(true);
    try {
      await axios.delete(`${BASE_URL}/api/automated-responses/${id}`);
      setPredefinedResponses(prev => prev.filter(r => r._id !== id));
      if (editResponseId === id) {
        setNewResponse({ keywords: '', responseText: '', isDefault: false });
        setEditResponseId(null);
      }
      alert('Response deleted');
    } catch (err) {
      console.error('Delete response error:', err);
      alert('Failed to delete response');
    } finally {
      setResponseLoading(false);
    }
  };

  // Prepare response form for edit
  const prepareEditResponse = (response) => {
    if (response) {
      setNewResponse({
        keywords: Array.isArray(response.keywords) ? response.keywords.join(', ') : '',
        responseText: response.responseText || '',
        isDefault: response.isDefault || false
      });
      setEditResponseId(response._id);
    }
  };

  // Backup data (cloud or local file)
  const backupData = async () => {
    try {
      setBackupLoading(true);
      setBackupStatus('Backing up...');
      if (backupLocation === 'cloud') {
        await axios.post(`${BASE_URL}/api/backup`, {}, { timeout: 60000 });
        setBackupStatus('Backup to cloud completed');
      } else {
        const qRes = await axios.get(`${BASE_URL}/api/queries`);
        const rRes = await axios.get(`${BASE_URL}/api/automated-responses`);
        const backupContent = {
          queries: Array.isArray(qRes.data) ? qRes.data : [],
          responses: Array.isArray(rRes.data) ? rRes.data : [],
          timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(backupContent, null, 2)], { type: 'application/json' });
        saveAs(blob, `queries-backup-${new Date().toISOString()}.json`);
        setBackupStatus('Backup file downloaded');
      }
      const now = new Date();
      setLastBackupDate(now);
      localStorage.setItem('lastBackupDate', now.toISOString());
      setTimeout(() => {
        setShowBackupModal(false);
        setBackupStatus('');
      }, 3000);
    } catch (err) {
      console.error('Backup error:', err);
      setBackupStatus('Backup failed');
    } finally {
      setBackupLoading(false);
    }
  };

  // Toggle auto backup
  const toggleAutoBackup = (value) => {
    setAutoBackupEnabled(value);
    localStorage.setItem('autoBackupEnabled', value);
    // TODO: send setting to backend for scheduling
  };

  // Change backup location
  const changeBackupLocation = (location) => {
    setBackupLocation(location);
    localStorage.setItem('backupLocation', location);
    // TODO: notify backend if needed
  };

  // Render UI
  return (
    <div style={{ fontFamily: 'sans-serif', lineHeight: '1.6' }}>
      {/* Header and Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2px solid #eee', paddingBottom: 10 }}>
        <h3>Customer Queries Management</h3>
        <div>
          <button
            onClick={() => setShowBackupModal(true)}
            style={{ backgroundColor: '#4682b4', color: 'white', marginRight: 10, padding: '8px 12px', borderRadius: 4, border: 'none', cursor: backupLoading || responseLoading ? 'not-allowed' : 'pointer', opacity: backupLoading || responseLoading ? 0.7 : 1 }}
            disabled={backupLoading || responseLoading}
          >
            Backup Data
          </button>
          <button
            onClick={autoRespondAll}
            style={{ backgroundColor: '#4caf50', color: 'white', padding: '8px 12px', borderRadius: 4, border: 'none', cursor: responseLoading || backupLoading ? 'not-allowed' : 'pointer', opacity: responseLoading || backupLoading ? 0.7 : 1 }}
            disabled={responseLoading || backupLoading}
          >
            {responseLoading ? 'Processing...' : 'Auto-Respond All Pending'}
          </button>
        </div>
      </div>

      {/* Backup Modal */}
      {showBackupModal && (
        <div style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100 }}>
          <div style={{ backgroundColor:'white', padding:'20px', borderRadius:8, width:'90%', maxWidth:400 }}>
            <h3>Backup Settings</h3>
            {backupStatus && (
              <div role="alert" style={{ marginBottom:15, padding:10, backgroundColor: backupStatus.includes('failed') ? '#ffebee' : '#e8f5e9', borderRadius:4, color: backupStatus.includes('failed') ? '#c62828' : '#2e7d32' }}>
                {backupStatus}
              </div>
            )}
            <div style={{ marginBottom:15 }}>
              <p>Last backup: {lastBackupDate ? lastBackupDate.toLocaleString() : 'Never'}</p>
            </div>
            <div style={{ marginBottom:15 }}>
              <label htmlFor="backupLocation" style={{ display:'block', marginBottom:5 }}>Backup Location</label>
              <select
                id="backupLocation"
                value={backupLocation}
                onChange={(e) => changeBackupLocation(e.target.value)}
                style={{ width:'100%', padding:8, borderRadius:4, border:'1px solid #ccc' }}
                disabled={backupLoading}
              >
                <option value="cloud">Cloud Storage (Backend Managed)</option>
                <option value="local">Local Download (Frontend)</option>
              </select>
            </div>
            <div style={{ marginBottom:15 }}>
              <label style={{ display:'flex', alignItems:'center', cursor: backupLoading ? 'not-allowed' : 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoBackupEnabled}
                  onChange={(e) => toggleAutoBackup(e.target.checked)}
                  style={{ marginRight:8 }}
                  disabled={backupLoading}
                />
                Enable Automatic Daily Backup (Requires Backend Scheduling)
              </label>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button onClick={() => setShowBackupModal(false)} style={{ padding:'8px 12px', cursor: backupLoading ? 'not-allowed' : 'pointer' }} disabled={backupLoading}>Cancel</button>
              <button onClick={backupData} style={{ backgroundColor:'#4682b4', color:'white', padding:'8px 12px', borderRadius:4, border:'none', cursor: backupLoading ? 'not-allowed' : 'pointer' }} disabled={backupLoading}>{backupLoading ? 'Backing up...' : 'Backup Now'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Queries & Responses */}
      <div style={{ display:'flex', marginTop:20 }}>
        {/* Customer Queries */}
        <div style={{ flex:1, marginRight:20 }}>
          <h4 style={{ borderBottom:'1px solid #eee', paddingBottom:5 }}>Customer Queries</h4>
          <div style={{ maxHeight:400, overflowY:'auto', border:'1px solid #ddd', borderRadius:4 }}>
            {Array.isArray(queries) && queries.length > 0 ? (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor:'#f0f0f0' }}>
                    <th style={{ padding:10, textAlign:'left' }}>Customer</th>
                    <th style={{ padding:10, textAlign:'left' }}>Message</th>
                    <th style={{ padding:10, textAlign:'left' }}>Status</th>
                    <th style={{ padding:10, textAlign:'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queries.map(q => q?._id && (
                    <tr key={q._id} style={{ borderBottom:'1px solid #eee' }}>
                      <td style={{ padding:10 }}>
                        <div>{q.name || 'N/A'}</div>
                        <div style={{ fontSize:12, color:'#666' }}>{q.email || 'N/A'}</div>
                      </td>
                      <td style={{ padding:10 }}>
                        <div style={{ maxWidth:200, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {q.message || 'No message'}
                        </div>
                      </td>
                      <td style={{ padding:10 }}>
                        <span style={{
                          display:'inline-block',
                          padding:'3px 8px',
                          borderRadius:'12px',
                          fontSize:12,
                          backgroundColor: q.status==='resolved' ? '#e6f7e6' : '#fff3e0',
                          color: q.status==='resolved' ? '#2e7d32' : '#e65100'
                        }}>
                          {q.status || 'open'} {q.autoResolved && q.status==='resolved' ? '(Auto)' : ''}
                        </span>
                      </td>
                      <td style={{ padding:10 }}>
                        {q.status !== 'resolved' && (
                          <button
                            onClick={() => triggerAutoResponse(q._id)}
                            style={{ padding:'5px 8px', marginRight:5, fontSize:12, cursor: responseLoading || backupLoading ? 'not-allowed' : 'pointer' }}
                            disabled={responseLoading || backupLoading}
                          >
                            Auto Reply
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const response = prompt('Enter manual response:', '');
                            if (response && response.trim()) {
                              handleManualResponse(q._id, response.trim());
                            } else if (response !== null) {
                              alert('Manual response cannot be empty');
                            }
                          }}
                          style={{ padding:'5px 8px', marginRight:5, fontSize:12, cursor: responseLoading || backupLoading ? 'not-allowed' : 'pointer' }}
                          disabled={responseLoading || backupLoading}
                        >
                          Respond
                        </button>
                        {/* Delete Query */}
                        {typeof handleDeleteQuery === 'function' && (
                          <button
                            onClick={() => { if (window.confirm('Are you sure?')) handleDeleteQuery(q._id); }}
                            style={{ padding:'5px 8px', fontSize:12, backgroundColor:'#f44336', color:'white', border:'none', cursor: responseLoading || backupLoading ? 'not-allowed' : 'pointer' }}
                            disabled={responseLoading || backupLoading}
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
              <div style={{ padding:20, textAlign:'center' }}>No queries found</div>
            )}
          </div>
        </div>

        {/* Automated Responses */}
        <div style={{ flex:1 }}>
          <h4 style={{ borderBottom:'1px solid #eee', paddingBottom:5 }}>Automated Responses</h4>
          <div style={{ maxHeight:400, overflowY:'auto', border:'1px solid #ddd', borderRadius:4, marginBottom:15 }}>
            {Array.isArray(predefinedResponses) && predefinedResponses.length > 0 ? (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor:'#f0f0f0' }}>
                    <th style={{ padding:10, textAlign:'left' }}>Keywords</th>
                    <th style={{ padding:10, textAlign:'left' }}>Response</th>
                    <th style={{ padding:10, textAlign:'left' }}>Default</th>
                    <th style={{ padding:10, textAlign:'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {predefinedResponses.map(r => r?._id && (
                    <tr key={r._id} style={{ borderBottom:'1px solid #eee' }}>
                      <td style={{ padding:10 }}>{Array.isArray(r.keywords) ? r.keywords.join(', ') : 'No keywords'}</td>
                      <td style={{ padding:10 }}>
                        <div style={{ maxWidth:200, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {r.responseText || 'No response'}
                        </div>
                      </td>
                      <td style={{ padding:10 }}>{r.isDefault ? '✓' : ''}</td>
                      <td style={{ padding:10 }}>
                        <button
                          onClick={() => prepareEditResponse(r)}
                          style={{ padding:'5px 8px', marginRight:5, fontSize:12, cursor: responseLoading || backupLoading ? 'not-allowed' : 'pointer' }}
                          disabled={responseLoading || backupLoading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteResponse(r._id)}
                          style={{ padding:'5px 8px', fontSize:12, cursor: responseLoading || backupLoading ? 'not-allowed' : 'pointer' }}
                          disabled={responseLoading || backupLoading}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding:20, textAlign:'center' }}>No responses</div>
            )}
          </div>

          {/* Add/Edit Response Form */}
          <div style={{ border:'1px solid #ddd', borderRadius:4, padding:15 }}>
            <h4 style={{ marginTop:0, marginBottom:15 }}>{editResponseId ? 'Edit Response' : 'Add New Response'}</h4>
            {/* Keywords Input */}
            <div style={{ marginBottom:10 }}>
              <label htmlFor="keywords" style={{ display:'block', marginBottom:5 }}>Keywords (comma-separated)</label>
              <input
                id="keywords"
                type="text"
                value={newResponse.keywords}
                onChange={(e) => setNewResponse({ ...newResponse, keywords: e.target.value })}
                style={{ width:'100%', padding:8, borderRadius:4, border:'1px solid #ccc' }}
                placeholder="product, pricing, delivery..."
                disabled={responseLoading || backupLoading}
              />
            </div>
            {/* Response Textarea */}
            <div style={{ marginBottom:10 }}>
              <label htmlFor="responseText" style={{ display:'block', marginBottom:5 }}>Response Text</label>
              <textarea
                id="responseText"
                value={newResponse.responseText}
                onChange={(e) => setNewResponse({ ...newResponse, responseText: e.target.value })}
                style={{ width:'100%', padding:8, minHeight:100, borderRadius:4, border:'1px solid #ccc', resize:'vertical' }}
                placeholder="Thank you for your query..."
                disabled={responseLoading || backupLoading}
              />
            </div>
            {/* Default Response Checkbox */}
            <div style={{ marginBottom:10 }}>
              <label style={{ display:'flex', alignItems:'center', cursor: responseLoading || backupLoading ? 'not-allowed' : 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newResponse.isDefault}
                  onChange={(e) => setNewResponse({ ...newResponse, isDefault: e.target.checked })}
                  style={{ marginRight:8 }}
                  disabled={responseLoading || backupLoading}
                />
                Set as default response (used when no match found)
              </label>
            </div>
            {/* Buttons */}
            {editResponseId ? (
              <>
                <button
                  onClick={handleEditResponse}
                  style={{ padding:'8px 12px', marginRight:10, backgroundColor:'#4682b4', color:'white', border:'none', borderRadius:4, cursor: responseLoading || backupLoading ? 'not-allowed' : 'pointer' }}
                  disabled={responseLoading || backupLoading}
                >
                  {responseLoading ? 'Updating...' : 'Update Response'}
                </button>
                <button
                  onClick={() => {
                    setNewResponse({ keywords: '', responseText: '', isDefault: false });
                    setEditResponseId(null);
                  }}
                  style={{ padding:'8px 12px', cursor: responseLoading || backupLoading ? 'not-allowed' : 'pointer' }}
                  disabled={responseLoading || backupLoading}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleAddResponse}
                style={{ padding:'8px 12px', backgroundColor:'#4caf50', color:'white', border:'none', borderRadius:4, cursor: responseLoading || backupLoading ? 'not-allowed' : 'pointer' }}
                disabled={responseLoading || backupLoading}
              >
                {responseLoading ? 'Adding...' : 'Add Response'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomatedResponseInterface;
