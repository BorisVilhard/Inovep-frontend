'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import classNames from 'classnames';
import axios from 'axios';
import Masonry from 'react-masonry-css';

import useAuthStore from '@/views/auth/api/userReponse';
import { useUpdateChartStore } from '../../../../utils/updateChart';
import { useDragStore } from '../../../../utils/compareChartTypeStore';

import {
	ChartType,
	DashboardCategory,
	Entry,
	CombinedChart,
	IndexedEntries,
} from '@/types/types';

import { getEditMode } from '../../../../utils/editModeStore';
import { isValidChartType } from '../../../../utils/chartTypeChecker';

import DropTarget from '@/app/components/DropTarget/DropTarget';
import { ChartWrapper } from '../components/ChartWrapper';
import SingleStringChart from '../components/SingleStringChart';
import SingleNumericChart from '../components/SingleNumericChart';
import CombinedChartDisplay from '../components/CombinedChartDisplay';
import CombinedChartPlaceholder from '../components/CombinedChartPlaceholder';

interface ChartPanelProps {
	fileName: string;
	editMode: boolean;
	dashboardData: DashboardCategory[];
	getCheckIds: (checkedIds: { [category: string]: string[] }) => void;
	getCategoryEdit: (category: string | undefined) => void;
	summaryData: { [category: string]: Entry[] };
	combinedData: { [category: string]: CombinedChart[] };
	setCombinedData: React.Dispatch<
		React.SetStateAction<{ [category: string]: CombinedChart[] }>
	>;
	appliedChartTypes: { [category: string]: ChartType };
	checkedIds: { [category: string]: string[] };
	deleteDataByFileName: (fileName: string) => void;
	dashboardId: string;
}

