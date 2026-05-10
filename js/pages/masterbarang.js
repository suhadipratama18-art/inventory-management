const PageMasterBarang = {
    q: '', pg: 1, perPg: 20,

    async render() {
        document.getElementById('pageContent').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-box"></i> Master Barang</h3>
                <div class="btn-group">
                    <button class="btn btn-primary btn-sm" onclick="PageMasterBarang.showImport()"><i class="fas fa-file-import"></i> Import</button>
                    <button class="btn btn-success btn-sm" onclick="PageMasterBarang.tambah()"><i class="fas fa-plus"></i> Tambah</button>
                    <button class="btn btn-info    btn-sm" onclick="PageMasterBarang.template()"><i class="fas fa-download"></i> Template</button>
                    <button class="btn btn-danger  btn-sm" onclick="PageMasterBarang.resetAll()"><i class="fas fa-undo"></i> Reset</button>
                </div>
            </div>
            <div class="card-body">
                <div class="search-bar"><i class="fas fa-search"></i>
                    <input placeholder="Cari barcode/nama…" oninput="PageMasterBarang.search(this.value)"></div>
                <div class="table-container"><table>
                    <thead><tr><th>No</th><th>Barcode</th><th>Nama Barang</th><th>Harga Jual</th><th>Aksi</th></tr></thead>
                    <tbody id="mbTbody"></tbody>
                </table></div>
                <div id="mbPagi" class="pagination mt-20"></div>
            </div>
            <div class="card-footer"><span id="mbInfo" style="font-size:13px;color:var(--gray)"></span></div>
        </div>`;
        await this.load();
    },

    async filtered() { let d = await DB.getMasterBarang(); if (this.q) { const q = this.q.toLowerCase(); d = d.filter(x => x.barcode.toLowerCase().includes(q) || x.namaBarang.toLowerCase().includes(q)); } return d; },

    async load() {
        const data = await this.filtered(); const pages = Math.ceil(data.length / this.perPg) || 1;
        if (this.pg > pages) this.pg = pages; const start = (this.pg - 1) * this.perPg; const slice = data.slice(start, start + this.perPg);
        document.getElementById('mbTbody').innerHTML = !data.length
            ? '<tr><td colspan="5" style="padding:40px;text-align:center;color:var(--gray-light)"><i class="fas fa-box-open" style="font-size:32px;display:block;margin-bottom:10px"></i>Belum ada data</td></tr>'
            : slice.map((d, i) => `<tr><td>${start + i + 1}</td><td><code>${d.barcode}</code></td><td>${d.namaBarang}</td><td>Rp ${Number(d.hargaJual || 0).toLocaleString('id-ID')}</td><td><button class="btn btn-danger btn-sm" onclick="PageMasterBarang.hapus('${d.barcode}')"><i class="fas fa-trash"></i></button></td></tr>`).join('');
        document.getElementById('mbInfo').textContent = `Total: ${data.length} barang`;
        const c = document.getElementById('mbPagi'); if (pages <= 1) { c.innerHTML = ''; return; } let h = `<button ${this.pg === 1 ? 'disabled' : ''} onclick="PageMasterBarang.go(${this.pg - 1})"><i class="fas fa-chevron-left"></i></button>`; for (let i = 1; i <= pages; i++) { if (i === 1 || i === pages || Math.abs(i - this.pg) <= 2) h += `<button class="${i === this.pg ? 'active' : ''}" onclick="PageMasterBarang.go(${i})">${i}</button>`; else if (Math.abs(i - this.pg) === 3) h += '<button disabled>…</button>'; } h += `<button ${this.pg === pages ? 'disabled' : ''} onclick="PageMasterBarang.go(${this.pg + 1})"><i class="fas fa-chevron-right"></i></button>`; c.innerHTML = h;
    },
    async go(p) { this.pg = p; await this.load(); },
    async search(v) { this.q = v; this.pg = 1; await this.load(); },

    showImport() { App.showModal(`<h3><i class="fas fa-file-import"></i> Import Master Barang</h3><p style="margin-bottom:14px;font-size:13px;color:var(--gray)">Kolom: A=Barcode | B=Nama | C=Harga</p><div class="import-area" onclick="document.getElementById('mbFile').click()"><i class="fas fa-cloud-upload-alt"></i><p>Klik pilih file</p><p class="import-hint">.xlsx .xls .csv</p></div><input type="file" id="mbFile" accept=".xlsx,.xls,.csv" style="display:none" onchange="PageMasterBarang.processImport(this)"><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Tutup</button></div>`); },

    async processImport(inp) {
        const file = inp.files[0]; if (!file) return;
        const r = new FileReader();
        r.onload = async (e) => {
            try {
                const wb = XLSX.read(e.target.result, { type: 'binary' }); const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
                const start = (raw[0] && isNaN(raw[0][0]) && typeof raw[0][0] === 'string') ? 1 : 0;
                const imp = raw.slice(start).filter(r => r && r[0]).map(r => ({ barcode: String(r[0]).trim(), namaBarang: String(r[1] || '').trim(), hargaJual: parseFloat(r[2]) || 0 }));
                if (!imp.length) { App.toast('Tidak ada data valid', 'error'); return; }
                const ex = await DB.getMasterBarang(); imp.forEach(ni => { const idx = ex.findIndex(e => e.barcode === ni.barcode); idx >= 0 ? ex[idx] = ni : ex.push(ni); });
                await DB.setMasterBarang(ex); App.closeModal(); App.toast(`${imp.length} data diimport!`, 'success'); await this.load();
            } catch (err) { App.toast('Error: ' + err.message, 'error'); }
        }; r.readAsBinaryString(file);
    },

    tambah() { App.showModal(`<h3><i class="fas fa-plus"></i> Tambah Barang</h3><div class="form-group"><label>Barcode</label><input id="tBarcode" placeholder="Barcode"></div><div class="form-group"><label>Nama Barang</label><input id="tNama" placeholder="Nama barang"></div><div class="form-group"><label>Harga Jual</label><input type="number" id="tHarga" placeholder="0" min="0"></div><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Batal</button><button class="btn btn-primary" onclick="PageMasterBarang.saveTambah()"><i class="fas fa-save"></i> Simpan</button></div>`); },
    async saveTambah() { const bc = document.getElementById('tBarcode').value.trim(); const nm = document.getElementById('tNama').value.trim(); const hj = parseFloat(document.getElementById('tHarga').value) || 0; if (!bc || !nm) { App.toast('Barcode & Nama wajib!', 'warning'); return; } const d = await DB.getMasterBarang(); if (d.find(x => x.barcode === bc)) { App.toast('Barcode sudah ada!', 'warning'); return; } d.push({ barcode: bc, namaBarang: nm, hargaJual: hj }); await DB.setMasterBarang(d); App.closeModal(); App.toast('Ditambahkan', 'success'); await this.load(); },

    hapus(bc) { App.showModal(`<h3><i class="fas fa-trash" style="color:var(--danger)"></i> Hapus</h3><p>Hapus <strong>${bc}</strong>?</p><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Batal</button><button class="btn btn-danger" onclick="PageMasterBarang._doHapus('${bc}')">Hapus</button></div>`); },
    async _doHapus(bc) { await DB.setMasterBarang((await DB.getMasterBarang()).filter(d => d.barcode !== bc)); App.closeModal(); App.toast('Dihapus', 'success'); await this.load(); },

    resetAll() { App.showModal(`<h3><i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i> Reset</h3><p>Hapus semua master barang?</p><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Batal</button><button class="btn btn-danger" onclick="PageMasterBarang._doReset()">Reset</button></div>`); },
    async _doReset() { await DB.setMasterBarang([]); App.closeModal(); App.toast('Direset', 'success'); await this.load(); },

    template() { App.exportExcel([{ Barcode: '8991234567890', 'Nama Barang': 'Contoh A', 'Harga Jual': 15000 }, { Barcode: '8991234567891', 'Nama Barang': 'Contoh B', 'Harga Jual': 25000 }], 'Template_Master_Barang'); App.toast('Template didownload', 'success'); }
};