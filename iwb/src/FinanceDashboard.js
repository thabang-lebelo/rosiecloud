import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { AlertCircle, Check, Download, Edit, Trash2 } from 'lucide-react';

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

  const chartData = {
    labels: incomeData.map(entry => entry.month),
    datasets: [{
      label: 'Monthly Income (in M$)',
      data: incomeData.map(entry => entry.totalIncome),
      backgroundColor: 'rgba(34,197,94,0.7)',
      borderColor: 'rgba(34,197,94,1)',
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: {
        display: true,
        text: 'Monthly Income Analysis',
        color: '#111827',
        font: { size: 20, weight: 'bold' }
      },
      tooltip: {
        backgroundColor: '#facc15',
        titleColor: '#000',
        bodyColor: '#000'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Income (M$)', color: '#374151', font: { weight: 'bold' } },
        ticks: { color: '#4b5563' },
        grid: { color: '#e5e7eb' }
      },
      x: {
        title: { display: true, text: 'Month', color: '#374151', font: { weight: 'bold' } },
        ticks: { color: '#4b5563' },
        grid: { display: false }
      }
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
          customer: 'Income Record'
        })
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
        body: JSON.stringify({ date: `${month}-01`, Price: parseFloat(totalIncome) })
      });
      if (!res.ok) throw new Error();
      logActivity(`Updated record for ${month}`);
      resetForm();
      fetchIncomeData();
    } catch {
      setError('Failed to update record.');
    }
  };

  const handleSave = () => editingId ? updateIncomeRecord() : addIncomeRecord();

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
    setAlerts(prev => [{ message: msg, timestamp }, ...prev.slice(0, 9)]);
  };

  const exportToCSV = () => {
    const csv = "Month,Total Income\n" + incomeData.map(i => `${i.month},${i.totalIncome.toFixed(2)}`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'income_records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <div className="text-center text-gray-500 py-10">Loading finance data...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 bg-gradient-to-r from-green-50 via-white to-green-100 shadow-xl rounded-2xl">
      <h1 className="text-3xl font-extrabold text-green-900 mb-6 text-center">Finance Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center mb-4">
          <AlertCircle className="mr-2" /> <span>{error}</span>
          <button className="ml-auto text-red-600 font-bold" onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      <div className="mb-6">
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold text-green-800">Total Annual Income: <span className="text-green-600">M${totalAnnualIncome.toFixed(2)}</span></div>
        <button onClick={exportToCSV} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <input type="month" className="border p-2 rounded-md" value={newRecord.month} onChange={(e) => setNewRecord({ ...newRecord, month: e.target.value })} />
        <input type="number" placeholder="Total Income" className="border p-2 rounded-md" value={newRecord.totalIncome} onChange={(e) => setNewRecord({ ...newRecord, totalIncome: e.target.value })} />
        <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow">{editingId ? 'Update' : 'Add'} Record</button>
      </div>

      <table className="min-w-full bg-white border rounded shadow-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left font-semibold">Month</th>
            <th className="p-3 text-left font-semibold">Total Income</th>
            <th className="p-3 text-left font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {incomeData.map(({ month, totalIncome, _id }) => (
            <tr key={_id} className="border-t hover:bg-green-50">
              <td className="p-3">{month}</td>
              <td className="p-3">M${totalIncome.toFixed(2)}</td>
              <td className="p-3 flex gap-2">
                <button onClick={() => setNewRecord({ month, totalIncome }) || setEditingId(_id)} className="text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                <button onClick={() => deleteRecord(_id, month)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6">
        <h3 className="text-lg font-bold text-gray-700 mb-2">Recent Activity</h3>
        <ul className="list-disc ml-6 text-gray-600 space-y-1">
          {alerts.map((a, idx) => (
            <li key={idx}><Check className="inline w-4 h-4 text-green-500 mr-1" /> {a.message} <span className="text-sm text-gray-400">({a.timestamp})</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FinanceDashboard;