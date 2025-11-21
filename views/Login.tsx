
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ArrowLeft, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react';

type Mode = 'LOGIN' | 'REGISTER' | 'RESET';

const Login = () => {
  const { login, register, resetPassword, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('LOGIN');
  const [identifier, setIdentifier] = useState(''); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isTakingLong, setIsTakingLong] = useState(false);

  // Detect long loading times
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
        setIsTakingLong(false);
        timer = setTimeout(() => setIsTakingLong(true), 5000);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      if (mode === 'REGISTER') {
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        await register(identifier.trim(), username.trim(), password);
        navigate('/');
      } else if (mode === 'LOGIN') {
        await login(identifier.trim(), password);
        navigate('/');
      } else if (mode === 'RESET') {
        await resetPassword(identifier.trim());
        setSuccessMsg("Password reset link sent! Check your email.");
      }
    } catch (err: any) {
      let msg = err.message || 'Operation failed.';
      const code = err.code || '';
      console.error("Login Error Code:", code); // Debugging

      // User-friendly error mapping
      if (code === 'auth/email-already-in-use') msg = "This email is already registered. Try logging in.";
      if (code === 'auth/wrong-password') msg = "Incorrect password.";
      if (code === 'auth/user-not-found') msg = "No account found with this email.";
      if (code === 'auth/invalid-credential') msg = "Invalid email or password."; 
      if (code === 'auth/network-request-failed') msg = "Network error. Check your internet connection.";
      if (code === 'auth/invalid-email') msg = "Please enter a valid email address.";
      
      // CONFIGURATION ERRORS (Crucial for user debugging)
      if (msg.includes('CONFIGURATION_ERROR') || msg.includes('PASTE_YOUR_API_KEY')) {
          msg = "SETUP REQUIRED: You must paste your Firebase API Key in services/firebase.ts.";
      } else if (code === 'auth/invalid-api-key' || msg.includes('invalid-api-key')) {
          msg = "INVALID API KEY: The key in services/firebase.ts is incorrect or does not match project 'akachai-fc'.";
      } else if (msg.includes('400') || code === 'auth/operation-not-allowed') {
          msg = "LOGIN FAILED (400): Ensure 'Email/Password' sign-in is ENABLED in your Firebase Console.";
      }
      
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
         <div className="absolute -top-20 -right-20 w-96 h-96 bg-akachai-red rounded-full filter blur-3xl animate-pulse"></div>
         <div className="absolute top-40 -left-20 w-72 h-72 bg-akachai-gold rounded-full filter blur-3xl"></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 z-10 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
           <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center overflow-visible">
             <img src="https://i.ibb.co/RkFSx7Cb/logo-removebg-preview.png" alt="Logo" className="w-full h-full object-contain scale-110" />
           </div>
           <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">AKACHAI FC</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1">
               {mode === 'LOGIN' && "Management Portal"}
               {mode === 'REGISTER' && "Create Member Account"}
               {mode === 'RESET' && "Reset Password"}
           </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm mb-4 text-center border border-red-100 dark:border-red-800 flex items-center justify-center">
             {error.includes("REQUIRED") || error.includes("INVALID") ? <AlertTriangle className="w-5 h-5 mr-2 shrink-0" /> : null}
             <span>{error}</span>
          </div>
        )}
        {successMsg && <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-md text-sm mb-4 text-center border border-green-100 dark:border-green-800">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                type="email" 
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-akachai-red focus:border-akachai-red outline-none transition"
                placeholder="name@example.com"
                required
                />
            </div>
          </div>

          {mode === 'REGISTER' && (
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                    type="text" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-akachai-red focus:border-akachai-red outline-none transition"
                    placeholder="johndoe"
                    required
                    />
                </div>
             </div>
          )}

          {mode !== 'RESET' && (
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    {mode === 'LOGIN' && (
                        <button type="button" onClick={() => setMode('RESET')} className="text-xs text-akachai-red hover:underline">
                            Forgot Password?
                        </button>
                    )}
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-akachai-red focus:border-akachai-red outline-none transition"
                    placeholder="••••••••"
                    required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-akachai-red text-white p-3 rounded-lg font-bold text-lg hover:bg-red-800 transition shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
            {loading ? 'Processing...' : mode === 'REGISTER' ? 'Register Account' : mode === 'RESET' ? 'Send Reset Link' : 'Sign In'}
          </button>
        </form>

        {isTakingLong && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 text-xs rounded border border-yellow-100 dark:border-yellow-800 animate-fade-in">
                <p className="font-bold mb-1">Taking longer than usual?</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Check your internet connection.</li>
                    <li>Ensure your Firestore Database is created in the console.</li>
                    <li>Verify the API Key in services/firebase.ts is correct.</li>
                </ul>
            </div>
        )}

        <div className="mt-6 text-center">
           {mode === 'LOGIN' && (
                <button 
                    onClick={() => setMode('REGISTER')}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-akachai-red hover:underline"
                >
                    New Member? Create Account
                </button>
           )}
           {mode !== 'LOGIN' && (
                <button 
                    onClick={() => { setMode('LOGIN'); setError(''); setSuccessMsg(''); }}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-akachai-red hover:underline flex items-center justify-center mx-auto"
                >
                    <ArrowLeft className="w-4 h-4 mr-1"/> Back to Login
                </button>
           )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Connected to <span className="font-bold text-akachai-red">Akachai FC Live Database</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
