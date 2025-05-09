import React, { useState, useEffect } from 'react';
import { 
  Users, FileText, Save, FileSearch, BarChart3, Shield, 
  Activity, ChevronDown, LogOut, Bell, Settings, Search, 
  Moon, Sun, Menu, X
} from 'lucide-react';

// Import your component files
import UserManagement from './UserManagement';
import FileManagement from './FileManagement';
import BackupManagement from './BackupManagement';

// Placeholder components for new admin roles with improved UI
const LogViewer = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">System Logs</h2>
      <div className="flex gap-2">
        <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md text-sm font-medium">Export</button>
        <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md text-sm font-medium">Filter</button>
      </div>
    </div>
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
      <div className="flex justify-between items-center py-2 border-b border-gray-200">
        <span className="font-medium text-gray-900">SYSTEM</span>
        <span className="text-gray-500">Today, 14:23:05</span>
      </div>
      <p className="py-2 text-gray-600">Database backup completed successfully</p>
      
      <div className="flex justify-between items-center py-2 border-b border-gray-200">
        <span className="font-medium text-gray-900">WARNING</span>
        <span className="text-gray-500">Today, 13:11:47</span>
      </div>
      <p className="py-2 text-gray-600">High CPU usage detected (87%)</p>
      
      <div className="flex justify-between items-center py-2 border-b border-gray-200">
        <span className="font-medium text-gray-900">SECURITY</span>
        <span className="text-gray-500">Today, 11:30:22</span>
      </div>
      <p className="py-2 text-gray-600">Failed login attempt from IP 192.168.1.55</p>
      
      <div className="flex justify-between items-center py-2 border-b border-gray-200">
        <span className="font-medium text-gray-900">INFO</span>
        <span className="text-gray-500">Today, 09:15:33</span>
      </div>
      <p className="py-2 text-gray-600">System update scheduled for 22:00</p>
    </div>
  </div>
);

const FinancialReports = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">Financial Reports</h2>
      <div className="flex gap-2">
        <select className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm">
          <option>Q2 2025</option>
          <option>Q1 2025</option>
          <option>Q4 2024</option>
        </select>
        <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md text-sm font-medium">Export PDF</button>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
        <div className="text-2xl font-bold">$1,834,500</div>
        <div className="text-xs text-green-600 mt-1">↑ 12.3% from last quarter</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-sm text-gray-500 mb-1">Operating Expenses</div>
        <div className="text-2xl font-bold">$945,210</div>
        <div className="text-xs text-red-600 mt-1">↑ 5.7% from last quarter</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-sm text-gray-500 mb-1">Net Profit</div>
        <div className="text-2xl font-bold">$889,290</div>
        <div className="text-xs text-green-600 mt-1">↑ 20.5% from last quarter</div>
      </div>
    </div>
    
    <div className="bg-white p-4 rounded-lg border border-gray-200 mt-4">
      <h3 className="font-medium mb-3">Revenue Breakdown</h3>
      <div className="h-64 bg-gray-50 flex items-center justify-center text-gray-400">
        Chart visualization placeholder
      </div>
    </div>
  </div>
);

