import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AutomatedResponseInterface from './AutomatedResponseInterface';
import OnlineTransactions from './OnlineTransactions';

// Chart.js imports
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  TimeScale
);

const SalesDashboard = ({ queries, setQueries, handleBack, setProducts }) => {
  const BASE_URL = 'https://rosiecloud.onrender.com';

  // State variables
  const [salesRecords, setSalesRecords] = useState([]);
  const [products, setProductsState] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newRecord, setNewRecord] = useState({ date: '', items: [], Price: '', customer: '' });
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', specifications: [] });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingProductIndex, setEditingProductIndex] = useState(null);
  const [salesPage, setSalesPage] = useState(0);
  const [productsPage, setProductsPage] = useState(0);
  const itemsPerPage = 5;
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [activeTab, setActiveTab] = useState('sales'); // 'sales', 'products', 'queries', 'transactions'
  const [queriesLoading, setQueriesLoading] = useState(false);
  const [manageQueries, setManageQueries] = useState(false);
  const [showOnlineTransactions, setShowOnlineTransactions] = useState(false);

  // Colors for styling (set text to black)
  const colors = {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    accent: '#EC4899',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    dark: '#000000',
    light: '#F9FAFB',
    muted: '#000000',
    background: '#F3F4F6',
    cardBg: '#FFFFFF',
    border: '#E5E7EB',
    text: '#000000',
    lightText: '#000000',
  };

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [salesRes, productsRes, queriesRes] = await Promise.all([
          axios.get(BASE_URL),
          axios.get(BASE_URL),
          axios.get(BASE_URL),
        ]);
        setSalesRecords(salesRes.data);
        setProductsState(productsRes.data);
        if (typeof setProducts === 'function') setProducts(productsRes.data);
        setQueriesLoading(true);
        if (typeof setQueries === 'function') setQueries(queriesRes.data);
        setQueriesLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        alert('Failed to fetch data.');
        setQueriesLoading(false);
      }
    };
    loadData();
  }, [setProducts, setQueries]);

  // Sorting functions
  const sortSalesRecords = (records) => {
    return [...records].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'Price') {
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        if (isNaN(aNum) && isNaN(bNum)) return 0;
        if (isNaN(aNum)) return sortOrder === 'asc' ? -1 : 1;
        if (isNaN(bNum)) return sortOrder === 'asc' ? 1 : -1;
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      }
      aVal = aVal ? aVal.toString() : '';
      bVal = bVal ? bVal.toString() : '';
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  };
  const sortProducts = (records) => {
    if (sortField === 'name') {
      return [...records].sort((a, b) => (sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    }
    return records;
  };
  const handleSort = (field) => {
    setSalesPage(0);
    setProductsPage(0);
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filters
  const filteredSales = salesRecords.filter(r =>
    (r.items && r.items.some(i => i.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (r.customer && r.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.date && r.date.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.Price && r.Price.toString().includes(searchTerm))
  );
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.price.toString().includes(searchTerm) ||
    p.specifications.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sorted & Paginated
  const sortedSales = sortSalesRecords(filteredSales);
  const totalPagesSales = Math.ceil(sortedSales.length / itemsPerPage);
  const currentSales = sortedSales.slice(salesPage * itemsPerPage, (salesPage + 1) * itemsPerPage);
  const sortedProducts = sortProducts(filteredProducts);
  const totalPagesProducts = Math.ceil(sortedProducts.length / itemsPerPage);
  const currentProducts = sortedProducts.slice(productsPage * itemsPerPage, (productsPage + 1) * itemsPerPage);

  // Income statement
  const generateIncomeStatement = () => {
    const totalIncome = salesRecords.reduce((acc, rec) => acc + (parseFloat(rec.Price) || 0), 0);
    alert(`Total Income: M${totalIncome.toFixed(2)}`);
  };

  // CRUD handlers
  const addOrUpdateRecord = async () => {
    const { date, items, Price, customer } = newRecord;
    const numericPrice = parseFloat(Price);
    const itemsArray =
      Array.isArray(items)
        ? items
        : typeof items === 'string'
        ? items.split(',').map(i => i.trim()).filter(i => i)
        : [];
    if (!date || itemsArray.length === 0 || isNaN(numericPrice) || numericPrice <= 0 || !customer) {
      alert('Please fill all fields correctly.');
      return;
    }
    try {
      if (editingIndex !== null) {
        const recordToUpdate = salesRecords[editingIndex];
        const id = recordToUpdate._id;
        const res = await axios.put(`${BASE_URL}/api/sales/${id}`, {
          date,
          items: itemsArray,
          Price: numericPrice,
          customer
        });
        const index = salesRecords.findIndex(r => r._id === id);
        const newRecords = [...salesRecords];
        newRecords[index] = res.data;
        setSalesRecords(newRecords);
        alert('Record updated!');
      } else {
        const res = await axios.post(`${BASE_URL}`, {
          date,
          items: itemsArray,
          Price: numericPrice,
          customer
        });
        setSalesRecords([...salesRecords, res.data.record]);
        alert('Record added!');
      }
      setNewRecord({ date: '', items: [], Price: '', customer: '' });
      setEditingIndex(null);
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to save record.');
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/sales/${id}`);
      setSalesRecords(salesRecords.filter(r => r._id !== id));
      alert('Deleted!');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete.');
    }
  };

  const resetForm = () => {
    setNewRecord({ date: '', items: [], Price: '', customer: '' });
    setEditingIndex(null);
  };

  const prepareRecordForEditing = (record) => {
    setNewRecord({
      date: record.date || '',
      items: record.items || [],
      Price: record.Price || '',
      customer: record.customer || ''
    });
    const index = salesRecords.findIndex(r => r._id === record._id);
    setEditingIndex(index);
  };

  // Products CRUD
  const addOrUpdateProduct = async () => {
    const { name, description, price, specifications } = newProduct;
    const numericPrice = parseFloat(price);
    if (name && description && !isNaN(numericPrice) && numericPrice > 0) {
      try {
        if (editingProductIndex !== null) {
          const productToUpdate = products[editingProductIndex];
          const id = productToUpdate._id;
          const res = await axios.put(`${BASE_URL}/api/products/${id}`, {
            name,
            description,
            price: numericPrice,
            specifications
          });
          const index = products.findIndex(p => p._id === id);
          const newProds = [...products];
          newProds[index] = res.data;
          setProductsState(newProds);
          if (typeof setProducts === 'function') setProducts(newProds);
          alert('Product updated!');
        } else {
          const res = await axios.post(`${BASE_URL}/api/products`, {
            name,
            description,
            price: numericPrice,
            specifications
          });
          setProductsState([...products, res.data.product]);
          if (typeof setProducts === 'function') setProducts([...products, res.data.product]);
          alert('Product added!');
        }
        setNewProduct({ name: '', description: '', price: '', specifications: [] });
        setEditingProductIndex(null);
      } catch (err) {
        console.error('Product error:', err);
        alert('Failed to save product.');
      }
    } else {
      alert('Fill all product fields correctly.');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete product?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/products/${id}`);
      const newProds = products.filter(p => p._id !== id);
      setProductsState(newProds);
      if (typeof setProducts === 'function') setProducts(newProds);
      alert('Deleted!');
    } catch (err) {
      console.error('Product delete error:', err);
      alert('Failed to delete.');
    }
  };

  const resetProductForm = () => {
    setNewProduct({ name: '', description: '', price: '', specifications: [] });
    setEditingProductIndex(null);
  };

  const prepareProductForEditing = (product) => {
    setNewProduct({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      specifications: product.specifications || []
    });
    const index = products.findIndex(p => p._id === product._id);
    setEditingProductIndex(index);
  };

  const viewDetailedRecord = (record) => {
    alert(`Details:\nDate: ${record.date}\nItems: ${record.items ? record.items.join(', ') : 'None'}\nPrice: M${record.Price ? parseFloat(record.Price).toFixed(2) : '0.00'}\nCustomer: ${record.customer}`);
  };

  const exportToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Date,Items,Price,Customer\n" +
      salesRecords.map(r => `${r.date},"${r.items ? r.items.join('; ') : ''}",${r.Price},${r.customer}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sales_records.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleItemsChange = (value) => {
    const itemsArray =
      typeof value === 'string'
        ? value.split(',').map(i => i.trim()).filter(i => i)
        : value;
    setNewRecord({ ...newRecord, items: itemsArray });
  };

  // Refresh queries
  const refreshQueries = async () => {
    try {
      setQueriesLoading(true);
      const res = await axios.get(`${BASE_URL}/api/queries`);
      if (typeof setQueries === 'function') setQueries(res.data);
      setQueriesLoading(false);
    } catch (err) {
      console.error('Fetch queries error:', err);
      alert('Failed to fetch queries.');
      setQueriesLoading(false);
    }
  };

  // Chart data functions
  const getQueryStatusData = () => {
    const counts = queries.reduce((a, q) => {
      const s = q.status || 'Unknown';
      a[s] = (a[s] || 0) + 1;
      return a;
    }, {});
    const labels = Object.keys(counts);
    const data = Object.values(counts);
    return {
      labels,
      datasets: [{
        label: 'Number of Queries',
        data,
        backgroundColor: [
          'rgba(99, 102, 241, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(126, 97, 97, 0.7)',
          'rgba(156, 163, 175, 0.7)',
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgb(99, 75, 75)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 1,
      }],
    };
  };

  const getQueriesOverTimeData = () => {
    const counts = queries.reduce((a, q) => {
      const dateStr = q.date ? new Date(q.date).toDateString() : 'Unknown Date';
      a[dateStr] = (a[dateStr] || 0) + 1;
      return a;
    }, {});
    const sortedDates = Object.keys(counts).sort((a, b) => new Date(a) - new Date(b));
    const labels = sortedDates;
    const data = sortedDates.map(d => counts[d]);
    return {
      labels,
      datasets: [{
        label: 'Queries Submitted per Day',
        data,
        fill: false,
        borderColor: colors.secondary,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        tension: 0.3,
        pointBackgroundColor: colors.secondary,
        pointBorderColor: colors.cardBg,
        pointHoverBackgroundColor: colors.accent,
        pointHoverBorderColor: colors.accent,
        pointRadius: 4,
        pointHoverRadius: 6,
      }],
    };
  };

  // Chart options
  const queryChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Customer Query Status Distribution', font: { size: 16 }, color: colors.dark }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Number of Queries', color: colors.dark },
        ticks: { stepSize: 1, color: colors.lightText },
        grid: { color: 'rgba(156, 163, 175, 0.2)' },
      },
      x: {
        title: { display: true, text: 'Query Status', color: colors.dark },
        ticks: { color: colors.lightText },
        grid: { color: 'rgba(156, 163, 175, 0.2)' },
      }
    }
  };

  const queriesOverTimeChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: colors.dark } },
      title: { display: true, text: 'Queries Submitted Over Time', font: { size: 16 }, color: colors.dark }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'MMM d, yyyy',
          displayFormats: { day: 'MMM d' }
        },
        title: { display: true, text: 'Date', color: colors.dark },
        ticks: { color: colors.lightText },
        grid: { color: 'rgba(156, 163, 175, 0.2)' },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Number of Queries', color: colors.dark },
        ticks: { stepSize: 1, color: colors.lightText },
        grid: { color: 'rgba(156, 163, 175, 0.2)' },
      }
    }
  };

  // Handlers for queries
  const handleDeleteQuery = async (queryId) => {
    if (!window.confirm('Are you sure you want to delete this query?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/queries/${queryId}`);
      if (typeof setQueries === 'function') {
        setQueries(prev => prev.filter(q => q._id !== queryId));
      }
      alert('Query deleted!');
    } catch (err) {
      console.error('Delete query error:', err);
      alert('Failed to delete.');
    }
  };
  const handleRespond = (query) => {
    const reply = prompt('Enter your response:', query.response || '');
    if (reply !== null && reply.trim() !== '') {
      axios
        .put(`${BASE_URL}/api/queries/${query._id}`, {
          ...query,
          response: reply,
          status: 'Responded',
        })
        .then(res => {
          if (typeof setQueries === 'function') {
            setQueries(prev => prev.map(q => q._id === query._id ? res.data : q));
          }
          alert('Response sent!');
        })
        .catch(err => {
          console.error('Respond error:', err);
          alert('Failed to send response.');
        });
    }
  };

  // Button styles
  const buttonStyle = (isPrimary) => ({
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: isPrimary ? colors.primary : colors.light,
    color: isPrimary ? colors.light : colors.dark,
    border: `1px solid ${isPrimary ? colors.primary : colors.border}`,
  });
  const primaryButtonStyle = { ...buttonStyle(true) };
  const secondaryButtonStyle = { ...buttonStyle(false) };
  const dangerButtonStyle = {
    ...buttonStyle(false),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: colors.danger,
    border: `1px solid ${colors.danger}`,
  };
  const tabButtonStyle = (isActive) => ({
    padding: '12px 20px',
    borderRadius: '8px 8px 0 0',
    border: 'none',
    borderBottom: isActive ? `3px solid ${colors.primary}` : 'none',
    backgroundColor: isActive ? colors.cardBg : colors.background,
    color: isActive ? colors.primary : colors.muted,
    fontWeight: isActive ? '600' : '500',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    margin: '0 4px',
  });
  const inputStyle = {
    padding: '12px 16px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: colors.light,
    color: colors.text,
  };
  const paginationButtonStyle = (isDisabled) => ({
    padding: '8px 14px',
    borderRadius: '6px',
    backgroundColor: isDisabled ? colors.border : colors.primary,
    color: isDisabled ? colors.muted : colors.light,
    border: 'none',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.6 : 1,
    fontWeight: '500',
    fontSize: '14px',
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: colors.background,
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: colors.cardBg,
        padding: '16px 24px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '700',
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>Sales Dashboard</h1>
        <button onClick={handleBack} style={{
          ...secondaryButtonStyle,
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}>
          ← Back to Home
        </button>
      </header>

      {/* Search & Tabs */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: colors.cardBg,
        marginBottom: '2px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSalesPage(0);
            setProductsPage(0);
          }}
          style={{
            ...inputStyle,
            width: '100%',
            maxWidth: '600px',
            margin: '0 auto 16px',
            fontSize: '16px',
            padding: '12px 20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}
        />
        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {['sales', 'products', 'queries', 'transactions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...tabButtonStyle(activeTab === tab),
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '24px',
          }}>
            {/* Total Sales */}
            <div style={{
              backgroundColor: colors.cardBg,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: `1px solid ${colors.border}`,
            }}>
              <h3 style={{
                margin: '0 0 10px',
                color: colors.muted,
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>Total Sales</h3>
              <p style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: '700',
                color: colors.dark,
              }}>M{salesRecords.reduce((a, r) => a + (parseFloat(r.Price) || 0), 0).toFixed(2)}</p>
              <p style={{ margin: '5px 0 0', fontSize: '14px', color: colors.muted }}>Records: {salesRecords.length}</p>
            </div>
            {/* Total Products */}
            <div style={{
              backgroundColor: colors.cardBg,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: `1px solid ${colors.border}`,
            }}>
              <h3 style={{
                margin: '0 0 10px',
                color: colors.muted,
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>Total Products</h3>
              <p style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: '700',
                color: colors.dark,
              }}>{products.length}</p>
              <p style={{ margin: '5px 0 0', fontSize: '14px', color: colors.muted }}>Products</p>
            </div>
          </div>

          {/* Content based on tab */}
          {activeTab === 'sales' && (
            <>
              {/* SALES TABLE + FORM */}
              <h2 style={{ marginBottom: '16px', color: colors.dark }}>Sales Records</h2>
              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <button style={primaryButtonStyle} onClick={exportToCSV}>Export CSV</button>
                  <button style={primaryButtonStyle} onClick={generateIncomeStatement}>Income Statement</button>
                </div>
                <button style={secondaryButtonStyle} onClick={() => { setNewRecord({ date: '', items: [], Price: '', customer: '' }); setEditingIndex(null); }}>Add New Record</button>
              </div>
              {/* Form */}
              <div style={{
                backgroundColor: colors.cardBg,
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                marginBottom: '20px'
              }}>
                <h3 style={{ marginBottom:'12px', color: colors.dark }}>
                  {editingIndex !== null ? 'Edit' : 'Add'} Sales Record
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <input style={inputStyle} type="date" placeholder="Date" value={newRecord.date} onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })} />
                  <input style={inputStyle} type="text" placeholder="Items (comma-separated)" value={Array.isArray(newRecord.items) ? newRecord.items.join(', ') : newRecord.items} onChange={(e) => handleItemsChange(e.target.value)} />
                  <input style={inputStyle} type="number" placeholder="Price" value={newRecord.Price} onChange={(e) => setNewRecord({ ...newRecord, Price: e.target.value })} />
                  <input style={inputStyle} type="text" placeholder="Customer" value={newRecord.customer} onChange={(e) => setNewRecord({ ...newRecord, customer: e.target.value })} />
                </div>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button style={secondaryButtonStyle} onClick={resetForm}>Cancel</button>
                  <button style={primaryButtonStyle} onClick={addOrUpdateRecord}>{editingIndex !== null ? 'Update' : 'Add'}</button>
                </div>
              </div>
              {/* Search & Sort */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <button onClick={() => handleSort('date')} style={buttonStyle(true)}>Sort by Date {sortField==='date' ? (sortOrder==='asc' ? '↑':'↓') : ''}</button>
                  <button onClick={() => handleSort('Price')} style={buttonStyle(true)}>Sort by Price {sortField==='Price' ? (sortOrder==='asc' ? '↑':'↓') : ''}</button>
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setSalesPage(0); }}
                  style={{ ...inputStyle, width: '200px' }}
                />
              </div>
              {/* Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer', color: '#000' }} onClick={() => handleSort('date')}>
                      Date {sortField==='date' ? (sortOrder==='asc' ? '↑':'↓') : ''}
                    </th>
                    <th style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>Items</th>
                    <th style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer', color: '#000' }} onClick={() => handleSort('Price')}>
                      Price {sortField==='Price' ? (sortOrder==='asc' ? '↑':'↓') : ''}
                    </th>
                    <th style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>Customer</th>
                    <th style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSales.map((rec, idx) => (
                    <tr key={rec._id} style={{ backgroundColor: idx % 2 === 0 ? colors.light : 'transparent' }}>
                      <td style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>{rec.date}</td>
                      <td style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>{rec.items ? rec.items.join(', ') : ''}</td>
                      <td style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>M{parseFloat(rec.Price).toFixed(2)}</td>
                      <td style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>{rec.customer}</td>
                      <td style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>
                        <button style={secondaryButtonStyle} onClick={() => { setNewRecord({ date: rec.date, items: rec.items, Price: rec.Price, customer: rec.customer }); setEditingIndex(salesRecords.findIndex(r => r._id===rec._id)); }}>Edit</button>
                        <button style={dangerButtonStyle} onClick={() => deleteRecord(rec._id)}>Delete</button>
                        <button style={secondaryButtonStyle} onClick={() => viewDetailedRecord(rec)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', gap: '8px' }}>
                <button disabled={salesPage === 0} onClick={() => setSalesPage(salesPage - 1)} style={paginationButtonStyle(salesPage === 0)}>Previous</button>
                <span style={{ alignSelf: 'center' }}>Page {salesPage + 1} of {totalPagesSales}</span>
                <button disabled={salesPage >= totalPagesSales - 1} onClick={() => setSalesPage(salesPage + 1)} style={paginationButtonStyle(salesPage >= totalPagesSales - 1)}>Next</button>
              </div>
            </>
          )}

          {activeTab === 'products' && (
            <>
              {/* Products Management */}
              <h2 style={{ marginBottom: '16px', color: colors.dark }}>Products</h2>
              {/* Add/Edit Product */}
              <div style={{
                backgroundColor: colors.cardBg,
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                marginBottom: '20px'
              }}>
                <h3 style={{ marginBottom:'12px', color: colors.dark }}>
                  {editingProductIndex !== null ? 'Edit' : 'Add'} Product
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <input style={inputStyle} type='text' placeholder='Product Name' value={newProduct.name} onChange={(e)=>setNewProduct({...newProduct, name:e.target.value})} />
                  <input style={inputStyle} type='text' placeholder='Description' value={newProduct.description} onChange={(e)=>setNewProduct({...newProduct, description:e.target.value})} />
                  <input style={inputStyle} type='number' placeholder='Price' value={newProduct.price} onChange={(e)=>setNewProduct({...newProduct, price:e.target.value})} />
                  <input style={inputStyle} type='text' placeholder='Specifications (comma-separated)' value={newProduct.specifications.join(', ')} onChange={(e) => {
                    const specs = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                    setNewProduct({...newProduct, specifications: specs});
                  }} />
                </div>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent:'flex-end', gap:'10px' }}>
                  <button style={secondaryButtonStyle} onClick={resetProductForm}>Cancel</button>
                  <button style={primaryButtonStyle} onClick={addOrUpdateProduct}>{editingProductIndex!==null?'Update':'Add'}</button>
                </div>
              </div>
              {/* Products Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer', color: '#000' }} onClick={() => handleSort('name')}>Name {sortField==='name' ? (sortOrder==='asc' ? '↑' : '↓') : ''}</th>
                    <th style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>Description</th>
                    <th style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer', color: '#000' }} onClick={() => handleSort('price')}>Price {sortField==='price' ? (sortOrder==='asc' ? '↑' : '↓') : ''}</th>
                    <th style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>Specifications</th>
                    <th style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((p, idx) => (
                    <tr key={p._id} style={{ backgroundColor: idx % 2 === 0 ? colors.light : 'transparent' }}>
                      <td style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>{p.name}</td>
                      <td style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>{p.description}</td>
                      <td style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>M{parseFloat(p.price).toFixed(2)}</td>
                      <td style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>
                        {Array.isArray(p.specifications) ? p.specifications.join(', ') : ''}
                      </td>
                      <td style={{ padding:'10px', borderBottom: `1px solid ${colors.border}`, color: '#000' }}>
                        <button style={secondaryButtonStyle} onClick={() => prepareProductForEditing(p)}>Edit</button>
                        <button style={dangerButtonStyle} onClick={() => deleteProduct(p._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Product Pagination */}
              <div style={{ display:'flex', justifyContent:'center', marginTop:'16px', gap:'8px' }}>
                <button disabled={productsPage===0} onClick={() => setProductsPage(productsPage - 1)} style={paginationButtonStyle(productsPage===0)}>Previous</button>
                <span>Page {productsPage + 1} of {Math.ceil(products.length / itemsPerPage)}</span>
                <button disabled={productsPage >= Math.ceil(products.length / itemsPerPage) - 1} onClick={() => setProductsPage(productsPage + 1)} style={paginationButtonStyle(productsPage >= Math.ceil(products.length / itemsPerPage) - 1)}>Next</button>
              </div>
            </>
          )}

          {/* Bottom Buttons */}
          <div style={{ marginTop: '30px', display: 'flex', gap: '20px', flexWrap:'wrap' }}>
            <button style={primaryButtonStyle} onClick={generateIncomeStatement}>Generate Income Statement</button>
            <button style={primaryButtonStyle} onClick={exportToCSV}>Export Sales to CSV</button>
            <button style={primaryButtonStyle} onClick={() => setManageQueries(!manageQueries)}>
              {manageQueries ? 'Hide Queries Management' : 'Manage Customer Queries'}
            </button>
            <button style={primaryButtonStyle} onClick={() => setShowOnlineTransactions(!showOnlineTransactions)}>
              {showOnlineTransactions ? 'Hide Online Transactions' : 'View Online Transactions'}
            </button>
          </div>

          {/* Queries Management & Charts */}
          {manageQueries && (
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ color: colors.dark }}>Customer Queries Management</h3>
              <button onClick={refreshQueries} disabled={queriesLoading} style={{ ...secondaryButtonStyle, marginBottom:'12px' }}>
                {queriesLoading ? 'Refreshing...' : 'Refresh Queries'}
              </button>
              <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                {/* Query Status Chart */}
                <div style={{ width:'100%', maxWidth:'600px', margin:'0 auto' }}>
                  <h4 style={{ color: colors.dark }}>Query Status Overview</h4>
                  {queriesLoading ? <p>Loading chart data...</p> :
                    queries.length > 0 ? <Bar data={getQueryStatusData()} options={queryChartOptions} /> :
                    <p>No data to display.</p>}
                </div>
                {/* Queries Over Time Chart */}
                <div style={{ width:'100%', maxWidth:'800px', margin:'0 auto' }}>
                  <h4 style={{ color: colors.dark }}>Queries Submitted Over Time</h4>
                  {queriesLoading ? <p>Loading chart data...</p> :
                    queries.length > 0 ? <Line data={getQueriesOverTimeData()} options={queriesOverTimeChartOptions} /> :
                    <p>No data to display.</p>}
                </div>
                {/* Automated Response */}
                <AutomatedResponseInterface
                  queries={queries}
                  setQueries={setQueries}
                  handleDeleteQuery={handleDeleteQuery}
                />
              </div>
            </div>
          )}

          {/* Online Transactions */}
          {showOnlineTransactions && (
            <div style={{ marginTop: '30px' }}>
              <h3>Online Transactions</h3>
              <OnlineTransactions />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SalesDashboard;
