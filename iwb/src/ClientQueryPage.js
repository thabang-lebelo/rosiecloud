import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://rosiecloud.onrender.com';

const ClientQueryPage = () => {
  // Form state
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  // List of previous queries with pagination
  const [queries, setQueries] = useState([]);
  const [totalQueries, setTotalQueries] = useState(0);
  const [queriesLoading, setQueriesLoading] = useState(false);
  const [queriesError, setQueriesError] = useState(null);

  // Automated responses
  const [automatedResponses, setAutomatedResponses] = useState([]);
  const [automatedResponsesError, setAutomatedResponsesError] = useState(null);

  // UI states
  const [responseMessage, setResponseMessage] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const queriesPerPage = 5; // fixed for now

  // --- Fetch automated responses on mount ---
  useEffect(() => {
    const fetchAutomatedResponses = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/automated-responses`);
        if (Array.isArray(response.data)) {
          setAutomatedResponses(response.data);
          setAutomatedResponsesError(null);
        } else {
          console.error('Invalid format for automated responses:', response.data);
          setAutomatedResponses([]);
          setAutomatedResponsesError('Failed to load automated responses: Invalid data format.');
        }
      } catch (err) {
        console.error('Error fetching automated responses:', err);
        setAutomatedResponses([]);
        setAutomatedResponsesError('Failed to load automated responses. Please try again later.');
      }
    };
    fetchAutomatedResponses();
  }, []);

  // --- Fetch queries for current page ---
  const fetchQueries = useCallback(async () => {
    setQueriesLoading(true);
    setQueriesError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/queries`, {
        params: {
          page: currentPage,
          limit: queriesPerPage,
        }
      });
      
      if (res.data && Array.isArray(res.data.queries)) {
        setQueries(res.data.queries);
        setTotalQueries(res.data.totalCount || 0);
      } else {
        console.error('Unexpected queries response:', res.data);
        setQueries([]);
        setTotalQueries(0);
        setQueriesError('Received unexpected data format from the server.');
      }
    } catch (err) {
      console.error('Error fetching queries:', err);
      setQueries([]);
      setTotalQueries(0);
      setQueriesError('Failed to load previous queries.');
    } finally {
      setQueriesLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const findMatchingResponse = (message) => {
    const defaultMessage = "Thank you for your query. Our team will get back to you shortly.";
    if (!Array.isArray(automatedResponses) || automatedResponses.length === 0) {
      return defaultMessage;
    }
    const msgLower = message.toLowerCase();

    for (const response of automatedResponses) {
      if (response && Array.isArray(response.keywords)) {
        if (response.keywords.some(keyword => typeof keyword === 'string' && msgLower.includes(keyword.toLowerCase()))) {
          return response.responseText || defaultMessage;
        }
      }
    }
    // fallback to default response
    const defaultResp = automatedResponses.find(r => r && r.isDefault);
    return defaultResp ? defaultResp.responseText : defaultMessage;
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setShowResponse(false);

    // Basic validation
    if (!form.name || !form.email || !form.message) {
      setFormError('Please fill in all fields.');
      setFormLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setFormError('Please enter a valid email address.');
      setFormLoading(false);
      return;
    }

    try {
      const matchedResponse = findMatchingResponse(form.message);
      setResponseMessage(matchedResponse);

      await axios.post(`${API_BASE_URL}/queries`, {
        ...form,
        automatedResponse: matchedResponse,
      }, { timeout: 10000 });

      await fetchQueries(); // refresh current page queries
      setShowResponse(true);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Error submitting query:', err);
      if (err.response) {
        setFormError(`Submission failed: ${err.response.status} - ${err.response.data?.error || 'Server error.'}`);
      } else if (err.request) {
        setFormError('Submission failed: No response from server. Please check your network connection.');
      } else {
        setFormError('Submission failed: An unexpected error occurred.');
      }
      setShowResponse(false);
    } finally {
      setFormLoading(false);
    }
  };

  const totalPages = Math.ceil(totalQueries / queriesPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages && !queriesLoading) {
      setCurrentPage(pageNumber);
    }
  };

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;
    return (
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || queriesLoading}
          aria-disabled={currentPage === 1 || queriesLoading}
          aria-label="Previous page"
          style={{ marginRight: '10px', padding: '8px 15px', cursor: (currentPage === 1 || queriesLoading) ? 'not-allowed' : 'pointer' }}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || queriesLoading}
          aria-disabled={currentPage === totalPages || queriesLoading}
          aria-label="Next page"
          style={{ marginLeft: '10px', padding: '8px 15px', cursor: (currentPage === totalPages || queriesLoading) ? 'not-allowed' : 'pointer' }}
        >
          Next
        </button>
      </div>
    );
  };

  // --- Render ---
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Contact Us</h2>

      {/* Success message after submission */}
      {showResponse && (
        <div role="alert" style={{
          backgroundColor: '#e9f7ef',
          border: '1px solid #28a745',
          borderRadius: '5px',
          padding: '15px',
          marginBottom: '20px',
          color: '#155724'
        }}>
          <h3 style={{ marginTop: 0, color: '#155724' }}>Thank you for your query!</h3>
          <p>{responseMessage}</p>
          <button
            onClick={() => setShowResponse(false)}
            aria-label="Close response message"
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Error messages */}
      {formError && (
        <div role="alert" style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #dc3545',
          borderRadius: '5px',
          padding: '15px',
          marginBottom: '20px',
          color: '#721c24'
        }}>
          <p><strong>Error:</strong> {formError}</p>
        </div>
      )}
      {automatedResponsesError && (
        <div role="alert" style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '5px',
          padding: '15px',
          marginBottom: '20px',
          color: '#856404'
        }}>
          <p><strong>Warning:</strong> {automatedResponsesError}</p>
        </div>
      )}

      {/* Contact Form */}
      <form onSubmit={handleQuerySubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="name" style={{ marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Name:</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            disabled={formLoading}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
          />
        </div>
        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="email" style={{ marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Email:</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            disabled={formLoading}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
          />
        </div>
        {/* Message */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="message" style={{ marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Message:</label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={handleChange}
            required
            disabled={formLoading}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '120px', resize: 'vertical', fontSize: '16px' }}
          />
        </div>
        {/* Submit Button */}
        <button
          type="submit"
          disabled={formLoading}
          aria-disabled={formLoading}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '4px',
            cursor: formLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            transition: 'background-color 0.3s ease',
            opacity: formLoading ? 0.7 : 1
          }}
        >
          {formLoading ? 'Submitting...' : 'Submit Query'}
        </button>
      </form>

      {/* Previous queries list with pagination */}
      <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', color: '#333' }}>Previous Queries</h3>
      {queriesLoading && (
        <p style={{ textAlign: 'center', color: '#777', padding: '20px' }}>Loading queries...</p>
      )}
      {queriesError && (
        <div role="alert" style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #dc3545',
          borderRadius: '5px',
          padding: '15px',
          marginBottom: '20px',
          color: '#721c24'
        }}>
          <p><strong>Error:</strong> {queriesError}</p>
        </div>
      )}
      
      {/* Render queries list if available */}
      {!queriesLoading && !queriesError && (
        <>
          {(Array.isArray(queries) && queries.length === 0) ? (
            <p style={{ textAlign: 'center', color: '#777', padding: '20px' }}>No queries submitted yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {queries.map((q) => (
                <li
                  key={q?._id || `query-${Math.random()}`}
                  style={{
                    borderBottom: '1px solid #eee',
                    padding: '15px',
                    backgroundColor: '#fff',
                    marginBottom: '10px',
                    borderRadius: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                  }}
                >
                  {/* Name and Email */}
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ fontSize: '18px', color: '#333' }}>{q?.name || 'N/A'}</strong>
                    <span style={{ color: '#666', marginLeft: '10px', fontSize: '14px' }}>({q?.email || 'N/A'})</span>
                  </div>
                  {/* Message */}
                  <div style={{ margin: '10px 0', fontStyle: 'italic', borderLeft: '4px solid #ccc', paddingLeft: '10px', color: '#555' }}>
                    {q?.message || 'No message content'}
                  </div>
                  {/* Status */}
                  <div style={{ fontSize: '14px' }}>
                    <span style={{ color: '#777' }}>Status: </span>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: q?.status === 'Resolved' ? '#d4edda' : '#fff3cd',
                        color: q?.status === 'Resolved' ? '#155724' : '#856404'
                      }}
                    >
                      {q?.status || 'Pending'}
                    </span>
                  </div>
                  {/* Automated Response */}
                  {q?.automatedResponse && typeof q.automatedResponse === 'string' && q.automatedResponse.trim() !== '' && (
                    <div style={{
                      marginTop: '10px',
                      backgroundColor: '#e9ecef',
                      padding: '10px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      borderLeft: '4px solid #007bff',
                      color: '#333'
                    }}>
                      <strong>Automated Response:</strong>
                      <p style={{ margin: '5px 0 0', color: '#555' }}>{q.automatedResponse}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {/* Pagination Controls */}
          {totalQueries > queriesPerPage && renderPaginationControls()}
        </>
      )}
    </div>
  );
};

export default ClientQueryPage;
