const PageStokSistem = {
    q: '', pg: 1, perPg: 20,

    async render() {
        document.getElementById('pageContent').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-warehouse"></i> Stok Sistem</h3>
                <div class="btn-group">
                    <button class="btn btn-primary btn-sm" onclick="PageStokSistem.showImport()"><i class="fas fa-file-import"></i> Import</button>
                    <button class="btn btn-success btn-sm" onclick="PageStokSistem.tambah()"><i class="fas fa-plus"></i> Tambah</button>
                    <button class="btn btn-info    btn-sm" onclick="PageStokSistem.template()"><i class="fas fa-download"></i> Template</button>
                    <button class="btn btn-danger  btn-sm" onclick="PageStokSistem.resetAll()"><i class="fas fa-undo"></i> Reset</button>
                </div>
            </div>
            <div class="card-body">
                <div class="search-bar"><i class="fas fa-search"></i>
                    <input placeholder="Cari…" oninput="PageStokSistem.search(this.value)"></div>
                <div class="table-container"><table>
                    <thead><tr><th>No</th><th>Barcode</th><th>Nama Barang</th><th>Qty</th><th>Lokasi</th><th>Aksi</th></tr></thead>
                    <tbody id="ssTbody"></tbody>
                </table></div>
                <div id="ssPagi" class="pagination mt-20"></div>
            </div>
            <div class="card-footer">
                <span id="ssInfo" style="font-size:13px;color:var(--gray)"></span>
                <span id="ssTotal" style="font-size:13px;font-weight:700;color:var(--primary)"></span>
            </div>
        </div>`; await this.load();
    },

    async filtered() { let d = await DB.getStokSistem(); if (this.q) { const q = this.q.toLowerCase(); d = d.filter(x => x.barcode.toLowerCase().includes(q) || x.namaBarang.toLowerCase().includes(q) || x.lokasi.includes(q)); } return d; },

    async load() {
        const data = await this.filtered(); const total = data.reduce((s, d) => s + d.qty, 0);
        const pages = Math.ceil(data.length / this.perPg) || 1; if (this.pg > pages) this.pg = pages;
        const start = (this.pg - 1) * this.perPg; const slice = data.slice(start, start + this.perPg);
        document.getElementById('ssTbody').innerHTML = !data.length
            ? '<tr><td colspan="6" style="padding:40px;text-align:center;color:var(--gray-light)"><i class="fas fa-warehouse" style="font-size:32px;display:block;margin-bottom:10px"></i>Belum ada data</td></tr>'
            : slice.map((d, i) => `<tr><td>${start + i + 1}</td><td><code>${d.barcode}</code></td><td>${d.namaBarang}</td><td><strong>${d.qty}</strong></td><td><span class="badge badge-info">${d.lokasi}</span></td><td><button class="btn btn-danger btn-sm" onclick="PageStokSistem.hapus(${start + i})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
        document.getElementById('ssInfo').textContent = `Total: ${data.length}`;
        document.getElementById('ssTotal').textContent = `Qty: ${total}`;
        const c = document.getElementById('ssPagi'); if (pages <= 1) { c.innerHTML = ''; return; } let h = `<button ${this.pg === 1 ? 'disabled' : ''} onclick="PageStokSistem.go(${this.pg - 1})"><i class="fas fa-chevron-left"></i></button>`; for (let i = 1; i <= pages; i++) { if (i === 1 || i === pages || Math.abs(i - this.pg) <= 2) h += `<button class="${i === this.pg ? 'active' : ''}" onclick="PageStokSistem.go(${i})">${i}</button>`; else if (Math.abs(i - this.pg) === 3) h += '<button disabled>…</button>'; } h += `<button ${this.pg === pages ? 'disabled' : ''} onclick="PageStokSistem.go(${this.pg + 1})"><i class="fas fa-chevron-right"></i></button>`; c.innerHTML = h;
    },
    async go(p) { this.pg = p; await this.load(); },
    async search(v) { this.q = v; this.pg = 1; await this.load(); },

    showImport() { App.showModal(`<h3><i class="fas fa-file-import"></i> Import Stok Sistem</h3><p style="margin-bottom:14px;font-size:13px;color:var(--gray)">Kolom: A=Barcode | B=Nama | C=Qty | D=Lokasi</p><div class="import-area" onclick="document.getElementById('ssFile').click()"><i class="fas fa-cloud-upload-alt"></i><p>Klik pilih file</p><p class="import-hint">.xlsx .xls .csv</p></div><input type="file" id="ssFile" accept=".xlsx,.xls,.csv" style="display:none" onchange="PageStokSistem.processImport(this)"><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Tutup</button></div>`); },

    async processImport(inp) { const file = inp.files[0]; if (!file) return; const r = new FileReader(); r.onload = async (e) => { try { const wb = XLSX.read(e.target.result, { type: 'binary' }); const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }); const start = (raw[0] && isNaN(raw[0][0]) && typeof raw[0][0] === 'string') ? 1 : 0; const imp = raw.slice(start).filter(r => r && r[0]).map(r => ({ barcode: String(r[0]).trim(), namaBarang: String(r[1] || '').trim(), qty: parseInt(r[2]) || 0, lokasi: App.formatLokasi(r[3] || '0') })); if (!imp.length) { App.toast('Tidak ada data valid', 'error'); return; } const ex = await DB.getStokSistem(); imp.forEach(ni => { const idx = ex.findIndex(e => e.barcode === ni.barcode && e.lokasi === ni.lokasi); idx >= 0 ? ex[idx] = ni : ex.push(ni); }); await DB.setStokSistem(ex); App.closeModal(); App.toast(`${imp.length} data diimport!`, 'success'); await this.load(); } catch (err) { App.toast('Error: ' + err.message, 'error'); } }; r.readAsBinaryString(file); },

    tambah() { App.showModal(`<h3><i class="fas fa-plus"></i> Tambah Stok</h3><div class="form-group"><label>Barcode</label><input id="ssBarcode" placeholder="Barcode"></div><div class="form-group"><label>Nama</label><input id="ssNama" placeholder="Nama barang"></div><div class="form-group"><label>Qty</label><input type="number" id="ssQty" value="0" min="0"></div><div class="form-group"><label>Lokasi</label><input type="number" id="ssLokasi" placeholder="1" min="1" max="99999"></div><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Batal</button><button class="btn btn-primary" onclick="PageStokSistem.saveTambah()"><i class="fas fa-save"></i> Simpan</button></div>`); },
    async saveTambah() { const bc = document.getElementById('ssBarcode').value.trim(); const nm = document.getElementById('ssNama').value.trim(); if (!bc || !nm) { App.toast('Wajib diisi!', 'warning'); return; } const d = await DB.getStokSistem(); d.push({ barcode: bc, namaBarang: nm, qty: parseInt(document.getElementById('ssQty').value) || 0, lokasi: App.formatLokasi(document.getElementById('ssLokasi').value) }); await DB.setStokSistem(d); App.closeModal(); App.toast('Ditambahkan', 'success'); await this.load(); },

    async hapus(idx) { const d = await DB.getStokSistem(); d.splice(idx, 1); await DB.setStokSistem(d); App.toast('Dihapus', 'success'); await this.load(); },

    resetAll() { App.showModal(`<h3><i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i> Reset</h3><p>Hapus semua stok sistem?</p><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Batal</button><button class="btn btn-danger" onclick="PageStokSistem._doReset()">Reset</button></div>`); },
    async _doReset() { await DB.setStokSistem([]); App.closeModal(); App.toast('Direset', 'success'); await this.load(); },

    template() { App.exportExcel([{ Barcode: '8991234567890', 'Nama Barang': 'Barang A', Qty: 100, 'Lokasi Rak': '00001' }, { Barcode: '8991234567891', 'Nama Barang': 'Barang B', Qty: 50, 'Lokasi Rak': '00002' }], 'Template_Stok_Sistem'); App.toast('Template ✓', 'success'); }
};