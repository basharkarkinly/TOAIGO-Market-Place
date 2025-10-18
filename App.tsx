
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Merchant, Booking, BookingStatus, User, Role, Service } from './types.ts';
import { api } from './services/mockApi.ts';
import { CalendarIcon, ClockIcon, UsersIcon, BackIcon, HomeIcon, ListIcon, LogoutIcon, CheckCircleIcon, XCircleIcon, ChartBarIcon, CogIcon, ShieldCheckIcon } from './components/Icons.tsx';

type Page = 'list' | 'detail' | 'booking' | 'confirmation' | 'my-bookings';

// --- Helper Functions ---
const getStatusColor = (status: BookingStatus) => {
  switch (status) {
    case BookingStatus.Confirmed: return 'bg-green-100 text-green-800';
    case BookingStatus.Pending: return 'bg-yellow-100 text-yellow-800';
    case BookingStatus.Rejected: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (date: Date | string) => new Date(date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);


// --- Loading Component ---
const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div></div>
);

// --- Notification System ---
interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}
const NotificationToast: React.FC<{ notification: Notification, onClose: () => void }> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses = "w-full max-w-sm p-4 rounded-lg text-white shadow-lg transition-transform transform duration-300";
  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-indigo-500',
  };
  
  const [visible, setVisible] = useState(false);
  useEffect(() => {
     const timeout = setTimeout(() => setVisible(true), 10); // slight delay to ensure transition triggers
     return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={`${baseClasses} ${typeClasses[notification.type]} ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
      {notification.message}
    </div>
  );
};


// --- Login Page Component ---
interface LoginPageProps {
    onLogin: (user: User) => void;
}
const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [users, setUsers] = useState<User[]>([]);
    useEffect(() => {
        api.getUsers().then(setUsers);
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
                <h1 className="text-3xl font-bold text-center text-indigo-600 mb-2">TOAIGO</h1>
                <p className="text-center text-gray-600 mb-8">Marketplace Reservation System</p>
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-700">Select a user to log in as:</h2>
                    {users.map(user => (
                        <button key={user.id} onClick={() => onLogin(user)} className="w-full text-left p-4 rounded-lg bg-gray-50 hover:bg-indigo-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <p className="font-bold text-gray-800">{user.name}</p>
                            <p className="text-sm text-indigo-700">{user.role}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- USER VIEW (Original App) ---
const UserView: React.FC<{ bookings: Booking[], setBookings: React.Dispatch<React.SetStateAction<Booking[]>>, merchants: Merchant[], addNotification: (message: string, type: Notification['type']) => void, onLogout: () => void }> = ({ bookings, setBookings, merchants, addNotification, onLogout }) => {
  const [page, setPage] = useState<Page>('list');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);

  const handleSelectMerchant = (id: string) => {
    setSelectedMerchantId(id);
    setPage('detail');
  };

  const handleBookingSubmit = async (details: Omit<Booking, 'id' | 'status' | 'createdAt' | 'merchant' | 'merchantId' | 'commission' | 'merchantPayout'>) => {
    const merchant = merchants.find(m => m.id === selectedMerchantId);
    if (!merchant) return;

    const newBooking = await api.createBooking({ ...details, merchant, merchantId: merchant.id });
    setBookings(prev => [newBooking, ...prev]);
    addNotification('Booking request sent successfully!', 'success');
    setPage('confirmation');
  };
  
  const selectedMerchant = merchants.find(m => m.id === selectedMerchantId);

  const renderContent = () => {
    switch (page) {
      case 'detail':
        return selectedMerchant && <MerchantDetailPage merchant={selectedMerchant} onBook={() => setPage('booking')} onBack={() => setPage('list')} />;
      case 'booking':
        return selectedMerchant && <BookingPage merchant={selectedMerchant} onSubmit={handleBookingSubmit} onBack={() => setPage('detail')} />;
      case 'confirmation':
        return <ConfirmationPage onViewBookings={() => setPage('my-bookings')} onGoHome={() => setPage('list')} />;
      case 'my-bookings':
        return <MyBookingsPage bookings={bookings} />;
      case 'list':
      default:
        return <MerchantListPage merchants={merchants} onSelectMerchant={handleSelectMerchant} />;
    }
  }

  return (
    <div>
        <header className="bg-white shadow-md sticky top-0 z-10">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <a href="#" onClick={(e) => { e.preventDefault(); setPage('list'); }} className="text-2xl font-bold text-indigo-600">TOAIGO</a>
                <div className="flex items-center gap-4">
                    <button onClick={() => setPage('list')} className={`flex items-center gap-2 p-2 rounded-md transition-colors ${page === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <HomeIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Home</span>
                    </button>
                    <button onClick={() => setPage('my-bookings')} className={`flex items-center gap-2 p-2 rounded-md transition-colors ${page === 'my-bookings' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <ListIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">My Bookings</span>
                        {bookings.filter(b => b.status === BookingStatus.Pending).length > 0 && 
                            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                            {bookings.filter(b => b.status === BookingStatus.Pending).length}
                            </span>}
                    </button>
                     <button onClick={onLogout} className="flex items-center gap-2 p-2 rounded-md text-gray-600 hover:bg-gray-100">
                        <LogoutIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </nav>
        </header>
        <main className="container mx-auto">
            {renderContent()}
        </main>
    </div>
  )
};

// --- MERCHANT DASHBOARD ---
const MerchantDashboard: React.FC<{ user: User, allBookings: Booking[], merchants: Merchant[], setMerchants: React.Dispatch<React.SetStateAction<Merchant[]>>, onBookingStatusChange: (bookingId: string, newStatus: BookingStatus) => void, addNotification: (message: string, type: Notification['type']) => void }> = ({ user, allBookings, merchants, setMerchants, onBookingStatusChange, addNotification }) => {
    const merchant = useMemo(() => merchants.find(m => m.id === user.merchantId), [merchants, user.merchantId]);
    const merchantBookings = useMemo(() => allBookings.filter(b => b.merchantId === user.merchantId).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()), [allBookings, user.merchantId]);
    
    const [activeTab, setActiveTab] = useState('bookings');
    
    const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
        onBookingStatusChange(bookingId, newStatus);
        addNotification(`Booking has been ${newStatus.toLowerCase()}.`, 'info');
    };

    if (!merchant) return <div className="p-8 text-center text-red-500">Error: Merchant data could not be found.</div>

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Merchant Dashboard</h1>
            <p className="text-gray-600 mb-6">Welcome, {user.name}. Here's what's happening at your business.</p>

            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('bookings')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'bookings' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Bookings
                    </button>
                     <button onClick={() => setActiveTab('services')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'services' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Services
                    </button>
                    <button onClick={() => setActiveTab('finances')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'finances' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Finances
                    </button>
                </nav>
            </div>

            {activeTab === 'bookings' && <BookingManagement merchantBookings={merchantBookings} onStatusChange={handleStatusChange} />}
            {activeTab === 'services' && <ServiceManagement merchant={merchant} setMerchants={setMerchants} addNotification={addNotification} />}
            {activeTab === 'finances' && <FinancialsDashboard merchantBookings={merchantBookings} />}
        </div>
    );
};


// --- ADMIN PANEL ---
const AdminPanel: React.FC<{ merchants: Merchant[], allBookings: Booking[] }> = ({ merchants, allBookings }) => {
    const [activeTab, setActiveTab] = useState('finances');
    const sortedBookings = useMemo(() => allBookings.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()), [allBookings]);

    return (
         <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">TOAIGO Admin Panel</h1>
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('finances')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'finances' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Finance Dashboard
                    </button>
                    <button onClick={() => setActiveTab('bookings')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'bookings' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Booking Monitoring
                    </button>
                     <button onClick={() => setActiveTab('merchants')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'merchants' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Merchant Management
                    </button>
                </nav>
            </div>
            {activeTab === 'finances' && <AdminFinanceDashboard allBookings={allBookings} />}
            {activeTab === 'bookings' && (
                <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Merchant</th>
                                <th scope="col" className="px-6 py-3">Date & Time</th>
                                <th scope="col" className="px-6 py-3">Service & Cost</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedBookings.map(b => (
                                <tr key={b.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{b.merchant.name}</td>
                                    <td className="px-6 py-4">{formatDate(b.date)} at {b.time}</td>
                                    <td className="px-6 py-4">{b.serviceName} ({formatCurrency(b.bookingCost)})</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(b.status)}`}>{b.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sortedBookings.length === 0 && <p className="p-6 text-gray-500">No bookings in the system yet.</p>}
                </div>
            )}
             {activeTab === 'merchants' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {merchants.map(merchant => (
                        <div key={merchant.id} className="bg-white p-5 rounded-lg shadow-md">
                             <img src={merchant.imageUrl} alt={merchant.name} className="w-full h-40 object-cover rounded-md mb-4" />
                            <h3 className="font-bold text-lg text-gray-800">{merchant.name}</h3>
                            <p className="text-sm text-indigo-600">{merchant.category}</p>
                            <div className="mt-4 flex gap-2">
                                <button className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded-md transition-colors">Edit</button>
                                <button className="text-sm bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-1 px-3 rounded-md transition-colors">Delete</button>
                            </div>
                        </div>
                    ))}
                 </div>
            )}
        </div>
    );
}


