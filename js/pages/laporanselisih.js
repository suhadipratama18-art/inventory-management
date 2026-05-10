const PageLaporanSelisih = {
    q: '', mode: 'all', pg: 1, perPg: 20,

    async render() {
        document.getElementById('pageContent').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-exchange-alt"></i> Laporan Selisih</h3>
                <div class="btn-group">
                    <button class="btn btn-success btn-sm" onclick="PageLaporanSelisih.exportExcel()"><i class="fas fa-file-excel"></i> Excel</button>
                    <button class="btn btn-danger  btn-sm" onclick="PageLaporanSelisih.exportPDF()"><i class="fas fa-file-pdf"></i> PDF</button>
                </div>
            </div>
            <div class="card-body">
                <div class="tab-bar">
                    <div class="tab-item ${this.mode === 'all' ? 'active' : ''}" onclick="PageLaporanSelisih.setMode('all')">Semua</div>
                    <div class="tab-item ${this.mode === 'match' ? 'active' : ''}" onclick="PageLaporanSelisih.setMode('match')">Sesuai</div>
                    <div class="tab-item ${this.mode === 'plus' ? 'active' : ''}" onclick="PageLaporanSelisih.setMode('plus')">Lebih (+)</div>
                    <div class="tab-item ${this.mode === 'minus' ? 'active' : ''}" onclick="PageLaporanSelisih.setMode('minus')">Kurang (-)</div>
                </div>
                <div class="search-bar"><i class="fas fa-search"></i><input placeholder="Cari…" oninput="PageLaporanSelisih.search(this.value)"></div>
                <div class="so-summary" id="selSummary"></div>
                <div class="table-container"><table>
                    <thead><tr><th>No</th><th>Barcode</th><th>Nama</th><th>Qty Scan</th><th>Qty Sistem</th><th>Selisih</th><th>Lokasi</th><th>Status</th></tr></thead>
                    <tbody id="selTbody"></tbody>
                </table></div>
                <div id="selPagi" class="pagination mt-20"></div>
            </div>
        </div>`; await this.load();
    },

    async generate() {
        const [stok, scan] = await Promise.all([DB.getStokSistem(), DB.getDataScan()]);
        const done = new Set(), rep = [];
        stok.forEach(s => { const k = s.barcode + '_' + s.lokasi; const sc = scan.find(x => x.barcode === s.barcode && x.lokasi === s.lokasi); const qs = sc ? sc.qty : 0; const sel = qs - s.qty; rep.push({ barcode: s.barcode, namaBarang: s.namaBarang, qtyScan: qs, qtySistem: s.qty, selisih: sel, lokasi: s.lokasi, status: sel === 0 ? 'Sesuai' : sel > 0 ? 'Lebih' : 'Kurang' }); done.add(k); });
        scan.forEach(s => { const k = s.barcode + '_' + s.lokasi; if (!done.has(k)) rep.push({ barcode: s.barcode, namaBarang: s.namaBarang, qtyScan: s.qty, qtySistem: 0, selisih: s.qty, lokasi: s.lokasi, status: 'Lebih' }); });
        return rep;
    },

    async load() {
        const all = await this.generate();
        document.getElementById('selSummary').innerHTML = `<div class="so-summary-card green"><h4>${all.filter(d => d.selisih === 0).length}</h4><p>Sesuai</p></div><div class="so-summary-card"><h4>${all.filter(d => d.selisih > 0).length}</h4><p>Lebih</p></div><div class="so-summary-card orange"><h4>${all.filter(d => d.selisih < 0).length}</h4><p>Kurang</p></div>`;
        let data = all;
        if (this.mode === 'match') data = all.filter(d => d.selisih === 0);
        if (this.mode === 'plus') data = all.filter(d => d.selisih > 0);
        if (this.mode === 'minus') data = all.filter(d => d.selisih < 0);
        if (this.q) { const q = this.q.toLowerCase(); data = data.filter(d => d.barcode.toLowerCase().includes(q) || d.namaBarang.toLowerCase().includes(q)); }
        const pages = Math.ceil(data.length / this.perPg) || 1; if (this.pg > pages) this.pg = pages;
        const start = (this.pg - 1) * this.perPg; const slice = data.slice(start, start + this.perPg);
        document.getElementById('selTbody').innerHTML = !data.length
            ? '<tr><td colspan="8" style="padding:40px;text-align:center;color:var(--gray-light)">Tidak ada data selisih</td></tr>'
            : slice.map((d, i) => { const cls = d.selisih === 0 ? 'selisih-zero' : d.selisih > 0 ? 'selisih-positive' : 'selisih-negative'; const bdg = d.status === 'Sesuai' ? 'badge-success' : d.status === 'Lebih' ? 'badge-warning' : 'badge-danger'; return `<tr><td>${start + i + 1}</td><td><code>${d.barcode}</code></td><td>${d.namaBarang}</td><td>${d.qtyScan}</td><td>${d.qtySistem}</td><td class="${cls}">${d.selisih > 0 ? '+' : ''}${d.selisih}</td><td><span class="badge badge-info">${d.lokasi}</span></td><td><span class="badge ${bdg}">${d.status}</span></td></tr>`; }).join('');
        const c = document.getElementById('selPagi'); if (pages <= 1) { c.innerHTML = ''; return; } let h = `<button ${this.pg === 1 ? 'disabled' : ''} onclick="PageLaporanSelisih.go(${this.pg - 1})"><i class="fas fa-chevron-left"></i></button>`; for (let i = 1; i <= pages; i++) { if (i === 1 || i === pages || Math.abs(i - this.pg) <= 2) h += `<button class="${i === this.pg ? 'active' : ''}" onclick="PageLaporanSelisih.go(${i})">${i}</button>`; else if (Math.abs(i - this.pg) === 3) h += '<button disabled>…</button>'; } h += `<button ${this.pg === pages ? 'disabled' : ''} onclick="PageLaporanSelisih.go(${this.pg + 1})"><i class="fas fa-chevron-right"></i></button>`; c.innerHTML = h;
    },

    async setMode(m) { this.mode = m; this.pg = 1; await this.render(); },
    async go(p) { this.pg = p; await this.load(); },
    async search(v) { this.q = v; this.pg = 1; await this.load(); },

    async exportExcel() { const d = await this.generate(); if (!d.length) { App.toast('Tidak ada data', 'warning'); return; } App.exportExcel(d.map((x, i) => ({ 'No': i + 1, 'Barcode': x.barcode, 'Nama': x.namaBarang, 'Scan': x.qtyScan, 'Sistem': x.qtySistem, 'Selisih': x.selisih, 'Lokasi': x.lokasi, 'Status': x.status })), 'Laporan_Selisih'); App.toast('Export ✓', 'success'); },
    async exportPDF() { const d = await this.generate(); if (!d.length) { App.toast('Tidak ada data', 'warning'); return; } await App.exportPDF(['No', 'Barcode', 'Nama', 'Scan', 'Sistem', 'Selisih', 'Lokasi', 'Status'], d.map((x, i) => [i + 1, x.barcode, x.namaBarang, x.qtyScan, x.qtySistem, x.selisih, x.lokasi, x.status]), 'Laporan Selisih SO', 'Laporan_Selisih'); App.toast('Export ✓', 'success'); }
};