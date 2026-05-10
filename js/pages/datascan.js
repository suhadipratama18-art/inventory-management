const PageDataScan = {
    q: '', pg: 1, perPg: 20,

    async render() {
        document.getElementById('pageContent').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-database"></i> Data Hasil Scan</h3>
                <div class="btn-group">
                    <button class="btn btn-success btn-sm" onclick="PageDataScan.exportExcel()"><i class="fas fa-file-excel"></i> Excel</button>
                    <button class="btn btn-danger  btn-sm" onclick="PageDataScan.exportPDF()"><i class="fas fa-file-pdf"></i> PDF</button>
                    <button class="btn btn-warning btn-sm" onclick="PageDataScan.hapusPilihan()"><i class="fas fa-trash"></i> Hapus</button>
                    <button class="btn btn-secondary btn-sm" onclick="PageDataScan.resetAll()"><i class="fas fa-undo"></i> Reset</button>
                </div>
            </div>
            <div class="card-body">
                <div class="search-bar"><i class="fas fa-search"></i>
                    <input placeholder="Cari barcode/nama…" oninput="PageDataScan.search(this.value)"></div>
                <div class="table-container"><table>
                    <thead><tr>
                        <th><input type="checkbox" id="chkAll" onchange="PageDataScan.toggleAll(this.checked)"></th>
                        <th>No</th><th>Barcode</th><th>Nama Barang</th><th>Qty</th><th>Lokasi</th>
                    </tr></thead>
                    <tbody id="dsTbody"></tbody>
                </table></div>
                <div id="dsPagi" class="pagination mt-20"></div>
            </div>
            <div class="card-footer">
                <span id="dsInfo" style="font-size:13px;color:var(--gray)"></span>
                <span id="dsTotal" style="font-size:13px;font-weight:700;color:var(--primary)"></span>
            </div>
        </div>`;
        await this.load();
    },

    async filtered() {
        let d = await DB.getDataScan();
        if (this.q) { const q = this.q.toLowerCase(); d = d.filter(x => x.barcode.toLowerCase().includes(q) || x.namaBarang.toLowerCase().includes(q) || x.lokasi.includes(q)); }
        return d;
    },

    async load() {
        const data = await this.filtered();
        const total = data.reduce((s, d) => s + d.qty, 0);
        const pages = Math.ceil(data.length / this.perPg) || 1;
        if (this.pg > pages) this.pg = pages;
        const start = (this.pg - 1) * this.perPg;
        const slice = data.slice(start, start + this.perPg);
        document.getElementById('dsTbody').innerHTML = !data.length
            ? '<tr><td colspan="6" style="padding:40px;text-align:center;color:var(--gray-light)"><i class="fas fa-inbox" style="font-size:32px;display:block;margin-bottom:10px"></i>Tidak ada data</td></tr>'
            : slice.map((d, i) => `<tr>
                <td><input type="checkbox" class="rc" data-idx="${start + i}"></td>
                <td>${start + i + 1}</td><td><code>${d.barcode}</code></td><td>${d.namaBarang}</td>
                <td><strong>${d.qty}</strong></td><td><span class="badge badge-info">${d.lokasi}</span></td></tr>`).join('');
        document.getElementById('dsInfo').textContent = `${slice.length} dari ${data.length} data`;
        document.getElementById('dsTotal').textContent = `Total Qty: ${total}`;
        this._pagi(pages);
    },

    _pagi(tot) { const c = document.getElementById('dsPagi'); if (tot <= 1) { c.innerHTML = ''; return; } let h = `<button ${this.pg === 1 ? 'disabled' : ''} onclick="PageDataScan.go(${this.pg - 1})"><i class="fas fa-chevron-left"></i></button>`; for (let i = 1; i <= tot; i++) { if (i === 1 || i === tot || Math.abs(i - this.pg) <= 2) h += `<button class="${i === this.pg ? 'active' : ''}" onclick="PageDataScan.go(${i})">${i}</button>`; else if (Math.abs(i - this.pg) === 3) h += '<button disabled>…</button>'; } h += `<button ${this.pg === tot ? 'disabled' : ''} onclick="PageDataScan.go(${this.pg + 1})"><i class="fas fa-chevron-right"></i></button>`; c.innerHTML = h; },
    async go(p) { this.pg = p; await this.load(); },
    async search(v) { this.q = v; this.pg = 1; await this.load(); },
    toggleAll(v) { document.querySelectorAll('.rc').forEach(c => c.checked = v); },

    hapusPilihan() { const cks = [...document.querySelectorAll('.rc:checked')]; if (!cks.length) { App.toast('Pilih data!', 'warning'); return; } App.showModal(`<h3><i class="fas fa-trash" style="color:var(--danger)"></i> Hapus ${cks.length} Data</h3><p>Lanjutkan?</p><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Batal</button><button class="btn btn-danger" onclick="PageDataScan._doHapus()">Hapus</button></div>`); },
    async _doHapus() { const idxs = [...document.querySelectorAll('.rc:checked')].map(c => +c.dataset.idx); const d = (await DB.getDataScan()).filter((_, i) => !idxs.includes(i)); await DB.setDataScan(d); App.closeModal(); App.toast('Data dihapus', 'success'); await this.load(); },

    resetAll() { App.showModal(`<h3><i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i> Reset Semua</h3><p>Hapus semua data scan?</p><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Batal</button><button class="btn btn-danger" onclick="PageDataScan._doReset()">Reset</button></div>`); },
    async _doReset() { await DB.setDataScan([]); App.closeModal(); App.toast('Data direset', 'success'); await this.load(); },

    async exportExcel() { const d = await this.filtered(); if (!d.length) { App.toast('Tidak ada data', 'warning'); return; } App.exportExcel(d.map((x, i) => ({ 'No': i + 1, 'Barcode': x.barcode, 'Nama Barang': x.namaBarang, 'Qty': x.qty, 'Lokasi': x.lokasi })), 'Data_Scan_SO'); App.toast('Export Excel ✓', 'success'); },
    async exportPDF() { const d = await this.filtered(); if (!d.length) { App.toast('Tidak ada data', 'warning'); return; } await App.exportPDF(['No', 'Barcode', 'Nama Barang', 'Qty', 'Lokasi'], d.map((x, i) => [i + 1, x.barcode, x.namaBarang, x.qty, x.lokasi]), 'Data Scan SO', 'Data_Scan_SO'); App.toast('Export PDF ✓', 'success'); }
};