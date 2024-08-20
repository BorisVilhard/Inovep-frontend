'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DataBar from './components/DataBar';
import { ChartWrapper } from './components/ChartWrapper';
import { DocumentData } from '@/types/types';
import Modal from '@/app/components/modal/modal';
import { numberCatcher } from '../../../utils/numberCatcher';
import Loading from '@/app/loading';
import { mergeDocumentData } from '../../../utils/mergeDatasets';
import { detectStructuralChanges } from '../../../utils/detectDocumentChnages';
import { generateChart } from '../../../utils/ChartGenerator';
import classNames from 'classnames';
import ChartEditBar from './components/ChartEditBar';
import { MdDelete } from 'react-icons/md';
interface ModalContent {
  added: string[];
  removed: string[];
}

interface Props {
  isEditMode: boolean;
}

const Dashboard = (props: Props) => {
  const [dashboardData, setDashboardData] = useState<DocumentData>([
    {
      Alakazam: [
        {
          chartType: 'Area',
          id: 1,
          data: [
            {
              title: 'Type 1',
              value: 'Psychic',
              date: '2024-08-13',
            },
          ],
        },
        {
          chartType: 'Area',
          id: 3,
          data: [
            {
              title: 'Type 2',
              value: 'hello',
              date: '2024-08-13',
            },
          ],
        },
        {
          chartType: 'Area',
          id: 3,
          data: [
            {
              title: 'HP',
              value: 55.0,
              date: '2024-08-13',
            },
            {
              title: 'HP',
              value: 100.0,
              date: '2024-08-13',
            },
            {
              title: 'HP',
              value: 20.0,
              date: '2024-08-13',
            },
            {
              title: 'HP',
              value: 30.0,
              date: '2024-08-13',
            },
            {
              title: 'HP',
              value: 200.0,
              date: '2024-08-13',
            },
          ],
        },
        {
          chartType: 'Area',
          id: 9.5,
          data: [
            {
              title: 'Attack',
              value: 50.0,
              date: '2024-08-13',
            },
          ],
        },
        {
          chartType: 'Area',
          id: 13,
          data: [
            {
              title: 'Defense',
              value: 50.0,
              date: '2024-08-13',
            },
            {
              title: 'Defense',
              value: 70.0,
              date: '2024-08-13',
            },
            {
              title: 'Defense',
              value: 100.0,
              date: '2024-08-13',
            },
          ],
        },
      ],
    },
    {
      Machop3: [
        {
          chartType: 'Area',
          id: 35,
          data: [
            {
              title: 'Type 1',
              value: 'Fighting',
              date: '2024-08-13',
            },
          ],
        },
        {
          chartType: 'Area',
          id: 15,
          data: [
            {
              title: 'Type 2',
              value: 'hello',
              date: '2024-08-13',
            },
          ],
        },
        {
          chartType: 'Area',
          id: 4,
          data: [
            {
              title: 'HP',
              value: 70.0,
              date: '2024-08-13',
            },
          ],
        },
        {
          chartType: 'Area',
          id: 19,
          data: [
            {
              title: 'Attack',
              value: 80.0,
              date: '2024-08-13',
            },
          ],
        },
        {
          chartType: 'Area',
          id: 21,
          data: [
            {
              title: 'Defense',
              value: 50.0,
              date: '2024-08-13',
            },
            {
              title: 'Defense',
              value: 70.0,
              date: '2024-08-13',
            },
            {
              title: 'Defense',
              value: 100.0,
              date: '2024-08-13',
            },
          ],
        },
      ],
    },
    {
      Machop: [
        {
          chartType: 'Area',
          id: 22,
          data: [
            {
              title: 'Type 1',
              value: 'Fighting',
              date: '2024-08-13',
            },
          ],
        },
        {
          chartType: 'Area',
          id: 27,
          data: [
            {
              title: 'Type 2',
              value: 'hello',
              date: '2024-08-13',
            },
          ],
        },
        {
          chartType: 'Area',
          id: 29,
          data: [
            {
              title: 'HP',
              value: 70.0,
              date: '2024-08-13',
            },
          ],
        },
        {
          chartType: 'Area',
          id: 29,
          data: [
            {
              title: 'Attack',
              value: 80.0,
              date: '2024-08-13',
            },
          ],
        },
        {
          chartType: 'Area',
          id: 31,
          data: [
            {
              title: 'Defense',
              value: 50.0,
              date: '2024-08-13',
            },
            {
              title: 'Defense',
              value: 70.0,
              date: '2024-08-13',
            },
            {
              title: 'Defense',
              value: 100.0,
              date: '2024-08-13',
            },
          ],
        },
      ],
    },
  ]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<ModalContent>({ added: [], removed: [] });
  const [isLoading, setLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [chartEdit, setChartEdit] = useState<number | string | undefined>(undefined);
  const [editMode, setEditMode] = useState(props.isEditMode);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isElementHovered, setIsElementHovered] = useState<number | null>(null);
  useEffect(() => {
    setEditMode(props.isEditMode);
  }, [props.isEditMode]);

  useEffect(() => {
    localStorage.setItem('dashboardData', JSON.stringify(dashboardData));
  }, [dashboardData]);

  const handleNewData = useCallback(
    (newData: DocumentData) => {
      if (dashboardData.length === 0) {
        setDashboardData(newData);
      } else {
        const updatedData = mergeDocumentData(dashboardData, newData);
        const { changesDetected, added, removed } = detectStructuralChanges(dashboardData, newData);
        if (changesDetected) {
          setShowModal(true);
          setModalContent({ added, removed });
        }
        setDashboardData(updatedData);
      }
    },
    [dashboardData],
  );

  const handleUpdateData = (category: string, action: 'add' | 'remove'): void => {
    setShowModal(false);
  };

  const handleDragOver = (id: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setChartEdit(id);
    setIsDraggingOver(true);
  };

  const updateChartType = useCallback((id: number, newChartType: 'Area' | 'Bar' | 'Pie') => {
    setDashboardData((currentData) =>
      currentData.map((section) => ({
        ...section,
        [Object.keys(section)[0]]: section[Object.keys(section)[0]].map((entry) =>
          entry.id === id ? { ...entry, chartType: newChartType } : entry,
        ),
      })),
    );
  }, []);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, id: number) => {
    event.preventDefault();
    const chartType = event.dataTransfer.getData('chartType');
    console.log(chartType);
    updateChartType(id, chartType as 'Area' | 'Bar' | 'Pie');
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-white">
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

      <div className="absolute top-0 w-full">
        <DataBar getFileName={setFileName} isLoading={setLoading} getData={handleNewData} />
      </div>
      <div className="flex w-[95%] justify-center">
        {isLoading ? (
          <div className="relative flex w-full items-center justify-center">
            <Loading />
            <div className="absolute top-[47vh] text-[18px]">{fileName} is loading...</div>
          </div>
        ) : (
          <div
            className={classNames('flex w-[100vw] items-center', {
              'justify-end': editMode,
              'justify-center': !editMode,
            })}
          >
            <div
              className={classNames(
                'z-20 m-3 mt-[140px] grid grid-cols-1 gap-5 p-5 transition-all duration-500 ease-in-out sm:grid-cols-2 lg:grid-cols-3',
                {
                  'w-[75vw] border-2 border-dashed border-primary-90': editMode,
                  'w-[90vw] border-2 border-dashed border-transparent': !editMode,
                },
              )}
            >
              {dashboardData.map((document, docIndex) => (
                <div key={docIndex}>
                  {Object.entries(document).map(([category, entries], index) => (
                    <ChartWrapper
                      key={index}
                      title={numberCatcher(category)}
                      className={classNames('relative min-h-[100px] w-auto space-y-4 bg-white', {
                        'min-w-[100px]': editMode,
                        'min-w-[400px]': !editMode,
                      })}
                    >
                      {editMode && (
                        <ChartEditBar
                          className="t-[8px] right-[10px] my-[8px]"
                          isOpen={category === chartEdit}
                          getChartId={setChartEdit}
                          chartId={category}
                        />
                      )}

                      {Object.entries(entries).map(([index, items], key) => (
                        <div
                          onMouseEnter={() => setIsElementHovered(items.id)}
                          onMouseLeave={() => setIsElementHovered(null)}
                          className="my-[10px] flex w-full items-center justify-between gap-3"
                        >
                          <h1 className="text-[17px] font-bold">{items.data[0].title}:</h1>
                          {items.data.length > 1 ? (
                            <div className="relative flex w-fit flex-wrap items-center justify-end transition-all duration-300 ease-in-out">
                              {(editMode || isDraggingOver) && (
                                <ChartEditBar
                                  isOpen={items.id === chartEdit}
                                  getChartId={setChartEdit}
                                  chartId={items.id}
                                />
                              )}
                              {category === chartEdit && (
                                <input
                                  className="absolute left-[3px] top-[3px] z-50 h-[20px] w-[20px]"
                                  type="checkbox"
                                />
                              )}

                              {(items.id === chartEdit || category === chartEdit) && (
                                <div
                                  onDrop={(event) => handleDrop(event, items.id)}
                                  onDragOver={(e) => e.preventDefault()}
                                  className="stage absolute z-30"
                                >
                                  <figure className="ball bubble absolute">
                                    <div className="absolute inset-0 z-30 rounded-[5px] bg-shades-black bg-opacity-25 backdrop-blur-sm"></div>
                                    <div className="absolute inset-0  z-40 flex items-center justify-center text-shades-white">
                                      <h1 className="text-[25px] font-bold">
                                        {category === chartEdit ? 'Combine Charts' : 'Change Chart'}
                                      </h1>
                                    </div>
                                  </figure>
                                </div>
                              )}
                              <div
                                onDragOver={(e) => handleDragOver(items.id, e)}
                                className={classNames('flex h-[160px]', {
                                  'w-[220px]': editMode,
                                  'w-[290px]': !editMode,
                                })}
                              >
                                {generateChart(items.chartType, items.data, index)}
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              {items.data.map((item, index) => (
                                <>
                                  {editMode && isElementHovered === items.id && (
                                    <a className="absolute right-0 top-0 z-50">
                                      <div className="flex h-full w-full cursor-pointer items-center justify-center rounded-full  bg-red-700 p-[6px]">
                                        <MdDelete color="white" />
                                      </div>
                                    </a>
                                  )}
                                  {typeof item.value === 'number' && category === chartEdit && (
                                    <input
                                      className="absolute left-[3px] top-[3px] z-50 h-[20px] w-[20px]"
                                      type="checkbox"
                                    />
                                  )}

                                  {typeof item.value === 'number' &&
                                    (items.id === chartEdit || category === chartEdit) && (
                                      <div
                                        onDrop={(event) => handleDrop(event, items.id)}
                                        onDragOver={(e) => e.preventDefault()}
                                        className="stage absolute z-30"
                                      >
                                        <figure className="ball bubble absolute">
                                          <div className="absolute inset-0 z-30 rounded-[5px] bg-shades-black bg-opacity-25 backdrop-blur-sm"></div>
                                          <div className="absolute inset-0 z-40 flex items-center justify-center text-shades-white">
                                            <h1 className="text-[15px] font-bold">
                                              {category === chartEdit
                                                ? 'Combine Charts'
                                                : 'Change Chart'}
                                            </h1>
                                          </div>
                                        </figure>
                                      </div>
                                    )}
                                  <div
                                    key={index}
                                    className={classNames(
                                      'relative w-fit rounded-md bg-primary-90 p-4 text-center',
                                      {
                                        'min-w-[210px]':
                                          category === chartEdit && typeof item.value === 'number',
                                        'min-w-[70px]':
                                          category !== chartEdit && typeof item.value === 'number',
                                      },
                                    )}
                                  >
                                    <h1 className="text-[20px] text-shades-white">{item.value}</h1>
                                  </div>
                                </>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </ChartWrapper>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
