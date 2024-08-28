import Modal from '@/app/components/modal/modal';
import { useCallback, useState } from 'react';

interface Props {
  added: string[];
  removed: string[];
}

const ChangesDetectionModal = (props: Props) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<Props>({ added: [], removed: [] });

  const handleUpdateData = (category: string, action: 'add' | 'remove'): void => {
    setShowModal(false);
  };
  return (
    <Modal title="Data structure changed" visible={showModal} onClose={() => setShowModal(false)}>
      {modalContent.added.length > 0 && (
        <div>
          <h3>Added:</h3>
          {modalContent.added.map((category) => (
            <div key={category}>
              {category} <button onClick={() => handleUpdateData(category, 'add')}>Add</button>
            </div>
          ))}
        </div>
      )}
      {modalContent.removed.length > 0 && (
        <div>
          <h3>Removed:</h3>
          {modalContent.removed.map((category) => (
            <div key={category}>
              {category}{' '}
              <button onClick={() => handleUpdateData(category, 'remove')}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default ChangesDetectionModal;
