
import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Bell, Calendar, Activity, Clock, Share2, AlertOctagon } from 'lucide-react';
// SWITCHING TO REAL BACKEND
import { FirebaseService } from '../services/firebase';
import { Announcement, SeasonStats } from '../types';

// Mock Data for charts (Reset to zero as requested)
const SALES_DATA = [
  { name: 'Jan', sales: 0 },
  { name: 'Feb', sales: 0 },
  { name: 'Mar', sales: 0 },
  { name: 'Apr', sales: 0 },
  { name: 'May', sales: 0 },
  { name: 'Jun', sales: 0 },
];

const Dashboard = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [seasonStats, setSeasonStats] = useState<SeasonStats>({ 
    seasonName: '', 
    startDate: '', 
    played: 0, 
    total: 1 
  });
  const [seasonData, setSeasonData] = useState<any[]>([]);
  const [hasPermissionError, setHasPermissionError] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
          const a = await FirebaseService.getAnnouncements();
          setAnnouncements(a);
          const s = await FirebaseService.getSeasonStats();
          setSeasonStats(s);
          
          // If we got defaults back and stats are suspiciously empty/default
          if (s.seasonName === 'N/A') {
             // We assume this might be a permission issue if the DB is known to have data, 
             // but for a fresh app, it might just be empty.
             // However, if the user is seeing errors in console, we want to be safe.
          }

          const remaining = Math.max(0, s.total - s.played);
          setSeasonData([
              { name: 'Played', value: s.played, color: '#991b1b' },
              { name: 'Remaining', value: remaining, color: '#e5e7eb' }
          ]);
      } catch (error) {
          console.error("Error loading dashboard data", error);
          setHasPermissionError(true);
      }
    };
    loadData();
  }, []);

  const percentPlayed = seasonStats.total > 0 
    ? Math.round((seasonStats.played / seasonStats.total) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 md:mt-0">Welcome back to Akachai FC Portal</p>
      </div>

      {/* Permission Error Banner */}
      {hasPermissionError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
            <div className="flex">
                <div className="flex-shrink-0">
                    <AlertOctagon className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                    <p className="text-sm text-red-700 font-bold">
                        Database Access Restricted
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                        The application cannot load data. This is usually because your Firestore Security Rules are set to 'locked'. 
                        Please go to Firebase Console > Firestore > Rules and enable access.
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* Top Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Notifications Window */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden md:col-span-2 flex flex-col h-96">
          <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center shrink-0">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center">
              <Bell className="w-4 h-4 mr-2 text-akachai-red" />
              Notifications & Updates
            </h3>
            <span className="text-xs bg-akachai-red text-white px-2 py-0.5 rounded-full">Live</span>
          </div>
          <div className="overflow-y-auto p-4 space-y-4 flex-1 scrollbar-hide">
            {announcements.length === 0 ? (
              <p className="text-center text-gray-400 mt-10">No new announcements</p>
            ) : (
              announcements.map((item) => (
                <div key={item.id} className={`p-3 rounded-lg border ${item.isImportant ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${item.isImportant ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
                      {item.isImportant ? 'Alert' : 'Update'}
                    </span>
                    <span className="text-xs text-gray-400">{item.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 whitespace-pre-wrap">{item.content}</p>
                  
                  {/* Media Content */}
                  {(item.mediaUrl || item.duration) && (
                     <div className="mt-2 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                        {item.mediaUrl && (
                            <div className="mb-2 relative rounded overflow-hidden bg-gray-100 dark:bg-gray-700 h-48">
                                <img src={item.mediaUrl} alt="Post Attachment" className="w-full h-full object-cover" />
                            </div>
                        )}
                        {item.duration && (
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="w-3 h-3 mr-1" /> Duration: {item.duration}
                            </div>
                        )}
                     </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Season Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col items-center justify-center h-96">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 self-start w-full flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-akachai-gold" />
            Season Progress
          </h3>
          <div className="w-full h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={seasonData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {seasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-3xl font-bold text-gray-800 dark:text-white">{percentPlayed}%</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Completed</span>
            </div>
          </div>
          <div className="w-full mt-4 flex justify-between text-sm text-gray-600 dark:text-gray-400 border-t dark:border-gray-700 pt-4">
            <div className="text-center">
                 <p className="text-2xl font-bold text-akachai-red">{seasonStats.played}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400">Played</p>
            </div>
            <div className="text-center">
                 <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">{seasonStats.total - seasonStats.played}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Jersey Sales */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-80">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
             <Activity className="w-4 h-4 mr-2 text-akachai-red" />
             Jersey Sales Trend
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={SALES_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#fff'}} />
              <Bar dataKey="sales" fill="#991b1b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Social Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-80">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
             <Share2 className="w-4 h-4 mr-2 text-blue-500" />
             Social Media Growth
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={SALES_DATA.map(d => ({ name: d.name, followers: d.sales }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
              <Tooltip contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#fff'}} />
              <Line type="monotone" dataKey="followers" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b'}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
