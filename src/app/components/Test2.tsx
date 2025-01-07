// Import necessary modules and libraries
import React from 'react';
import * as XLSX from 'xlsx';

// Define the data interfaces
interface DataItem {
  title: string;
  value: number | string;
}

interface RestructuredData {
  categoryName: string;
  data: DataItem[];
}

interface FinalData {
  dashboardData: RestructuredData[];
}

// Sample data as provided
const sampleData: FinalData = {
  dashboardData: [
    {
      categoryName: 'INV-1642',
      data: [
        { title: 'Customer Name', value: 'Foo Bar' },
        { title: 'Invoice Date', value: 49643 },
        { title: 'Item Description', value: 'Laptop' },
        { title: 'Quantity', value: 21 },
        { title: 'Unit Price', value: 1553.577255560916 },
        { title: 'Total Amount', value: 10875.05 },
      ],
    },
    {
      categoryName: 'INV-7083',
      data: [
        { title: 'Customer Name', value: 'Acme Corp' },
        { title: 'Invoice Date', value: 49639 },
        { title: 'Item Description', value: 'Laptop' },
        { title: 'Quantity', value: 15 },
        { title: 'Unit Price', value: 1926.9167993375754 },
        { title: 'Total Amount', value: 6731.37 },
      ],
    },
    {
      categoryName: 'INV-3473',
      data: [
        { title: 'Customer Name', value: 'Jane Smith' },
        { title: 'Invoice Date', value: 2024 },
        { title: 'Item Description', value: 'Laptop' },
        { title: 'Quantity', value: 17 },
        { title: 'Unit Price', value: 1098.2224468798882 },
        { title: 'Total Amount', value: 8670.27 },
      ],
    },
    {
      categoryName: 'INV-6607',
      data: [
        { title: 'Customer Name', value: 'Foo Bar' },
        { title: 'Invoice Date', value: 2024 },
        { title: 'Item Description', value: 'Mouse' },
        { title: 'Quantity', value: 16 },
        { title: 'Unit Price', value: 883.0923604945771 },
        { title: 'Total Amount', value: 3585.7 },
      ],
    },
    {
      categoryName: 'INV-7324',
      data: [
        { title: 'Customer Name', value: 'John Doe' },
        { title: 'Invoice Date', value: 2024 },
        { title: 'Item Description', value: 'Laptop' },
        { title: 'Quantity', value: 21 },
        { title: 'Unit Price', value: 2102.909546342563 },
        { title: 'Total Amount', value: 14436.73 },
      ],
    },
    {
      categoryName: 'INV-9215',
      data: [
        { title: 'Customer Name', value: 'Jane Smith' },
        { title: 'Invoice Date', value: 2024 },
        { title: 'Item Description', value: 'Keyboard' },
        { title: 'Quantity', value: 14 },
        { title: 'Unit Price', value: 1990.2065956817464 },
        { title: 'Total Amount', value: 9804.45 },
      ],
    },
    {
      categoryName: 'INV-9167',
      data: [
        { title: 'Customer Name', value: 'Acme Corp' },
        { title: 'Invoice Date', value: 2024 },
        { title: 'Item Description', value: 'Monitor' },
        { title: 'Quantity', value: 19 },
        { title: 'Unit Price', value: 2859.181966960896 },
        { title: 'Total Amount', value: 18052.48 },
      ],
    },
    {
      categoryName: 'INV-2493',
      data: [
        { title: 'Customer Name', value: 'Jane Smith' },
        { title: 'Invoice Date', value: 2024 },
        { title: 'Item Description', value: 'Mouse' },
        { title: 'Quantity', value: 26 },
        { title: 'Unit Price', value: 1353.2244731350486 },
        { title: 'Total Amount', value: 14857.22 },
      ],
    },
    {
      categoryName: 'INV-9446',
      data: [
        { title: 'Customer Name', value: 'Jane Smith' },
        { title: 'Invoice Date', value: 2024 },
        { title: 'Item Description', value: 'Monitor' },
        { title: 'Quantity', value: 24 },
        { title: 'Unit Price', value: 1662.8569532764983 },
        { title: 'Total Amount', value: 13888.76 },
      ],
    },
    {
      categoryName: 'INV-4420',
      data: [
        { title: 'Customer Name', value: 'John Doe' },
        { title: 'Invoice Date', value: 2024 },
        { title: 'Item Description', value: 'Chair' },
        { title: 'Quantity', value: 18 },
        { title: 'Unit Price', value: 1342.35 },
        { title: 'Total Amount', value: 7529.65 },
      ],
    },
  ],
};

// React component
const Test2: React.FC = () => {
  // Function to process data and generate headers and rows
  const processData = (data: FinalData) => {
    const allTitlesSet = new Set<string>();
    data.dashboardData.forEach((item) => {
      item.data.forEach((dataItem) => {
        allTitlesSet.add(dataItem.title);
      });
    });

    const titles = Array.from(allTitlesSet);
    // Sort titles for consistency (optional)
    titles.sort();

    // Prepare header row
    const headers = ['Category Name', ...titles];

    // Prepare data rows
    const rows = data.dashboardData.map((item) => {
      const row: (string | number)[] = [item.categoryName];
      const dataMap = new Map<string, string | number>();
      item.data.forEach((dataItem) => {
        dataMap.set(dataItem.title, dataItem.value);
      });
      titles.forEach((title) => {
        row.push(dataMap.get(title) ?? '');
      });
      return row;
    });

    return { headers, rows };
  };

  // Function to download CSV
  const downloadCSV = () => {
    const { headers, rows } = processData(sampleData);
    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((item) => {
            if (typeof item === 'string') {
              // Escape double quotes
              const escaped = item.replace(/"/g, '""');
              return `"${escaped}"`;
            }
            return item;
          })
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to download Excel
  const downloadExcel = () => {
    const { headers, rows } = processData(sampleData);
    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Generate buffer
    const wbout = XLSX.write(workbook, {
      type: 'array',
      bookType: 'xlsx',
    });

    // Create a Blob and trigger download
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    const url = URL.createObjectURL(blob);

    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'data.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={styles.container}>
      <h1>Data Exporter</h1>
      <div style={styles.buttonContainer}>
        <button style={styles.button} onClick={downloadCSV}>
          Download CSV
        </button>
        <button style={styles.button} onClick={downloadExcel}>
          Download Excel
        </button>
      </div>
    </div>
  );
};

// Simple styling for the component
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '50px',
    fontFamily: 'Arial, sans-serif',
  },
  buttonContainer: {
    display: 'flex',
    gap: '20px',
    marginTop: '20px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#4CAF50',
    color: 'white',
  },
};

export default Test2;
