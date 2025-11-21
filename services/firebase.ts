
import emailjs from '@emailjs/browser';
import { User, UserRole, Transaction, JerseyOrder, Receipt, Announcement, SocialStats, SeasonStats } from '../types';

// Access the global firebase object loaded via script tags in index.html
const firebase = (window as any).firebase;

if (!firebase) {
  console.error("Firebase not loaded. Check internet connection or index.html script tags.");
}

// ------------------------------------------------------------------
// ⚠️ CRITICAL CONFIGURATION STEP ⚠️
// Update this config to match your NEW Firebase project settings.
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBSMNp6VzR0mfApA3OImQd3m9PJi2o7C0U", // REPLACE THIS WITH YOUR NEW KEY FROM FIREBASE CONSOLE
  authDomain: "akachai-fc-management-app.firebaseapp.com", // Update if changed
  projectId: "akachai-fc-management-app", // Update if changed
  storageBucket: "akachai-fc-management-app.firebasestorage.app",
  messagingSenderId: "276591466734",
  appId: "1:276591466734:web:e3b4e4f11f1638ec5b7bff"
};

// --- ⚡️ ADMIN WHITELIST ⚡️ ---
// Add your email here to automatically become an Admin, bypassing database checks.
const AUTO_ADMIN_EMAILS = [
    "akachaifc6@gmail.com", 
    "secretary.akachaifc@gmail.com"
];

// --- EMAILJS CONFIGURATION ---
const emailConfig = {
  serviceId: "service_9nzfwtm",   
  templateId: "template_efn8vlb", 
  publicKey: "l3bB3ofE87AW5cFb2"    
};

// --- Initialization ---
let app;
let auth: any = null;
let db: any = null;

if (firebase) {
    try {
      // Prevent re-initialization
      if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
      } else {
        app = firebase.app(); // Retrieve existing instance
      }
      auth = app.auth();
      db = app.firestore();
      console.log("%c FIREBASE CONNECTED ", "background: #991b1b; color: #fff; font-weight: bold;");
    } catch (e) {
      console.error("Firebase Initialization Error. Did you update the config keys?", e);
    }
}

// --- Helper: Map Firebase User to App User ---
const mapUser = (u: any, role: UserRole = UserRole.L4_ADMIN): User => ({
    uid: u.uid,
    email: u.email || '',
    username: u.username || u.displayName || u.email?.split('@')[0] || 'User',
    role: role, 
    photoURL: u.photoURL || undefined,
    phoneNumber: u.phoneNumber || undefined
});

// --- Helper: Timeout Promise ---
const timeout = (ms: number, msg: string) => new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms));

// --- Helper: Safe DB Operation Wrapper ---
// Swallows permission errors to prevent app crashes
const safeDbOp = async <T>(operation: () => Promise<T>, fallback: T, context: string): Promise<T> => {
    if (!db) return fallback;
    try {
        return await operation();
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            console.warn(`[${context}] Permission Denied: Check Firestore Security Rules.`);
            return fallback;
        }
        console.error(`[${context}] Error:`, error);
        return fallback; // Return fallback on other errors too to keep app alive
    }
};

