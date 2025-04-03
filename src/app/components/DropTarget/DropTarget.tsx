'use client';

import React, { useEffect } from 'react';
import { useDrop } from 'react-dnd';

import { ChartType, CombinedChart } from '@/types/types';
import { useDragStore } from '../../../../utils/compareChartTypeStore';
import ChartOverlay from '@/views/Dashboard/components/ChartOverlay';

export const SUPPORTED_CHART_TYPES = {
	individual: [
		'EntryLine',
		'EntryArea',
		'TradingLine',
		'Bar',
		'IndexBar',
	] as const,
	combined: [
		'Pie',
		'Radar',
		'IndexBar',
		'Bar',
		'IndexArea',
		'IndexLine',
	] as const,
};

function getChartTypeFromItem(item: {
	type: ChartType;
	dataType?: 'entry' | 'index';
}): 'combined' | 'individual' {
	if (
		SUPPORTED_CHART_TYPES.combined.includes(
			item.type as (typeof SUPPORTED_CHART_TYPES.combined)[number]
		)
	) {
		return 'combined';
	}
	return 'individual';
}

function isChartCombined(
	chartId: string,
	category: string,
	combinedData: { [category: string]: CombinedChart[] }
) {
	return !!combinedData[category]?.some((chart) => chart.id === chartId);
}

interface DragItem {
	type: string;
	item: {
		type: ChartType;
		title: string;
		imageUrl: string;
		imageWidth?: number;
		imageHeight?: number;
		dataType?: 'entry' | 'index';
	};
}

interface DropTargetProps {
	category: string;
	chartId: string;
	children: React.ReactNode;
	onDrop: (
		draggedItem: DragItem['item'],
		category: string,
		chartId: string
	) => void;
	onHover?: (
		draggedItem: DragItem['item'],
		category: string,
		chartId: string
	) => void;
	overlayText: string;
	overlayCondition?: boolean;
	extraChildren?: any;
	combinedData: { [category: string]: CombinedChart[] };
}

const DropTarget: React.FC<DropTargetProps> = ({
	category,
	chartId,
	children,
	onDrop,
	onHover,
	overlayText,
	overlayCondition = false,
	extraChildren,
	combinedData,
}) => {
	const setHoveredTitle = useDragStore((state) => state.setHoveredTitle);

	const [{ isOver, canDrop }, drop] = useDrop<
		DragItem,
		unknown,
		{ isOver: boolean; canDrop: boolean }
	>(() => ({
		accept: 'CHART_ITEM',
		drop: (draggedItem) => {
			onDrop(draggedItem.item, category, chartId);
		},
		hover: (draggedItem, monitor) => {
			if (!monitor.isOver({ shallow: true })) return;

			const draggedIsCombined =
				getChartTypeFromItem(draggedItem.item) === 'combined';

			const hoveredIsCombined = isChartCombined(
				chartId,
				category,
				combinedData
			);

			const isIndexBar = draggedItem.item.type === 'IndexBar';
			const matchStatus =
				isIndexBar || draggedIsCombined === hoveredIsCombined
					? 'match'
					: 'no match';

			setHoveredTitle(matchStatus);

			if (onHover) {
				onHover(draggedItem.item, category, chartId);
			}
		},
		collect: (monitor) => ({
			isOver: monitor.isOver({ shallow: true }),
			canDrop: monitor.canDrop(),
		}),
	}));

	useEffect(() => {
		if (!isOver) {
			setHoveredTitle('none');
		}
	}, [isOver]);

	const shouldShowOverlay = overlayCondition || (isOver && canDrop);

	return (
		<div
			ref={drop}
			className='relative'
			style={{
				position: 'relative',
				minHeight: '80px',
				marginTop: '20px',
				transition: 'border-color 0.3s',
			}}
		>
			{shouldShowOverlay && (
				<ChartOverlay>
					<div className='flex items-center'>{overlayText}</div>
				</ChartOverlay>
			)}
			{children}
		</div>
	);
};

export default DropTarget;