// --- Main App Component (Router) ---
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const [merchantData, bookingData] = await Promise.all([api.getMerchants(), api.getBookings()]);
      // Create shallow copies to prevent state mutation issues from mock API
      setMerchants([...merchantData]);
      setBookings([...bookingData]);
      setLoading(false);
    };
    loadInitialData();
  }, []);
  
  const addNotification = useCallback((message: string, type: Notification['type']) => {
    const newNotification = { id: Date.now(), message, type };
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => setCurrentUser(null);
  
  const handleBookingStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
      const updatedBooking = await api.updateBookingStatus(bookingId, newStatus);
      if (updatedBooking) {
          setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));
      }
  };

  if (loading) return <LoadingSpinner />;
  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  const renderRoleView = () => {
    switch (currentUser.role) {
      case Role.Merchant:
        return <MerchantDashboard user={currentUser} allBookings={bookings} onBookingStatusChange={handleBookingStatusChange} addNotification={addNotification} merchants={merchants} setMerchants={setMerchants} />;
      case Role.Admin:
        return <AdminPanel merchants={merchants} allBookings={bookings} />;
      case Role.User:
      default:
        return <UserView bookings={bookings} setBookings={setBookings} merchants={merchants} addNotification={addNotification} onLogout={handleLogout}/>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {currentUser.role !== Role.User && (
           <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <p className="text-xl font-bold text-indigo-600">TOAIGO <span className="font-light text-gray-500 text-lg">{currentUser.role}</span></p>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 hidden sm:inline">Logged in as <strong>{currentUser.name}</strong></span>
                        <button onClick={handleLogout} className="flex items-center gap-2 p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                            <LogoutIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>
      )}
      {renderRoleView()}
      <div className="fixed top-5 right-5 z-50 space-y-2 w-full max-w-sm">
        {notifications.map(n => <NotificationToast key={n.id} notification={n} onClose={() => removeNotification(n.id)} />)}
      </div>
    </div>
  );
};