// --- REAL SERVICE IMPLEMENTATION ---
export const FirebaseService = {
  
  // AUTHENTICATION
  login: async (identifier: string, password?: string): Promise<User> => {
    if (!auth || !db) throw new Error("Firebase not initialized. Check services/firebase.ts config.");
    
    try {
        console.log(`Attempting Auth Sign In for: ${identifier}`);
        
        // Race Auth against a 15s timeout to catch network hangs
        const userCredential = await Promise.race([
            auth.signInWithEmailAndPassword(identifier, password || ''),
            timeout(15000, "Authentication timed out. Check network.")
        ]) as any;
        
        const uid = userCredential.user.uid;
        const email = userCredential.user.email;
        console.log(`Auth Successful. UID: ${uid}`);

        // --- 1. CHECK WHITELIST FIRST ---
        if (email && AUTO_ADMIN_EMAILS.includes(email)) {
            console.log(`%c ⚡️ FORCE ADMIN: ${email} is in whitelist.`, "color: yellow; background: red; font-weight: bold;");
            return mapUser(userCredential.user, UserRole.L1_ADMIN);
        }

        // --- 2. CHECK DATABASE ---
        const docRef = db.collection('users').doc(uid);
        
        let docSnap;
        let role = UserRole.L4_ADMIN;
        let userData: any = {};

        try {
            // Race Firestore against a 5s timeout. 
            docSnap = await Promise.race([
                docRef.get(),
                timeout(5000, "Firestore fetch timed out")
            ]) as any;

            if (docSnap && docSnap.exists) {
                userData = docSnap.data();
                role = userData.role as UserRole;
            } else if (docSnap) {
                // User exists in Auth but not Firestore - Create default
                const newDoc = {
                    uid: uid,
                    email: email,
                    username: userCredential.user.displayName || identifier.split('@')[0],
                    role: UserRole.L4_ADMIN,
                    createdAt: new Date().toISOString()
                };
                // Fire and forget
                docRef.set(newDoc).catch((e: any) => console.warn("Background profile creation failed (Rules likely block write)", e.code));
                userData = newDoc;
            }
        } catch (dbError: any) {
            console.warn(`Firestore lookup failed (${dbError.code}). Logging in with basic Auth data.`);
        }

        if (!userCredential.user) throw new Error("Login failed");
        
        return mapUser({ ...userCredential.user, ...userData }, role);

    } catch (error: any) {
        console.error("Login Error:", error);
        throw error;
    }
  },

  register: async (email: string, username: string, password?: string): Promise<User> => {
    if (!auth || !db) throw new Error("Firebase not initialized.");
    
    const userCredential = await auth.createUserWithEmailAndPassword(email, password || 'password123'); 
    
    if (!userCredential.user) throw new Error("Registration failed");
    
    await userCredential.user.updateProfile({ displayName: username });
    
    const newUser = {
        uid: userCredential.user.uid,
        email: email,
        username: username,
        role: UserRole.L4_ADMIN,
        createdAt: new Date().toISOString()
    };

    // Attempt to save to DB, but don't crash app if it fails (e.g. permissions)
    try {
        await db.collection('users').doc(userCredential.user.uid).set(newUser);
    } catch (e: any) {
        console.warn("Failed to save user profile to Firestore. Permissions likely denied.", e.code);
    }

    return mapUser(userCredential.user, UserRole.L4_ADMIN);
  },

  sendPasswordResetEmail: async (email: string): Promise<void> => {
    if (!auth) throw new Error("Firebase not initialized");
    await auth.sendPasswordResetEmail(email);
  },

  logout: async () => {
      if (!auth) return;
      await auth.signOut();
  },

  updateUserProfile: async (uid: string, data: Partial<User>): Promise<User> => {
    if (!auth || !db) throw new Error("Firebase not initialized");
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user logged in');

    if (data.fullName || data.photoURL) {
        await currentUser.updateProfile({
            displayName: data.fullName || currentUser.displayName,
            photoURL: data.photoURL || currentUser.photoURL
        });
    }

    try {
        await db.collection('users').doc(uid).set({ ...data, uid, email: currentUser.email }, { merge: true });
    } catch (e) {
        console.warn("Profile DB update failed (Permissions)", e);
    }
    
    // Return updated local object regardless of DB success
    let role = UserRole.L4_ADMIN;
    // Re-check whitelist
    if (currentUser.email && AUTO_ADMIN_EMAILS.includes(currentUser.email)) {
        role = UserRole.L1_ADMIN;
    } 

    return mapUser(currentUser, role); 
  },

  changePassword: async (uid: string, oldPw: string, newPw: string): Promise<void> => {
    if (auth && auth.currentUser) {
        await auth.currentUser.updatePassword(newPw);
    }
  },

  // --- DATA FETCHING (ROBUST) ---

  getTransactions: async (): Promise<Transaction[]> => {
    return safeDbOp(async () => {
        const snapshot = await db.collection('transactions').orderBy('date', 'desc').get();
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Transaction));
    }, [], 'getTransactions');
  },

  addTransaction: async (t: Omit<Transaction, 'id'>): Promise<Transaction> => {
    if (!db) throw new Error("Firebase DB not initialized");
    try {
        const ref = await db.collection('transactions').add(t);
        return { id: ref.id, ...t };
    } catch (e: any) {
        if(e.code === 'permission-denied') throw new Error("Permission Denied: Database is locked.");
        throw e;
    }
  },

  getJerseyOrders: async (): Promise<JerseyOrder[]> => {
    return safeDbOp(async () => {
        const snapshot = await db.collection('jersey_orders').orderBy('orderDate', 'desc').get();
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as JerseyOrder));
    }, [], 'getJerseyOrders');
  },

  // Updated to allow status override
  addJerseyOrder: async (order: Omit<JerseyOrder, 'id' | 'orderDate'>): Promise<JerseyOrder> => {
    if (!db) throw new Error("Firebase DB not initialized");
    const newOrder = {
        ...order,
        status: order.status || 'PENDING',
        orderDate: new Date().toISOString()
    };
    try {
        const ref = await db.collection('jersey_orders').add(newOrder);
        return { id: ref.id, ...newOrder as JerseyOrder };
    } catch (e: any) {
        if(e.code === 'permission-denied') throw new Error("Permission Denied: Database is locked.");
        throw e;
    }
  },

  confirmJerseyOrder: async (orderId: string, receiptData: any, financials: { charged: number, balance: number }): Promise<JerseyOrder> => {
    if (!db) throw new Error("Firebase DB not initialized");
    const orderRef = db.collection('jersey_orders').doc(orderId);
    
    const updates = {
        status: 'CONFIRMED',
        receiptNumber: receiptData.number,
        amountCharged: financials.charged,
        balanceDue: financials.balance
    };

    await orderRef.update(updates);

    // Generate receipt logic here...
    const newReceipt: Omit<Receipt, 'id'> = {
        number: receiptData.number,
        date: new Date().toISOString(),
        amount: receiptData.amount,
        description: `Jersey Order Confirmation`,
        type: 'JERSEY',
        generatedBy: receiptData.generatedBy,
        payerName: 'Member', 
        payerEmail: 'N/A',
        payerPhone: 'N/A',
        payerRole: 'Member',
        receiverName: 'Admin',
        receiverRole: 'Admin',
        receiverPhone: 'N/A',
        receiverEmail: 'N/A',
        modeOfPayment: 'Cash'
    };
    
    await FirebaseService.addManualReceipt(newReceipt);
    
    const updatedSnap = await orderRef.get();
    return { id: updatedSnap.id, ...updatedSnap.data() } as JerseyOrder;
  },

  getReceipts: async (): Promise<Receipt[]> => {
    return safeDbOp(async () => {
        const snapshot = await db.collection('receipts').orderBy('date', 'desc').get();
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Receipt));
    }, [], 'getReceipts');
  },

  addManualReceipt: async (r: Omit<Receipt, 'id'>): Promise<Receipt> => {
    if (!db) throw new Error("Firebase DB not initialized");
    const ref = await db.collection('receipts').add(r);
    const receiptWithId = { id: ref.id, ...r };
    
    try {
        await FirebaseService.sendReceiptEmail(receiptWithId.id);
    } catch (e) {
        console.warn("Auto-email failed, can retry manually.", e);
    }
    
    return receiptWithId;
  },

  // --- EMAILJS FUNCTIONALITY ---
  sendReceiptEmail: async (receiptId: string): Promise<void> => {
    if (!db) throw new Error("Firebase DB not initialized");
    if (!emailConfig.serviceId.startsWith('service_')) {
        console.warn("EmailJS not configured. Please add keys in services/firebase.ts");
        return;
    }

    const docRef = db.collection('receipts').doc(receiptId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        throw new Error("Receipt not found");
    }
    
    const data = docSnap.data() as Receipt;

    const templateParams = {
        to_name: data.payerName,
        to_email: data.payerEmail,
        receipt_number: data.number,
        amount: `UGX ${data.amount.toLocaleString()}`,
        date: new Date(data.date).toLocaleDateString(),
        description: data.description,
        payment_mode: data.modeOfPayment,
        receiver_name: data.receiverName || 'Admin'
    };

    try {
        console.log(`Attempting to send email to ${data.payerEmail}...`);
        const response = await emailjs.send(
            emailConfig.serviceId,
            emailConfig.templateId,
            templateParams,
            emailConfig.publicKey
        );
        console.log('EmailJS Success!', response.status, response.text);
    } catch (error) {
        console.error('EmailJS Failed:', error);
        throw new Error("Failed to send email. Please check your EmailJS keys and quota.");
    }
  },

  getAnnouncements: async (): Promise<Announcement[]> => {
    return safeDbOp(async () => {
        const snapshot = await db.collection('announcements').orderBy('date', 'desc').get();
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Announcement));
    }, [], 'getAnnouncements');
  },

  addAnnouncement: async (a: Omit<Announcement, 'id' | 'date'>): Promise<Announcement> => {
    if (!db) throw new Error("Firebase DB not initialized");
    const newA = { ...a, date: new Date().toISOString().split('T')[0] };
    try {
        const ref = await db.collection('announcements').add(newA);
        return { id: ref.id, ...newA };
    } catch(e: any) {
         if(e.code === 'permission-denied') throw new Error("Permission Denied: Database locked.");
         throw e;
    }
  },

  deleteAnnouncement: async (id: string): Promise<void> => {
      if (!db) throw new Error("Firebase DB not initialized");
      await db.collection('announcements').doc(id).delete();
  },

  getSocialStats: async (): Promise<SocialStats[]> => {
    return safeDbOp(async () => {
        const snapshot = await db.collection('social_stats').get();
        return snapshot.docs.map((doc: any) => doc.data() as SocialStats);
    }, [], 'getSocialStats');
  },

  updateSocialStats: async (stats: SocialStats[]): Promise<void> => {
      // Implementation omitted 
  },

  getSeasonStats: async (): Promise<SeasonStats> => {
    return safeDbOp(async () => {
        const snapshot = await db.collection('season_stats').get();
        if (!snapshot.empty) {
            return snapshot.docs[0].data() as SeasonStats;
        }
        return { seasonName: 'N/A', startDate: '', played: 0, total: 0 };
    }, { seasonName: 'N/A', startDate: '', played: 0, total: 0 }, 'getSeasonStats');
  },

  updateSeasonStats: async (stats: SeasonStats): Promise<void> => {
    if (!db) throw new Error("Firebase DB not initialized");
    const snapshot = await db.collection('season_stats').get();
    if (!snapshot.empty) {
        await snapshot.docs[0].ref.update(stats as any);
    } else {
        await db.collection('season_stats').add(stats);
    }
  },

  getAllUsers: async (): Promise<User[]> => {
      return safeDbOp(async () => {
          const snapshot = await db.collection('users').get();
          return snapshot.docs.map((d: any) => d.data() as User);
      }, [], 'getAllUsers');
  },

  updateUserRole: async (uid: string, newRole: UserRole): Promise<void> => {
      if (!db) throw new Error("Firebase DB not initialized");
      await db.collection('users').doc(uid).update({ role: newRole });
  },

  updateAnyUserDetails: async (uid: string, data: Partial<User>): Promise<void> => {
    if (!db) throw new Error("Firebase DB not initialized");
    await db.collection('users').doc(uid).update(data);
  },
  
  adminCreateUserDoc: async (uid: string, email: string): Promise<void> => {
     if (!db) throw new Error("Firebase DB not initialized");
     await db.collection('users').doc(uid).set({
         uid,
         email,
         username: email.split('@')[0],
         role: UserRole.L4_ADMIN,
         createdAt: new Date().toISOString()
     });
  }
};


