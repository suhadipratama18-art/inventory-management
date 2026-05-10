/* ============================================================
   APP CONTROLLER - FIREBASE ASYNC VERSION
   ============================================================ */
const App = {
    currentPage: 'home',
    _onlineInterval: null,

    async init() {
        // Tunggu database siap
        await DB.ready();
        this._hideLoading();
        this.checkAuth();
        this.bindEvents();
        this.startClock();
        this.setupSync();
        this._startOnlineTracker();
    },

    _hideLoading() {
        const el = document.getElementById('loadingScreen');
        if (el) {
            el.classList.add('fade-out');
            setTimeout(() => el.remove(), 600);
        }
    },

    /* ── AUTH ─────────────────────────────────────────── */
    checkAuth() {
        const user = DB.getCurrentUser();
        user ? this.showApp(user) : this.showLogin();
    },

    showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    },

    showApp(user) {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('sidebarUsername').textContent = user.username;
        document.getElementById('sidebarRole').textContent = user.role || 'User';
        DB.setPresence(user.username);
        this.navigate('home');
    },

    /* ── EVENTS ───────────────────────────────────────── */
    bindEvents() {
        // Login
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const u = document.getElementById('loginUsername').value.trim();
            const p = document.getElementById('loginPassword').value.trim();
            const user = await DB.authenticate(u, p);
            if (user) {
                DB.setCurrentUser({ username: user.username, role: user.role });
                this.showApp(user);
                this.toast('Selamat datang, ' + user.username + '!', 'success');
            } else {
                this.toast('Username atau password salah!', 'error');
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            DB.removePresence();
            DB.clearSession();
            this.showLogin();
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
            this.toast('Logout berhasil', 'info');
        });

        // Sidebar nav
        document.querySelectorAll('.menu-item[data-page]').forEach(item => {
            item.addEventListener('click', () => {
                this.navigate(item.dataset.page);
                document.getElementById('sidebar').classList.remove('mobile-open');
                const ov = document.querySelector('.sidebar-overlay');
                if (ov) ov.classList.remove('show');
            });
        });

        // Sidebar toggle desktop
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        // Mobile sidebar
        document.getElementById('mobileSidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.add('mobile-open');
            this._showOverlay();
        });

        // Modal close
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modalOverlay')) this.closeModal();
        });

        // Keyboard shortcut: Escape closes modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    },

    _showOverlay() {
        let ov = document.querySelector('.sidebar-overlay');
        if (!ov) {
            ov = document.createElement('div');
            ov.className = 'sidebar-overlay';
            document.body.appendChild(ov);
            ov.addEventListener('click', () => {
                document.getElementById('sidebar').classList.remove('mobile-open');
                ov.classList.remove('show');
            });
        }
        ov.classList.add('show');
    },

    /* ── NAVIGATE ─────────────────────────────────────── */
    async navigate(page) {
        this.currentPage = page;

        document.querySelectorAll('.menu-item').forEach(li => {
            li.classList.toggle('active', li.dataset.page === page);
        });

        const titles = {
            home: 'Home', formso: 'Form Stock Opname',
            datascan: 'Data Hasil Scan', masterbarang: 'Master Barang',
            stoksistem: 'Stok Sistem', grafik: 'Grafik Proses SO',
            laporanselisih: 'Laporan Selisih', logactivity: 'Log Activity',
            setting: 'Setting', about: 'About'
        };
        document.getElementById('pageTitle').textContent = titles[page] || page;

        const c = document.getElementById('pageContent');
        // Show loading indicator
        c.innerHTML = '<div class="text-center mt-20"><div class="loading-spinner" style="border-color:rgba(79,70,229,0.2);border-top-color:var(--primary);width:36px;height:36px;margin:0 auto"></div><p style="margin-top:12px;color:var(--gray)">Memuat data...</p></div>';
        c.style.animation = 'none';
        void c.offsetHeight;
        c.style.animation = 'fadeIn .3s ease';

        const pages = {
            home: PageHome, formso: PageFormSO, datascan: PageDataScan,
            masterbarang: PageMasterBarang, stoksistem: PageStokSistem,
            grafik: PageGrafik, laporanselisih: PageLaporanSelisih,
            logactivity: PageLogActivity, setting: PageSetting, about: PageAbout
        };

        try {
            await pages[page]?.render();
        } catch (e) {
            c.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i>
                <h4>Error memuat halaman</h4><p>${e.message}</p></div>`;
            console.error(e);
        }

        await this._updateNotif();
    },

    async _updateNotif() {
        try {
            const scan = await DB.getDataScan();
            const stok = await DB.getStokSistem();
            let cnt = 0;
            stok.forEach(s => {
                const sc = scan.find(x => x.barcode === s.barcode);
                if (!sc || sc.qty !== s.qty) cnt++;
            });
            const badge = document.getElementById('notifBadge');
            badge.textContent = cnt;
            badge.classList.toggle('hidden', cnt === 0);
        } catch (e) { }
    },

    /* ── CLOCK ────────────────────────────────────────── */
    startClock() {
        const el = document.getElementById('currentTime');
        const tick = () => el.textContent = new Date().toLocaleString('id-ID', {
            weekday: 'short', day: '2-digit', month: 'short',
            year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        tick(); setInterval(tick, 1000);
    },

    /* ── ONLINE TRACKER ───────────────────────────────── */
    _startOnlineTracker() {
        const update = async () => {
            try {
                const users = await DB.getOnlineUsers();
                const el = document.getElementById('onlineCount');
                if (el) el.textContent = users.length || 1;
            } catch (e) { }
        };
        update();
        this._onlineInterval = setInterval(update, 10000);
    },

    /* ── SYNC ─────────────────────────────────────────── */
    setupSync() {
        DB.onSync((data) => {
            // Auto-refresh halaman saat ada perubahan dari user lain
            if (['masterBarang', 'stokSistem', 'dataScan', 'logActivity'].includes(data.key)) {
                if (this.currentPage && this.currentPage !== 'formso') {
                    this.navigate(this.currentPage);
                }
            }
        });
    },

    /* ── TOAST ────────────────────────────────────────── */
    toast(msg, type = 'info') {
        const icons = {
            success: 'fas fa-check-circle', error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle', info: 'fas fa-info-circle'
        };
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `<i class="${icons[type]}"></i>
            <span class="toast-msg">${msg}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i></button>`;
        document.getElementById('toastContainer').appendChild(el);
        setTimeout(() => {
            el.style.animation = 'slideOutR .3s ease forwards';
            setTimeout(() => el.remove(), 300);
        }, 3500);
    },

    /* ── MODAL ────────────────────────────────────────── */
    showModal(html) {
        document.getElementById('modalContent').innerHTML = html;
        document.getElementById('modalOverlay').classList.remove('hidden');
    },
    closeModal() {
        document.getElementById('modalOverlay').classList.add('hidden');
    },

    /* ── EXPORT ───────────────────────────────────────── */
    exportExcel(data, filename) {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Data');
        XLSX.writeFile(wb, filename + '.xlsx');
    },
    async exportPDF(headers, rows, title, filename) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const s = await DB.getSettings();
        doc.setFontSize(16); doc.text(title, 14, 20);
        doc.setFontSize(10);
        doc.text('Tanggal   : ' + new Date().toLocaleString('id-ID'), 14, 28);
        doc.text('Perusahaan: ' + (s.companyName || ''), 14, 34);
        doc.autoTable({
            head: [headers], body: rows, startY: 40,
            styles: { fontSize: 9 }, headStyles: { fillColor: [79, 70, 229] }
        });
        doc.save(filename + '.pdf');
    },

    formatLokasi(val) {
        return String(parseInt(val) || 0).padStart(5, '0');
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());