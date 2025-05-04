import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClientQueryPage = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [queries, setQueries] = useState([]);
  const [automatedResponses, setAutomatedResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [showResponse, setShowResponse] = useState(false);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [queriesPerPage] = useState(5); // Number of queries to display per page
  const [totalQueries, setTotalQueries] = useState(0); // Total number of queries from the backend
  const [queriesLoading, setQueriesLoading] = useState(false); // Loading state for fetching queries

  // Fetch automated responses on page load (only once)
  useEffect(() => {
    const fetchAutomatedResponses = async () => {
      try {
        const responsesResponse = await axios.get('http://localhost:5000/api/automated-responses');
        setAutomatedResponses(responsesResponse.data);
      } catch (err) {
        console.error('Error fetching automated responses:', err);
      }
    };

    fetchAutomatedResponses();
  }, []); // Empty dependency array means this runs only once on mount

  // Fetch queries for the current page whenever currentPage or queriesPerPage changes
  useEffect(() => {
    const fetchQueries = async () => {
      setQueriesLoading(true);
      try {
        // Fetch queries for the current page from the backend
        // IMPORTANT: Your backend API needs to support these query parameters
        const queriesResponse = await axios.get('http://localhost:5000/api/queries', {
          params: {
            page: currentPage,
            limit: queriesPerPage,
            // You might need to include user ID or token here if your API requires it
          }
        });

        // Assuming your backend response includes the list of queries for the page
        // and the total count of all queries
        setQueries(queriesResponse.data.queries); // e.g., { queries: [...], totalCount: 25 }
        setTotalQueries(queriesResponse.data.totalCount);

      } catch (err) {
        console.error('Error fetching queries:', err);
        // Optionally show an error message to the user
      } finally {
        setQueriesLoading(false);
      }
    };

    fetchQueries();
  }, [currentPage, queriesPerPage]); // Re-run effect when page or items per page change

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Find the most appropriate automated response based on query content
  const findMatchingResponse = (message) => {
    if (!automatedResponses || automatedResponses.length === 0) {
      return "Thank you for your query. Our team will get back to you shortly.";
    }

    // Convert message to lowercase for case-insensitive matching
    const lowercaseMessage = message.toLowerCase();

    // Try to find a response where the keywords match the query message
    for (const response of automatedResponses) {
      if (response.keywords && response.keywords.some(keyword =>
        lowercaseMessage.includes(keyword.toLowerCase())
      )) {
        return response.responseText;
      }
    }

    // If no matching response is found, return the default response
    // Find a default response (if configured by sales team)
    const defaultResponse = automatedResponses.find(r => r.isDefault);
    return defaultResponse ? defaultResponse.responseText :
      "Thank you for your query. Our team will get back to you shortly.";
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find the appropriate automated response
      const matchedResponse = findMatchingResponse(form.message);
      setResponseMessage(matchedResponse);

      // Submit the query to the backend
      const response = await axios.post('http://localhost:5000/api/queries', {
        ...form,
        // Assuming your backend handles associating the query with the user
        // You might need to send user ID or token here if not handled server-side
        automatedResponse: matchedResponse // Store the automated response with the query
      });

      // After successful submission, you might want to:
      // 1. Re-fetch the queries for the current page to include the new one, OR
      // 2. Add the new query to the start of the current page's list and potentially
      //    adjust pagination if it causes the page to exceed queriesPerPage.
      // Re-fetching is simpler for now:
      const queriesResponse = await axios.get('http://localhost:5000/api/queries', {
        params: {
          page: currentPage,
          limit: queriesPerPage,
          // Include user ID or token if needed
        }
      });
      setQueries(queriesResponse.data.queries);
      setTotalQueries(queriesResponse.data.totalCount);


      // Show the automated response to the user
      setShowResponse(true);

      // Reset form
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Submission error:', err);
      alert('Failed to submit query: ' + (err.response?.data?.error || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // --- Pagination Logic ---
  const totalPages = Math.ceil(totalQueries / queriesPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const renderPaginationControls = () => {
    const pages = [];
    // Simple pagination: Previous and Next buttons
    // You could extend this to show page numbers (e.g., 1 2 3 ... 10)

    return (
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || queriesLoading}
          style={{ marginRight: '10px', padding: '8px 15px', cursor: (currentPage === 1 || queriesLoading) ? 'not-allowed' : 'pointer' }}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || queriesLoading}
          style={{ marginLeft: '10px', padding: '8px 15px', cursor: (currentPage === totalPages || queriesLoading) ? 'not-allowed' : 'pointer' }}
        >
          Next
        </button>
      </div>
    );
  };


  return (
    <div className="query-page-container" style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Contact Us</h2>

      {showResponse && (
        <div style={{
          backgroundColor: '#f0f8ff',
          border: '1px solid #4682b4',
          borderRadius: '5px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3>Thank you for your query!</h3>
          <p>{responseMessage}</p>
          <button
            onClick={() => setShowResponse(false)}
            style={{
              backgroundColor: '#4682b4',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Close
          </button>
        </div>
      )}

      <form
        onSubmit={handleQuerySubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="name" style={{ marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            style={{
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="email" style={{ marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            style={{
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="message" style={{ marginBottom: '5px', fontWeight: 'bold' }}>Message:</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            required
            style={{
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              minHeight: '120px',
              resize: 'vertical'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          {loading ? 'Submitting...' : 'Submit Query'}
        </button>
      </form>

      <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Previous Queries</h3>

      {queriesLoading ? (
        <p style={{ textAlign: 'center', color: '#777', padding: '20px' }}>Loading queries...</p>
      ) : (
        <>
          {queries.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#777', padding: '20px' }}>No queries submitted yet.</p>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0 // Remove default ul margin
              }}
            >
              {queries.map((q) => (
                <li
                  key={q._id}
                  style={{
                    borderBottom: '1px solid #eee', // Add border between items
                    padding: '15px',
                    backgroundColor: '#fff'
                  }}
                >
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ fontSize: '18px' }}>{q.name}</strong>
                    <span style={{ color: '#666', marginLeft: '10px' }}>({q.email})</span>
                  </div>
                  <div style={{ margin: '10px 0', fontStyle: 'italic', borderLeft: '4px solid #eee', paddingLeft: '10px' }}>
                    {q.message}
                  </div>
                  <div>
                    <span style={{ color: '#777' }}>Status: </span>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        backgroundColor: q.status === 'Resolved' ? '#e6f7e6' : '#fff3e0',
                        color: q.status === 'Resolved' ? '#2e7d32' : '#e65100'
                      }}
                    >
                      {q.status || 'Pending'}
                    </span>
                  </div>
                  {q.automatedResponse && (
                    <div style={{
                      marginTop: '10px',
                      backgroundColor: '#f5f5f5',
                      padding: '10px',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      <strong>Automated Response:</strong>
                      <p style={{ margin: '5px 0 0' }}>{q.automatedResponse}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {/* Render Pagination Controls */}
          {totalQueries > queriesPerPage && renderPaginationControls()}
        </>
      )}
    </div>
  );
};

export default ClientQueryPage;