// --- HTML GENERATOR HELPERS ---

export const generateHtmlReceipt = (data: Receipt): string => {
  const dateStr = new Date(data.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const formattedAmount = `UGX ${data.amount.toLocaleString()}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AKACHAI FC Receipt ${data.number}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #111827; 
        }
        @media print {
            body {
                background: white !important;
                margin: 0;
            }
            #receipt-container {
                box-shadow: none !important;
                border: none !important;
                transform: none !important;
                max-width: none !important;
                width: 100%;
                min-height: 100vh;
                margin: 0;
                padding: 0;
            }
            #print-button {
                display: none !important;
            }
        }
    </style>
</head>
<body class="p-4 sm:p-8 flex flex-col items-center justify-center min-h-screen">

    <div class="w-full max-w-2xl mb-6 print:hidden">
        <button id="print-button" onclick="window.print()" class="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg shadow-xl transition duration-300">
            Print Receipt
        </button>
    </div>

    <div id="receipt-container" class="w-full max-w-2xl bg-gray-900 shadow-2xl rounded-xl overflow-hidden border-4 border-yellow-500 transform transition duration-500 hover:shadow-yellow-500/50">

        <header id="receipt-header" class="bg-gray-800 p-6 flex justify-between items-center border-b-2 border-yellow-500">
            <div>
                <h1 class="text-4xl font-extrabold text-yellow-500 tracking-widest">AKACHAI FC</h1>
                <p class="text-sm font-light text-gray-400 mt-1">AFANDE NI OB</p>
            </div>
            <div class="text-right">
                <p class="text-xl font-bold text-white mb-1">PAYMENT RECEIPT</p>
                <p class="text-sm font-semibold text-yellow-400">RECEIPT NO: ${data.number}</p>
                <p class="text-xs text-gray-400">Date: ${dateStr}</p>
            </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-8 border-b border-gray-700">
            <div>
                <h3 class="text-lg font-bold text-yellow-500 mb-2 border-b border-yellow-500/50 pb-1">FROM (Payer)</h3>
                <p class="text-white text-lg font-semibold">${data.payerName}</p>
                <p class="text-gray-300">${data.payerRole}</p>
                <p class="text-gray-400 text-sm">Phone: ${data.payerPhone}</p>
                <p class="text-gray-400 text-sm">Email: ${data.payerEmail}</p>
            </div>
            <div class="md:text-right">
                <h3 class="text-lg font-bold text-yellow-500 mb-2 border-b border-yellow-500/50 pb-1">RECEIVED BY</h3>
                <p class="text-white text-lg font-semibold">${data.receiverName}</p>
                <p class="text-gray-300">${data.receiverRole}, AKACHAI FC</p>
                <p class="text-gray-400 text-sm">Contact: ${data.receiverPhone}</p>
                <p class="text-gray-400 text-sm">Email: ${data.receiverEmail}</p>
            </div>
        </div>

        <div class="p-6 md:p-8">
            <h3 class="text-xl font-bold text-yellow-500 mb-4">CONTRIBUTION DETAILS</h3>
            <div class="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">

                <div class="grid grid-cols-3 text-sm font-semibold text-gray-100 bg-gray-700 p-3">
                    <div class="col-span-2">Description</div>
                    <div class="text-right">Amount</div>
                </div>

                <div class="grid grid-cols-3 items-center text-gray-300 p-3 border-t border-gray-700">
                    <div class="col-span-2 text-base">
                        ${data.description}
                    </div>
                    <div class="text-right text-lg font-bold text-yellow-400">
                        ${formattedAmount}
                    </div>
                </div>
            </div>
        </div>

        <div class="p-6 md:p-8 bg-gray-800">
            <div class="flex justify-between items-center mb-4 border-t-2 border-yellow-500 pt-4">
                <p class="text-xl font-bold text-white">MODE OF PAYMENT</p>
                <p class="text-xl font-extrabold text-yellow-400">${data.modeOfPayment}</p>
            </div>
            <div class="flex justify-between items-center mb-6">
                <p class="text-3xl font-extrabold text-yellow-500">TOTAL</p>
                <p class="text-3xl font-extrabold text-yellow-500">${formattedAmount}</p>
            </div>

            <div class="p-4 bg-gray-700 rounded-lg border-l-4 border-yellow-500/70">
                <p class="text-xs text-gray-300 italic">
                    • This payment is deeply appreciated. It ensures we can continue essential club operations, training, and equipment maintenance. Your support is our foundation. Thank you for being a vital part of Akachai FC.
                </p>
                <p class="text-right text-yellow-400 font-extrabold mt-2 text-lg">#KATAKWITA</p>
            </div>
        </div>

    </div>

</body>
</html>`;
};