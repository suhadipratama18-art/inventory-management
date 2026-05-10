/* ============================================================
   db.js - DATABASE FIREBASE
   GANTI BAGIAN firebaseConfig DENGAN MILIK ANDA
   ============================================================ */

// ══════════════════════════════════════════════════════════
// 🔥 STEP 1: GANTI SEMUA NILAI DI BAWAH INI
//    Ambil dari: console.firebase.google.com
//    Project Settings → Your Apps → Web App → firebaseConfig
// ══════════════════════════════════════════════════════════

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAonLpoxT_WR21PWfVy5njOHR7dsNquPns",
  authDomain: "inventory-so.firebaseapp.com",
  databaseURL: "https://inventory-so-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "inventory-so",
  storageBucket: "inventory-so.firebasestorage.app",
  messagingSenderId: "481559282546",
  appId: "1:481559282546:web:1a4053e6ea7e5c0ff193eb"
};

// ══════════════════════════════════════════════════════════
// JANGAN UBAH KODE DI BAWAH INI
// ══════════════════════════════════════════════════════════

const DB = {
    _fb          : null,
    _connected   : false,
    _cache       : {},
    _syncCbs     : [],
    _readyPromise: null,
    _resolveReady: null,

    /* ── INIT ─────────────────────────────────────────── */
    init() {
        this._readyPromise = new Promise(resolve => {
            this._resolveReady = resolve;
        });

        try {
            // Cek config sudah diisi atau belum
            if (!FIREBASE_CONFIG.apiKey ||
                FIREBASE_CONFIG.apiKey === "AIzaSyAonLpoxT_WR21PWfVy5njOHR7dsNquPns") {
                console.warn('⚠️ Firebase config belum diisi! Pakai LocalStorage.');
                this._fallbackLocal();
                return;
            }

            // Init Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }

            this._fb = firebase.database();

            // Monitor status koneksi
            this._fb.ref('.info/connected').on('value', snap => {
                this._connected = snap.val() === true;
                this._updateConnUI();
            });

            // Init data default lalu setup realtime
            this._initDefaults().then(() => {
                this._setupRealtime();
                this._resolveReady();
                console.log('✅ Firebase berhasil terhubung!');
            }).catch(err => {
                console.error('Init defaults error:', err);
                this._resolveReady();
            });

        } catch (e) {
            console.warn('⚠️ Firebase error, fallback LocalStorage:', e);
            this._fallbackLocal();
        }
    },

    ready()    { return this._readyPromise; },
    isOnline() { return this._connected; },

    /* ── DEFAULT DATA ─────────────────────────────────── */
    async _initDefaults() {
        // Users default
        const userSnap = await this._fb.ref('users').once('value');
        if (!userSnap.exists()) {
            await this._fb.ref('users').set([
                { id:1, username:'admin',    password:'admin123',    role:'Administrator' },
                { id:2, username:'operator', password:'operator123', role:'Operator' }
            ]);
        }

        // Settings default
        const settSnap = await this._fb.ref('settings').once('value');
        if (!settSnap.exists()) {
            await this._fb.ref('settings').set({
                companyName : 'PT. Inventory Management',
                notifPopup  : true,
                notifSound  : true,
                autoSave    : true
            });
        }

        // Array kosong jika belum ada
        const keys = ['masterBarang', 'stokSistem', 'dataScan', 'logActivity'];
        for (const k of keys) {
            const snap = await this._fb.ref(k).once('value');
            if (!snap.exists()) {
                await this._fb.ref(k).set([]);
            }
        }
    },

    /* ── REALTIME SYNC ────────────────────────────────── */
    _setupRealtime() {
        const keys = [
            'masterBarang', 'stokSistem', 'dataScan',
            'logActivity', 'users', 'settings'
        ];

        keys.forEach(key => {
            this._fb.ref(key).on('value', snap => {
                const val = snap.val();
                this._cache[key] = val !== null ? val : (
                    key === 'settings' ? {} : []
                );
                // Backup ke localStorage
                try {
                    localStorage.setItem(
                        'ims_' + key,
                        JSON.stringify(this._cache[key])
                    );
                } catch(e) {}
                // Notify semua subscriber
                this._syncCbs.forEach(cb => cb({ key, value: this._cache[key] }));
            });
        });
    },

    /* ── PRESENCE (siapa yang online) ────────────────── */
    setPresence(username) {
        if (!this._fb) return;
        const ref = this._fb.ref('presence/' + this._sid());
        ref.set({
            username,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
        ref.onDisconnect().remove();
    },

    removePresence() {
        if (!this._fb) return;
        this._fb.ref('presence/' + this._sid()).remove();
    },

    async getOnlineUsers() {
        if (!this._fb) return [];
        try {
            const snap = await this._fb.ref('presence').once('value');
            if (!snap.exists()) return [];
            return Object.values(snap.val()).map(d => d.username);
        } catch { return []; }
    },

    _sid() {
        let id = sessionStorage.getItem('ims_sid');
        if (!id) {
            id = 'sid_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
            sessionStorage.setItem('ims_sid', id);
        }
        return id;
    },

    /* ── GET & SET ────────────────────────────────────── */
    async get(key) {
        // Ambil dari cache dulu (lebih cepat)
        if (this._cache[key] !== undefined) {
            return this._cache[key];
        }
        // Ambil dari Firebase
        if (this._fb) {
            try {
                const snap = await this._fb.ref(key).once('value');
                const val  = snap.val();
                this._cache[key] = val;
                return val;
            } catch(e) {
                return this._localGet(key);
            }
        }
        return this._localGet(key);
    },

    async set(key, value) {
        this._cache[key] = value;

        if (this._fb) {
            try {
                await this._fb.ref(key).set(
                    value === undefined ? null : value
                );
            } catch(e) {
                console.error('Firebase set error:', e);
                this._localSet(key, value);
            }
        } else {
            this._localSet(key, value);
        }
    },

    onSync(cb) {
        this._syncCbs.push(cb);
    },

    /* ── MASTER BARANG ────────────────────────────────── */
    async getMasterBarang() {
        const d = await this.get('masterBarang');
        return Array.isArray(d) ? d : [];
    },
    async setMasterBarang(d) {
        await this.set('masterBarang', d || []);
    },
    async findBarcode(bc) {
        const list = await this.getMasterBarang();
        return list.find(i => i.barcode === bc) || null;
    },

    /* ── STOK SISTEM ──────────────────────────────────── */
    async getStokSistem() {
        const d = await this.get('stokSistem');
        return Array.isArray(d) ? d : [];
    },
    async setStokSistem(d) {
        await this.set('stokSistem', d || []);
    },

    /* ── DATA SCAN ────────────────────────────────────── */
    async getDataScan() {
        const d = await this.get('dataScan');
        return Array.isArray(d) ? d : [];
    },
    async setDataScan(d) {
        await this.set('dataScan', d || []);
    },
    async addDataScan(items) {
        const cur = await this.getDataScan();
        items.forEach(ni => {
            const ex = cur.find(c =>
                c.barcode === ni.barcode && c.lokasi === ni.lokasi
            );
            if (ex) {
                ex.qty += ni.qty;
            } else {
                cur.push({ ...ni, id: Date.now() + Math.random() });
            }
        });
        await this.setDataScan(cur);
    },

    /* ── LOG ACTIVITY ─────────────────────────────────── */
    async getLogActivity() {
        const d = await this.get('logActivity');
        return Array.isArray(d) ? d : [];
    },
    async addLog(user, lokasi, totalQty) {
        const logs = await this.getLogActivity();
        logs.unshift({
            id       : Date.now(),
            user     : user,
            waktu    : new Date().toLocaleString('id-ID'),
            lokasi   : lokasi,
            totalQty : totalQty
        });
        await this.set('logActivity', logs);
    },

    /* ── USERS ────────────────────────────────────────── */
    async getUsers() {
        const d = await this.get('users');
        return Array.isArray(d) ? d : [];
    },
    async setUsers(d) {
        await this.set('users', d || []);
    },
    async authenticate(username, password) {
        const users = await this.getUsers();
        return users.find(u =>
            u.username === username && u.password === password
        ) || null;
    },

    /* ── SETTINGS ─────────────────────────────────────── */
    async getSettings() {
        const d = await this.get('settings');
        return d && typeof d === 'object' ? d : {};
    },
    async setSettings(d) {
        await this.set('settings', d);
    },

    /* ── SESSION (per browser, tetap localStorage) ────── */
    setCurrentUser(u) {
        localStorage.setItem('ims_session', JSON.stringify(u));
    },
    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('ims_session'));
        } catch { return null; }
    },
    clearSession() {
        localStorage.removeItem('ims_session');
    },

    /* ── UPDATE UI KONEKSI ────────────────────────────── */
    _updateConnUI() {
        // Top bar indicator
        const top = document.getElementById('topConnStatus');
        if (top) {
            if (this._connected) {
                top.className = 'conn-indicator';
                top.innerHTML = '<i class="fas fa-wifi"></i><span class="conn-label">Online</span>';
            } else {
                top.className = 'conn-indicator offline';
                top.innerHTML = '<i class="fas fa-wifi"></i><span class="conn-label">Offline</span>';
            }
        }
        // Login page indicator
        const login = document.getElementById('connStatus');
        if (login) {
            if (this._connected) {
                login.className = 'connection-status';
                login.innerHTML = '<span class="conn-dot online"></span><span>Online - Firebase</span>';
            } else {
                login.className = 'connection-status offline';
                login.innerHTML = '<span class="conn-dot offline"></span><span>Offline - LocalStorage</span>';
            }
        }
    },

    /* ── FALLBACK LOCAL STORAGE ───────────────────────── */
    _fallbackLocal() {
        this._fb        = null;
        this._connected = false;

        // BroadcastChannel untuk sync antar tab
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                this._bc = new BroadcastChannel('ims_sync');
                this._bc.onmessage = ev => {
                    this._cache[ev.data.key] = ev.data.value;
                    this._syncCbs.forEach(fn => fn(ev.data));
                };
            } catch(e) {}
        }

        // Set data default jika belum ada
        if (!this._localGet('users')) {
            this._localSet('users', [
                { id:1, username:'admin',    password:'admin123',    role:'Administrator' },
                { id:2, username:'operator', password:'operator123', role:'Operator' }
            ]);
        }
        if (!this._localGet('settings')) {
            this._localSet('settings', {
                companyName : 'PT. Inventory Management',
                notifPopup  : true,
                notifSound  : true,
                autoSave    : true
            });
        }
        ['masterBarang','stokSistem','dataScan','logActivity'].forEach(k => {
            if (!this._localGet(k)) this._localSet(k, []);
        });

        // Load ke cache
        ['masterBarang','stokSistem','dataScan','logActivity','users','settings']
            .forEach(k => {
                this._cache[k] = this._localGet(k);
            });

        this._updateConnUI();
        this._resolveReady();
    },

    _localGet(key) {
        try {
            const d = localStorage.getItem('ims_' + key);
            return d ? JSON.parse(d) : null;
        } catch { return null; }
    },

    _localSet(key, val) {
        try {
            localStorage.setItem('ims_' + key, JSON.stringify(val));
            if (this._bc) {
                this._bc.postMessage({ key, value: val });
            }
        } catch(e) { console.error('localStorage error:', e); }
    }
};

// Jalankan inisialisasi
DB.init();