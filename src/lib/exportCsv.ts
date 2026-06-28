import type { RpaRow } from '@/types/rpa';

/**
 * Generates a CSV download using a Web Worker.
 * Ensures the main thread (and thus the 60fps streaming grid) never freezes
 * even if the user is exporting 50,000+ filtered rows.
 */
export function exportToCsv(data: RpaRow[], filename: string = 'atlasrpa_snapshot.csv'): Promise<void> {
  return new Promise((resolve) => {
    if (!data || data.length === 0) {
      alert('No data to export!');
      resolve();
      return;
    }

    // Inline worker code to avoid Next.js bundling complexities
    const workerCode = `
      self.onmessage = function(e) {
        const rows = e.data;
        if (!rows || rows.length === 0) {
          self.postMessage(null);
          return;
        }
        
        // Generate headers from the first row
        const headers = Object.keys(rows[0]).join(',');
        
        // Map data to CSV format
        const csvRows = [headers];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const values = Object.values(row).map(v => {
            const str = String(v === null || v === undefined ? '' : v);
            // Escape quotes by doubling them, and wrap field in quotes
            return '"' + str.replace(/"/g, '""') + '"';
          });
          csvRows.push(values.join(','));
        }
        
        // Create Blob on the background thread
        const blob = new Blob([csvRows.join('\\n')], { type: 'text/csv;charset=utf-8;' });
        self.postMessage(blob);
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => {
      const csvBlob = e.data;
      if (csvBlob) {
        // Trigger download on main thread once worker is done
        const link = document.createElement('a');
        const url = URL.createObjectURL(csvBlob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      worker.terminate();
      resolve();
    };

    // Send the current data view pool to the worker
    worker.postMessage(data);
  });
}
