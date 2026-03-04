export function exportToCSV(tips: any[], filename = 'tip-history.csv') {
  const headers = ['Tipper', 'Amount (STX)', 'Message', 'Block', 'Anonymous'];
  const rows = tips.map(t => [
    t.isAnonymous ? 'Anonymous' : t.tipper,
    (t.amount / 1000000).toFixed(6),
    t.message || '',
    t.block,
    t.isAnonymous ? 'Yes' : 'No'
  ]);
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToJSON(tips: any[], filename = 'tip-history.json') {
  const data = JSON.stringify(tips, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
