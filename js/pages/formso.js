/* ============================================================
   FORM STOCK OPNAME - ALUR BARU
   ============================================================
   ALUR:
   1. Input Lokasi → Enter → Lokasi terkunci
   2. Scan Barcode → Enter → Nama barang otomatis muncul
   3. Input Qty → Enter → Masuk ke tabel
   4. Kursor otomatis kembali ke Barcode
   5. Jika barcode sama → qty bertambah otomatis
   6. Klik Simpan → data masuk ke database
   ============================================================ */

const PageFormSO = {
    items      : [],      // item sementara sebelum simpan
    selIdx     : -1,      // index item terpilih di tabel
    lokasiLock : false,   // true = lokasi sudah dikunci
    lokasiVal  : '',      // nilai lokasi yang sudah dikunci
    step       : 'lokasi', // step aktif: 'lokasi' | 'barcode' | 'qty'

    async render() {
        const user = DB.getCurrentUser();
        const totalQty = this.items.reduce((s, i) => s + i.qty, 0);

        document.getElementById('pageContent').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-clipboard-check"></i> Form Stock Opname</h3>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                    <span class="badge badge-info">User: ${user?.username || '-'}</span>
                    ${DB.isOnline && DB.isOnline() ? '<span class="firebase-badge"><i class="fas fa-cloud"></i> Real-time</span>' : ''}
                </div>
            </div>
            <div class="card-body">

                <!-- ══ RINGKASAN ══ -->
                <div class="so-summary">
                    <div class="so-summary-card">
                        <h4 id="cntItems">${this.items.length}</h4>
                        <p>Total Item</p>
                    </div>
                    <div class="so-summary-card green">
                        <h4 id="cntQty">${totalQty}</h4>
                        <p>Total Qty</p>
                    </div>
                    <div class="so-summary-card orange">
                        <h4 id="cntLokasi">${this.lokasiLock ? this.lokasiVal : '-'}</h4>
                        <p>Lokasi Rak</p>
                    </div>
                </div>

                <!-- ══ STEP INDICATOR ══ -->
                <div class="step-indicator" id="stepIndicator">
                    <div class="step-item ${this.step === 'lokasi' ? 'active' : (this.lokasiLock ? 'done' : '')}" id="stepLokasi">
                        <div class="step-num">${this.lokasiLock ? '<i class="fas fa-check"></i>' : '1'}</div>
                        <span>Lokasi Rak</span>
                    </div>
                    <div class="step-line ${this.lokasiLock ? 'done' : ''}"></div>
                    <div class="step-item ${this.step === 'barcode' ? 'active' : ''}" id="stepBarcode">
                        <div class="step-num">2</div>
                        <span>Scan Barcode</span>
                    </div>
                    <div class="step-line ${this.step === 'qty' ? 'done' : ''}"></div>
                    <div class="step-item ${this.step === 'qty' ? 'active' : ''}" id="stepQty">
                        <div class="step-num">3</div>
                        <span>Input Qty</span>
                    </div>
                </div>

                <!-- ══ FORM USER (hidden) ══ -->
                <input type="hidden" id="soUser" value="${user?.username || ''}">

                <!-- ══ STEP 1: LOKASI ══ -->
                <div class="form-step" id="formStepLokasi" ${this.lokasiLock ? 'style="display:none"' : ''}>
                    <div class="scan-box">
                        <div class="scan-label">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>STEP 1 — Masukkan Nomor Lokasi Rak</span>
                        </div>
                        <div class="scan-input-group">
                            <input type="number" id="soLokasi"
                                   class="scan-input-big"
                                   placeholder="Contoh: 1 → otomatis 00001"
                                   min="1" max="99999" autofocus
                                   onkeydown="if(event.key==='Enter'){PageFormSO.lockLokasi();event.preventDefault();}">
                            <button class="btn btn-primary btn-lg" onclick="PageFormSO.lockLokasi()">
                                <i class="fas fa-lock"></i> Kunci Lokasi
                            </button>
                        </div>
                        <p class="scan-hint">Tekan <kbd>Enter</kbd> untuk mengunci lokasi</p>
                    </div>
                </div>

                <!-- ══ LOKASI TERKUNCI (tampil setelah dikunci) ══ -->
                <div class="locked-lokasi ${this.lokasiLock ? '' : 'hidden'}" id="lockedLokasiBar">
                    <div class="locked-info">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>Lokasi Rak: <strong id="lockedLokasiText">${this.lokasiVal}</strong></span>
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="PageFormSO.unlockLokasi()">
                        <i class="fas fa-unlock"></i> Ganti Lokasi
                    </button>
                </div>

                <!-- ══ STEP 2: BARCODE ══ -->
                <div class="form-step ${this.lokasiLock && this.step === 'barcode' ? '' : 'hidden'}" id="formStepBarcode">
                    <div class="scan-box barcode-box">
                        <div class="scan-label">
                            <i class="fas fa-barcode"></i>
                            <span>STEP 2 — Scan atau Ketik Barcode</span>
                        </div>
                        <div class="scan-input-group">
                            <input type="text" id="soBarcode"
                                   class="scan-input-big"
                                   placeholder="Scan barcode di sini…"
                                   onkeydown="if(event.key==='Enter'){PageFormSO.confirmBarcode();event.preventDefault();}">
                        </div>
                        <div class="barcode-preview ${this.step === 'barcode' ? '' : 'hidden'}" id="barcodePreview">
                            <div class="preview-label">Nama Barang:</div>
                            <div class="preview-value" id="previewNama">-</div>
                        </div>
                        <p class="scan-hint">Tekan <kbd>Enter</kbd> setelah scan barcode</p>
                    </div>
                </div>

                <!-- ══ STEP 3: QTY ══ -->
                <div class="form-step ${this.step === 'qty' ? '' : 'hidden'}" id="formStepQty">
                    <div class="scan-box qty-box">
                        <div class="scan-label">
                            <i class="fas fa-calculator"></i>
                            <span>STEP 3 — Masukkan Jumlah Qty</span>
                        </div>
                        <div class="qty-info-bar" id="qtyInfoBar">
                            <div class="qty-barcode"><i class="fas fa-barcode"></i> <span id="qtyBarcodeText">-</span></div>
                            <div class="qty-nama"><i class="fas fa-box"></i> <span id="qtyNamaText">-</span></div>
                        </div>
                        <div class="scan-input-group">
                            <input type="number" id="soQty"
                                   class="scan-input-big qty-input"
                                   placeholder="Masukkan jumlah qty"
                                   min="1" value="1"
                                   onkeydown="if(event.key==='Enter'){PageFormSO.addToTable();event.preventDefault();}">
                            <button class="btn btn-success btn-lg" onclick="PageFormSO.addToTable()">
                                <i class="fas fa-plus-circle"></i> Tambah
                            </button>
                        </div>
                        <p class="scan-hint">Tekan <kbd>Enter</kbd> untuk menambahkan ke tabel</p>
                    </div>
                </div>

                <!-- ══ TOMBOL AKSI ══ -->
                <div class="btn-group mt-20">
                    <button class="btn btn-success btn-lg" onclick="PageFormSO.simpan()">
                        <i class="fas fa-save"></i> Simpan Semua
                    </button>
                    <button class="btn btn-info" onclick="PageFormSO.editItem()">
                        <i class="fas fa-edit"></i> Edit Qty
                    </button>
                    <button class="btn btn-danger" onclick="PageFormSO.hapusItem()">
                        <i class="fas fa-trash"></i> Hapus Item
                    </button>
                    <button class="btn btn-secondary" onclick="PageFormSO.batal()">
                        <i class="fas fa-undo"></i> Batal / Reset
                    </button>
                </div>
            </div>
        </div>

        <!-- ══ TABEL HASIL SCAN ══ -->
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-table"></i> Tabel Hasil Scan</h3>
                <span class="badge badge-info" id="tableCountBadge">${this.items.length} item</span>
            </div>
            <div class="card-body" style="padding:0">
                <div class="table-container">
                    <table id="soTable">
                        <thead>
                            <tr>
                                <th style="width:50px">No</th>
                                <th>Barcode</th>
                                <th>Nama Barang</th>
                                <th style="width:80px">Qty</th>
                                <th style="width:100px">Lokasi</th>
                            </tr>
                        </thead>
                        <tbody id="soTableBody">
                            ${this._renderTableRows()}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card-footer">
                <span style="font-size:13px;color:var(--gray)">
                    <i class="fas fa-info-circle"></i> Klik baris tabel untuk memilih item
                </span>
                <span style="font-size:15px;font-weight:700;color:var(--primary)">
                    Total Qty: <span id="footerTotalQty">${totalQty}</span>
                </span>
            </div>
        </div>`;

        // CSS tambahan untuk form SO
        this._injectStyles();

        // Auto-focus berdasarkan step
        setTimeout(() => this._focusCurrentStep(), 150);

        // Setup barcode live preview
        this._setupBarcodePreview();
    },

    /* ══════════════════════════════════════════════════════
       STEP 1: LOKASI
    ══════════════════════════════════════════════════════ */
    lockLokasi() {
        const input = document.getElementById('soLokasi');
        const val = input?.value?.trim();

        if (!val || parseInt(val) < 1) {
            App.toast('Masukkan nomor lokasi rak yang valid!', 'warning');
            input?.focus();
            return;
        }

        this.lokasiVal = App.formatLokasi(val);
        this.lokasiLock = true;
        this.step = 'barcode';

        // Update UI
        document.getElementById('formStepLokasi').style.display = 'none';
        document.getElementById('lockedLokasiBar').classList.remove('hidden');
        document.getElementById('lockedLokasiText').textContent = this.lokasiVal;
        document.getElementById('cntLokasi').textContent = this.lokasiVal;
        document.getElementById('formStepBarcode').classList.remove('hidden');

        this._updateStepIndicator();
        App.toast(`Lokasi ${this.lokasiVal} terkunci ✓`, 'success');

        setTimeout(() => document.getElementById('soBarcode')?.focus(), 100);
    },

    unlockLokasi() {
        if (this.items.length > 0) {
            App.showModal(`
                <h3><i class="fas fa-exclamation-triangle" style="color:var(--warning)"></i> Ganti Lokasi</h3>
                <p>Anda sudah memiliki <strong>${this.items.length} item</strong> di lokasi <strong>${this.lokasiVal}</strong>.</p>
                <p class="mt-10">Simpan dulu atau hapus semua item sebelum ganti lokasi.</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
                    <button class="btn btn-success" onclick="PageFormSO.simpan();App.closeModal()">
                        <i class="fas fa-save"></i> Simpan Dulu</button>
                    <button class="btn btn-danger" onclick="PageFormSO._forceUnlock()">
                        <i class="fas fa-trash"></i> Hapus & Ganti</button>
                </div>`);
            return;
        }
        this._doUnlock();
    },

    _forceUnlock() {
        this.items = [];
        this.selIdx = -1;
        App.closeModal();
        this._doUnlock();
    },

    _doUnlock() {
        this.lokasiLock = false;
        this.lokasiVal = '';
        this.step = 'lokasi';
        this.render();
    },

    /* ══════════════════════════════════════════════════════
       STEP 2: BARCODE
    ══════════════════════════════════════════════════════ */
    _setupBarcodePreview() {
        const bcInput = document.getElementById('soBarcode');
        if (!bcInput) return;

        bcInput.addEventListener('input', async () => {
            const bc = bcInput.value.trim();
            const previewEl = document.getElementById('previewNama');

            if (!bc) {
                if (previewEl) previewEl.textContent = '-';
                return;
            }

            const item = await DB.findBarcode(bc);
            if (previewEl) {
                if (item) {
                    previewEl.textContent = item.namaBarang;
                    previewEl.classList.add('found');
                    previewEl.classList.remove('not-found');
                } else {
                    previewEl.textContent = '(Tidak ditemukan di master)';
                    previewEl.classList.add('not-found');
                    previewEl.classList.remove('found');
                }
            }
        });
    },

    _currentBarcode: '',
    _currentNama: '',

    async confirmBarcode() {
        const bcInput = document.getElementById('soBarcode');
        const bc = bcInput?.value?.trim();

        if (!bc) {
            App.toast('Scan atau masukkan barcode!', 'warning');
            bcInput?.focus();
            return;
        }

        // Lookup nama barang
        const item = await DB.findBarcode(bc);
        this._currentBarcode = bc;
        this._currentNama = item ? item.namaBarang : '(Tidak ada di master)';

        // Pindah ke step qty
        this.step = 'qty';

        // Hide barcode step, show qty step
        document.getElementById('formStepBarcode').classList.add('hidden');
        document.getElementById('formStepQty').classList.remove('hidden');

        // Set info di qty step
        document.getElementById('qtyBarcodeText').textContent = bc;
        document.getElementById('qtyNamaText').textContent = this._currentNama;

        // Reset qty input
        const qtyInput = document.getElementById('soQty');
        if (qtyInput) {
            qtyInput.value = 1;
        }

        this._updateStepIndicator();

        setTimeout(() => {
            const qtyEl = document.getElementById('soQty');
            if (qtyEl) {
                qtyEl.focus();
                qtyEl.select();
            }
        }, 100);
    },

    /* ══════════════════════════════════════════════════════
       STEP 3: QTY → MASUK KE TABEL
    ══════════════════════════════════════════════════════ */
    addToTable() {
        const qtyInput = document.getElementById('soQty');
        const qty = parseInt(qtyInput?.value) || 1;

        if (qty < 1) {
            App.toast('Qty minimal 1!', 'warning');
            qtyInput?.focus();
            return;
        }

        const bc = this._currentBarcode;
        const nama = this._currentNama;
        const lokasi = this.lokasiVal;

        // Cek apakah barcode sudah ada di tabel
        const existingIdx = this.items.findIndex(i => i.barcode === bc);

        if (existingIdx >= 0) {
            // Barcode sudah ada → qty bertambah
            this.items[existingIdx].qty += qty;
            App.toast(`${nama} → Qty +${qty} = ${this.items[existingIdx].qty}`, 'info');
        } else {
            // Barcode baru → tambah ke tabel
            this.items.push({
                barcode: bc,
                namaBarang: nama,
                qty: qty,
                lokasi: lokasi
            });
            App.toast(`✓ ${nama} (${qty}) ditambahkan`, 'success');
        }

        // Reset ke step barcode
        this._currentBarcode = '';
        this._currentNama = '';
        this.step = 'barcode';

        // Update UI
        document.getElementById('formStepQty').classList.add('hidden');
        document.getElementById('formStepBarcode').classList.remove('hidden');

        // Clear barcode input
        const bcInput = document.getElementById('soBarcode');
        if (bcInput) bcInput.value = '';
        const previewEl = document.getElementById('previewNama');
        if (previewEl) { previewEl.textContent = '-'; previewEl.className = 'preview-value'; }

        this._updateStepIndicator();
        this._updateTableAndSummary();

        // Focus kembali ke barcode
        setTimeout(() => {
            document.getElementById('soBarcode')?.focus();
        }, 100);
    },

    /* ══════════════════════════════════════════════════════
       TABEL
    ══════════════════════════════════════════════════════ */
    selectRow(idx) {
        this.selIdx = idx;
        document.querySelectorAll('#soTableBody tr').forEach((tr, i) => {
            tr.classList.toggle('row-selected', i === idx);
        });
    },

    _renderTableRows() {
        if (!this.items.length) {
            return `<tr class="empty-row">
                <td colspan="5">
                    <div class="table-empty">
                        <i class="fas fa-inbox"></i>
                        <p>Belum ada item discan</p>
                        <small>Scan barcode untuk menambahkan item</small>
                    </div>
                </td>
            </tr>`;
        }

        return this.items.map((it, i) => `
            <tr class="${i === this.selIdx ? 'row-selected' : ''}"
                onclick="PageFormSO.selectRow(${i})">
                <td class="text-center"><strong>${i + 1}</strong></td>
                <td><code class="barcode-text">${it.barcode}</code></td>
                <td>${it.namaBarang}</td>
                <td class="text-center">
                    <span class="qty-badge">${it.qty}</span>
                </td>
                <td class="text-center">
                    <span class="badge badge-info">${it.lokasi}</span>
                </td>
            </tr>
        `).join('');
    },

    _updateTableAndSummary() {
        // Update tabel
        const tbody = document.getElementById('soTableBody');
        if (tbody) tbody.innerHTML = this._renderTableRows();

        // Update summary
        const totalQty = this.items.reduce((s, i) => s + i.qty, 0);
        const cntItems = document.getElementById('cntItems');
        const cntQty = document.getElementById('cntQty');
        const footerQty = document.getElementById('footerTotalQty');
        const tableBadge = document.getElementById('tableCountBadge');

        if (cntItems) cntItems.textContent = this.items.length;
        if (cntQty) cntQty.textContent = totalQty;
        if (footerQty) footerQty.textContent = totalQty;
        if (tableBadge) tableBadge.textContent = this.items.length + ' item';
    },

    _updateStepIndicator() {
        const steps = ['lokasi', 'barcode', 'qty'];
        steps.forEach(s => {
            const el = document.getElementById('step' + s.charAt(0).toUpperCase() + s.slice(1));
            if (!el) return;
            el.classList.remove('active', 'done');
            if (s === this.step) {
                el.classList.add('active');
            } else if (
                (s === 'lokasi' && this.lokasiLock) ||
                (s === 'barcode' && this.step === 'qty')
            ) {
                el.classList.add('done');
            }
        });

        // Step lines
        document.querySelectorAll('.step-line').forEach((line, i) => {
            line.classList.remove('done');
            if (i === 0 && this.lokasiLock) line.classList.add('done');
            if (i === 1 && this.step === 'qty') line.classList.add('done');
        });
    },

    _focusCurrentStep() {
        switch (this.step) {
            case 'lokasi':
                document.getElementById('soLokasi')?.focus();
                break;
            case 'barcode':
                document.getElementById('soBarcode')?.focus();
                break;
            case 'qty':
                const qtyEl = document.getElementById('soQty');
                if (qtyEl) { qtyEl.focus(); qtyEl.select(); }
                break;
        }
    },

    /* ══════════════════════════════════════════════════════
       AKSI: EDIT, HAPUS, SIMPAN, BATAL
    ══════════════════════════════════════════════════════ */
    editItem() {
        if (this.selIdx < 0) {
            App.toast('Klik item di tabel yang akan diedit!', 'warning');
            return;
        }
        const it = this.items[this.selIdx];
        App.showModal(`
            <h3><i class="fas fa-edit"></i> Edit Qty</h3>
            <div class="form-group">
                <label>Barcode</label>
                <input value="${it.barcode}" readonly>
            </div>
            <div class="form-group">
                <label>Nama Barang</label>
                <input value="${it.namaBarang}" readonly>
            </div>
            <div class="form-group">
                <label>Qty</label>
                <input type="number" id="editQty" value="${it.qty}" min="1" autofocus>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
                <button class="btn btn-primary" onclick="PageFormSO.saveEdit()">
                    <i class="fas fa-save"></i> Simpan</button>
            </div>`);

        setTimeout(() => {
            const el = document.getElementById('editQty');
            if (el) { el.focus(); el.select(); }
        }, 200);
    },

    saveEdit() {
        const newQty = parseInt(document.getElementById('editQty').value) || 1;
        this.items[this.selIdx].qty = newQty;
        App.closeModal();
        App.toast('Qty diperbarui ✓', 'success');
        this._updateTableAndSummary();
    },

    hapusItem() {
        if (this.selIdx < 0) {
            App.toast('Klik item di tabel yang akan dihapus!', 'warning');
            return;
        }
        const it = this.items[this.selIdx];
        App.showModal(`
            <h3><i class="fas fa-trash" style="color:var(--danger)"></i> Hapus Item</h3>
            <p>Hapus <strong>${it.namaBarang}</strong> (Qty: ${it.qty})?</p>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
                <button class="btn btn-danger" onclick="PageFormSO._doHapus()">
                    <i class="fas fa-trash"></i> Hapus</button>
            </div>`);
    },

    _doHapus() {
        const nama = this.items[this.selIdx].namaBarang;
        this.items.splice(this.selIdx, 1);
        this.selIdx = -1;
        App.closeModal();
        App.toast(`${nama} dihapus`, 'success');
        this._updateTableAndSummary();
    },

    async simpan() {
        if (!this.items.length) {
            App.toast('Tidak ada data untuk disimpan!', 'warning');
            return;
        }

        const user = DB.getCurrentUser();
        const totalQty = this.items.reduce((s, i) => s + i.qty, 0);
        const lokasi = this.lokasiVal;

        App.showModal(`
            <h3><i class="fas fa-save" style="color:var(--success)"></i> Konfirmasi Simpan</h3>
            <div style="background:var(--light);padding:16px;border-radius:8px;margin-bottom:16px">
                <p><strong>Lokasi Rak:</strong> ${lokasi}</p>
                <p><strong>Jumlah Item:</strong> ${this.items.length}</p>
                <p><strong>Total Qty:</strong> ${totalQty}</p>
                <p><strong>User:</strong> ${user?.username}</p>
            </div>
            <p>Simpan data ke database?</p>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
                <button class="btn btn-success" onclick="PageFormSO._doSimpan()">
                    <i class="fas fa-save"></i> Ya, Simpan</button>
            </div>`);
    },

    async _doSimpan() {
        App.closeModal();

        const user = DB.getCurrentUser();
        const totalQty = this.items.reduce((s, i) => s + i.qty, 0);
        const lokasi = this.lokasiVal;

        // Simpan ke database
        await DB.addDataScan([...this.items]);
        await DB.addLog(user?.username || 'Unknown', lokasi, totalQty);

        App.toast(`✓ Tersimpan! ${this.items.length} item, Total Qty: ${totalQty}`, 'success');

        // Reset form
        this.items = [];
        this.selIdx = -1;
        this.lokasiLock = false;
        this.lokasiVal = '';
        this.step = 'lokasi';
        this._currentBarcode = '';
        this._currentNama = '';

        await this.render();
    },

    batal() {
        if (!this.items.length && !this.lokasiLock) {
            App.toast('Form sudah kosong', 'info');
            return;
        }

        App.showModal(`
            <h3><i class="fas fa-exclamation-triangle" style="color:var(--warning)"></i> Reset Form</h3>
            <p>Semua data yang belum disimpan akan hilang.</p>
            ${this.items.length > 0 ? `<p style="color:var(--danger);font-weight:600;margin-top:8px">${this.items.length} item akan dihapus!</p>` : ''}
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="App.closeModal()">Tidak</button>
                <button class="btn btn-warning" onclick="PageFormSO._doBatal()">
                    <i class="fas fa-undo"></i> Ya, Reset</button>
            </div>`);
    },

    _doBatal() {
        this.items = [];
        this.selIdx = -1;
        this.lokasiLock = false;
        this.lokasiVal = '';
        this.step = 'lokasi';
        this._currentBarcode = '';
        this._currentNama = '';
        App.closeModal();
        App.toast('Form direset', 'info');
        this.render();
    },

    /* ══════════════════════════════════════════════════════
       INJECT CSS TAMBAHAN
    ══════════════════════════════════════════════════════ */
    _injectStyles() {
        if (document.getElementById('formso-styles')) return;
        const style = document.createElement('style');
        style.id = 'formso-styles';
        style.textContent = `
            /* Step Indicator */
            .step-indicator {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0;
                margin-bottom: 24px;
                padding: 16px;
                background: var(--light);
                border-radius: var(--radius);
            }
            .step-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                color: var(--gray-light);
                transition: var(--transition);
            }
            .step-item.active {
                background: var(--primary);
                color: var(--white);
                box-shadow: 0 4px 12px rgba(79,70,229,0.3);
            }
            .step-item.done {
                background: rgba(16,185,129,0.1);
                color: var(--success);
            }
            .step-num {
                width: 28px; height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
                font-weight: 700;
                background: var(--gray-lighter);
                color: var(--gray);
            }
            .step-item.active .step-num {
                background: rgba(255,255,255,0.2);
                color: var(--white);
            }
            .step-item.done .step-num {
                background: var(--success);
                color: var(--white);
            }
            .step-line {
                width: 40px;
                height: 2px;
                background: var(--gray-lighter);
                margin: 0 4px;
                transition: var(--transition);
            }
            .step-line.done {
                background: var(--success);
            }

            /* Scan Box */
            .scan-box {
                border: 2px solid var(--gray-lighter);
                border-radius: var(--radius);
                padding: 24px;
                margin-bottom: 16px;
                transition: var(--transition);
                background: var(--white);
            }
            .scan-box:focus-within {
                border-color: var(--primary);
                box-shadow: 0 0 0 4px rgba(79,70,229,0.08);
            }
            .scan-box.barcode-box:focus-within {
                border-color: var(--info);
                box-shadow: 0 0 0 4px rgba(59,130,246,0.08);
            }
            .scan-box.qty-box:focus-within {
                border-color: var(--success);
                box-shadow: 0 0 0 4px rgba(16,185,129,0.08);
            }
            .scan-label {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 14px;
                font-size: 14px;
                font-weight: 700;
                color: var(--primary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .scan-label i { font-size: 18px; }
            .barcode-box .scan-label { color: var(--info); }
            .qty-box .scan-label { color: var(--success); }

            .scan-input-big {
                flex: 1;
                padding: 14px 18px !important;
                font-size: 18px !important;
                font-weight: 600;
                border: 2px solid var(--gray-lighter) !important;
                border-radius: var(--radius-sm) !important;
                transition: var(--transition);
            }
            .scan-input-big:focus {
                border-color: var(--primary) !important;
                box-shadow: 0 0 0 3px rgba(79,70,229,0.1) !important;
            }
            .qty-input:focus {
                border-color: var(--success) !important;
                box-shadow: 0 0 0 3px rgba(16,185,129,0.1) !important;
            }

            .scan-hint {
                margin-top: 10px;
                font-size: 12px;
                color: var(--gray-light);
            }
            .scan-hint kbd {
                background: var(--dark);
                color: var(--white);
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-family: monospace;
            }

            /* Barcode Preview */
            .barcode-preview {
                margin-top: 12px;
                padding: 12px 16px;
                background: var(--light);
                border-radius: var(--radius-sm);
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .preview-label {
                font-size: 13px;
                font-weight: 600;
                color: var(--gray);
                white-space: nowrap;
            }
            .preview-value {
                font-size: 15px;
                font-weight: 700;
                color: var(--dark);
            }
            .preview-value.found { color: var(--success); }
            .preview-value.not-found { color: var(--danger); font-size: 13px; }

            /* Qty Info Bar */
            .qty-info-bar {
                display: flex;
                gap: 20px;
                margin-bottom: 14px;
                padding: 12px 16px;
                background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
                border: 1px solid rgba(16,185,129,0.2);
                border-radius: var(--radius-sm);
                flex-wrap: wrap;
            }
            .qty-barcode, .qty-nama {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                font-weight: 600;
            }
            .qty-barcode i { color: var(--info); }
            .qty-nama i { color: var(--success); }

            /* Locked Lokasi Bar */
            .locked-lokasi {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 20px;
                background: linear-gradient(135deg, #fef3c7, #fef9c3);
                border: 2px solid rgba(245,158,11,0.3);
                border-radius: var(--radius-sm);
                margin-bottom: 16px;
            }
            .locked-info {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 15px;
                font-weight: 600;
                color: var(--dark);
            }
            .locked-info i { color: var(--warning); font-size: 18px; }

            /* Table Specific */
            #soTable tbody tr {
                cursor: pointer;
            }
            #soTable tbody tr.row-selected {
                background: rgba(79,70,229,0.08) !important;
                border-left: 3px solid var(--primary);
            }
            #soTable tbody tr:hover {
                background: rgba(79,70,229,0.04);
            }
            .barcode-text {
                font-family: 'Courier New', monospace;
                font-size: 13px;
                background: var(--light);
                padding: 2px 8px;
                border-radius: 4px;
            }
            .qty-badge {
                display: inline-block;
                background: var(--primary);
                color: var(--white);
                padding: 3px 14px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 700;
                min-width: 36px;
                text-align: center;
            }
            .table-empty {
                padding: 40px 20px;
                text-align: center;
                color: var(--gray-light);
            }
            .table-empty i {
                font-size: 48px;
                margin-bottom: 12px;
                display: block;
                opacity: 0.4;
            }
            .table-empty p {
                font-size: 15px;
                font-weight: 600;
                color: var(--gray);
            }
            .table-empty small {
                font-size: 12px;
            }
            .empty-row td { padding: 0 !important; }

            /* Form Step Animation */
            .form-step {
                animation: fadeIn 0.3s ease;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .step-indicator {
                    flex-wrap: wrap;
                    gap: 8px;
                    justify-content: center;
                }
                .step-line { width: 20px; }
                .step-item { padding: 6px 12px; font-size: 12px; }
                .step-item span { display: none; }
                .scan-input-big { font-size: 16px !important; padding: 12px 14px !important; }
                .locked-lokasi { flex-direction: column; gap: 10px; text-align: center; }
                .qty-info-bar { flex-direction: column; gap: 8px; }
                .scan-box { padding: 16px; }
            }
        `;
        document.head.appendChild(style);
    }
};