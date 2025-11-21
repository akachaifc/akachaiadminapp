
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
// SWITCHING TO REAL BACKEND
import { FirebaseService, generateHtmlReceipt } from '../services/firebase';
import { Transaction, JerseyOrder, Receipt, UserRole, SeasonStats } from '../types';
import { 
  Wallet, ArrowUp, ArrowDown, FileText, 
  ShoppingBag, CheckCircle, Download, AlertTriangle, Printer, Lock, Mail
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Tab = 'OVERVIEW' | 'TRANSACTIONS' | 'JERSEYS' | 'RECEIPTS' | 'REPORTS';

const Finances = () => {
  const { user, hasRole } = useAuth();
  const { formatMoney, convert, currency } = useCurrency();
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<JerseyOrder[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Permissions
  const canManageFinances = hasRole([UserRole.L1_ADMIN, UserRole.L2_ADMIN]);

  const refreshData = async () => {
    setLoading(true);
    try {
        const [txs, ords, rcpts, stats] = await Promise.all([
        FirebaseService.getTransactions(),
        FirebaseService.getJerseyOrders(),
        FirebaseService.getReceipts(),
        FirebaseService.getSeasonStats()
        ]);
        setTransactions(txs);
        setOrders(ords);
        setReceipts(rcpts);
        setSeasonStats(stats);
    } catch (e) {
        console.error("Error fetching data", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // --- SUB COMPONENTS ---

  const Overview = () => {
    const [viewType, setViewType] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');
    const inflow = transactions.filter(t => t.type === 'INFLOW').reduce((acc, curr) => acc + curr.amount, 0);
    const outflow = transactions.filter(t => t.type === 'OUTFLOW').reduce((acc, curr) => acc + curr.amount, 0);

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-end items-center space-x-4">
           <span className="text-xs text-gray-400 font-mono">Currency: {currency}</span>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 border dark:border-gray-700 shadow-sm inline-flex">
            <button 
              onClick={() => setViewType('WEEKLY')}
              className={`px-4 py-1 text-sm rounded-md transition-all ${viewType === 'WEEKLY' ? 'bg-akachai-red text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              Weekly
            </button>
            <button 
              onClick={() => setViewType('MONTHLY')}
              className={`px-4 py-1 text-sm rounded-md transition-all ${viewType === 'MONTHLY' ? 'bg-akachai-red text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Market Style Inflow */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase">Total Inflow</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{formatMoney(inflow)}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">Income Generated</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ArrowUp className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Market Style Outflow */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase">Total Outflow</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{formatMoney(outflow)}</p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-2">Expenses Incurred</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ArrowDown className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <div className="bg-gray-900 dark:bg-black p-6 rounded-xl shadow-sm border border-gray-800 dark:border-gray-700 text-white">
             <div className="flex items-center justify-between mb-4">
              <h4 className="text-gray-300 text-sm font-medium uppercase">Net Balance</h4>
              <div className="p-2 bg-white/10 rounded-full text-akachai-gold"><Wallet size={20} /></div>
            </div>
            <p className="text-3xl font-bold text-akachai-gold">{formatMoney(inflow - outflow)}</p>
            <p className="text-xs text-gray-400 mt-2">Current Treasury</p>
          </div>
        </div>
      </div>
    );
  };

  const TransactionsTab = () => {
    const [formData, setFormData] = useState({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      type: 'OUTFLOW'
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      if (!formData.amount || Number(formData.amount) <= 0) {
          setError('Amount must be greater than 0.');
          return;
      }
      if (!formData.category) {
          setError('Please select a category.');
          return;
      }
      if (!formData.description.trim()) {
          setError('Description is required.');
          return;
      }
      
      await FirebaseService.addTransaction({
        amount: Number(formData.amount),
        date: new Date(formData.date).toISOString(),
        category: formData.category,
        description: formData.description,
        type: formData.type as any,
        createdBy: user?.username || 'unknown'
      });
      
      refreshData();
      setFormData({ ...formData, amount: '', description: '', category: '' });
      alert('Transaction Recorded!');
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r shadow-sm">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-2" />
              <p className="text-sm text-yellow-700 dark:text-yellow-200 font-medium">
                Treasury Note: Every transaction must be recorded.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Record Transaction</h3>
            {error && <div className="bg-red-50 text-red-600 text-xs p-2 rounded mb-4">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Type</label>
                <div className="flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'INFLOW'})}
                    className={`flex-1 py-2 text-sm font-medium rounded-l-md border ${formData.type === 'INFLOW' ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
                  >
                    Inflow
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'OUTFLOW'})}
                    className={`flex-1 py-2 text-sm font-medium rounded-r-md border ${formData.type === 'OUTFLOW' ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
                  >
                    Outflow
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Amount (UGX)</label>
                  <input 
                    type="number" 
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white border p-2 text-sm focus:ring-akachai-red focus:border-akachai-red"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Date</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white border p-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                 <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Category</label>
                 <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white border p-2 text-sm"
                    required
                 >
                   <option value="">Select...</option>
                   <option value="Jerseys">Jerseys</option>
                   <option value="Sponsorship">Sponsorship</option>
                   <option value="Match Fees">Match Fees</option>
                   <option value="Equipment">Equipment</option>
                   <option value="Transport">Transport</option>
                   <option value="Refreshments">Refreshments</option>
                   <option value="Other">Other</option>
                 </select>
              </div>

              <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white border p-2 text-sm"
                    rows={3}
                    placeholder="Details about this transaction..."
                  ></textarea>
              </div>

              <button type="submit" className="w-full bg-gray-900 dark:bg-black text-white py-2 rounded-md hover:bg-black transition font-medium">
                Submit Record
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-bold text-gray-700 dark:text-gray-200">Recent Transactions</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Desc</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cat</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{t.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {t.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${t.type === 'INFLOW' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.type === 'INFLOW' ? '+' : '-'}{formatMoney(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const JerseysTab = () => {
    const [newOrder, setNewOrder] = useState({ size: 'M', nameOnJersey: '', number: '', deliveryLocation: '', contactInfo: '' });
    const [confirmModal, setConfirmModal] = useState<string | null>(null);
    const [financials, setFinancials] = useState({ charged: 50000, balance: 0 });

    const submitOrder = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newOrder.nameOnJersey || !newOrder.contactInfo) {
          alert("Name and Contact info are required");
          return;
      }
      
      // If an Admin/Treasurer submits the order, it is automatically confirmed to skip the "approve other" queue.
      // If a regular user submits, it stays PENDING until the Treasurer approves it.
      const initialStatus = canManageFinances ? 'CONFIRMED' : 'PENDING';
      
      await FirebaseService.addJerseyOrder({ 
          ...newOrder, 
          orderedBy: user?.username || 'guest', 
          amountCharged: 0, 
          balanceDue: 0,
          status: initialStatus
      });
      
      setNewOrder({ size: 'M', nameOnJersey: '', number: '', deliveryLocation: '', contactInfo: '' });
      refreshData();
      alert(canManageFinances ? 'Order placed and auto-confirmed!' : 'Order placed successfully! Waiting for confirmation.');
    };

    const handleConfirmClick = (orderId: string) => {
        setConfirmModal(orderId);
        setFinancials({ charged: 50000, balance: 0 }); // Reset defaults
    }

    const confirmOrder = async (order: JerseyOrder) => {
        try {
           const receiptData = {
             number: `REC-${Date.now()}`,
             amount: Number(financials.charged) - Number(financials.balance), // Receipt for amount paid
             generatedBy: user?.username
           };
           await FirebaseService.confirmJerseyOrder(order.id, receiptData, {
               charged: Number(financials.charged),
               balance: Number(financials.balance)
           });
           setConfirmModal(null);
           refreshData();
           alert('Order Confirmed & Receipt Generated!');
        } catch (err) {
          alert('Error confirming order');
        }
    };

    // Filter orders: Admins see all, Users see theirs
    const visibleOrders = canManageFinances 
        ? orders 
        : orders.filter(o => o.orderedBy === user?.username);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* ORDER FORM - Available to ALL */}
         <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center"><ShoppingBag className="mr-2 h-5 w-5"/> New Jersey Order</h3>
            <form onSubmit={submitOrder} className="space-y-3">
              <div className="flex space-x-2">
                 <div className="w-1/3">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase">Size</label>
                    <select value={newOrder.size} onChange={e => setNewOrder({...newOrder, size: e.target.value})} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded">
                      <option>S</option><option>M</option><option>L</option><option>XL</option>
                    </select>
                 </div>
                 <div className="w-2/3">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase">Number</label>
                    <input type="text" value={newOrder.number} onChange={e => setNewOrder({...newOrder, number: e.target.value})} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded" placeholder="e.g. 10"/>
                 </div>
              </div>
              <div>
                 <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase">Name on Jersey</label>
                 <input type="text" value={newOrder.nameOnJersey} onChange={e => setNewOrder({...newOrder, nameOnJersey: e.target.value})} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded" required/>
              </div>
              <div>
                 <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase">Delivery Location</label>
                 <input type="text" value={newOrder.deliveryLocation} onChange={e => setNewOrder({...newOrder, deliveryLocation: e.target.value})} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded" required/>
              </div>
              <div>
                 <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase">Contact Info (Email/Phone)</label>
                 <input type="text" value={newOrder.contactInfo} onChange={e => setNewOrder({...newOrder, contactInfo: e.target.value})} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded" required/>
              </div>
              <button className="w-full bg-akachai-red text-white py-2 rounded hover:bg-red-800">Submit Order</button>
              {canManageFinances && <p className="text-[10px] text-gray-400 text-center mt-2">*Admin orders are automatically confirmed upon submission.</p>}
            </form>
         </div>

         {/* ORDER LIST - Filtered by permission */}
         <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">
                {canManageFinances ? 'All Orders' : 'My Orders'}
            </h3>
            {visibleOrders.length === 0 && <p className="text-gray-500 italic">No orders found.</p>}
            {visibleOrders.map(order => (
              <div key={order.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm flex justify-between items-center relative">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg dark:text-white">#{order.number}</span>
                    <span className="font-medium dark:text-gray-200">{order.nameOnJersey}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">Size: {order.size}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loc: {order.deliveryLocation} | Contact: {order.contactInfo}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Ordered by {order.orderedBy} on {new Date(order.orderDate).toLocaleDateString()}</p>
                  {order.status === 'CONFIRMED' && (
                      <div className="mt-1 text-xs font-mono text-gray-600 dark:text-gray-300">
                          Charged: {formatMoney(order.amountCharged || 0)} | Balance: <span className="text-red-600 dark:text-red-400">{formatMoney(order.balanceDue || 0)}</span>
                      </div>
                  )}
                </div>
                <div>
                   {order.status === 'PENDING' ? (
                     canManageFinances ? (
                        <button onClick={() => handleConfirmClick(order.id)} className="flex items-center bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-2 rounded border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40">
                            <CheckCircle className="w-4 h-4 mr-1"/> Confirm
                        </button>
                     ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                     )
                   ) : (
                     <div className="flex flex-col items-end">
                       <span className="text-green-600 dark:text-green-400 font-bold text-sm flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Confirmed</span>
                       <span className="text-xs text-gray-400">Rcpt: {order.receiptNumber}</span>
                     </div>
                   )}
                </div>

                {confirmModal === order.id && canManageFinances && (
                    <div className="absolute inset-0 bg-white dark:bg-gray-800 z-10 p-4 rounded border-2 border-akachai-red flex flex-col justify-between">
                        <h4 className="text-sm font-bold text-akachai-red">Confirm & Bill</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400">Total Charge</label>
                                <input type="number" value={financials.charged} onChange={e => setFinancials({...financials, charged: Number(e.target.value)})} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm p-1 rounded"/>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400">Balance Due</label>
                                <input type="number" value={financials.balance} onChange={e => setFinancials({...financials, balance: Number(e.target.value)})} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm p-1 rounded"/>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-2">
                            <button onClick={() => setConfirmModal(null)} className="text-xs text-gray-500 underline">Cancel</button>
                            <button onClick={() => confirmOrder(order)} className="text-xs bg-akachai-red text-white px-3 py-1 rounded">Generate Receipt</button>
                        </div>
                    </div>
                )}
              </div>
            ))}
         </div>
      </div>
    );
  };

  const ReceiptsTab = () => {
    const [manualReceipt, setManualReceipt] = useState({ 
        payerName: '', 
        payerEmail: '',
        payerPhone: '',
        payerRole: '',
        amount: '', 
        description: '',
        modeOfPayment: 'Cash'
    });

    const issueReceipt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualReceipt.payerName || !manualReceipt.amount || !manualReceipt.description || !manualReceipt.payerEmail) {
            alert("Name, Email, Amount, and Description are required");
            return;
        }
        await FirebaseService.addManualReceipt({
            number: `MAN-${Math.floor(Math.random() * 10000)}`,
            payerName: manualReceipt.payerName,
            payerEmail: manualReceipt.payerEmail,
            payerPhone: manualReceipt.payerPhone || 'N/A',
            payerRole: manualReceipt.payerRole || 'Supporter',
            amount: Number(manualReceipt.amount),
            description: manualReceipt.description,
            date: new Date().toISOString(),
            modeOfPayment: manualReceipt.modeOfPayment,
            
            // Default Receiver details for now
            receiverName: user?.username || 'Admin',
            receiverRole: 'Administrator',
            receiverPhone: '+256-708-344240',
            receiverEmail: 'akachaifc6@gmail.com',
            
            type: 'MANUAL',
            generatedBy: user?.username || 'admin'
        });
        refreshData();
        setManualReceipt({ payerName: '', payerEmail: '', payerPhone: '', payerRole: '', amount: '', description: '', modeOfPayment: 'Cash' });
        alert("Receipt generated!");
    };

    const printReceipt = (r: Receipt) => {
        const w = window.open('', '_blank');
        if (w) {
            const htmlContent = generateHtmlReceipt(r);
            w.document.write(htmlContent);
            w.document.close();
        }
    };

    const handleSendEmail = async (receiptId: string) => {
        if(confirm("Send receipt email to payer?")) {
            try {
                await FirebaseService.sendReceiptEmail(receiptId);
                // alert("Receipt email sent successfully!"); // Disabled for Spark plan
            } catch (err) {
                console.error(err);
                alert("Failed to send email.");
            }
        }
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
             <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center"><FileText className="mr-2 h-5 w-5"/> Issue Manual Receipt</h3>
             <form onSubmit={issueReceipt} className="space-y-3">
                 <div>
                     <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase">Payer Name</label>
                     <input type="text" value={manualReceipt.payerName} onChange={e => setManualReceipt({...manualReceipt, payerName: e.target.value})} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded" required />
                 </div>
                 <div>
                     <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase">Payer Email (For Receipt)</label>
                     <input type="email" value={manualReceipt.payerEmail} onChange={e => setManualReceipt({...manualReceipt, payerEmail: e.target.value})} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded" required />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase">Payer Phone</label>
                        <input type="text" value={manualReceipt.payerPhone} onChange={e => setManualReceipt({...manualReceipt, payerPhone: e.target.value})} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase">Payer Role</label>
                        <input type="text" value={manualReceipt.payerRole} onChange={e => setManualReceipt({...manualReceipt, payerRole: e.target.value})} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded" placeholder="e.g. Patron" />
                    </div>
                 </div>
                 <div>
                     <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase">Amount (UGX)</label>
                     <input type="number" value={manualReceipt.amount} onChange={e => setManualReceipt({...manualReceipt, amount: e.target.value})} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded" required />
                 </div>
                 <div>
                     <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase">Mode of Payment</label>
                     <select value={manualReceipt.modeOfPayment} onChange={e => setManualReceipt({...manualReceipt, modeOfPayment: e.target.value})} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded">
                        <option>Cash</option>
                        <option>Mobile Money</option>
                        <option>Bank Transfer</option>
                        <option>Cheque</option>
                     </select>
                 </div>
                 <div>
                     <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase">Reason / Description</label>
                     <textarea value={manualReceipt.description} onChange={e => setManualReceipt({...manualReceipt, description: e.target.value})} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded" rows={2} required />
                 </div>
                 <button className="w-full bg-gray-800 dark:bg-gray-700 text-white py-2 rounded hover:bg-black dark:hover:bg-gray-600">Generate Receipt</button>
             </form>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
           <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 dark:text-gray-200">Receipt History</h3>
              <button className="text-sm text-akachai-red font-medium flex items-center hover:underline">
                 <Download className="w-4 h-4 mr-1"/> Export All
              </button>
           </div>
           <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
             {receipts.length === 0 && <p className="p-6 text-center text-gray-400">No receipts generated yet.</p>}
             {receipts.map(r => (
               <div key={r.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700">
                 <div>
                   <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm dark:text-gray-200">{r.number}</p>
                        {r.type === 'JERSEY' && <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded">JERSEY</span>}
                   </div>
                   <p className="text-xs text-gray-500 dark:text-gray-400">{r.payerName} - {r.description}</p>
                   <p className="text-[10px] text-gray-400">{new Date(r.date).toLocaleDateString()}</p>
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className="font-bold text-gray-800 dark:text-white mr-2">{formatMoney(r.amount)}</span>
                   <button onClick={() => handleSendEmail(r.id)} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Send Email">
                     <Mail className="w-4 h-4"/>
                   </button>
                   <button onClick={() => printReceipt(r)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" title="Print Receipt">
                     <Printer className="w-4 h-4"/>
                   </button>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  };

  const ReportsTab = () => {
      const downloadPdf = () => {
          const doc = new jsPDF();
          const seasonTitle = seasonStats?.seasonName ? `Season: ${seasonStats.seasonName}` : 'General Report';
          
          // Header
          doc.setTextColor(153, 27, 27); // #991b1b
          doc.setFontSize(20);
          doc.text("AKACHAI FC", 14, 22);
          
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(12);
          doc.text("Financial Report", 14, 30);
          doc.text(seasonTitle, 14, 36);
          doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 42);
          
          // Financial Summary
          const inflow = transactions.filter(t => t.type === 'INFLOW').reduce((acc, curr) => acc + curr.amount, 0);
          const outflow = transactions.filter(t => t.type === 'OUTFLOW').reduce((acc, curr) => acc + curr.amount, 0);
          
          doc.text(`Total Inflow: UGX ${inflow.toLocaleString()}`, 14, 55);
          doc.text(`Total Outflow: UGX ${outflow.toLocaleString()}`, 14, 62);
          doc.setFont(undefined, 'bold');
          doc.text(`Net Position: UGX ${(inflow - outflow).toLocaleString()}`, 14, 69);
          doc.setFont(undefined, 'normal');

          // Table Data
          const tableData = transactions.map(t => [
              new Date(t.date).toLocaleDateString(),
              t.category,
              t.description,
              t.type,
              t.amount.toLocaleString()
          ]);

          autoTable(doc, {
              startY: 80,
              head: [['Date', 'Category', 'Description', 'Type', 'Amount (UGX)']],
              body: tableData,
              theme: 'grid',
              headStyles: { fillColor: [153, 27, 27] }
          });

          doc.save(`Akachai_Report_${seasonStats?.seasonName || 'General'}.pdf`);
      };

      return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
        <FileText className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Financial Reports {seasonStats?.seasonName ? `(${seasonStats.seasonName})` : ''}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Download comprehensive PDF reports including transaction history, sales breakdowns, and monthly profit/loss statements for the current season.</p>
        <button 
            onClick={downloadPdf}
            className="bg-gray-900 dark:bg-gray-700 text-white px-6 py-3 rounded-md hover:bg-black dark:hover:bg-gray-600 flex items-center mx-auto"
        >
            <Download className="w-4 h-4 mr-2" /> Download PDF Report
        </button>
        </div>
      );
  }

  // --- MAIN RENDER ---

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Finance Center</h2>
        {!canManageFinances && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <Lock className="w-3 h-3 mr-1" /> Member View
            </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'OVERVIEW'
                ? 'border-akachai-red text-akachai-red'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}
            `}
          >
            Overview
          </button>
          
          <button
            onClick={() => setActiveTab('JERSEYS')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'JERSEYS'
                ? 'border-akachai-red text-akachai-red'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}
            `}
          >
            Jersey Orders
          </button>

          {canManageFinances && ['TRANSACTIONS', 'RECEIPTS', 'REPORTS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab
                  ? 'border-akachai-red text-akachai-red'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}
              `}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-akachai-red"></div>
          </div>
        ) : (
          <>
            {activeTab === 'OVERVIEW' && <Overview />}
            {activeTab === 'JERSEYS' && <JerseysTab />}
            {canManageFinances && activeTab === 'TRANSACTIONS' && <TransactionsTab />}
            {canManageFinances && activeTab === 'RECEIPTS' && <ReceiptsTab />}
            {canManageFinances && activeTab === 'REPORTS' && <ReportsTab />}
          </>
        )}
      </div>
    </div>
  );
};

export default Finances;