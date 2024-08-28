import React, { useState, useEffect, useCallback } from 'react';

// Provided interfaces and types
export type EntryValue = number | string;

export interface Entry {
  title: string;
  value: EntryValue;
  date: string;
}

export interface IndexedEntries {
  chartType: 'Area' | 'Bar' | 'Pie';
  data: Entry[];
  id: number;
}

export type DocumentData = Array<{
  [category: string]: IndexedEntries[];
}>;

// Component
const Test: React.FC = () => {
  // State for the dashboard data using the provided type
  const [dashboardData, setDashboardData] = useState<DocumentData>([
    {
      Alakazam: [
        {
          chartType: 'Area',
          id: 3,
          data: [
            { title: 'HP', value: 55.0, date: '2024-08-13' },
            { title: 'HP', value: 100.0, date: '2024-08-13' },
            { title: 'HP', value: 20.0, date: '2024-08-13' },
            { title: 'HP', value: 30.0, date: '2024-08-13' },
            { title: 'HP', value: 200.0, date: '2024-08-13' },
          ],
        },
        {
          chartType: 'Area',
          id: 9.5,
          data: [{ title: 'Attack', value: 50.0, date: '2024-08-13' }],
        },
      ],
    },
  ]);

  // State to manage which IDs are checked
  const [checkedIds, setCheckedIds] = useState<number[]>([3, 9.5]);

  // State to hold the aggregated data for display
  const [summaryData, setSummaryData] = useState<Entry[]>([]);

  // Handle checkbox logic
  const handleCheck = useCallback((id: number) => {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }, []);

  // Aggregate data based on checked IDs
  const aggregateData = useCallback(() => {
    let aggregate: { [title: string]: number } = {};

    dashboardData.forEach((document) => {
      Object.values(document).forEach((entries) => {
        entries.forEach((entry) => {
          if (checkedIds.includes(entry.id)) {
            entry.data.forEach((item) => {
              if (typeof item.value === 'number') {
                // Ensuring only numerical values are aggregated
                if (!aggregate[item.title]) {
                  aggregate[item.title] = 0;
                }
                aggregate[item.title] += item.value;
              }
            });
          }
        });
      });
    });

    const aggregatedArray: Entry[] = Object.entries(aggregate).map(([title, value]) => ({
      title,
      value,
      date: new Date().toISOString(), // Assuming aggregation date as today's date for simplicity
    }));

    setSummaryData(aggregatedArray);
  }, [checkedIds, dashboardData]);

  // Effect to re-calculate summary data when checked IDs or data change
  useEffect(() => {
    aggregateData();
  }, [aggregateData]);

  // Render the component
  return (
    <div>
      <h1>Dashboard Summary</h1>
      <div>
        {dashboardData.map((document, index) =>
          Object.entries(document).map(([key, entries]) =>
            entries.map((entry) => (
              <div key={entry.id}>
                <input
                  type="checkbox"
                  checked={checkedIds.includes(entry.id)}
                  onChange={() => handleCheck(entry.id)}
                />
                {`ID: ${entry.id}, Chart Type: ${entry.chartType}`}
              </div>
            )),
          ),
        )}
      </div>
      <div>
        {summaryData.map((data, index) => (
          <div key={index}>
            <strong>{data.title}:</strong> {data.value}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Test;