const ChartPanel: React.FC<ChartPanelProps> = ({
	editMode,
	dashboardData,
	getCheckIds,
	summaryData,
	combinedData,
	setCombinedData,
	appliedChartTypes,
	checkedIds,
	dashboardId,
}) => {
	// --- Local State ---
	const [categoryEdit, setCategoryEdit] = useState<string | undefined>(
		undefined
	);
	const [checkedType, setCheckedType] = useState<'entry' | 'index' | undefined>(
		undefined
	);
	const [localDashboardData, setLocalDashboardData] =
		useState<DashboardCategory[]>(dashboardData);

	const { chartType: globalChartType, setChartData } = useUpdateChartStore();
	const { id: userId, accessToken } = useAuthStore();
	const setHoveredTitle = useDragStore((state) => state.setHoveredTitle);

	const previousCategoryEdit = useRef<string | undefined>();

	useEffect(() => {
		setLocalDashboardData(JSON.parse(JSON.stringify(dashboardData)));
	}, [dashboardData]);

	const updateCategoryDataInBackend = useCallback(
		async (
			categoryName: string,
			combinedDataArray: CombinedChart[],
			summaryDataArray: Entry[]
		) => {
			if (!dashboardId || !userId) return;
			const encodedCategoryName = encodeURIComponent(categoryName.trim());
			const url = `http://localhost:3500/data/users/${userId}/dashboard/${dashboardId}/category/${encodedCategoryName}`;

			try {
				await axios.put(
					url,
					{
						combinedData: combinedDataArray,
						summaryData: summaryDataArray,
						appliedChartType: appliedChartTypes[categoryName],
						checkedIds: checkedIds[categoryName],
					},
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				);
			} catch (error) {}
		},
		[dashboardId, userId, accessToken, appliedChartTypes, checkedIds]
	);

	useEffect(() => {
		Object.keys(combinedData).forEach((categoryName) => {
			const combinedDataArray = combinedData[categoryName];
			const summaryDataArray = summaryData[categoryName] || [];
			updateCategoryDataInBackend(
				categoryName,
				combinedDataArray,
				summaryDataArray
			);
		});
	}, [combinedData, summaryData, updateCategoryDataInBackend]);

	const getCombinedChartData = (
		category: string,
		chartIds: string[]
	): Entry[] => {
		const entries =
			localDashboardData
				.find((cat) => cat.categoryName === category)
				?.mainData.filter((entry) => chartIds.includes(entry.id))
				.flatMap((entry) => entry.data) || [];

		return entries;
	};

	const handleCheck = useCallback(
		(category: string, id: string, combinedChartId: string | null = null) => {
			let newCheckedIds = { ...checkedIds };

			if (id === '' && combinedChartId) {
				if (checkedType === 'entry') {
					newCheckedIds[category] = [];
				}

				const categoryCheckedIds = newCheckedIds[category] || [];
				const isChecked = categoryCheckedIds.includes(combinedChartId);

				if (isChecked) {
					newCheckedIds[category] = categoryCheckedIds.filter(
						(i) => i !== combinedChartId
					);
					if (newCheckedIds[category].length === 0) {
						setCheckedType(undefined);
					}
				} else {
					newCheckedIds[category] = [combinedChartId];
					setCheckedType('index');
				}
				getCheckIds(newCheckedIds);

				if (newCheckedIds[category].length === 0) {
					setCheckedType(undefined);
				}
				return;
			}

			if (combinedChartId) {
				setCombinedData((prevCombinedData) => {
					const categoryCombinedCharts = prevCombinedData[category] || [];
					let updatedCombinedCharts = categoryCombinedCharts.map((chart) => {
						if (chart.id === combinedChartId) {
							const isChecked = chart.chartIds.includes(id);
							const newChartIds = isChecked
								? chart.chartIds.filter((chartId) => chartId !== id)
								: [...chart.chartIds, id];

							return {
								...chart,
								chartIds: newChartIds,
								data: getCombinedChartData(category, newChartIds),
							};
						}
						return chart;
					});

					updatedCombinedCharts = updatedCombinedCharts.filter(
						(chart) => chart.chartIds?.length >= 2
					);

					return {
						...prevCombinedData,
						[category]: updatedCombinedCharts,
					};
				});
				return;
			}

			if (checkedType === 'index') {
				newCheckedIds[category] = [];
			}

			const categoryCheckedIds = newCheckedIds[category] || [];
			const isChecked = categoryCheckedIds.includes(id);

			if (isChecked) {
				newCheckedIds[category] = categoryCheckedIds.filter((i) => i !== id);
				if (newCheckedIds[category].length === 0) {
					setCheckedType(undefined);
				}
			} else {
				newCheckedIds[category] = [...categoryCheckedIds, id];
				setCheckedType('entry');
			}

			getCheckIds(newCheckedIds);

			const individualChartIds = newCheckedIds[category].filter((chartId) => {
				const isCombinedChart = (combinedData[category] || []).some(
					(chart) => chart.id === chartId
				);
				return !isCombinedChart;
			});

			if (individualChartIds.length >= 2) {
				const newCombinedChart: CombinedChart = {
					id: `combined-${Date.now()}`,
					chartType: appliedChartTypes[category] || 'IndexBar',
					chartIds: individualChartIds,
					data: getCombinedChartData(category, individualChartIds),
				};

				setCombinedData((prevCombinedData) => {
					const updatedCombinedCharts = [
						...(prevCombinedData[category] || []),
						newCombinedChart,
					];
					return {
						...prevCombinedData,
						[category]: updatedCombinedCharts,
					};
				});

				newCheckedIds[category] = [];
				getCheckIds(newCheckedIds);
				setCheckedType(undefined);
			} else if (newCheckedIds[category].length === 0) {
				setCheckedType(undefined);
			}
		},
		[
			checkedIds,
			checkedType,
			getCheckIds,
			combinedData,
			appliedChartTypes,
			setCombinedData,
			localDashboardData,
		]
	);

	// ----------------------------------------------
	//  4. Update Chart Type (Individual/Combined)
	// ----------------------------------------------
	const updateChartType = async (
		chartId: string,
		newChartType: ChartType,
		isCombined: boolean,
		categoryName: string
	) => {
		const endpoint = isCombined
			? `category/${encodeURIComponent(
					categoryName.trim()
			  )}/combinedChart/${chartId}`
			: `chart/${chartId}`;

		const url = `http://localhost:3500/data/users/${userId}/dashboard/${dashboardId}/${endpoint}`;
		const payload = { chartType: newChartType };
		const headers = { Authorization: `Bearer ${accessToken}` };

		try {
			await axios.put(url, payload, { headers });
		} catch (error) {
			console.error('Error updating chartType:', error);
		}
	};

	// Apply global chartType to all checked charts
	useEffect(() => {
		if (globalChartType) {
			Object.keys(checkedIds).forEach((category) => {
				const chartIds = checkedIds[category];
				if (chartIds.length > 0) {
					chartIds.forEach(async (chartId) => {
						const isCombinedChartFlag = (combinedData[category] || []).some(
							(chart) => chart.id === chartId
						);

						// Validate chart type
						if (!isValidChartType(globalChartType, chartId, combinedData)) {
							console.warn(
								`ChartType '${globalChartType}' is not supported for chart ID '${chartId}'. Skipping update.`
							);
							return;
						}

						if (isCombinedChartFlag) {
							// For a combined chart
							await updateChartType(chartId, globalChartType, true, category);
							setCombinedData((prev) => ({
								...prev,
								[category]: prev[category].map((chart) =>
									chart.id === chartId
										? { ...chart, chartType: globalChartType }
										: chart
								),
							}));
						} else {
							// For an individual chart
							await updateChartType(chartId, globalChartType, false, category);
							setLocalDashboardData((prevData) =>
								prevData.map((cat) => {
									if (cat.categoryName === category) {
										return {
											...cat,
											mainData: cat.mainData.map((item) =>
												chartIds.includes(item.id)
													? { ...item, chartType: globalChartType }
													: item
											),
										};
									}
									return cat;
								})
							);
						}
					});
				}
			});

			// Clear global chartType in store once applied
			setChartData(undefined);
		}
	}, [
		globalChartType,
		checkedIds,
		combinedData,
		dashboardId,
		userId,
		accessToken,
		setChartData,
		setLocalDashboardData,
		setCombinedData,
	]);

	// ----------------------------------------------
	//  5. Clear Checks When Edit Mode is Off
	// ----------------------------------------------
	useEffect(() => {
		if (!editMode) {
			getCheckIds({});
			setCheckedType(undefined);
		}
	}, [editMode, getCheckIds]);

	// ----------------------------------------------
	//  6. Clear Checks When Category Changes
	// ----------------------------------------------
	useEffect(() => {
		if (categoryEdit !== previousCategoryEdit.current) {
			getCheckIds({});
			setCheckedType(undefined);
		}
		previousCategoryEdit.current = categoryEdit;
	}, [categoryEdit, getCheckIds]);

	// ----------------------------------------------
	//  7. Drag & Drop to Change Chart Type
	// ----------------------------------------------
	const handleDropCustom = async (
		draggedItem: { type: ChartType; dataType?: 'entry' | 'index' },
		category: string,
		chartId: string
	) => {
		const isCombined = (combinedData[category] || []).some(
			(chart) => chart.id === chartId
		);
		const newChartType = draggedItem.type;

		if (!isValidChartType(newChartType, chartId, combinedData)) {
			console.warn(
				`ChartType '${newChartType}' is not supported for chart ID '${chartId}'.`
			);
			return;
		}

		try {
			await updateChartType(chartId, newChartType, isCombined, category);
			if (isCombined) {
				// Update combined chart in state
				setCombinedData((prev) => ({
					...prev,
					[category]: prev[category].map((chart) =>
						chart.id === chartId ? { ...chart, chartType: newChartType } : chart
					),
				}));
			} else {
				// Update individual chart in local data
				setLocalDashboardData((prevData) =>
					prevData.map((cat) => {
						if (cat.categoryName === category) {
							return {
								...cat,
								mainData: cat.mainData.map((item) =>
									item.id === chartId
										? { ...item, chartType: newChartType }
										: item
								),
							};
						}
						return cat;
					})
				);
			}
		} catch (error) {
			console.error('Error updating chartType:', error);
		}

		setHoveredTitle(null);
	};

	const breakpointColumnsObj = {
		default: 3,
		1100: 2,
		700: 1,
	};

	useEffect(() => {
		if (categoryEdit) {
			getEditMode(
				checkedIds[categoryEdit]?.length ?? 0,
				categoryEdit.length > 0,
				Object.values(checkedIds).flat(),
				checkedType
			);
		}
	}, [editMode, checkedIds, categoryEdit, checkedType]);

	return (
		<div className='mt-5 flex w-full justify-center'>
			<div
				className={classNames('flex w-full items-start', {
					'justify-end': editMode,
					'justify-center': !editMode,
				})}
			>
				<Masonry
					breakpointCols={breakpointColumnsObj}
					className={classNames('z-20 flex gap-5 p-5', {
						'ml-[10px] mr-[20px] w-[75vw] border-2 border-dashed border-primary-90':
							editMode,
						'w-[90vw] border-2 border-dashed border-transparent': !editMode,
					})}
					columnClassName='masonry-column flex flex-col'
				>
					{localDashboardData &&
						localDashboardData.map((document, docIndex) => (
							<div key={docIndex} className='mb-5 break-inside-avoid'>
								<ChartWrapper
									percentageDifference='15'
									isEditingMode={editMode}
									getIsChartCHange={setCategoryEdit}
									title={document.categoryName}
									className='relative h-full w-full shrink-0'
								>
									{document.mainData
										.filter(
											(items) =>
												!(combinedData[document.categoryName] || []).some(
													(chart) => chart.chartIds.includes(items.id)
												)
										)
										.map((items: IndexedEntries) => {
											const isSingleString =
												items.data.length === 1 &&
												typeof items.data[0]?.value === 'string' &&
												items.data[0].value.trim() !== '';

											if (isSingleString) {
												return (
													<SingleStringChart
														key={items.id}
														items={items}
														editMode={editMode}
														categoryEdit={categoryEdit}
														handleCheck={(cat, id) =>
															handleCheck(document.categoryName, id)
														}
														checkedIds={checkedIds[document.categoryName] || []}
													/>
												);
											}

											return (
												<DropTarget
													key={items.id}
													category={document.categoryName}
													chartId={items.id}
													onDrop={handleDropCustom}
													overlayText='Combine / Change Chart'
													overlayCondition={
														editMode && categoryEdit === document.categoryName
													}
													combinedData={combinedData}
												>
													<SingleNumericChart
														items={items}
														editMode={editMode}
														categoryEdit={categoryEdit}
														documentCategory={document.categoryName}
														checkedIds={checkedIds[document.categoryName] || []}
														summaryData={
															summaryData[document.categoryName] || []
														}
														combinedData={
															combinedData[document.categoryName] || []
														}
														handleCheck={handleCheck}
													/>
												</DropTarget>
											);
										})}

									{(combinedData[document.categoryName] || []).map(
										(combinedChart) => (
											<DropTarget
												key={combinedChart.id}
												category={document.categoryName}
												chartId={combinedChart.id}
												onDrop={handleDropCustom}
												overlayText='Combine / Change Chart'
												overlayCondition={
													editMode && categoryEdit === document.categoryName
												}
												combinedData={combinedData}
											>
												<CombinedChartDisplay
													combinedChart={combinedChart}
													editMode={editMode}
													categoryEdit={categoryEdit}
													documentCategory={document.categoryName}
													localDashboardData={localDashboardData}
													checkedIds={checkedIds[document.categoryName] || []}
													handleCheck={handleCheck}
												/>
											</DropTarget>
										)
									)}

									<CombinedChartPlaceholder
										document={document}
										editMode={editMode}
										categoryEdit={categoryEdit}
										checkedIds={checkedIds[document.categoryName] || []}
										summaryData={summaryData[document.categoryName] || []}
										localDashboardData={localDashboardData}
										handleCheck={handleCheck}
										appliedChartType={appliedChartTypes[document.categoryName]}
										combinedData={combinedData[document.categoryName] || []}
									/>
								</ChartWrapper>
							</div>
						))}
				</Masonry>
			</div>
		</div>
	);
};

export default ChartPanel;
