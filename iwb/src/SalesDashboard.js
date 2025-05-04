import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AutomatedResponseInterface from './AutomatedResponseInterface';
import OnlineTransactions from './OnlineTransactions';

// Import Chart.js components for Bar and Line charts
import { Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    LineElement, // Added for Line chart
    PointElement, // Added for Line chart
    TimeScale, // Added for time-based charts
} from 'chart.js';
// Import date adapter for TimeScale
import 'chartjs-adapter-date-fns'; // Install this: npm install chartjs-adapter-date-fns date-fns

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
    TimeScale // Register TimeScale
);

const SalesDashboard = ({ queries, setQueries, handleBack, setProducts }) => {
    const [salesRecords, setSalesRecords] = useState([]);
    const [products, setProductsState] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newRecord, setNewRecord] = useState({
        date: '',
        items: [],
        Price: '',
        customer: ''
    });
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price: '',
        specifications: []
    });
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingProductIndex, setEditingProductIndex] = useState(null);

    // Pagination states for sales and products
    const [salesPage, setSalesPage] = useState(0);
    const [productsPage, setProductsPage] = useState(0);
    const itemsPerPage = 5; // Number of items to display per page

    const [sortField, setSortField] = useState('date');
    const [sortOrder, setSortOrder] = useState('asc');

    const [manageQueries, setManageQueries] = useState(false);
    const [showOnlineTransactions, setShowOnlineTransactions] = useState(false);

    // For queries management
    const [queriesLoading, setQueriesLoading] = useState(false);

    // Load sales records, products, and queries from the database when component mounts
    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch sales records
                const salesResponse = await axios.get('http://localhost:5000/api/sales');
                setSalesRecords(salesResponse.data);

                // Fetch products
                const productsResponse = await axios.get('http://localhost:5000/api/products');
                setProductsState(productsResponse.data);

                // Also update the products state passed from the parent
                if (typeof setProducts === 'function') {
                    setProducts(productsResponse.data);
                }

                // Fetch customer queries - same endpoint used by ClientQueryPage
                setQueriesLoading(true);
                const queriesResponse = await axios.get('http://localhost:5000/api/queries');
                if (typeof setQueries === 'function') {
                    setQueries(queriesResponse.data);
                }
                setQueriesLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                alert("Failed to fetch data.");
                setQueriesLoading(false);
            }
        };
        loadData();
    }, [setProducts, setQueries]); // Added dependencies

    // Sorting functions
    const sortSalesRecords = (records) => {
        return [...records].sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            if (sortField === 'Price') {
                // Ensure values are numbers for comparison
                const numA = parseFloat(aValue);
                const numB = parseFloat(bValue);
                if (isNaN(numA) && isNaN(numB)) return 0;
                if (isNaN(numA)) return sortOrder === 'asc' ? -1 : 1;
                if (isNaN(numB)) return sortOrder === 'asc' ? 1 : -1;
                return sortOrder === 'asc' ? numA - numB : numB - numA;
            }

            // Handle other fields as strings
            aValue = aValue ? aValue.toString() : '';
            bValue = bValue ? bValue.toString() : '';

            return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        });
    };

    const sortProducts = (records) => {
        return [...records].sort((a, b) => {
            if (sortField === 'name') {
                return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
            // Add sorting for other product fields if needed
            return 0; // Default no sort if field is not name
        });
    };

    const handleSort = (field) => {
        // Reset page to 0 when sorting changes
        setSalesPage(0);
        setProductsPage(0);
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc'); // Default to ascending when changing field
        }
    };

    // Filtering based on search
    const filteredSales = salesRecords.filter(record =>
        (record.items && record.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (record.customer && record.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.date && record.date.toLowerCase().includes(searchTerm.toLowerCase())) || // Include date in search
        (record.Price && record.Price.toString().includes(searchTerm)) // Include price in search
    );

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.price.toString().includes(searchTerm) ||
        product.specifications.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sorted and Paginated records
    const sortedSales = sortSalesRecords(filteredSales);
    const totalPagesSales = Math.ceil(sortedSales.length / itemsPerPage);
    const currentSales = sortedSales.slice(salesPage * itemsPerPage, (salesPage + 1) * itemsPerPage);

    const sortedProducts = sortProducts(filteredProducts);
    const totalPagesProducts = Math.ceil(sortedProducts.length / itemsPerPage);
    const currentProducts = sortedProducts.slice(productsPage * itemsPerPage, (productsPage + 1) * itemsPerPage);

    // Income statement
    const generateIncomeStatement = () => {
        const totalIncome = salesRecords.reduce((acc, record) => acc + (parseFloat(record.Price) || 0), 0);
        alert(`Total Income: M${totalIncome.toFixed(2)}`);
    };

    // CRUD for sales records
    const addOrUpdateRecord = async () => {
        const { date, items, Price, customer } = newRecord;
        const numericPrice = parseFloat(Price);

        const itemsArray = Array.isArray(items) ? items :
                          (typeof items === 'string' ? items.split(',').map(i => i.trim()).filter(i => i) : []);

        if (!date) {
            alert('Date is required.');
            return;
        }
        if (itemsArray.length === 0) {
            alert('At least one item is required.');
            return;
        }
        if (isNaN(numericPrice) || numericPrice <= 0) {
            alert('Price must be a valid positive number.');
            return;
        }
        if (!customer) {
            alert('Customer name is required.');
            return;
        }

        try {
            const updatedRecords = [...salesRecords];
            if (editingIndex !== null) {
                const recordToUpdate = updatedRecords[editingIndex];
                 if (!recordToUpdate || !recordToUpdate._id) {
                    alert("Error: Record to update not found or missing ID.");
                    return;
                }
                const updatedId = recordToUpdate._id;
                const response = await axios.put(`http://localhost:5000/api/sales/${updatedId}`, {
                    date,
                    items: itemsArray,
                    Price: numericPrice,
                    customer
                });
                 // Find the index of the updated record in the original salesRecords array
                const originalIndex = salesRecords.findIndex(rec => rec._id === updatedId);
                if (originalIndex !== -1) {
                     const newSalesRecords = [...salesRecords];
                     newSalesRecords[originalIndex] = response.data; // Use data from the response
                     setSalesRecords(newSalesRecords);
                }

                alert('Record updated successfully!');
            } else {
                const response = await axios.post('http://localhost:5000/api/sales', {
                    date,
                    items: itemsArray,
                    Price: numericPrice,
                    customer
                });
                setSalesRecords([...salesRecords, response.data.record]); // Add the new record from the response
                alert('New record added successfully!');
            }
            resetForm();
        } catch (error) {
            console.error('Error adding or updating record:', error);
            alert('Failed to add or update the record: ' + (error.response?.data?.error || error.message));
        }
    };

    const deleteRecord = async (id) => {
         if (!window.confirm("Are you sure you want to delete this record?")) {
            return;
        }
        try {
            await axios.delete(`http://localhost:5000/api/sales/${id}`);
            // Filter out the deleted record
            setSalesRecords(salesRecords.filter(record => record._id !== id));
            alert('Record deleted successfully!');
        } catch (error) {
            console.error('Error deleting record:', error);
            alert('Failed to delete the record.');
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
        // Find the index in the *current* salesRecords array to set editingIndex
        const index = salesRecords.findIndex(rec => rec._id === record._id);
        setEditingIndex(index);
    };

    // CRUD for products
    const addOrUpdateProduct = async () => {
        const { name, description, price, specifications } = newProduct;
        const numericPrice = parseFloat(price);

        if (name && description && !isNaN(numericPrice) && numericPrice > 0) {
            try {
                const updatedProducts = [...products];
                if (editingProductIndex !== null) {
                    const productToUpdate = updatedProducts[editingProductIndex];
                     if (!productToUpdate || !productToUpdate._id) {
                        alert("Error: Product to update not found or missing ID.");
                        return;
                    }
                    const updatedId = productToUpdate._id;

                    const response = await axios.put(`http://localhost:5000/api/products/${updatedId}`, {
                        name,
                        description,
                        price: numericPrice,
                        specifications
                    });
                     // Find the index of the updated product in the original products array
                    const originalIndex = products.findIndex(prod => prod._id === updatedId);
                    if (originalIndex !== -1) {
                        const newProducts = [...products];
                        newProducts[originalIndex] = response.data; // Use data from the response
                        setProductsState(newProducts);
                        if (typeof setProducts === 'function') {
                            setProducts(newProducts); // Update parent state
                        }
                    }

                    alert('Product updated successfully!');
                } else {
                    const response = await axios.post('http://localhost:5000/api/products', {
                        name,
                        description,
                        price: numericPrice,
                        specifications
                    });
                    const newProductData = response.data.product;
                    setProductsState([...products, newProductData]);
                    if (typeof setProducts === 'function') {
                        setProducts([...products, newProductData]); // Update parent state
                    }
                    alert('New product added successfully!');
                }
                resetProductForm();
            } catch (error) {
                console.error('Error adding or updating product:', error);
                alert('Failed to add or update the product: ' + (error.response?.data?.error || error.message));
            }
        } else {
            alert('Please fill in all fields correctly.');
        }
    };

    const deleteProduct = async (id) => {
         if (!window.confirm("Are you sure you want to delete this product?")) {
            return;
        }
        try {
            await axios.delete(`http://localhost:5000/api/products/${id}`);
            // Filter out the deleted product
            const newProducts = products.filter(product => product._id !== id);
            setProductsState(newProducts);
             if (typeof setProducts === 'function') {
                setProducts(newProducts); // Update parent state
            }
            alert('Product deleted successfully!');
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete the product.');
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
         // Find the index in the *current* products array to set editingProductIndex
        const index = products.findIndex(prod => prod._id === product._id);
        setEditingProductIndex(index);
    };

    const viewDetailedRecord = (record) => {
        alert(`Details:
Date: ${record.date}
Items: ${record.items ? record.items.join(', ') : 'None'}
Price: M${record.Price ? parseFloat(record.Price).toFixed(2) : '0.00'}
Customer: ${record.customer}`);
    };

    const exportToCSV = () => {
        const csvContent = "data:text/csv;charset=utf-8," +
            "Date,Items,Price,Customer\n" +
            salesRecords.map(record =>
                `${record.date},"${record.items ? record.items.join('; ') : ''}",${record.Price},${record.customer}`
            ).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "sales_records.csv");
        document.body.appendChild(link);
        link.click();
    };

    const handleItemsChange = (value) => {
        let itemsArray;
        if (typeof value === 'string') {
            itemsArray = value.split(',').map(item => item.trim()).filter(item => item);
        } else {
            itemsArray = value;
        }
        setNewRecord({ ...newRecord, items: itemsArray });
    };

    // Refresh queries from the server
    const refreshQueries = async () => {
        try {
            setQueriesLoading(true);
            const response = await axios.get('http://localhost:5000/api/queries');
            if (typeof setQueries === 'function') {
                setQueries(response.data);
            }
            setQueriesLoading(false);
        } catch (error) {
            console.error("Error fetching queries:", error);
            alert("Failed to fetch customer queries.");
            setQueriesLoading(false);
        }
    };

    // --- Query Status Chart Data Processing ---
    const getQueryStatusData = () => {
        const statusCounts = queries.reduce((acc, query) => {
            const status = query.status || 'Unknown'; // Default to 'Unknown' if status is missing
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(statusCounts);
        const data = Object.values(statusCounts);

        return {
            labels: labels,
            datasets: [{
                label: 'Number of Queries',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)', // Red
                    'rgba(54, 162, 235, 0.6)', // Blue
                    'rgba(255, 206, 86, 0.6)', // Yellow
                    'rgba(75, 192, 192, 0.6)', // Green
                    'rgba(153, 102, 255, 0.6)', // Purple
                    'rgba(255, 159, 64, 0.6)', // Orange
                    'rgba(199, 199, 199, 0.6)', // Grey
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)',
                ],
                borderWidth: 1,
            }]
        };
    };

    const queryChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Customer Query Status Distribution',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Queries'
                },
                ticks: {
                    stepSize: 1 // Ensure integer ticks
                }
            },
            x: {
                 title: {
                    display: true,
                    text: 'Query Status'
                },
            }
        }
    };
    // --- End of Status Chart Data Processing ---

    // --- Queries Over Time Chart Data Processing ---
    const getQueriesOverTimeData = () => {
        const dailyCounts = queries.reduce((acc, query) => {
            // Assuming query.date is in a format that can be parsed by Date
            const date = query.date ? new Date(query.date).toDateString() : 'Unknown Date';
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        // Sort dates for the chart
        const sortedDates = Object.keys(dailyCounts).sort((a, b) => new Date(a) - new Date(b));

        const labels = sortedDates;
        const data = sortedDates.map(date => dailyCounts[date]);

        return {
            labels: labels,
            datasets: [{
                label: 'Queries Submitted per Day',
                data: data,
                fill: false,
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1,
            }]
        };
    };

    const queriesOverTimeChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Queries Submitted Over Time',
            },
        },
        scales: {
            x: {
                type: 'time', // Use time scale
                time: {
                    unit: 'day', // Display unit as days
                    tooltipFormat: 'MMM d, yyyy', // Format for tooltip
                    displayFormats: {
                        day: 'MMM d' // Format for axis labels
                    }
                },
                title: {
                    display: true,
                    text: 'Date'
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Queries'
                },
                 ticks: {
                    stepSize: 1 // Ensure integer ticks
                }
            }
        }
    };
    // --- End of Queries Over Time Chart Data Processing ---

    // --- Delete Query Function ---
    const handleDeleteQuery = async (queryId) => {
         if (!window.confirm("Are you sure you want to delete this query?")) {
            return;
        }
        try {
            await axios.delete(`http://localhost:5000/api/queries/${queryId}`);
            // Update the queries state by filtering out the deleted query
            if (typeof setQueries === 'function') {
                setQueries(prevQueries => prevQueries.filter(query => query._id !== queryId));
            }
            alert('Query deleted successfully!');
        } catch (error) {
            console.error('Error deleting query:', error);
            alert('Failed to delete the query.');
        }
    };
    // --- End of Delete Query Function ---


    return (
        // Outermost container - Set to fill the screen height
        <div style={{
             display: 'flex',
             flexDirection: 'column',
             height: '100vh', // Make the container fill the viewport height
             padding: '20px',
             boxSizing: 'border-box' // Include padding in the height calculation
             }}>

            {/* Header Area (Fixed at the top of the page content) */}
            {/* This div is outside the scrollable area */}
            <div style={{ flexShrink: 0 }}> {/* flexShrink: 0 prevents this header from shrinking */}
                <h2>Sales Dashboard</h2>
                <button onClick={handleBack} style={{ marginBottom: '20px', padding: '10px 15px' }}>Back to Home</button>

                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            // Reset pagination when search term changes
                            setSalesPage(0);
                            setProductsPage(0);
                        }}
                        style={{ width: '100%', padding: '10px', fontSize: '16px' }}
                    />
                </div>
            </div>

            {/* Main Content Container - This is the container with internal scrolling */}
            {/* It now holds the tables, forms, and the bottom buttons/conditional sections */}
            {/* Set flexGrow: 1 to make it take up the remaining space */}
            <div style={{
                 flexGrow: 1, // Allow this div to grow and fill the remaining height
                 overflowY: 'auto', // Add vertical scroll if content exceeds height
                 paddingRight: '10px' // Add padding to the right for scrollbar visibility
            }}>

                {/* Container for Sales Records and Products Management (Flex layout for two columns) */}
                 <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', '@media (max-width: 768px)': { flexDirection: 'column' } }}> {/* Add responsive flex */}
                     {/* Sales Records Section */}
                     <div style={{ flex: 1, border: '1px solid #ccc', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                        <h3>Sales Records</h3>
                        {/* The table content itself will contribute to the scroll of the parent flex item */}
                         <div style={{ marginTop: '10px', overflowX: 'auto' }}> {/* Add horizontal scroll for tables */}
                            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '600px' }}> {/* Set a min-width for better display on smaller screens */}
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('date')} style={{ border: '1px solid #ddd', padding: '10px', cursor: 'pointer', backgroundColor: '#f2f2f2' }}>
                                            Date {sortField === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                        </th>
                                        <th onClick={() => handleSort('items')} style={{ border: '1px solid #ddd', padding: '10px', cursor: 'pointer', backgroundColor: '#f2f2f2' }}>
                                            Items {sortField === 'items' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                        </th>
                                        <th onClick={() => handleSort('Price')} style={{ border: '1px solid #ddd', padding: '10px', cursor: 'pointer', backgroundColor: '#f2f2f2' }}>
                                            Price {sortField === 'Price' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                        </th>
                                        <th onClick={() => handleSort('customer')} style={{ border: '1px solid #ddd', padding: '10px', cursor: 'pointer', backgroundColor: '#f2f2f2' }}>
                                            Customer {sortField === 'customer' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                        </th>
                                        <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f2f2f2' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentSales.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '10px', border: '1px solid #ddd' }}>No sales records found.</td>
                                        </tr>
                                    ) : (
                                        currentSales.map((record) => (
                                            <tr key={record._id}>
                                                <td style={{ border: '1px solid #ddd', padding: '10px' }}>{record.date}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                                                    {record.items ? record.items.join(', ') : ''}
                                                </td>
                                                <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                                                    M{record.Price ? parseFloat(record.Price).toFixed(2) : '0.00'}
                                                </td>
                                                <td style={{ border: '1px solid #ddd', padding: '10px' }}>{record.customer}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                                                    <button onClick={() => prepareRecordForEditing(record)} style={{ marginRight: '5px', padding: '5px 10px' }}>Edit</button>
                                                    <button onClick={() => deleteRecord(record._id)} style={{ marginRight: '5px', padding: '5px 10px' }}>Delete</button>
                                                    <button onClick={() => viewDetailedRecord(record)} style={{ padding: '5px 10px' }}>View</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls for Sales */}
                        {/* flexShrink: 0 prevents the pagination from shrinking */}
                        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexShrink: 0, flexWrap: 'wrap' }}> {/* Add flexWrap */}
                            <button
                                disabled={salesPage === 0}
                                onClick={() => setSalesPage(salesPage - 1)}
                                style={{ padding: '8px 12px', cursor: salesPage === 0 ? 'not-allowed' : 'pointer' }}
                            >
                                Previous
                            </button>
                            <span style={{ margin: '0 10px' }}>
                                Page {salesPage + 1} of {totalPagesSales || 1}
                            </span>
                            <button
                                disabled={salesPage >= totalPagesSales - 1 || totalPagesSales <= 1}
                                onClick={() => setSalesPage(salesPage + 1)}
                                style={{ padding: '8px 12px', cursor: (salesPage >= totalPagesSales - 1 || totalPagesSales <= 1) ? 'not-allowed' : 'pointer' }}
                            >
                                Next
                            </button>
                        </div>

                        {/* Form to add/update sales record */}
                        {/* flexShrink: 0 prevents the form from shrinking */}
                        <div style={{ marginTop: '25px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9', flexShrink: 0 }}>
                            <h3>{editingIndex !== null ? 'Edit Sales Record' : 'Add New Sales Record'}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '10px' }}>
                                <input
                                    type="date"
                                    placeholder="Date"
                                    value={newRecord.date}
                                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                                    style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Items (comma-separated)"
                                    value={Array.isArray(newRecord.items) ? newRecord.items.join(', ') : newRecord.items}
                                    onChange={(e) => handleItemsChange(e.target.value)}
                                    style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
                                />
                                <input
                                    type="number"
                                    placeholder="Price"
                                    value={newRecord.Price}
                                    onChange={(e) => setNewRecord({ ...newRecord, Price: e.target.value })}
                                    style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Customer"
                                    value={newRecord.customer}
                                    onChange={(e) => setNewRecord({ ...newRecord, customer: e.target.value })}
                                    style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ marginTop: '15px' }}>
                                <button onClick={addOrUpdateRecord} style={{ padding: '10px 15px', marginRight: '10px' }}>
                                    {editingIndex !== null ? 'Update Record' : 'Add Record'}
                                </button>
                                {editingIndex !== null && <button onClick={resetForm} style={{ padding: '10px 15px' }}>Cancel</button>}
                            </div>
                        </div>
                    </div>

                    {/* Products Management Section */}
                    {/* The table content itself will contribute to the scroll of the parent flex item */}
                     <div style={{ flex: 1, border: '1px solid #ccc', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                        <h3>Products Management</h3>
                        <div style={{ marginTop: '10px', overflowX: 'auto' }}> {/* Add horizontal scroll for tables */}
                            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '600px' }}> {/* Set a min-width */}
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('name')} style={{ border: '1px solid #ddd', padding: '10px', cursor: 'pointer', backgroundColor: '#f2f2f2' }}>
                                            Name {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                        </th>
                                        <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f2f2f2' }}>Description</th>
                                        <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f2f2f2' }}>Price</th>
                                        <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f2f2f2' }}>Specifications</th>
                                        <th style={{ border: '1px solid #ddd', padding: '10px', backgroundColor: '#f2f2f2' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '10px', border: '1px solid #ddd' }}>No products found.</td>
                                        </tr>
                                    ) : (
                                        currentProducts.map((product) => (
                                            <tr key={product._id}>
                                                <td style={{ border: '1px solid #ddd', padding: '10px' }}>{product.name}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '10px' }}>{product.description}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '10px' }}>M{parseFloat(product.price).toFixed(2)}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                                                    {Array.isArray(product.specifications) ? product.specifications.join(', ') : ''}
                                                </td>
                                                <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                                                    <button onClick={() => prepareProductForEditing(product)} style={{ marginRight: '5px', padding: '5px 10px' }}>Edit</button>
                                                    <button onClick={() => deleteProduct(product._id)} style={{ padding: '5px 10px' }}>Delete</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls for Products */}
                        {/* flexShrink: 0 prevents the pagination from shrinking */}
                        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexShrink: 0, flexWrap: 'wrap' }}> {/* Add flexWrap */}
                             <button
                                disabled={productsPage === 0}
                                onClick={() => setProductsPage(productsPage - 1)}
                                 style={{ padding: '8px 12px', cursor: productsPage === 0 ? 'not-allowed' : 'pointer' }}
                            >
                                Previous
                            </button>
                            <span style={{ margin: '0 10px' }}>
                               Page {productsPage + 1} of {totalPagesProducts || 1}
                            </span>
                            <button
                                disabled={productsPage >= totalPagesProducts - 1 || totalPagesProducts <= 1}
                                onClick={() => setProductsPage(productsPage + 1)}
                                style={{ padding: '8px 12px', cursor: (productsPage >= totalPagesProducts - 1 || totalPagesProducts <= 1) ? 'not-allowed' : 'pointer' }}
                            >
                                Next
                            </button>
                        </div>

                        {/* Form to add/update product */}
                         {/* flexShrink: 0 prevents the form from shrinking */}
                         <div style={{ marginTop: '25px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9', flexShrink: 0 }}>
                            <h3>{editingProductIndex !== null ? 'Edit Product' : 'Add New Product'}</h3>
                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                     style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Description"
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                     style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
                                />
                                <input
                                    type="number"
                                    placeholder="Price"
                                    value={newProduct.price}
                                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                     style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Specifications (comma-separated)"
                                    value={Array.isArray(newProduct.specifications) ? newProduct.specifications.join(', ') : newProduct.specifications}
                                    onChange={(e) => setNewProduct({ ...newProduct, specifications: e.target.value.split(',').map(spec => spec.trim()).filter(spec => spec) })}
                                     style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ marginTop: '15px' }}>
                                <button onClick={addOrUpdateProduct} style={{ padding: '10px 15px', marginRight: '10px' }}>
                                    {editingProductIndex !== null ? 'Update Product' : 'Add Product'}
                                </button>
                                {editingProductIndex !== null && <button onClick={resetProductForm} style={{ padding: '10px 15px' }}>Cancel</button>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Other Dashboard Features - Below Sales and Products Tables */}
                <div style={{ marginTop: '30px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <button onClick={generateIncomeStatement} style={{ padding: '10px 15px' }}>Generate Income Statement</button>
                    <button onClick={exportToCSV} style={{ padding: '10px 15px' }}>Export Sales to CSV</button>
                    <button onClick={() => setManageQueries(!manageQueries)} style={{ padding: '10px 15px' }}>
                        {manageQueries ? 'Hide Queries Management' : 'Manage Customer Queries'}
                    </button>
                    <button onClick={() => setShowOnlineTransactions(!showOnlineTransactions)} style={{ padding: '10px 15px' }}>
                         {showOnlineTransactions ? 'Hide Online Transactions' : 'View Online Transactions'}
                    </button>
                </div>

                {/* Conditional Rendering for Automated Response Interface and Charts */}
                {manageQueries && (
                    <div style={{ marginTop: '30px' }}>
                         <h3>Customer Queries Management</h3>
                         <button onClick={refreshQueries} disabled={queriesLoading} style={{ marginBottom: '15px', padding: '10px 15px' }}>
                             {queriesLoading ? 'Refreshing...' : 'Refresh Queries'}
                         </button>

                         {/* Container for both charts, using flexbox for potential side-by-side layout on wider screens */}
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                             {/* Query Status Chart */}
                             <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', border: '1px solid #eee', padding: '15px', borderRadius: '8px', backgroundColor: '#fff' }}>
                                 <h4>Query Status Overview</h4>
                                 {queriesLoading ? (
                                     <p>Loading chart data...</p>
                                 ) : queries.length > 0 ? (
                                     <Bar data={getQueryStatusData()} options={queryChartOptions} />
                                 ) : (
                                     <p>No query status data available to display chart.</p>
                                 )}
                             </div>

                             {/* Queries Over Time Chart */}
                             <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', border: '1px solid #eee', padding: '15px', borderRadius: '8px', backgroundColor: '#fff' }}>
                                 <h4>Queries Submitted Over Time</h4>
                                  {queriesLoading ? (
                                     <p>Loading chart data...</p>
                                 ) : queries.length > 0 ? (
                                     <Line data={getQueriesOverTimeData()} options={queriesOverTimeChartOptions} />
                                 ) : (
                                     <p>No query date data available to display chart.</p>
                                 )}
                             </div>
                         </div>


                         {/* Automated Response Interface */}
                         {/* Pass queries and setQueries and handleDeleteQuery to AutomatedResponseInterface */}
                        <AutomatedResponseInterface
                            queries={queries}
                            setQueries={setQueries}
                            handleDeleteQuery={handleDeleteQuery} // Pass the delete function
                        />
                    </div>
                )}

                 {/* Conditional Rendering for Online Transactions */}
                {showOnlineTransactions && (
                    <div style={{ marginTop: '30px' }}>
                        <h3>Online Transactions</h3>
                         {/* Render the OnlineTransactions component */}
                        <OnlineTransactions />
                    </div>
                )}

                {/* Add more sections for reports, analytics, etc. here */}

            </div> {/* End of Main Content Container (Scrollable) */}

        </div> // End of Outermost container
    );
};

export default SalesDashboard;