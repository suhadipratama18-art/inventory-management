const PageLogActivity = {
    async render() {
        const logs = await DB.getLogActivity();
        document.getElementById('pageContent').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-history"></i> Log Activity</h3>
                <div class="btn-group">
                    <button class="btn btn-success btn-sm" onclick="PageLogActivity.exportExcel()"><i class="fas fa-file-excel"></i> Excel</button>
                    <button class="btn btn-danger  btn-sm" onclick="PageLogActivity.clear()"><i class="fas fa-trash"></i> Clear</button>
                </div>
            </div>
            <div class="card-body"><div class="table-container"><table>
                <thead><tr><th>No</th><th>User</th><th>Waktu</th><th>Lokasi</th><th>Total Qty</th></tr></thead>
                <tbody>${!logs.length
                    ? '<tr><td colspan="5" style="padding:40px;text-align:center;color:var(--gray-light)"><i class="fas fa-clipboard-list" style="font-size:32px;display:block;margin-bottom:10px"></i>Belum ada log</td></tr>'
                    : logs.map((l, i) => `<tr><td>${i + 1}</td><td><strong>${l.user}</strong></td><td>${l.waktu}</td><td><span class="badge badge-info">${l.lokasi}</span></td><td><strong>${l.totalQty}</strong></td></tr>`).join('')
                }</tbody>
            </table></div></div>
            <div class="card-footer">
                <span style="font-size:13px;color:var(--gray)">Total: ${logs.length} log</span>
                <span style="font-size:13px;font-weight:700;color:var(--primary)">Total Qty: ${logs.reduce((s, l) => s + l.totalQty, 0)}</span>
            </div>
        </div>`;
    },
    clear() { App.showModal(`<h3><i class="fas fa-trash" style="color:var(--danger)"></i> Clear Log</h3><p>Hapus semua log?</p><div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">Batal</button><button class="btn btn-danger" onclick="PageLogActivity._doClear()">Clear</button></div>`); },
    async _doClear() { await DB.set('logActivity', []); App.closeModal(); App.toast('Log dihapus', 'success'); await this.render(); },
    async exportExcel() { const logs = await DB.getLogActivity(); if (!logs.length) { App.toast('Tidak ada data', 'warning'); return; } App.exportExcel(logs.map((l, i) => ({ 'No': i + 1, 'User': l.user, 'Waktu': l.waktu, 'Lokasi': l.lokasi, 'Total Qty': l.totalQty })), 'Log_Activity'); App.toast('Export ✓', 'success'); }
};