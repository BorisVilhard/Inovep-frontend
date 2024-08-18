import { DocumentData } from '@/types/types';

// Function to detect structural changes and identify added/removed categories
export function detectStructuralChanges(oldData: DocumentData, newData: DocumentData) {
  const oldKeys = getKeysFromData(oldData);
  const newKeys = getKeysFromData(newData);
  const added = newKeys.filter((key) => !oldKeys.includes(key));
  const removed = oldKeys.filter((key) => !newKeys.includes(key));

  return {
    changesDetected: added.length > 0 || removed.length > 0,
    added,
    removed,
  };
}

// Helper function to extract all keys from the data
function getKeysFromData(data: DocumentData) {
  return data.map((doc) => Object.keys(doc)[0]);
}
