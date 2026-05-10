const PageHome = {
    async render() {
        const [scan, master, stok, logs] = await Promise.all([
            DB.getDataScan(), DB.getMasterBarang(), DB.getStokSistem(), DB.getLogActivity()
        ]);
        const totalScanQty = scan.reduce((s, d) => s + d.qty, 0);
        const totalStokQty = stok.reduce((s, d) => s + d.qty, 0);
        const onlineUsers  = await DB.getOnlineUsers();

        document.getElementById('pageContent').innerHTML = `
        <div class="home-grid">
            <div class="stat-card" onclick="App.navigate('datascan')">
                <div class="stat-icon blue"><i class="fas fa-barcode"></i></div>
                <div class="stat-info"><h3>${scan.length}</h3><p>Item Data Scan</p></div>
            </div>
            <div class="stat-card" onclick="App.navigate('masterbarang')">
                <div class="stat-icon green"><i class="fas fa-box"></i></div>
                <div class="stat-info"><h3>${master.length}</h3><p>Master Barang</p></div>
            </div>
            <div class="stat-card" onclick="App.navigate('stoksistem')">
                <div class="stat-icon orange"><i class="fas fa-warehouse"></i></div>
                <div class="stat-info"><h3>${stok.length}</h3><p>Stok Sistem</p></div>
            </div>
            <div class="stat-card" onclick="App.navigate('logactivity')">
                <div class="stat-icon purple"><i class="fas fa-history"></i></div>
                <div class="stat-info"><h3>${logs.length}</h3><p>Log Activity</p></div>
            </div>
        </div>
        <div class="home-grid">
            <div class="stat-card">
                <div class="stat-icon cyan"><i class="fas fa-calculator"></i></div>
                <div class="stat-info"><h3>${totalScanQty}</h3><p>Total Qty Terhitung</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon red"><i class="fas fa-chart-line"></i></div>
                <div class="stat-info"><h3>${totalStokQty}</h3><p>Total Qty Sistem</p></div>
            </div>
        </div>

        <h3 class="section-title"><i class="fas fa-users"></i> User Online (${onlineUsers.length})</h3>
        <div class="home-grid" style="margin-bottom:16px">
            ${onlineUsers.map(u => `
                <div class="stat-card" style="cursor:default">
                    <div class="stat-icon green" style="width:40px;height:40px;font-size:16px">
                        <i class="fas fa-user"></i></div>
                    <div class="stat-info"><h3 style="font-size:16px">${u}</h3>
                        <p><span class="conn-dot online" style="margin-right:4px"></span> Online</p></div>
                </div>`).join('')}
        </div>

        <h3 class="section-title"><i class="fas fa-th-large"></i> Menu Utama</h3>
        <div class="home-menu-grid">
            <div class="menu-card so"       onclick="App.navigate('formso')">
                <i class="fas fa-barcode"></i><h4>Form SO</h4><p>Scan kode barang</p></div>
            <div class="menu-card datascan" onclick="App.navigate('datascan')">
                <i class="fas fa-database"></i><h4>Data Scan</h4><p>Hasil scan SO</p></div>
            <div class="menu-card master"   onclick="App.navigate('masterbarang')">
                <i class="fas fa-box"></i><h4>Master Barang</h4><p>Data master SKU</p></div>
            <div class="menu-card stok"     onclick="App.navigate('stoksistem')">
                <i class="fas fa-warehouse"></i><h4>Stok Sistem</h4><p>Data stok gudang</p></div>
            <div class="menu-card grafik"   onclick="App.navigate('grafik')">
                <i class="fas fa-chart-bar"></i><h4>Grafik</h4><p>Proses pengerjaan</p></div>
            <div class="menu-card selisih"  onclick="App.navigate('laporanselisih')">
                <i class="fas fa-exchange-alt"></i><h4>Lap. Selisih</h4><p>Perbandingan</p></div>
            <div class="menu-card log"      onclick="App.navigate('logactivity')">
                <i class="fas fa-history"></i><h4>Log Activity</h4><p>Riwayat</p></div>
            <div class="menu-card setting"  onclick="App.navigate('setting')">
                <i class="fas fa-cog"></i><h4>Setting</h4><p>Pengaturan</p></div>
            <div class="menu-card about"    onclick="App.navigate('about')">
                <i class="fas fa-info-circle"></i><h4>About</h4><p>Tentang</p></div>
        </div>`;
    }
};