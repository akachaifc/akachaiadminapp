
import React, { useState, useEffect } from 'react';
// SWITCHING TO REAL BACKEND
import { FirebaseService } from '../services/firebase';
import { Send, ThumbsUp, Image as ImageIcon, Clock, Trash2, Activity, Save, Calendar } from 'lucide-react';
import { Announcement, SeasonStats, SocialStats } from '../types';

const SocialInput = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  
  // Duration Composite State
  const [durationValue, setDurationValue] = useState('');
  const [durationUnit, setDurationUnit] = useState('Hours');

  // Data management
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [seasonStats, setSeasonStats] = useState<SeasonStats>({ seasonName: 'Season 1', startDate: '', played: 0, total: 0 });
  const [socialStats, setSocialStats] = useState<SocialStats[]>([]);

  useEffect(() => {
      loadData();
  }, []);

  const loadData = async () => {
      try {
        const a = await FirebaseService.getAnnouncements();
        setAnnouncements(a);
        const s = await FirebaseService.getSeasonStats();
        setSeasonStats(s);
        
        // Initialize Social Stats
        const dbStats = await FirebaseService.getSocialStats();
        const platforms = ['WhatsApp', 'Instagram', 'X', 'TikTok'];
        const mergedStats = platforms.map(p => {
            const existing = dbStats.find(s => s.platform === p);
            return existing || { platform: p, followers: 0, engagementRate: 0, lastUpdated: '' };
        });
        setSocialStats(mergedStats);

      } catch (e) {
          console.error("Error loading social data", e);
      }
  };

  const postAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalDuration = durationValue ? `${durationValue} ${durationUnit}` : undefined;

    await FirebaseService.addAnnouncement({
      title,
      content,
      isImportant,
      author: 'social_admin',
      mediaUrl: mediaUrl || undefined,
      duration: finalDuration
    });
    
    alert('Announcement Posted to Dashboard!');
    setTitle('');
    setContent('');
    setMediaUrl('');
    setDurationValue('');
    setIsImportant(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Are you sure you want to delete this announcement?")) {
          await FirebaseService.deleteAnnouncement(id);
          loadData();
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setMediaUrl(URL.createObjectURL(file));
      }
  };

  const updateSeasonStats = async () => {
      await FirebaseService.updateSeasonStats(seasonStats);
      alert("Season information updated!");
  };

  const handleStatChange = (platform: string, value: string) => {
      setSocialStats(prev => prev.map(s => s.platform === platform ? { ...s, followers: Number(value) } : s));
  };

  const updateSingleStat = async (platform: string) => {
      const statToUpdate = socialStats.find(s => s.platform === platform);
      if (statToUpdate) {
          await FirebaseService.updateSocialStats([statToUpdate]);
          alert(`${platform} stats saved!`);
      }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
       <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Social Media & Communications</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage dashboard announcements and update public stats.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN - CREATE POST */}
          <div className="lg:col-span-2 space-y-8">
             {/* Announcement Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                <Send className="w-5 h-5 mr-2 text-akachai-red" />
                Post Dashboard Announcement
                </h3>
                <form onSubmit={postAnnouncement} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Headline</label>
                    <input 
                    type="text" 
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-akachai-red focus:border-akachai-red" 
                    placeholder="e.g. Match Cancelled"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                    <textarea 
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-akachai-red focus:border-akachai-red" 
                    rows={4}
                    placeholder="Details..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                    ></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attach Media (Image/Poster)</label>
                        <div className="flex items-center space-x-2">
                            <label className="cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex-1">
                                <ImageIcon className="w-4 h-4 mr-2" />
                                <span>Choose File</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                        {mediaUrl && (
                            <div className="mt-2 relative w-full h-32 bg-gray-100 dark:bg-gray-900 rounded border overflow-hidden">
                                <img src={mediaUrl} alt="Preview" className="w-full h-full object-contain" />
                                <button type="button" onClick={() => setMediaUrl('')} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-red-600">
                                    <XIcon className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (Optional)</label>
                        <div className="flex space-x-2">
                             <input 
                                type="number"
                                className="w-1/3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                                placeholder="Qty"
                                value={durationValue}
                                onChange={e => setDurationValue(e.target.value)}
                             />
                             <select 
                                className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                                value={durationUnit}
                                onChange={e => setDurationUnit(e.target.value)}
                             >
                                 <option>Hours</option>
                                 <option>Days</option>
                                 <option>Weeks</option>
                                 <option>Months</option>
                                 <option>Season</option>
                                 <option>Indefinite</option>
                             </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center pt-2">
                    <input 
                    id="important" 
                    type="checkbox" 
                    className="h-4 w-4 text-akachai-red border-gray-300 rounded focus:ring-akachai-red"
                    checked={isImportant}
                    onChange={e => setIsImportant(e.target.checked)}
                    />
                    <label htmlFor="important" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                    Mark as High Priority / Alert
                    </label>
                </div>
                <div className="pt-2">
                    <button type="submit" className="bg-akachai-red text-white px-6 py-2 rounded-md hover:bg-red-800 transition font-medium">Post Update</button>
                </div>
                </form>
            </div>

            {/* Active Announcements Management */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                 <h3 className="font-bold text-gray-800 dark:text-white mb-4">Active Dashboard Posts</h3>
                 <div className="space-y-4 max-h-96 overflow-y-auto">
                     {announcements.length === 0 && <p className="text-gray-400 text-sm italic">No active posts.</p>}
                     {announcements.map(a => (
                         <div key={a.id} className="flex justify-between items-start p-3 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                             <div>
                                 <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{a.date}</span>
                                    {a.isImportant && <span className="text-[10px] bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-1 rounded font-bold">ALERT</span>}
                                 </div>
                                 <h4 className="font-medium text-gray-900 dark:text-white">{a.title}</h4>
                                 <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{a.content}</p>
                             </div>
                             <button 
                                onClick={() => handleDelete(a.id)}
                                className="text-gray-400 hover:text-red-600 p-2"
                                title="Delete Post"
                             >
                                 <Trash2 className="w-4 h-4" />
                             </button>
                         </div>
                     ))}
                 </div>
            </div>
          </div>

          {/* RIGHT COLUMN - STATS */}
          <div className="space-y-8">
             
             {/* Season Stats */}
             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-600" />
                    Season Management
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Season Name</label>
                        <input 
                            type="text" 
                            value={seasonStats.seasonName} 
                            onChange={e => setSeasonStats({...seasonStats, seasonName: e.target.value})}
                            className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded"
                            placeholder="e.g. NLLXVII"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Start Date</label>
                        <input 
                            type="date" 
                            value={seasonStats.startDate} 
                            onChange={e => setSeasonStats({...seasonStats, startDate: e.target.value})}
                            className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Played</label>
                            <input 
                                type="number" 
                                value={seasonStats.played} 
                                onChange={e => setSeasonStats({...seasonStats, played: Number(e.target.value)})}
                                className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Total</label>
                            <input 
                                type="number" 
                                value={seasonStats.total} 
                                onChange={e => setSeasonStats({...seasonStats, total: Number(e.target.value)})}
                                className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded"
                            />
                        </div>
                    </div>
                    <button 
                        onClick={updateSeasonStats}
                        className="w-full flex items-center justify-center bg-gray-800 dark:bg-gray-700 text-white py-2 rounded hover:bg-black dark:hover:bg-gray-600 transition text-sm"
                    >
                        <Save className="w-4 h-4 mr-2"/> Update Season Info
                    </button>
                </div>
             </div>

             {/* Social Stats Update */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                <ThumbsUp className="w-5 h-5 mr-2 text-blue-600" />
                Social Follower Count
                </h3>
                <div className="space-y-4">
                {socialStats.map(stat => (
                    <div key={stat.platform} className="p-3 border dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900/50">
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{stat.platform}</h4>
                        <div className="flex space-x-2">
                            <input 
                                type="number" 
                                placeholder="Followers" 
                                value={stat.followers}
                                onChange={(e) => handleStatChange(stat.platform, e.target.value)}
                                className="w-2/3 p-2 text-sm border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded" 
                            />
                            <button 
                                onClick={() => updateSingleStat(stat.platform)}
                                className="w-1/3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 font-medium dark:text-white"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                ))}
                </div>
            </div>
          </div>

      </div>
    </div>
  );
};

const XIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
)

export default SocialInput;
