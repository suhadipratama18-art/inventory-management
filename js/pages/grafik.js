const PageGrafik = {
    async render() {
        const [stok, scan] = await Promise.all([DB.getStokSistem(), DB.getDataScan()]);
        const totalStok = stok.length; const totalStokQty = stok.reduce((s, d) => s + d.qty, 0);
        const totalScanQty = scan.reduce((s, d) => s + d.qty, 0);
        let scanned = 0, notScanned = 0;
        stok.forEach(s => { scan.find(x => x.barcode === s.barcode) ? scanned++ : notScanned++; });
        const pctItem = totalStok > 0 ? Math.round((scanned / totalStok) * 100) : 0;
        const pctQty = totalStokQty > 0 ? Math.min(Math.round((totalScanQty / totalStokQty) * 100), 100) : 0;
        const lok = {};
        stok.forEach(s => { if (!lok[s.lokasi]) lok[s.lokasi] = { stok: 0, scan: 0 }; lok[s.lokasi].stok += s.qty; });
        scan.forEach(s => { if (!lok[s.lokasi]) lok[s.lokasi] = { stok: 0, scan: 0 }; lok[s.lokasi].scan += s.qty; });

        const donut = (pct, color, label) => `<div style="text-align:center"><div class="donut-chart"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" stroke-width="3.5"/><circle cx="18" cy="18" r="15.915" fill="none" stroke="${color}" stroke-width="3.5" stroke-dasharray="${pct} ${100 - pct}" stroke-linecap="round"/></svg><div class="donut-center"><h3>${pct}%</h3><p>selesai</p></div></div><p class="mt-10" style="font-weight:600">${label}</p></div>`;

        document.getElementById('pageContent').innerHTML = `
        <div class="home-grid">
            <div class="stat-card"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div><div class="stat-info"><h3>${scanned}</h3><p>Sudah Dihitung</p></div></div>
            <div class="stat-card"><div class="stat-icon red"><i class="fas fa-times-circle"></i></div><div class="stat-info"><h3>${notScanned}</h3><p>Belum Dihitung</p></div></div>
            <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-percentage"></i></div><div class="stat-info"><h3>${pctItem}%</h3><p>Progress Item</p></div></div>
            <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-chart-pie"></i></div><div class="stat-info"><h3>${pctQty}%</h3><p>Progress Qty</p></div></div>
        </div>
        <div class="card"><div class="card-header"><h3><i class="fas fa-chart-pie"></i> Progress SO</h3></div><div class="card-body"><div class="donut-chart-container">${donut(pctItem, '#10b981', 'Item')}${donut(pctQty, '#3b82f6', 'Qty')}</div></div></div>
        <div class="card"><div class="card-header"><h3><i class="fas fa-map-marker-alt"></i> Per Lokasi</h3></div><div class="card-body">${!Object.keys(lok).length ? '<div class="empty-state"><i class="fas fa-chart-bar"></i><h4>Belum ada data</h4></div>' : Object.entries(lok).sort((a, b) => a[0].localeCompare(b[0])).map(([l, d]) => { const p = d.stok > 0 ? Math.min(Math.round((d.scan / d.stok) * 100), 999) : d.scan > 0 ? 100 : 0; const cl = p >= 100 ? 'green' : p >= 50 ? 'blue' : p > 0 ? 'orange' : 'red'; return `<div class="progress-group"><div class="progress-label"><span><strong>Rak ${l}</strong></span><span>Scan: ${d.scan} / Sistem: ${d.stok} (${p}%)</span></div><div class="progress-bar-track"><div class="progress-bar-fill ${cl}" style="width:${Math.min(p, 100)}%">${Math.min(p, 100)}%</div></div></div>`; }).join('')}</div></div>
        <div class="card"><div class="card-header"><h3><i class="fas fa-chart-bar"></i> Perbandingan Qty</h3></div><div class="card-body">${(() => { const entries = Object.entries(lok).sort((a, b) => a[0].localeCompare(b[0])); if (!entries.length) return '<div class="empty-state"><i class="fas fa-chart-bar"></i><h4>Belum ada data</h4></div>'; const max = Math.max(...entries.map(([, d]) => Math.max(d.stok, d.scan)), 1); return `<div style="display:flex;align-items:flex-end;gap:8px;padding:30px 10px 10px;border-bottom:2px solid var(--gray-lighter);min-height:240px;overflow-x:auto">${entries.map(([l, d]) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="display:flex;gap:4px;align-items:flex-end;height:180px"><div style="width:22px;height:${Math.round((d.stok / max) * 180) || 2}px;background:linear-gradient(180deg,#f59e0b,#d97706);border-radius:4px 4px 0 0;position:relative"><span style="position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:700;white-space:nowrap">${d.stok}</span></div><div style="width:22px;height:${Math.round((d.scan / max) * 180) || 2}px;background:linear-gradient(180deg,#10b981,#059669);border-radius:4px 4px 0 0;position:relative"><span style="position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:700;white-space:nowrap">${d.scan}</span></div></div><span style="font-size:10px;color:var(--gray);margin-top:4px">${l}</span></div>`).join('')}</div><div class="chart-legend"><div class="chart-legend-item"><div class="legend-color" style="background:#f59e0b"></div>Sistem</div><div class="chart-legend-item"><div class="legend-color" style="background:#10b981"></div>Scan</div></div>`; })()}</div></div>`;
    }
};