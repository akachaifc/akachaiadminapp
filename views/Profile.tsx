
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// SWITCHING TO REAL BACKEND
import { FirebaseService } from '../services/firebase';
import { User, Save, Key, AlertCircle, Camera, Copy } from 'lucide-react';

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || ''
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [status, setStatus] = useState({ message: '', type: '' });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserProfile({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber
      });
      setStatus({ message: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      setStatus({ message: 'Failed to update profile.', type: 'error' });
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          // In a real app, we would upload to Storage here. 
          // For this mock/demo transition, we create a local URL.
          const mockUrl = URL.createObjectURL(file);
          await updateUserProfile({ photoURL: mockUrl });
          setStatus({ message: 'Profile photo updated!', type: 'success' });
      }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setStatus({ message: 'New passwords do not match.', type: 'error' });
      return;
    }
    try {
      if (user?.uid) {
        await FirebaseService.changePassword(user.uid, passwords.current, passwords.new);
        setStatus({ message: 'Password changed successfully!', type: 'success' });
        setPasswords({ current: '', new: '', confirm: '' });
      }
    } catch (error: any) {
      setStatus({ message: error.message || 'Failed to change password.', type: 'error' });
    }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("Copied ID to clipboard!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
       <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Profile</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage your account settings and security.</p>
      </div>

      {status.message && (
        <div className={`p-4 rounded-md flex items-center ${status.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
          <AlertCircle className="w-5 h-5 mr-2" />
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PHOTO UPLOAD */}
        <div className="md:col-span-1">
             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center">
                <div className="relative w-32 h-32 mb-4 group">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 ring-4 ring-white dark:ring-gray-600 shadow-lg">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                <User size={48} />
                            </div>
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-akachai-red text-white p-2.5 rounded-full cursor-pointer hover:bg-red-800 shadow-md transition-transform transform group-hover:scale-110">
                        <Camera size={18} />
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    </label>
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{user?.username}</h3>
                <span className={`px-2 py-1 text-xs rounded-full mt-1 uppercase font-bold tracking-wide ${user?.role.includes('ADMIN') ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {user?.role.replace(/L\d_/, '').replace('_', ' ')}
                </span>
                
                <div className="mt-4 w-full pt-4 border-t dark:border-gray-700">
                     <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">User ID (UID)</p>
                     <button 
                        onClick={() => user?.uid && copyToClipboard(user.uid)}
                        className="flex items-center justify-center w-full text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition truncate"
                        title="Click to copy"
                     >
                         <span className="truncate mr-1">{user?.uid}</span>
                         <Copy size={10} />
                     </button>
                     <p className="text-[10px] text-gray-400 mt-1">Use this ID for manual database edits.</p>
                </div>
             </div>
        </div>

        {/* FORMS */}
        <div className="md:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center"><User className="w-5 h-5 mr-2 text-akachai-red"/> Personal Details</h3>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                            <input type="text" value={user?.username} disabled className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-2 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input type="email" value={formData.email} disabled className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-2 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input 
                            type="text" 
                            value={formData.fullName} 
                            onChange={e => setFormData({...formData, fullName: e.target.value})}
                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-akachai-red focus:border-akachai-red" 
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                        <input 
                            type="tel" 
                            value={formData.phoneNumber} 
                            onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-akachai-red focus:border-akachai-red" 
                            placeholder="+256..."
                        />
                    </div>
                    <button type="submit" className="w-full bg-gray-900 dark:bg-black text-white py-2.5 rounded-md hover:bg-black dark:hover:bg-gray-700 transition flex items-center justify-center font-medium">
                        <Save className="w-4 h-4 mr-2" /> Save Profile Details
                    </button>
                </form>
            </div>

            {/* Security */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center"><Key className="w-5 h-5 mr-2 text-akachai-gold"/> Change Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                        <input 
                            type="password" 
                            value={passwords.current}
                            onChange={e => setPasswords({...passwords, current: e.target.value})}
                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-akachai-red focus:border-akachai-red" 
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                            <input 
                                type="password" 
                                value={passwords.new}
                                onChange={e => setPasswords({...passwords, new: e.target.value})}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-akachai-red focus:border-akachai-red" 
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                            <input 
                                type="password" 
                                value={passwords.confirm}
                                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-akachai-red focus:border-akachai-red" 
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-white dark:bg-gray-700 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 py-2.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition font-medium">
                        Update Password
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
