export interface ExcelWorkerData {
  'Employee ID': string;
  'Name': string;
  'Email'?: string;
  'Phone'?: string;
  'Position'?: string;
  'Department'?: string;
  'Start Date'?: string;
}

export const validateExcelData = (data: any[]): ExcelWorkerData[] => {
  return data.filter(row => {
    return row['Employee ID'] && row['Name'];
  }).map(row => ({
    'Employee ID': String(row['Employee ID']).trim(),
    'Name': String(row['Name']).trim(),
    'Email': row['Email'] ? String(row['Email']).trim() : undefined,
    'Phone': row['Phone'] ? String(row['Phone']).trim() : undefined,
    'Position': row['Position'] ? String(row['Position']).trim() : undefined,
    'Department': row['Department'] ? String(row['Department']).trim() : undefined,
    'Start Date': row['Start Date'] ? String(row['Start Date']).trim() : undefined,
  }));
};

export const downloadExcel = (data: any[], filename: string = 'export.xlsx') => {
  // This function would be used for client-side Excel generation if needed
  // For now, we're handling exports on the server side
  console.log('Downloading Excel file:', filename, data);
};
