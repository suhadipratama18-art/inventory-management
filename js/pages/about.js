/* ============================================================
   ABOUT
   ============================================================ */
const PageAbout = {
    render() {
        document.getElementById('pageContent').innerHTML = `
        <div class="about-header">
            <i class="fas fa-boxes-stacked about-icon"></i>
            <h2>Inventory Management System</h2>
            <p>Stock Opname Application v1.0.0</p>
            <p style="margin-top:6px;opacity:.7">Solusi lengkap pengelolaan stock opname</p>
        </div>

        <div class="card"><div class="card-body">
            <div class="settings-group">
                <h4><i class="fas fa-code"></i> Informasi Aplikasi</h4>
                ${[
                    ['Nama Aplikasi','Inventory Management System (IMS)'],
                    ['Versi','1.0.0'],
                    ['Platform','Web Browser (tanpa server)'],
                    ['Penyimpanan','LocalStorage browser'],
                    ['Sinkronisasi','BroadcastChannel API (antar tab)'],
                    ['Teknologi','HTML5, CSS3, Vanilla JavaScript'],
                    ['Lisensi','Free - Open Source'],
                ].map(([k,v])=>`
                    <div class="setting-item">
                        <div class="setting-label"><h5>${k}</h5><p>${v}</p></div>
                    </div>`).join('')}
            </div>
        </div></div>

        <div class="card">
            <div class="card-header"><h3><i class="fas fa-star"></i> Daftar Fitur</h3></div>
            <div class="card-body">
                <div class="feature-list">
                    ${[
                        ['fas fa-home',         'Home Dashboard',        'Ringkasan data & navigasi cepat ke semua menu'],
                        ['fas fa-barcode',      'Form Stock Opname',     'Scan barcode + auto-lookup master + manajemen lokasi rak'],
                        ['fas fa-database',     'Data Hasil Scan',       'Tampilkan, cari, hapus, export Excel & PDF'],
                        ['fas fa-box',          'Master Barang',         'Import Excel, tambah manual, download template'],
                        ['fas fa-warehouse',    'Stok Sistem',           'Import stok dari sistem untuk pembanding'],
                        ['fas fa-chart-bar',    'Grafik Progress',       'Donut chart, progress bar per lokasi, bar chart'],
                        ['fas fa-exchange-alt', 'Laporan Selisih',       'Perbandingan scan vs sistem, filter status, export'],
                        ['fas fa-history',      'Log Activity',          'Riwayat semua aktivitas scan SO'],
                        ['fas fa-cog',          'Setting Lengkap',       'Profil, perusahaan, user, backup & restore'],
                        ['fas fa-sync-alt',     'Multi-Tab Real-time',   'Sinkronisasi antar tab browser secara instan'],
                        ['fas fa-users',        'Multi User',            'Dukungan banyak user dengan manajemen akun'],
                        ['fas fa-file-export',  'Export & Import',       'Excel, PDF, JSON backup & restore'],
                    ].map(([ic,h,p])=>`
                        <div class="feature-item">
                            <i class="${ic}"></i>
                            <div><h5>${h}</h5><p>${p}</p></div>
                        </div>`).join('')}
                </div>
            </div>
        </div>

        <div class="card"><div class="card-body text-center" style="padding:30px">
            <i class="fas fa-heart" style="font-size:24px;color:var(--danger);margin-bottom:10px;display:block"></i>
            <p style="color:var(--gray);font-size:14px">Dibuat untuk mempermudah proses Stock Opname ❤️</p>
            <p style="color:var(--gray-light);font-size:12px;margin-top:6px">
                © ${new Date().getFullYear()} Inventory Management System
            </p>
        </div></div>`;
    }
};