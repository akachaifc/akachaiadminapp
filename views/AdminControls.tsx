
import React, { useEffect, useState } from 'react';
// SWITCHING TO REAL BACKEND
import { FirebaseService } from '../services/firebase';
import { User, UserRole } from '../types';
import { Shield, Users, Save, Pencil, X, Link as LinkIcon } from 'lucide-react';

const AdminControls = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  // Form state for modal
  const [formData, setFormData] = useState({
      username: '',
      phoneNumber: '',
      role: UserRole.L4_ADMIN
  });

  // Link User Form Data
  const [linkData, setLinkData] = useState({
      uid: '',
      email: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
      FirebaseService.getAllUsers().then(setUsers).catch(console.error);
  }

  const handleEditClick = (user: User) => {
      setEditingUser(user);
      setFormData({
          username: user.username,
          phoneNumber: user.phoneNumber || '',
          role: user.role
      });
  };

  const handleSave = async () => {
      if (!editingUser) return;
      
      try {
          await FirebaseService.updateAnyUserDetails(editingUser.uid, {
              username: formData.username,
              phoneNumber: formData.phoneNumber,
              role: formData.role
          });
          
          // Close modal and refresh
          setEditingUser(null);
          loadUsers();
          alert("User updated successfully");
      } catch (e) {
          console.error("Update failed", e);
          alert("Failed to update user on server");
      }
  };

  const handleLinkUser = async () => {
      if (!linkData.uid || !linkData.email) {
          alert("UID and Email are required.");
          return;
      }
      try {
          await FirebaseService.adminCreateUserDoc(linkData.uid.trim(), linkData.email.trim());
          alert("User linked successfully! They should now appear in the list.");
          setShowLinkModal(false);
          setLinkData({ uid: '', email: '' });
          loadUsers();
      } catch (e) {
          console.error(e);
          alert("Failed to link user. Check permissions.");
      }
  };

  return (
    <div className="space-y-6 relative">
      <div className="mb-6 flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <Shield className="mr-2 text-akachai-red"/> Admin Controls
            </h2>
            <p className="text-gray-500 dark:text-gray-400">Manage user access and system permissions.</p>
        </div>
        <button 
            onClick={() => setShowLinkModal(true)}
            className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center hover:bg-black"
        >
            <LinkIcon className="w-4 h-4 mr-2" /> Link Missing User
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center"><Users className="w-4 h-4 mr-2"/> User Registry</h3>
            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">{users.length} Users</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((u) => (
                <tr key={u.uid}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden mr-3">
                        {u.photoURL && <img src={u.photoURL} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{u.username}</div>
                          <div className="text-xs text-gray-400">{u.phoneNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${u.role === UserRole.L1_ADMIN ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                        u.role === UserRole.L2_ADMIN ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        u.role === UserRole.L3_ADMIN ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                        onClick={() => handleEditClick(u)}
                        className="text-akachai-red hover:text-red-800 font-medium flex items-center space-x-1 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                    >
                        <Pencil className="w-3 h-3" /> <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700 flex flex-col">
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 dark:text-white">Edit User Details</h3>
                      <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Email (ID)</label>
                          <input type="text" value={editingUser.email} disabled className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2 text-gray-500 cursor-not-allowed" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Username</label>
                          <input 
                            type="text" 
                            value={formData.username} 
                            onChange={e => setFormData({...formData, username: e.target.value})}
                            className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Phone Number</label>
                          <input 
                            type="text" 
                            value={formData.phoneNumber} 
                            onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                            className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2"
                            placeholder="+256..."
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">System Role</label>
                          <select 
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                            className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2"
                          >
                              <option value={UserRole.L1_ADMIN}>L1 - Main Administrator</option>
                              <option value={UserRole.L2_ADMIN}>L2 - Finance Manager</option>
                              <option value={UserRole.L3_ADMIN}>L3 - Social Media Manager</option>
                              <option value={UserRole.L4_ADMIN}>L4 - Club Member</option>
                          </select>
                      </div>
                  </div>
                  <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl flex justify-end space-x-2">
                      <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">Cancel</button>
                      <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-akachai-red text-white rounded hover:bg-red-800 flex items-center">
                          <Save className="w-4 h-4 mr-2"/> Save Changes
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* LINK USER MODAL */}
      {showLinkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700 flex flex-col">
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 dark:text-white">Link Missing User</h3>
                      <button onClick={() => setShowLinkModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                          <p className="text-xs text-yellow-700">
                              <strong>Note:</strong> Use this if a user has signed up (exists in Auth) but does not appear in the Admin list. Copy their UID from the Firebase Authentication Console.
                          </p>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">User UID (From Firebase Console)</label>
                          <input 
                            type="text" 
                            value={linkData.uid} 
                            onChange={e => setLinkData({...linkData, uid: e.target.value})}
                            className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2 font-mono text-sm"
                            placeholder="e.g. 7dh348..."
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Email Address</label>
                          <input 
                            type="email" 
                            value={linkData.email} 
                            onChange={e => setLinkData({...linkData, email: e.target.value})}
                            className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2"
                            placeholder="user@example.com"
                          />
                      </div>
                  </div>
                  <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl flex justify-end space-x-2">
                      <button onClick={() => setShowLinkModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">Cancel</button>
                      <button onClick={handleLinkUser} className="px-4 py-2 text-sm font-medium bg-gray-800 text-white rounded hover:bg-black flex items-center">
                          <LinkIcon className="w-4 h-4 mr-2"/> Link Profile
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminControls;