const AccessControl = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">Access Control</h2>
      <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium">Create Role</button>
    </div>
    
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Administrator</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">All permissions</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <button className="text-blue-600 hover:text-blue-800">Edit</button>
            </td>
          </tr>
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Manager</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">7</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">View, Edit, Limited Delete</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <button className="text-blue-600 hover:text-blue-800">Edit</button>
            </td>
          </tr>
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Editor</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">View, Edit</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <button className="text-blue-600 hover:text-blue-800">Edit</button>
            </td>
          </tr>
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Viewer</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">25</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">View only</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <button className="text-blue-600 hover:text-blue-800">Edit</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const SystemDiagnostics = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">System Diagnostics</h2>
      <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md text-sm font-medium">Run Full Scan</button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-medium mb-3 flex items-center">
          <Activity className="w-4 h-4 mr-1" />
          System Health
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">CPU Usage</span>
              <span className="text-sm text-gray-500">32%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '32%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Memory Usage</span>
              <span className="text-sm text-gray-500">64%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '64%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Disk Space</span>
              <span className="text-sm text-gray-500">47%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '47%' }}></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-medium mb-3">Environment Info</h3>
        <div className="text-sm">
          <div className="grid grid-cols-3 py-2 border-b border-gray-100">
            <span className="text-gray-500">OS:</span>
            <span className="col-span-2">Linux Ubuntu 24.04 LTS</span>
          </div>
          <div className="grid grid-cols-3 py-2 border-b border-gray-100">
            <span className="text-gray-500">Server:</span>
            <span className="col-span-2">Apache 2.4.56</span>
          </div>
          <div className="grid grid-cols-3 py-2 border-b border-gray-100">
            <span className="text-gray-500">Database:</span>
            <span className="col-span-2">PostgreSQL 15.3</span>
          </div>
          <div className="grid grid-cols-3 py-2 border-b border-gray-100">
            <span className="text-gray-500">PHP Version:</span>
            <span className="col-span-2">8.2.7</span>
          </div>
          <div className="grid grid-cols-3 py-2">
            <span className="text-gray-500">Last Updated:</span>
            <span className="col-span-2">May 3, 2025 (6 days ago)</span>
          </div>
        </div>
      </div>
    </div>
    
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="font-medium mb-3">Active Processes</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memory</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">2458</td>
              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">postgresql</td>
              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">4.2%</td>
              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">512MB</td>
              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Running</span>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">1854</td>
              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">apache2</td>
              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">2.8%</td>
              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">256MB</td>
              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Running</span>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">3012</td>
              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">node</td>
              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">6.5%</td>
              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">384MB</td>
              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Running</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const AdminDashboard = ({ currentUser, handleLogout }) => {
  // State for dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // State for sidebar collapse on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Get active tab from localStorage or default to userManagement
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'userManagement';
  });

  // Notifications counter (simulated)
  const [notificationCount] = useState(3);
  
  // Save active tab to localStorage when changed
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);
  
  // Toggle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Access denied screen if not admin
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-6">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You do not have permission to access this dashboard. Please contact your system administrator for assistance.
          </p>
          <button 
            onClick={handleLogout}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Map tabs to their icons and components
  const tabConfig = {
    userManagement: { icon: <Users size={18} />, label: "User Management", component: <UserManagement /> },
    fileManagement: { icon: <FileText size={18} />, label: "File Management", component: <FileManagement /> },
    backupManagement: { icon: <Save size={18} />, label: "Backup Management", component: <BackupManagement /> },
    logViewer: { icon: <FileSearch size={18} />, label: "System Logs", component: <LogViewer /> },
    financialReports: { icon: <BarChart3 size={18} />, label: "Financial Reports", component: <FinancialReports /> },
    accessControl: { icon: <Shield size={18} />, label: "Access Control", component: <AccessControl /> },
    systemDiagnostics: { icon: <Activity size={18} />, label: "Diagnostics", component: <SystemDiagnostics /> },
  };

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 z-20 p-4">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md bg-white shadow-md dark:bg-gray-800"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      {/* Sidebar */}
      <div 
        className={`fixed lg:static inset-y-0 left-0 z-10 w-64 transform transition-transform duration-300 ease-in-out 
                   ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                   lg:translate-x-0 bg-white dark:bg-gray-800 shadow-lg`}
      >
        <div className="flex flex-col h-full">
          {/* Logo area */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Enterprise Admin</h1>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {Object.entries(tabConfig).map(([key, config]) => (
                <li key={key}>
                  <button
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center w-full px-3 py-2 rounded-md transition-colors ${
                      activeTab === key 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="mr-3">{config.icon}</span>
                    <span>{config.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User profile section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium">
                {currentUser?.name?.substring(0, 1) || "A"}
              </div>
              <div className="ml-3 truncate">
                <p className="text-sm font-medium dark:text-white">{currentUser?.name || "Admin User"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">System Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white dark:bg-gray-800 shadow z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-lg font-medium dark:text-white">
                {tabConfig[activeTab]?.label}
              </h2>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Search bar */}
              <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 rounded-md px-3 py-1.5">
                <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-transparent border-none text-sm focus:outline-none ml-2 w-40 dark:text-white"
                />
              </div>
              
              {/* Dark mode toggle */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isDarkMode ? 
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : 
                  <Moon className="w-5 h-5 text-gray-600" />
                }
              </button>
              
              {/* Notifications */}
              <div className="relative">
                <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </button>
              </div>
              
              {/* Settings */}
              <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              
              {/* Logout button */}
              <button 
                onClick={handleLogout}
                className="hidden md:flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            {/* Render active tab component */}
            {tabConfig[activeTab]?.component}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;