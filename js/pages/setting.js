const PageSetting = {
    async render() {
        const [cfg, users] = await Promise.all([DB.getSettings(), DB.getUsers()]);
        const cur = DB.getCurrentUser();
        document.getElementById('pageContent').innerHTML = `
        <div class="card"><div class="card-body"><div class="settings-group"><h4><i class="fas fa-user"></i> Profil</h4>
            <div class="setting-item"><div class="setting-label"><h5>Username</h5><p>${cur?.username || '-'}</p></div><span class="badge badge-info">${cur?.role || 'User'}</span></div>
            <div class="setting-item"><div class="setting-label"><h5>Ganti Password</h5><p>Ubah password</p></div><button class="btn btn-outline btn-sm" onclick="PageSetting.changePw()"><i class="fas fa-key"></i> Ubah</button></div>
        </div></div></div>

        <div class="card"><div class="card-body"><div class="settings-group"><h4><i class="fas fa-building"></i> Perusahaan</h4>
            <div class="setting-item"><div class="setting-label"><h5>Nama Perusahaan</h5><p>${cfg.companyName || '-'}</p></div><button class="btn btn-outline btn-sm" onclick="PageSetting.editComp()"><i class="fas fa-edit"></i> Edit</button></div>
        </div></div></div>

        <div class="card"><div class="card-body"><div class="settings-group"><h4><i class="fas fa-bell"></i> Notifikasi</h4>
            <div class="setting-item"><div class="setting-label"><h5>Popup</h5><p>Toast notification</p></div><div class="toggle-switch ${cfg.notifPopup ? 'active' : ''}" onclick="PageSetting.toggle('notifPopup',this)"></div></div>
            <div class="setting-item"><div class="setting-label"><h5>Auto Save</h5><p>Simpan otomatis</p></div><div class="toggle-switch ${cfg.autoSave ? 'active' : ''}" onclick="PageSetting.toggle('autoSave',this)"></div></div>
        </div></div></div>

        <div class="card">
            <div class="card-header"><h3><i class="fas fa-users"></i> Manajemen User</h3>
                <button class="btn btn-primary btn-sm" onclick="PageSetting.addUser()"><i class="fas fa-user-plus"></i> Tambah</button></div>
            <div class="card-body">${users.map(u => `<div class="user-list-item"><div class="user-details"><i class="fas fa-user-circle"></i><div><div class="u-name">${u.username}</div><div class="u-role">${u.role}</div></div></div>${u.username === 'admin' ? '<span class="badge badge-info">Default</span>' : `<button class="btn btn-danger btn-sm" onclick="PageSetting.delUser(${u.id})"><i class="fas fa-trash"></i></button>`}</div>`).join('')}</div>
        </div>

        <div class="card"><div class="card-body"><div class="settings-group"><h4><i class="fas fa-database"></i> Kelola Data</h4>
            <div class="setting-item"><div class="setting-label"><h5>Backup Data</h5><p>Download JSON</p></div><button class="btn btn-success btn-sm" onclick="PageSetting.backup()"><i class="fas fa-download"></i> Backup</button></div>
            <div class="setting-item"><div class="setting-label"><h5>Restore Data</h5><p>Pulihkan dari JSON</p></div><button class="btn btn-info btn-sm" onclick="PageSetting.restore()"><i class="fas fa-upload"></i> Restore</button></div>
            <div class="setting-item"><div class="setting-label"><h5 style="color:var(--danger)">Reset Semua</h5><p>Hapus semua data</p></div><button class="btn btn-danger btn-sm" onclick="PageSetting.resetAll()"><i class="fas fa-exclamation-triangle"></i> Reset</button></div>
        </div></div></div>`;
    },

    async toggle(key, el) { const cfg = await DB.getSettings(); cfg[key] = !cfg[key]; await DB.setSettings(cfg); el.classList.toggle('active'); App.toast(`${key} ${cfg[key] ? 'aktif' : 'nonaktif'}`, 'info'); },

    async editComp() { const cfg = await DB.getSettings(); App.showModal(`<h3><i class="fas fa-building"></i> Edit Perusahaan</h3><div class="form-group"><label>Nama</label><input id="compInput" value="${cfg.companyName || ''}"></div><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Batal</button><button class="btn btn-primary" onclick="PageSetting.saveComp()">Simpan</button></div>`); },
    async saveComp() { const v = document.getElementById('compInput').value.trim(); if (!v) return; const cfg = await DB.getSettings(); cfg.companyName = v; await DB.setSettings(cfg); App.closeModal(); App.toast('Diperbarui', 'success'); await this.render(); },

    changePw() { App.showModal(`<h3><i class="fas fa-key"></i> Ganti Password</h3><div class="form-group"><label>Password Lama</label><input type="password" id="pwOld"></div><div class="form-group"><label>Password Baru</label><input type="password" id="pwNew"></div><div class="form-group"><label>Konfirmasi</label><input type="password" id="pwCfm"></div><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Batal</button><button class="btn btn-primary" onclick="PageSetting.savePw()">Simpan</button></div>`); },
    async savePw() { const o = document.getElementById('pwOld').value; const n = document.getElementById('pwNew').value; const c = document.getElementById('pwCfm').value; if (!o || !n || !c) { App.toast('Semua field wajib!', 'warning'); return; } if (n !== c) { App.toast('Password baru tidak cocok!', 'error'); return; } const cur = DB.getCurrentUser(); const users = await DB.getUsers(); const u = users.find(x => x.username === cur.username && x.password === o); if (!u) { App.toast('Password lama salah!', 'error'); return; } u.password = n; await DB.setUsers(users); App.closeModal(); App.toast('Password diubah', 'success'); },

    addUser() { App.showModal(`<h3><i class="fas fa-user-plus"></i> Tambah User</h3><div class="form-group"><label>Username</label><input id="nuName" placeholder="Username"></div><div class="form-group"><label>Password</label><input type="password" id="nuPw" placeholder="Password"></div><div class="form-group"><label>Role</label><select id="nuRole"><option value="Operator">Operator</option><option value="Administrator">Administrator</option></select></div><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Batal</button><button class="btn btn-primary" onclick="PageSetting.saveUser()">Simpan</button></div>`); },
    async saveUser() { const nm = document.getElementById('nuName').value.trim(); const pw = document.getElementById('nuPw').value; const rl = document.getElementById('nuRole').value; if (!nm || !pw) { App.toast('Wajib diisi!', 'warning'); return; } const users = await DB.getUsers(); if (users.find(u => u.username === nm)) { App.toast('Username sudah ada!', 'error'); return; } users.push({ id: Date.now(), username: nm, password: pw, role: rl }); await DB.setUsers(users); App.closeModal(); App.toast('User ditambahkan', 'success'); await this.render(); },

    delUser(id) { App.showModal(`<h3><i class="fas fa-trash" style="color:var(--danger)"></i> Hapus User</h3><p>Yakin?</p><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Batal</button><button class="btn btn-danger" onclick="PageSetting._doDel(${id})">Hapus</button></div>`); },
    async _doDel(id) { await DB.setUsers((await DB.getUsers()).filter(u => u.id !== id)); App.closeModal(); App.toast('User dihapus', 'success'); await this.render(); },

    async backup() { const data = { masterBarang: await DB.getMasterBarang(), stokSistem: await DB.getStokSistem(), dataScan: await DB.getDataScan(), logActivity: await DB.getLogActivity(), users: await DB.getUsers(), settings: await DB.getSettings(), date: new Date().toISOString() }; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); a.download = `IMS_Backup_${new Date().toISOString().split('T')[0]}.json`; a.click(); App.toast('Backup ✓', 'success'); },

    restore() { App.showModal(`<h3><i class="fas fa-upload"></i> Restore</h3><p style="margin-bottom:12px;font-size:13px;color:var(--gray)">Pilih file backup. <strong style="color:var(--danger)">Data akan ditimpa!</strong></p><div class="import-area" onclick="document.getElementById('rstFile').click()"><i class="fas fa-cloud-upload-alt"></i><p>Klik pilih file</p></div><input type="file" id="rstFile" accept=".json" style="display:none" onchange="PageSetting.processRestore(this)"><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Tutup</button></div>`); },
    async processRestore(inp) { const file = inp.files[0]; if (!file) return; const r = new FileReader(); r.onload = async (e) => { try { const d = JSON.parse(e.target.result); if (d.masterBarang) await DB.setMasterBarang(d.masterBarang); if (d.stokSistem) await DB.setStokSistem(d.stokSistem); if (d.dataScan) await DB.setDataScan(d.dataScan); if (d.logActivity) await DB.set('logActivity', d.logActivity); if (d.users) await DB.setUsers(d.users); if (d.settings) await DB.setSettings(d.settings); App.closeModal(); App.toast('Data dipulihkan!', 'success'); await this.render(); } catch (err) { App.toast('File tidak valid: ' + err.message, 'error'); } }; r.readAsText(file); },

    resetAll() { App.showModal(`<h3><i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i> Reset Semua</h3><p style="color:var(--danger);font-weight:600">SEMUA DATA AKAN DIHAPUS!</p><div class="form-group mt-10"><label>Ketik <strong>RESET</strong>:</label><input id="rstConfirm" placeholder="RESET"></div><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Batal</button><button class="btn btn-danger" onclick="PageSetting._doResetAll()"><i class="fas fa-trash"></i> Reset</button></div>`); },
    async _doResetAll() { if (document.getElementById('rstConfirm').value !== 'RESET') { App.toast('Ketik RESET!', 'warning'); return; } await DB.setMasterBarang([]); await DB.setStokSistem([]); await DB.setDataScan([]); await DB.set('logActivity', []); await DB.setSettings({ companyName: 'PT. Inventory Management', notifPopup: true, notifSound: true, autoSave: true }); App.closeModal(); App.toast('Semua data direset', 'success'); await this.render(); }
};