import React, { useState } from 'react';
import AddressBook from './Addressbook/AddressBook';
import InvoiceBook from './Invoicebook/InvoiceBook';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('customers');

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar with improved contrast */}
      <div className="w-64 p-6 bg-gray-800 text-white shadow-lg">
        {/* Customers Tab */}
        <button
          className={`w-full text-left p-4 hover:bg-gray-700 ${
            activeTab === 'customers' ? 'bg-gray-600' : 'bg-gray-800'
          }`}
          onClick={() => setActiveTab('customers')}
        >
          Customers
        </button>
        {/* Invoices Tab */}
        <button
          className={`w-full text-left p-4 hover:bg-gray-700 ${
            activeTab === 'invoices' ? 'bg-gray-600' : 'bg-gray-800'
          }`}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices
        </button>
      </div>

      {/* Main content */}
      <div className="flex-grow flex flex-col justify-center sm:py-12">
        <div className="relative py-3 w-full sm:max-w-4xl mx-auto">
          <div className="relative px-4 py-10 bg-white shadow rounded-3xl sm:p-10 overflow-auto">
            {/* Conditional rendering based on the active tab */}
            {activeTab === 'customers' ? (
              // Component for customers
              <AddressBook />
            ) : (
              // Component for invoices
              <InvoiceBook />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
