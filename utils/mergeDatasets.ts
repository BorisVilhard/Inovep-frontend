import { DocumentData, Entry, IndexedEntries } from '@/types/types'; // Ensure your type imports are correct

// This function now returns an array of DocumentData.
export function mergeDocumentData(data1: DocumentData, data2: DocumentData): DocumentData {
  if (data1.length === 0 || data2.length === 0) return data1.length > 0 ? data1 : data2;

  const mergedResults: DocumentData = [];

  // Merge each corresponding DocumentData object in arrays
  for (let i = 0; i < Math.max(data1.length, data2.length); i++) {
    let result: { [category: string]: IndexedEntries[] } = {};

    const document1 = data1[i] || {};
    const document2 = data2[i] || {};

    const allCategories = new Set([...Object.keys(document1), ...Object.keys(document2)]);

    allCategories.forEach((category) => {
      const indexedEntries1 = document1[category] || [];
      const indexedEntries2 = document2[category] || [];

      // Merge IndexedEntries arrays by index
      const mergedIndexedEntries: IndexedEntries[] = [];

      const maxLength = Math.max(indexedEntries1.length, indexedEntries2.length);

      for (let j = 0; j < maxLength; j++) {
        const entries1 = indexedEntries1[j] ? indexedEntries1[j].data : [];
        const entries2 = indexedEntries2[j] ? indexedEntries2[j].data : [];

        const mergedEntries: Entry[] = [...entries1];

        entries2.forEach((entry2) => {
          // Check if there is any entry in entries1 with a string value
          const hasStringValues = entries1.some((entry1) => typeof entry1.value === 'string');

          // Determine if the current entry2 should be merged
          if (!hasStringValues || typeof entry2.value === 'number') {
            mergedEntries.push(entry2);
          }
        });

        if (indexedEntries1[j] || indexedEntries2[j]) {
          mergedIndexedEntries.push({
            chartType: indexedEntries1[j]?.chartType || indexedEntries2[j]?.chartType || 'Area',
            id: indexedEntries1[j]?.id,
            data: mergedEntries,
          });
        }
      }

      result[category] = mergedIndexedEntries;
    });

    mergedResults.push(result);
  }

  return mergedResults;
}
