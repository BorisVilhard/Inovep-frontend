import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Types from your specification
type ChartType =
  | 'EntryArea'
  | 'IndexArea'
  | 'EntryLine'
  | 'IndexLine'
  | 'TradingLine'
  | 'IndexBar'
  | 'Bar'
  | 'Pie'
  | 'Line'
  | 'Radar'
  | 'Area';

interface Entry {
  title: string;
  value: number | string;
  date: string;
  fileName: string;
  _id?: string;
}

interface IndexedEntries {
  id: string;
  chartType: ChartType;
  data: Entry[];
  isChartTypeChanged?: boolean;
  fileName: string;
  _id?: string;
}

interface CombinedChart {
  id: string;
  chartType: ChartType;
  chartIds: string[];
  data: Entry[];
  _id?: string;
}

interface DashboardCategory {
  categoryName: string;
  mainData: IndexedEntries[];
  combinedData?: CombinedChart[];
  summaryData?: Entry[];
  appliedChartType?: ChartType;
  checkedIds?: string[];
  combinedCharts?: any[];
  _id?: string;
}

interface DocumentData {
  dashboardData: DashboardCategory[];
}

// The sample data you provided:
const sampleDocumentData: DocumentData = {
  dashboardData: [
    {
      categoryName: 'INV-1642',
      mainData: [
        {
          id: 'inv-1642-customer-name',
          chartType: 'Area',
          data: [
            {
              title: 'Customer Name',
              value: 'Foo Bar',
              date: '2024-11-13T00:00:00.000Z',
              fileName: 'invoice_data.xlsx',
              _id: '6734f8191cbc735064214aa5',
            },
          ],
          isChartTypeChanged: false,
          fileName: 'invoice_data.xlsx',
          _id: '6734f8191cbc735064214aa4',
        },
        {
          id: 'inv-1642-invoice-date',
          chartType: 'Area',
          data: [
            {
              title: 'Invoice Date',
              value: 2024,
              date: '2024-11-13T00:00:00.000Z',
              fileName: 'invoice_data.xlsx',
              _id: '6734f8191cbc735064214aa7',
            },
          ],
          isChartTypeChanged: false,
          fileName: 'invoice_data.xlsx',
          _id: '6734f8191cbc735064214aa6',
        },
        {
          id: 'inv-1642-item-description',
          chartType: 'Area',
          data: [
            {
              title: 'Item Description',
              value: 'Laptop',
              date: '2024-11-13T00:00:00.000Z',
              fileName: 'invoice_data.xlsx',
              _id: '6734f8191cbc735064214aa9',
            },
          ],
          isChartTypeChanged: false,
          fileName: 'invoice_data.xlsx',
          _id: '6734f8191cbc735064214aa8',
        },
        {
          id: 'inv-1642-quantity',
          chartType: 'Area',
          data: [
            {
              title: 'Quantity',
              value: 7,
              date: '2024-11-13T00:00:00.000Z',
              fileName: 'invoice_data.xlsx',
              _id: '6734f8191cbc735064214aab',
            },
          ],
          isChartTypeChanged: false,
          fileName: 'invoice_data.xlsx',
          _id: '6734f8191cbc735064214aaa',
        },
        {
          id: 'inv-1642-unit-price',
          chartType: 'Area',
          data: [
            {
              title: 'Unit Price',
              value: 203.0107398789683,
              date: '2024-11-13T00:00:00.000Z',
              fileName: 'invoice_data.xlsx',
              _id: '6734f8191cbc735064214aad',
            },
          ],
          isChartTypeChanged: false,
          fileName: 'invoice_data.xlsx',
          _id: '6734f8191cbc735064214aac',
        },
        {
          id: 'inv-1642-total-amount',
          chartType: 'Area',
          data: [
            {
              title: 'Total Amount',
              value: 1421.08,
              date: '2024-11-13T00:00:00.000Z',
              fileName: 'invoice_data.xlsx',
              _id: '6734f8191cbc735064214aaf',
            },
          ],
          isChartTypeChanged: false,
          fileName: 'invoice_data.xlsx',
          _id: '6734f8191cbc735064214aae',
        },
      ],
      combinedData: [
        {
          id: 'combined-1732720771261',
          chartType: 'Pie',
          chartIds: ['inv-1642-quantity', 'inv-1642-invoice-date'],
          data: [
            {
              title: 'Invoice Date',
              value: 2024,
              date: '2024-11-20T00:00:00.000Z',
              fileName: 'invoice_data_same_invoices.xlsx',
              _id: '673db955c1d7b4f12aeb5a3c',
            },
            {
              title: 'Invoice Date',
              value: 2024,
              date: '2024-11-20T00:00:00.000Z',
              fileName: 'invoice_data.xlsx',
              _id: '673dba30c1d7b4f12aec7bda',
            },
            {
              title: 'Invoice Date',
              value: 45595,
              date: '2024-11-22T00:00:00.000Z',
              fileName: 'new_invoice_data.xlsx',
              _id: '6740717ec1d7b4f12a1465e1',
            },
            {
              title: 'Quantity',
              value: 7,
              date: '2024-11-20T00:00:00.000Z',
              fileName: 'invoice_data_same_invoices.xlsx',
              _id: '673db955c1d7b4f12aeb5a40',
            },
            {
              title: 'Quantity',
              value: 7,
              date: '2024-11-20T00:00:00.000Z',
              fileName: 'invoice_data.xlsx',
              _id: '673dba30c1d7b4f12aec7bdc',
            },
            {
              title: 'Quantity',
              value: 7,
              date: '2024-11-22T00:00:00.000Z',
              fileName: 'new_invoice_data.xlsx',
              _id: '6740717ec1d7b4f12a1465e3',
            },
          ],
          _id: '67473cf626d64b203ea982b9',
        },
      ],
      checkedIds: ['inv-1642-unit-price'],
      _id: '6734f8191cbc735064214aa3',
      combinedCharts: [],
      summaryData: [],
      appliedChartType: 'TradingLine',
    },
  ],
};

