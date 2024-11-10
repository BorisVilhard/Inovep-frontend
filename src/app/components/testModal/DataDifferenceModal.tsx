import React from 'react';
import Button from '../Button/Button';
import Modal from '../Modal';

interface DataDifferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOk: () => void;
  differences: {
    addedCategories: any[];
    removedCategories: any[];
    addedTitles: { category: string; titles: string[] }[];
    removedTitles: { category: string; titles: string[] }[];
  };
  isUploading: boolean;
}

const DataDifferenceModal: React.FC<DataDifferenceModalProps> = ({
  isOpen,
  onClose,
  onOk,
  differences,
  isUploading,
}) => {
  const renderDifferences = () => (
    <div className="mt-4 max-h-60 overflow-y-auto">
      {differences?.addedCategories.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold">Added Categories:</h3>
          <ul className="list-inside list-disc">
            {differences.addedCategories.map((cat) => (
              <li key={cat.categoryName}>{cat.categoryName}</li>
            ))}
          </ul>
        </div>
      )}
      {differences?.removedCategories.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold">Removed Categories:</h3>
          <ul className="list-inside list-disc">
            {differences.removedCategories.map((cat) => (
              <li key={cat.categoryName}>{cat.categoryName}</li>
            ))}
          </ul>
        </div>
      )}
      {differences?.addedTitles.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold">Added Titles:</h3>
          {differences.addedTitles.map(({ category, titles }) => (
            <div key={category}>
              <strong>{category}</strong>
              <ul className="list-inside list-disc">
                {titles.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {differences?.removedTitles.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold">Removed Titles:</h3>
          {differences.removedTitles.map(({ category, titles }) => (
            <div key={category}>
              <strong>{category}</strong>
              <ul className="list-inside list-disc">
                {titles.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Data Differences Detected"
      footer={
        <>
          <Button type="secondary" onClick={onClose} disabled={isUploading} className="mr-2">
            Cancel
          </Button>
          <Button type="primary" onClick={onOk} disabled={isUploading}>
            {isUploading ? 'Applying...' : 'Apply Changes'}
          </Button>
        </>
      }
    >
      {renderDifferences()}
      <p className="mt-4 text-gray-700">
        The new data differs from your current data. Do you want to apply these changes?
      </p>
    </Modal>
  );
};

export default DataDifferenceModal;
