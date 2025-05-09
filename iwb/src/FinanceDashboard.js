import React, { useEffect, useState, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { AlertCircle, Check, Download, Edit, Trash2, DollarSign, Calendar, Activity, 
  ChevronDown, ChevronUp, Info, ChevronLeft, ChevronRight, Maximize, Minimize, ArrowLeft, 
  ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_URL = 'http://localhost:5000/api';

const FinanceDashboard = ({ currentUser }) => {
  const [incomeData, setIncomeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newRecord, setNewRecord] = useState({ month: '', totalIncome: '' });
  const [editingId, setEditingId] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [totalAnnualIncome, setTotalAnnualIncome] = useState(0);
  const [showActivityLog, setShowActivityLog] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  // Fullscreen and scrolling
  const [isFullScreen, setIsFullScreen] = useState(false);
  const dashboardRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPosition, setStartDragPosition] = useState({ x: 0, y: 0 });

  const authorizedUsers = ['finance_user1', 'finance_user2', 'finance_user3', 'admin'];
  const hasPermission = authorizedUsers.includes(currentUser);

  const fetchIncomeData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/sales`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      const monthlyData = processMonthlyData(data);
      setIncomeData(monthlyData);
      const total = monthlyData.reduce((sum, item) => sum + item.totalIncome, 0);
      setTotalAnnualIncome(total);
      setTotalPages(Math.ceil(monthlyData.length / itemsPerPage));
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching income data:', err);
      setError('Failed to load income data. Please try again later.');
      setIsLoading(false);
    }
  };

  const processMonthlyData = (salesData) => {
    const monthMap = {};
    salesData.forEach(sale => {
      const dateParts = sale.date.split('-');
      const month = `${dateParts[0]}-${dateParts[1]}`;
      monthMap[month] = (monthMap[month] || 0) + sale.Price;
    });
    return Object.entries(monthMap).map(([month, totalIncome]) => ({
      month,
      totalIncome,
      _id: salesData.find(sale => sale.date.startsWith(month))?._id
    })).sort((a, b) => a.month.localeCompare(b.month));
  };

  useEffect(() => { fetchIncomeData(); }, []);

  // Update totalPages when itemsPerPage changes
  useEffect(() => {
    setTotalPages(Math.ceil(incomeData.length / itemsPerPage));
    if (currentPage > Math.ceil(incomeData.length / itemsPerPage) && incomeData.length > 0) {
      setCurrentPage(1);
    }
  }, [itemsPerPage, incomeData.length]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Keyboard navigation for scrolling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isFullScreen || !dashboardRef.current) return;
      const scrollAmount = 100;
      switch (e.key) {
        case 'ArrowUp':
          dashboardRef.current.scrollBy(0, -scrollAmount);
          break;
        case 'ArrowDown':
          dashboardRef.current.scrollBy(0, scrollAmount);
          break;
        case 'ArrowLeft':
          dashboardRef.current.scrollBy(-scrollAmount, 0);
          break;
        case 'ArrowRight':
          dashboardRef.current.scrollBy(scrollAmount, 0);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  const toggleFullScreen = async () => {
    if (!isFullScreen) {
      try {
        await dashboardRef.current.requestFullscreen();
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error('Error attempting to exit fullscreen:', err);
      }
    }
  };

  // Drag scroll
  const handleMouseDown = (e) => {
    if (isFullScreen) {
      setIsDragging(true);
      setStartDragPosition({ x: e.clientX, y: e.clientY });
    }
  };
  const handleMouseMove = (e) => {
    if (isDragging && isFullScreen && dashboardRef.current) {
      const dx = startDragPosition.x - e.clientX;
      const dy = startDragPosition.y - e.clientY;
      dashboardRef.current.scrollBy(dx, dy);
      setStartDragPosition({ x: e.clientX, y: e.clientY });
    }
  };
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScroll = () => {
    if (dashboardRef.current) {
      setScrollPosition({ x: dashboardRef.current.scrollLeft, y: dashboardRef.current.scrollTop });
    }
  };

  // Restore scroll after fullscreen toggle
  useEffect(() => {
    if (dashboardRef.current) {
      dashboardRef.current.scrollTo(scrollPosition.x, scrollPosition.y);
    }
  }, [isFullScreen]);

  const chartData = {
    labels: incomeData.map((entry) => entry.month),
    datasets: [{
      label: 'Monthly Income (in M$)',
      data: incomeData.map((entry) => entry.totalIncome),
      backgroundColor: 'rgba(79, 70, 229, 0.7)',
      borderColor: 'rgba(79, 70, 229, 1)',
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      title: {
        display: true,
        text: 'Monthly Income Analysis',
        color: '#1e293b',
        font: { size: 20, weight: 'bold' },
      },
      tooltip: {
        backgroundColor: '#475569',
        titleColor: '#fff',
        bodyColor: '#fff',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Income (M)', color: '#64748b', font: { weight: 'bold' } },
        ticks: { color: '#64748b' },
        grid: { color: '#e2e8f0' },
      },
      x: {
        title: { display: true, text: 'Month', color: '#64748b', font: { weight: 'bold' } },
        ticks: { color: '#64748b' },
        grid: { display: false },
      },
    },
  };

  const addIncomeRecord = async () => {
    const { month, totalIncome } = newRecord;
    if (!month || isNaN(parseFloat(totalIncome))) return setError('Enter valid data.');
    try {
      const res = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: `${month}-01`,
          items: ['Monthly Income'],
          Price: parseFloat(totalIncome),
          customer: 'Income Record',
        }),
      });
      if (!res.ok) throw new Error();
      logActivity(`Added record for ${month}`);
      resetForm();
      fetchIncomeData();
    } catch {
      setError('Failed to add record.');
    }
  };

  const updateIncomeRecord = async () => {
    const { month, totalIncome } = newRecord;
    if (!month || isNaN(parseFloat(totalIncome))) return setError('Enter valid data.');
    try {
      const res = await fetch(`${API_URL}/sales/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: `${month}-01`, Price: parseFloat(totalIncome) }),
      });
      if (!res.ok) throw new Error();
      logActivity(`Updated record for ${month}`);
      resetForm();
      fetchIncomeData();
    } catch {
      setError('Failed to update record.');
    }
  };

  const handleSave = () => (editingId ? updateIncomeRecord() : addIncomeRecord());

  const deleteRecord = async (id, month) => {
    if (!hasPermission) return setError('No permission.');
    try {
      const res = await fetch(`${API_URL}/sales/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      logActivity(`Deleted record for ${month}`);
      fetchIncomeData();
    } catch {
      setError('Failed to delete record.');
    }
  };

  const resetForm = () => {
    setNewRecord({ month: '', totalIncome: '' });
    setEditingId(null);
    setError(null);
  };

  const logActivity = (msg) => {
    const timestamp = new Date().toLocaleString();
    setAlerts((prev) => [{ message: msg, timestamp }, ...prev.slice(0, 9)]);
  };

  const exportToCSV = () => {
    const csv =
      'Month,Total Income\n' +
      incomeData.map((i) => `${i.month},${i.totalIncome.toFixed(2)}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'income_records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination controls
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

  // Current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentIncomeData = incomeData.slice(indexOfFirstItem, indexOfLastItem);

  if (isLoading)
    return (
      <div className='flex items-center justify-center h-screen bg-slate-50'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-t-indigo-600 border-b-indigo-300 border-l-indigo-300 border-r-indigo-300 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-600 font-medium'>Loading finance data...</p>
        </div>
      </div>
    );

  return (
    <div
      ref={dashboardRef}
      style={{
        width: isFullScreen ? '100vw' : 'auto',
        height: isFullScreen ? '100vh' : 'auto',
        overflowX: 'auto',
        overflowY: 'auto',
        cursor: isDragging ? 'grabbing' : isFullScreen ? 'grab' : 'default',
      }}
      className={`${isFullScreen ? 'bg-slate-900' : 'bg-slate-50'} p-6`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onScroll={handleScroll}
    >
      {/* Main JSX content */}
      {/* HEADER */}
      <div className={`${isFullScreen ? 'max-w-none' : 'max-w-7xl mx-auto'}`}>
        {/* HEADER */}
        <header className='bg-white rounded-2xl shadow-md p-6 mb-6'>
          {/* Header content (buttons, title, income display) */}
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h1 className='text-3xl font-bold text-slate-800'>Finance Dashboard</h1>
              <p className='text-slate-500'>Track and manage your financial performance</p>
            </div>
            <div className='flex gap-4'>
              <button
                onClick={toggleFullScreen}
                className='flex items-center bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-3 rounded-xl transition-all'
                title={isFullScreen ? 'Exit Fullscreen' : 'View Fullscreen'}
              >
                {isFullScreen ? (
                  <>
                    <Minimize className='w-5 h-5 mr-2' /> Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize className='w-5 h-5 mr-2' /> Fullscreen
                  </>
                )}
              </button>
              <div className='flex items-center bg-indigo-50 p-3 rounded-xl'>
                <DollarSign className='text-indigo-600 w-6 h-6 mr-2' />
                <div>
                  <p className='text-xs text-slate-500 font-medium'>Annual Income</p>
                  <p className='text-lg font-bold text-indigo-600'>M{totalAnnualIncome.toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={exportToCSV}
                className='flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl shadow transition-all'
              >
                <Download className='w-5 h-5 mr-2' /> Export Data
              </button>
            </div>
          </div>
          {/* Scroll controls in fullscreen */}
          {isFullScreen && (
            <div className='flex items-center justify-center gap-2 mt-4'>
              <div className='bg-slate-100 p-2 rounded-xl flex gap-1'>
                <button
                  onClick={() => dashboardRef.current?.scrollBy(-100, 0)}
                  className='p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors'
                >
                  <ArrowLeft className='w-5 h-5' />
                </button>
                <button
                  onClick={() => dashboardRef.current?.scrollBy(0, -100)}
                  className='p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors'
                >
                  <ArrowUp className='w-5 h-5' />
                </button>
                <button
                  onClick={() => dashboardRef.current?.scrollBy(0, 100)}
                  className='p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors'
                >
                  <ArrowDown className='w-5 h-5' />
                </button>
                <button
                  onClick={() => dashboardRef.current?.scrollBy(100, 0)}
                  className='p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors'
                >
                  <ArrowRight className='w-5 h-5' />
                </button>
              </div>
              <p className='text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-xl'>
                Use arrow keys or drag to scroll. Click and drag for panning.
              </p>
            </div>
          )}
        </header>

        {/* Main grid */}
        <div className={`grid grid-cols-1 ${isFullScreen ? 'lg:grid-cols-1 xl:grid-cols-3 gap-8' : 'lg:grid-cols-3 gap-6'}`}>
          {/* Income Trends Chart */}
          <div className={`${isFullScreen ? 'xl:col-span-2' : 'lg:col-span-2'} bg-white p-6 rounded-2xl shadow-md`}>
            <h2 className='text-xl font-semibold text-slate-800 mb-4'>Income Trends</h2>
            <div className={`${isFullScreen ? 'h-96' : 'h-80'}`}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Add/Update Record Form */}
          <div className='bg-white p-6 rounded-2xl shadow-md'>
            <h2 className='text-xl font-semibold text-slate-800 mb-4'>
              {editingId ? 'Update Record' : 'Add New Record'}
            </h2>
            {error && (
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center mb-4'>
                <AlertCircle className='mr-2 w-5 h-5' /> <span>{error}</span>
                <button className='ml-auto text-red-600 font-bold' onClick={() => setError(null)}>
                  ×
                </button>
              </div>
            )}
            <div className='space-y-4'>
              {/* Month input */}
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Month</label>
                <div className='relative'>
                  <Calendar className='absolute left-3 top-3 text-slate-400 w-5 h-5' />
                  <input
                    type='month'
                    className='w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    value={newRecord.month}
                    onChange={(e) => setNewRecord({ ...newRecord, month: e.target.value })}
                  />
                </div>
              </div>
              {/* Total Income input */}
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Total Income</label>
                <div className='relative'>
                  <DollarSign className='absolute left-3 top-3 text-slate-400 w-5 h-5' />
                  <input
                    type='number'
                    placeholder='Amount'
                    className='w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    value={newRecord.totalIncome}
                    onChange={(e) => setNewRecord({ ...newRecord, totalIncome: e.target.value })}
                  />
                </div>
              </div>
              {/* Action buttons */}
              <div className='flex gap-2'>
                <button
                  onClick={handleSave}
                  className='w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl shadow transition-all'
                >
                  {editingId ? 'Update Record' : 'Add Record'}
                </button>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className='bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-4 rounded-xl transition-all'
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Income Records Table with Pagination */}
        <div className='mt-6 bg-white p-6 rounded-2xl shadow-md' style={{ overflowX: 'auto' }}>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold text-slate-800'>Income Records</h2>
            <div className='flex items-center space-x-2'>
              <label htmlFor='itemsPerPage' className='text-sm text-slate-600'>
                Show:
              </label>
              <select
                id='itemsPerPage'
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className='border border-slate-300 rounded-lg text-sm p-1'
              >
                <option value='5'>5</option>
                <option value='10'>10</option>
                <option value='20'>20</option>
                <option value='50'>50</option>
              </select>
            </div>
          </div>
          {/* Table */}
          <div className='overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100'>
            <table className={`${isFullScreen ? 'min-w-full w-full table-fixed' : 'min-w-full'}`}>
              <thead className='sticky top-0 bg-white z-10'>
                <tr className='bg-slate-50 text-left'>
                  <th className='px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider'>Month</th>
                  <th className='px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider'>Total Income</th>
                  <th className='px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-200'>
                {currentIncomeData.map(({ month, totalIncome, _id }) => (
                  <tr key={_id} className='hover:bg-slate-50 transition-colors'>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700'>{month}</td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-700'>
                      <span className='font-semibold text-indigo-600'>M{totalIncome.toFixed(2)}</span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-700 flex gap-2'>
                      <button
                        onClick={() => {
                          setNewRecord({ month, totalIncome });
                          setEditingId(_id);
                        }}
                        className='p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors'
                        title='Edit'
                      >
                        <Edit className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => deleteRecord(_id, month)}
                        className='p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors'
                        title='Delete'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination controls */}
          <div className='flex justify-between items-center mt-4 text-sm'>
            <div className='text-slate-500'>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, incomeData.length)} of {incomeData.length} entries
            </div>
            <div className='flex items-center space-x-2'>
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${currentPage === 1 ? 'text-slate-400 bg-slate-100' : 'text-slate-700 bg-slate-200 hover:bg-slate-300'}`}
              >
                <ChevronLeft className='w-4 h-4' />
              </button>
              <div className='bg-slate-100 px-3 py-1 rounded-lg font-medium'>
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-slate-400 bg-slate-100' : 'text-slate-700 bg-slate-200 hover:bg-slate-300'}`}
              >
                <ChevronRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className='mt-6 bg-white p-6 rounded-2xl shadow-md'>
          <button
            onClick={() => setShowActivityLog(!showActivityLog)}
            className='w-full flex items-center justify-between text-left'
          >
            <div className='flex items-center'>
              <Activity className='w-5 h-5 text-indigo-600 mr-2' />
              <h2 className='text-xl font-semibold text-slate-800'>Recent Activity</h2>
            </div>
            {showActivityLog ? (
              <ChevronUp className='w-5 h-5 text-slate-500' />
            ) : (
              <ChevronDown className='w-5 h-5 text-slate-500' />
            )}
          </button>
          {showActivityLog && (
            <div className='mt-4 pl-2 max-h-60 overflow-y-auto'>
              {alerts.length > 0 ? (
                <ul className='space-y-2'>
                  {alerts.map((a, idx) => (
                    <li key={idx} className='flex items-start p-2 rounded-lg hover:bg-slate-50'>
                      <div className='p-1 bg-indigo-100 rounded-full mr-3'>
                        <Check className='w-4 h-4 text-indigo-600' />
                      </div>
                      <div>
                        <span className='text-slate-700'>{a.message}</span>
                        <span className='block text-xs text-slate-400'>{a.timestamp}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className='flex items-center text-slate-500 py-4'>
                  <Info className='w-5 h-5 mr-2' />
                  <p>No recent activity to display</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;