// Restructured type
interface RestructuredCategory {
  categoryName: string;
  data: {
    title: string;
    value: string | number;
    date: string;
  }[];
}

function restructureData(dashboardData: DashboardCategory[]): RestructuredCategory[] {
  return dashboardData.map((category) => {
    const mainEntries = category.mainData.flatMap((md) =>
      md.data.map((d) => ({
        title: d.title,
        value: d.value,
        date: d.date,
      })),
    );

    const combinedEntries = category.combinedData
      ? category.combinedData.flatMap((cd) =>
          cd.data.map((d) => ({
            title: d.title,
            value: d.value,
            date: d.date,
          })),
        )
      : [];

    const summaryEntries = category.summaryData
      ? category.summaryData.map((d) => ({
          title: d.title,
          value: d.value,
          date: d.date,
        }))
      : [];

    const allData = [...mainEntries, ...combinedEntries, ...summaryEntries];

    return {
      categoryName: category.categoryName,
      data: allData,
    };
  });
}

function generateCSV(restructuredData: RestructuredCategory[]): string {
  let csvString = 'Category,Title,Value,Date\n';
  restructuredData.forEach((category) => {
    category.data.forEach((d) => {
      const row = `"${category.categoryName}","${d.title}","${d.value}","${d.date}"\n`;
      csvString += row;
    });
  });
  return csvString;
}

function generateExcel(restructuredData: RestructuredCategory[]): Blob {
  const wb = XLSX.utils.book_new();
  restructuredData.forEach((category) => {
    const wsData = [
      ['Title', 'Value', 'Date'],
      ...category.data.map((d) => [d.title, d.value, d.date]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, category.categoryName.slice(0, 31));
  });
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/octet-stream' });
}

export default function Test2() {
  const [csvData, setCsvData] = useState('');
  const [excelBlob, setExcelBlob] = useState<Blob | null>(null);

  useEffect(() => {
    const restructured = restructureData(sampleDocumentData.dashboardData);
    const csv = generateCSV(restructured);
    setCsvData(csv);

    const excel = generateExcel(restructured);
    setExcelBlob(excel);
  }, []);

  const downloadCSV = () => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'data.csv');
  };

  const downloadExcel = () => {
    if (!excelBlob) return;
    saveAs(excelBlob, 'data.xlsx');
  };

  const downloadPDF = async () => {
    const response = await fetch('/api/generate-pdf');
    if (!response.ok) {
      console.error('Failed to fetch PDF');
      return;
    }
    const blob = await response.blob();
    saveAs(blob, 'generated.pdf');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Data Generation Demo</h1>
      <p>
        This page restructures the provided data and allows you to download CSV, Excel, and a
        server-generated PDF.
      </p>
      <button onClick={downloadCSV} style={{ marginRight: '10px' }}>
        Download CSV
      </button>
      <button onClick={downloadExcel} style={{ marginRight: '10px' }}>
        Download Excel
      </button>
      <button onClick={downloadPDF}>Download PDF</button>
    </div>
  );
}
