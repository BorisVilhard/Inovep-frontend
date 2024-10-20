import React from 'react';
import Modal from '../modal/modal';

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
}

const DataDifferenceModal: React.FC<DataDifferenceModalProps> = ({
  isOpen,
  onClose,
  onOk,
  differences,
}) => {
  return (
    <Modal
      onOk={onOk}
      onClose={onClose}
      title="Data Differences"
      okName="Apply Changes"
      visible={isOpen}
    >
      <div>
        {differences?.addedCategories.length > 0 && (
          <>
            <h3>Added Categories</h3>
            <ul>
              {differences.addedCategories.map((cat) => (
                <li key={cat.categoryName}>{cat.categoryName}</li>
              ))}
            </ul>
          </>
        )}

        {differences?.removedCategories.length > 0 && (
          <>
            <h3>Removed Categories</h3>
            <ul>
              {differences.removedCategories.map((cat) => (
                <li key={cat.categoryName}>{cat.categoryName}</li>
              ))}
            </ul>
          </>
        )}

        {differences?.addedTitles.length > 0 && (
          <>
            <h3>Added Titles</h3>
            {differences.addedTitles.map(({ category, titles }) => (
              <div key={category}>
                <strong>{category}</strong>
                <ul>
                  {titles.map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}

        {differences?.removedTitles.length > 0 && (
          <>
            <h3>Removed Titles</h3>
            {differences.removedTitles.map(({ category, titles }) => (
              <div key={category}>
                <strong>{category}</strong>
                <ul>
                  {titles.map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </div>
    </Modal>
  );
};

export default DataDifferenceModal;
