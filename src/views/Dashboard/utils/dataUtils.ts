import { DashboardCategory } from '@/types/types';

interface DataDifferences {
  addedCategories: DashboardCategory[];
  removedCategories: DashboardCategory[];
  addedTitles: { category: string; titles: string[] }[];
  removedTitles: { category: string; titles: string[] }[];
}

export const compareData = (
  oldData: DashboardCategory[],
  newData: DashboardCategory[],
): DataDifferences => {
  const differences: DataDifferences = {
    addedCategories: [],
    removedCategories: [],
    addedTitles: [],
    removedTitles: [],
  };

  const oldCategories = new Set(oldData.map((cat) => cat.categoryName));
  const newCategories = new Set(newData.map((cat) => cat.categoryName));

  for (const newCat of newData) {
    if (!oldCategories.has(newCat.categoryName)) {
      differences.addedCategories.push(newCat);
    }
  }

  for (const oldCat of oldData) {
    if (!newCategories.has(oldCat.categoryName)) {
      differences.removedCategories.push(oldCat);
    }
  }

  for (const newCat of newData) {
    const oldCat = oldData.find((cat) => cat.categoryName === newCat.categoryName);
    if (oldCat) {
      const oldTitles = new Set(oldCat.mainData.map((entry) => entry.id));
      const newTitles = new Set(newCat.mainData.map((entry) => entry.id));

      const addedTitles = Array.from(newTitles).filter((id) => !oldTitles.has(id));
      const removedTitles = Array.from(oldTitles).filter((id) => !newTitles.has(id));

      if (addedTitles.length > 0) {
        differences.addedTitles.push({
          category: newCat.categoryName,
          titles: addedTitles,
        });
      }

      if (removedTitles.length > 0) {
        differences.removedTitles.push({
          category: newCat.categoryName,
          titles: removedTitles,
        });
      }
    }
  }

  return differences;
};
