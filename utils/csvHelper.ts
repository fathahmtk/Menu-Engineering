// Function to convert an array of objects to a CSV string
export function convertToCSV(data: any[], headers: string[]): string {
    const csvRows = [];
    // Add headers
    csvRows.push(headers.map(header => `"${header}"`).join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            let value = row[header] === null || row[header] === undefined ? '' : row[header];
            if (typeof value === 'string' && value.includes(',')) {
                value = `"${value.replace(/"/g, '""')}"`;
            } else if (typeof value === 'number') {
                // do nothing
            } else {
                 value = `"${String(value).replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

// Function to download a CSV file
export function downloadCSV(csvString: string, filename: string) {
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