export default App;


// --- Component Definitions (to keep them in scope) ---

const MerchantListPage: React.FC<{ merchants: Merchant[]; onSelectMerchant: (id: string) => void; }> = ({ merchants, onSelectMerchant }) => (
  <div className="p-4 sm:p-6 lg:p-8">
    <h1 className="text-3xl font-bold text-gray-800 mb-6">Discover Merchants</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {merchants.map(merchant => (
        <div key={merchant.id} className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer" onClick={() => onSelectMerchant(merchant.id)}>
          <img src={merchant.imageUrl} alt={merchant.name} className="w-full h-48 object-cover" />
          <div className="p-5">
            <h2 className="text-xl font-semibold text-gray-900">{merchant.name}</h2>
            <p className="text-sm text-indigo-600 font-medium mt-1">{merchant.category}</p>
            <p className="text-gray-600 mt-2 text-sm line-clamp-2">{merchant.description}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MerchantDetailPage: React.FC<{ merchant: Merchant; onBook: () => void; onBack: () => void; }> = ({ merchant, onBook, onBack }) => (
  <div className="p-4 sm:p-6 lg:p-8">
    <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800 transition-colors mb-6">
      <BackIcon className="w-5 h-5" /> Back to List
    </button>
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <img src={merchant.imageUrl} alt={merchant.name} className="w-full h-64 object-cover" />
      <div className="p-6 md:p-8">
        <h1 className="text-4xl font-extrabold text-gray-900">{merchant.name}</h1>
        <p className="text-lg text-indigo-700 font-medium mt-1">{merchant.category}</p>
        <p className="text-gray-700 mt-4 text-base leading-relaxed">{merchant.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Services & Pricing</h3>
            <ul className="space-y-3">{merchant.services.map(service => (<li key={service.id} className="flex justify-between items-center text-gray-600"><span>{service.name}</span><span className="font-medium text-gray-800">{formatCurrency(service.price)}</span></li>))}</ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Operating Hours</h3>
            <ul className="space-y-2">{Object.entries(merchant.operatingHours).map(([day, hours]) => (<li key={day} className="flex justify-between items-center text-gray-600"><span className="font-medium">{day}</span><span>{hours}</span></li>))}</ul>
          </div>
        </div>
        <div className="mt-10 text-center">
          <button onClick={onBook} className="bg-indigo-600 text-white font-bold py-3 px-10 rounded-full text-lg hover:bg-indigo-700 transition-transform transform hover:scale-105 duration-300 shadow-lg">Book Now</button>
        </div>
      </div>
    </div>
  </div>
);

const BookingPage: React.FC<{ merchant: Merchant; onSubmit: (details: Omit<Booking, 'id' | 'status' | 'createdAt' | 'merchant' | 'merchantId' | 'commission' | 'merchantPayout'>) => void; onBack: () => void; }> = ({ merchant, onSubmit, onBack }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('18:00');
    const [guests, setGuests] = useState(1);
    const [notes, setNotes] = useState('');
    const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({});

    const handleServiceChange = (serviceId: string) => {
        setSelectedServices(prev => ({
            ...prev,
            [serviceId]: !prev[serviceId]
        }));
    };

    const { totalCost, serviceList } = useMemo(() => {
        const list: Service[] = [];
        let cost = 0;
        for (const service of merchant.services) {
            if (selectedServices[service.id]) {
                list.push(service);
                cost += service.price;
            }
        }
        return { totalCost: cost, serviceList: list };
    }, [selectedServices, merchant.services]);


    const handleSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (serviceList.length === 0) {
            return alert("Please select at least one service.");
        }
        const serviceName = serviceList.map(s => s.name).join(', ');
        onSubmit({ date, time, guests, notes, serviceName, bookingCost: totalCost });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
             <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800 transition-colors mb-6"><BackIcon className="w-5 h-5" /> Back to Profile</button>
            <div className="bg-white p-8 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-bold text-gray-900">Book at {merchant.name}</h1>
                <p className="text-gray-600 mt-2 mb-8">Fill in the details for your reservation.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Services</label>
                        <div className="space-y-3 rounded-md border border-gray-200 p-4 bg-gray-50">
                            {merchant.services.map(service => (
                                <div key={service.id} className="flex items-center justify-between">
                                    <label htmlFor={`service-${service.id}`} className="flex items-center cursor-pointer flex-grow">
                                        <input
                                            type="checkbox"
                                            id={`service-${service.id}`}
                                            checked={!!selectedServices[service.id]}
                                            onChange={() => handleServiceChange(service.id)}
                                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="ml-3 text-sm text-gray-800">{service.name}</span>
                                    </label>
                                    <span className="text-sm font-medium text-gray-900">{formatCurrency(service.price)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <div className="relative"><CalendarIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/></div>
                        </div>
                         <div>
                            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <div className="relative"><ClockIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/></div>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">Number of People</label>
                        <div className="relative"><UsersIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="number" id="guests" value={guests} onChange={e => setGuests(parseInt(e.target.value, 10))} min="1" required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/></div>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Optional Notes</label>
                        <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Any special requests?"></textarea>
                    </div>
                     <div className="mt-6 p-4 bg-indigo-50 rounded-lg flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-700">Total Cost: </span>
                        <span className="text-2xl font-bold text-indigo-600">{formatCurrency(totalCost)}</span>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 transition duration-300 text-lg">Submit Booking Request</button>
                </form>
            </div>
        </div>
    );
};

const ConfirmationPage: React.FC<{ onViewBookings: () => void; onGoHome: () => void; }> = ({ onViewBookings, onGoHome }) => (
  <div className="p-8 text-center flex flex-col items-center justify-center h-[calc(100vh-100px)]">
    <div className="bg-white p-10 rounded-xl shadow-2xl max-w-lg">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100"><ClockIcon className="h-8 w-8 text-yellow-600" /></div>
      <h2 className="text-3xl font-bold text-gray-900 mt-6">Request Pending</h2>
      <p className="text-gray-600 mt-3 text-lg">Your booking request has been sent. You'll be notified of its status soon.</p>
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <button onClick={onViewBookings} className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-indigo-700 transition duration-300">View My Bookings</button>
        <button onClick={onGoHome} className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-md hover:bg-gray-300 transition duration-300">Back to Home</button>
      </div>
    </div>
  </div>
);

const MyBookingsPage: React.FC<{ bookings: Booking[]; }> = ({ bookings }) => (
    <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Bookings</h1>
        {bookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-md"><p className="text-gray-500 text-lg">You have no bookings yet.</p></div>
        ) : (
            <div className="space-y-6">
                {bookings.map(booking => (
                    <div key={booking.id} className="bg-white rounded-lg shadow-md p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <img src={booking.merchant.imageUrl} alt={booking.merchant.name} className="w-full sm:w-32 h-32 sm:h-24 rounded-md object-cover"/>
                        <div className="flex-grow">
                            <h2 className="text-xl font-semibold text-gray-900">{booking.merchant.name}</h2>
                            <p className="text-md text-gray-700">{booking.serviceName}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                                <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4" /> {formatDate(booking.date)}</span>
                                <span className="flex items-center gap-1.5"><ClockIcon className="w-4 h-4" /> {booking.time}</span>
                                <span className="flex items-center gap-1.5"><UsersIcon className="w-4 h-4" /> {booking.guests} people</span>
                            </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-800">{formatCurrency(booking.bookingCost)}</p>
                          <div className={`text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap mt-2 ${getStatusColor(booking.status)}`}>{booking.status}</div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

// --- Merchant Dashboard Components ---

const BookingManagement: React.FC<{merchantBookings: Booking[], onStatusChange: (bookingId: string, newStatus: BookingStatus) => void}> = ({merchantBookings, onStatusChange}) => (
    <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Pending Requests</h2>
        <div className="space-y-4">
            {merchantBookings.filter(b => b.status === BookingStatus.Pending).map(booking => (
                <div key={booking.id} className="bg-white rounded-lg shadow-md p-5 flex flex-wrap items-center gap-4">
                   <div className="flex-grow">
                        <p className="font-semibold text-gray-800">{booking.serviceName} on {formatDate(booking.date)} at {booking.time} for {booking.guests}</p>
                        <p className="text-sm text-gray-500">Notes: {booking.notes || 'None'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onStatusChange(booking.id, BookingStatus.Confirmed)} className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"><CheckCircleIcon className="w-6 h-6"/></button>
                        <button onClick={() => onStatusChange(booking.id, BookingStatus.Rejected)} className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"><XCircleIcon className="w-6 h-6"/></button>
                    </div>
                </div>
            ))}
             {merchantBookings.filter(b => b.status === BookingStatus.Pending).length === 0 && <p className="text-gray-500">No pending requests.</p>}
        </div>

        <h2 className="text-xl font-semibold text-gray-700 mt-8 mb-4">Booking History</h2>
         <div className="space-y-4">
            {merchantBookings.filter(b => b.status !== BookingStatus.Pending).map(booking => (
               <div key={booking.id} className="bg-white rounded-lg shadow-sm p-4 opacity-80">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-grow">
                            <p className="font-medium text-gray-700">{booking.serviceName} for {booking.guests} on {formatDate(booking.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(booking.bookingCost)}</p>
                          <div className={`text-xs font-bold px-3 py-1 rounded-full mt-1 ${getStatusColor(booking.status)}`}>{booking.status}</div>
                        </div>
                    </div>
               </div>
            ))}
        </div>
    </div>
);

const ServiceManagement: React.FC<{ merchant: Merchant, setMerchants: React.Dispatch<React.SetStateAction<Merchant[]>>, addNotification: (message: string, type: Notification['type']) => void }> = ({ merchant, setMerchants, addNotification }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');

    const handleAddService = async (e: React.FormEvent) => {
        e.preventDefault();
        const priceNum = parseFloat(price);
        if (!name.trim() || isNaN(priceNum) || priceNum < 0) {
            addNotification('Please provide a valid name and positive price.', 'error');
            return;
        }
        const newService: Service = { id: `s-${merchant.id}-${Date.now()}`, name, price: priceNum };
        const updatedServices = [...merchant.services, newService];
        const updatedMerchant = await api.updateMerchantServices(merchant.id, updatedServices);
        if (updatedMerchant) {
            setMerchants(prev => prev.map(m => m.id === merchant.id ? updatedMerchant : m));
            addNotification('Service added successfully!', 'success');
            setName('');
            setPrice('');
        }
    };
    
    const handleDeleteService = async (serviceId: string) => {
        const updatedServices = merchant.services.filter(s => s.id !== serviceId);
         const updatedMerchant = await api.updateMerchantServices(merchant.id, updatedServices);
        if (updatedMerchant) {
            setMerchants(prev => prev.map(m => m.id === merchant.id ? updatedMerchant : m));
            addNotification('Service removed.', 'info');
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Services</h2>
                <div className="bg-white rounded-lg shadow-md">
                    <ul className="divide-y divide-gray-200">
                        {merchant.services.map(service => (
                            <li key={service.id} className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{service.name}</p>
                                    <p className="text-gray-600">{formatCurrency(service.price)}</p>
                                </div>
                                <button onClick={() => handleDeleteService(service.id)} className="text-red-500 hover:text-red-700 font-semibold">Remove</button>
                            </li>
                        ))}
                         {merchant.services.length === 0 && <p className="p-4 text-gray-500">You haven't added any services yet.</p>}
                    </ul>
                </div>
            </div>
            <div>
                 <h2 className="text-xl font-semibold text-gray-700 mb-4">Add New Service</h2>
                 <form onSubmit={handleAddService} className="bg-white rounded-lg shadow-md p-6 space-y-4">
                     <div>
                         <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700">Service Name</label>
                         <input type="text" id="serviceName" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                     </div>
                      <div>
                         <label htmlFor="servicePrice" className="block text-sm font-medium text-gray-700">Price ($)</label>
                         <input type="number" id="servicePrice" value={price} onChange={e => setPrice(e.target.value)} step="0.01" min="0" placeholder="e.g., 49.99" className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                     </div>
                     <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-300">Add Service</button>
                 </form>
            </div>
        </div>
    );
};

const FinancialsDashboard: React.FC<{merchantBookings: Booking[]}> = ({merchantBookings}) => {
    const confirmedBookings = useMemo(() => merchantBookings.filter(b => b.status === BookingStatus.Confirmed), [merchantBookings]);

    const stats = useMemo(() => {
        return confirmedBookings.reduce((acc, booking) => {
            acc.totalRevenue += booking.bookingCost;
            acc.commission += booking.commission;
            acc.netPayout += booking.merchantPayout;
            return acc;
        }, { totalRevenue: 0, commission: 0, netPayout: 0 });
    }, [confirmedBookings]);

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-gray-500">Total Revenue</h3><p className="text-3xl font-bold text-indigo-600">{formatCurrency(stats.totalRevenue)}</p></div>
                <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-gray-500">TOAIGO Commission</h3><p className="text-3xl font-bold text-yellow-600">{formatCurrency(stats.commission)}</p></div>
                <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-gray-500">Net Payout</h3><p className="text-3xl font-bold text-green-600">{formatCurrency(stats.netPayout)}</p></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Transaction History (Confirmed Bookings)</h2>
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Service</th>
                            <th scope="col" className="px-6 py-3 text-right">Revenue</th>
                            <th scope="col" className="px-6 py-3 text-right">Commission</th>
                            <th scope="col" className="px-6 py-3 text-right">Payout</th>
                        </tr>
                    </thead>
                    <tbody>
                        {confirmedBookings.map(b => (
                            <tr key={b.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{formatDate(b.date)}</td>
                                <td className="px-6 py-4">{b.serviceName}</td>
                                <td className="px-6 py-4 text-right">{formatCurrency(b.bookingCost)}</td>
                                <td className="px-6 py-4 text-right text-yellow-700">{formatCurrency(b.commission)}</td>
                                <td className="px-6 py-4 text-right font-semibold text-green-700">{formatCurrency(b.merchantPayout)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {confirmedBookings.length === 0 && <p className="p-6 text-center text-gray-500">No confirmed bookings yet.</p>}
            </div>
        </div>
    );
};

// --- Admin Dashboard Components ---
const AdminFinanceDashboard: React.FC<{ allBookings: Booking[] }> = ({ allBookings }) => {
    const confirmedBookings = useMemo(() => allBookings.filter(b => b.status === BookingStatus.Confirmed), [allBookings]);

    const platformStats = useMemo(() => {
        return confirmedBookings.reduce((acc, booking) => {
            acc.totalRevenue += booking.bookingCost;
            acc.totalCommission += booking.commission;
            acc.totalPayout += booking.merchantPayout;
            return acc;
        }, { totalRevenue: 0, totalCommission: 0, totalPayout: 0 });
    }, [confirmedBookings]);

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-gray-500">Total Platform Revenue</h3>
                    <p className="text-3xl font-bold text-indigo-600">{formatCurrency(platformStats.totalRevenue)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-gray-500">Total Commissions Earned</h3>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(platformStats.totalCommission)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-gray-500">Total Payouts to Merchants</h3>
                    <p className="text-3xl font-bold text-yellow-600">{formatCurrency(platformStats.totalPayout)}</p>
                </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-700 mb-4">Financial Records (All Confirmed Transactions)</h2>
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Merchant</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Service</th>
                            <th scope="col" className="px-6 py-3 text-right">Revenue</th>
                            <th scope="col" className="px-6 py-3 text-right">Commission</th>
                            <th scope="col" className="px-6 py-3 text-right">Payout</th>
                        </tr>
                    </thead>
                    <tbody>
                        {confirmedBookings.map(b => (
                            <tr key={b.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{b.merchant.name}</td>
                                <td className="px-6 py-4">{formatDate(b.date)}</td>
                                <td className="px-6 py-4">{b.serviceName}</td>
                                <td className="px-6 py-4 text-right">{formatCurrency(b.bookingCost)}</td>
                                <td className="px-6 py-4 text-right text-yellow-700">{formatCurrency(b.commission)}</td>
                                <td className="px-6 py-4 text-right font-semibold text-green-700">{formatCurrency(b.merchantPayout)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {confirmedBookings.length === 0 && <p className="p-6 text-center text-gray-500">No confirmed transactions yet.</p>}
            </div>
        </div>
    );
};