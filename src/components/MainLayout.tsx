import React, { useState } from 'react';
import AddressBook from './Addressbook/AddressBook';
import InvoiceBook, { InvoiceIntent } from './Invoicebook/InvoiceBook';
import Dashboard from './Dashboard/Dashboard';
import { resetDemoData } from '../data';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'invoices'>('dashboard');
    const [intent, setIntent] = useState<InvoiceIntent | null>(null);
    const [dataVersion, setDataVersion] = useState(0);

    const goTab = (tab: 'dashboard' | 'customers' | 'invoices') => {
        setIntent(null);
        setActiveTab(tab);
    };

    const openInvoice = (intentValue: InvoiceIntent) => {
        setIntent(intentValue);
        setActiveTab('invoices');
    };

    const handleReset = () => {
        setIntent(null);
        resetDemoData();
        setDataVersion((v) => v + 1);
    };

    return (
        <div className="min-w-max min-h-screen bg-gradient-to-br from-gray-950 via-gray-600 to-gray-400 flex flex-col md:flex-row">
            {/* Sidebar with glassmorphism */}
            <div className="md:w-40 p-4 backdrop-blur-md bg-white/30 text-white shadow-lg flex flex-row md:flex-col justify-between md:justify-start">
                {/* Logo or Branding */}
                <div className="mb-6 text-center md:text-left">
                    <span className="text-xl font-bold">BMS</span>
                </div>
                {/* Navigation Tabs */}
                <div className="flex-grow md:flex md:flex-col md:justify-between">
                    <div>
                        {/* Dashboard Tab */}
                        <button
                            type="button"
                            className={`block w-full text-left p-4 hover:bg-white/20 ${activeTab === 'dashboard' ? 'bg-white/40' : 'bg-transparent'
                                } rounded-lg transition-colors mb-2`}
                            aria-current={activeTab === 'dashboard' ? 'page' : undefined}
                            onClick={() => goTab('dashboard')}
                        >
                            Dashboard
                        </button>
                        {/* Customers Tab */}
                        <button
                            type="button"
                            className={`block w-full text-left p-4 hover:bg-white/20 ${activeTab === 'customers' ? 'bg-white/40' : 'bg-transparent'
                                } rounded-lg transition-colors mb-2`}
                            aria-current={activeTab === 'customers' ? 'page' : undefined}
                            onClick={() => goTab('customers')}
                        >
                            Customers
                        </button>
                        {/* Invoices Tab */}
                        <button
                            type="button"
                            className={`block w-full text-left p-4 hover:bg-white/20 ${activeTab === 'invoices' ? 'bg-white/40' : 'bg-transparent'
                                } rounded-lg transition-colors`}
                            aria-current={activeTab === 'invoices' ? 'page' : undefined}
                            onClick={() => goTab('invoices')}
                        >
                            Invoices
                        </button>
                    </div>
                    {process.env.NEXT_PUBLIC_BMS_BACKEND !== 'pocketbase' && (
                        <button
                            type="button"
                            className="block w-full text-left p-4 text-sm bg-red-700/80 hover:bg-red-700 rounded-lg transition-colors mt-4"
                            onClick={handleReset}
                        >
                            Reset demo data
                        </button>
                    )}
                </div>
            </div>

            {/* Main content with glassmorphism */}
            <div className="flex-grow flex flex-col justify-center p-6">
                <div className="relative max-w-min max-h-min w-min mx-auto">
                    <div className="relative p-4 backdrop-blur-lg bg-white/30 shadow-xl rounded-3xl overflow-hidden">
                        {/* Conditional rendering based on the active tab */}
                        {activeTab === 'dashboard' && (
                            <Dashboard key={dataVersion} onOpenInvoice={(id) => openInvoice({ kind: 'view', id })} />
                        )}
                        {activeTab === 'customers' && (
                            <AddressBook
                                key={dataVersion}
                                onOpenInvoice={(id) => openInvoice({ kind: 'view', id })}
                                onNewInvoice={(customerUUID) => openInvoice({ kind: 'new', customerUUID })}
                            />
                        )}
                        {activeTab === 'invoices' && <InvoiceBook key={`${dataVersion}-${intent ? JSON.stringify(intent) : ''}`} intent={intent} />}
                    </div>
                </div>
            </div>
        </div>


    );
};

export default MainLayout;
