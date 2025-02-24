'use client';

import React, { useEffect } from 'react';
import { useDrop } from 'react-dnd';

import { ChartType, CombinedChart } from '@/types/types'; // <-- adjust path as needed
import { useDragStore } from '../../../../utils/compareChartTypeStore'; // <-- adjust path
import ChartOverlay from '@/views/Dashboard/components/ChartOverlay'; // <-- adjust path

/**
 * Defines your “supported” chart types.
 * Adjust these if you have them declared elsewhere.
 */
export const SUPPORTED_CHART_TYPES = {
  individual: ['EntryLine', 'EntryArea', 'TradingLine', 'Bar', 'IndexBar'] as const,
  combined: ['Pie', 'Radar', 'IndexBar', 'Bar', 'IndexArea', 'IndexLine'] as const,
};

/**
 * Determines “combined” vs. “individual” purely by matching
 * the chart’s `type` with the SUPPORTED_CHART_TYPES lists.
 */
function getChartTypeFromItem(item: {
  type: ChartType;
  dataType?: 'entry' | 'index';
}): 'combined' | 'individual' {
  if (
    SUPPORTED_CHART_TYPES.combined.includes(
      item.type as (typeof SUPPORTED_CHART_TYPES.combined)[number],
    )
  ) {
    return 'combined';
  }
  return 'individual';
}

/**
 * Checks if a given chart ID is in the `combinedData` array for the specified category.
 */
function isChartCombined(
  chartId: string,
  category: string,
  combinedData: { [category: string]: CombinedChart[] },
) {
  return !!combinedData[category]?.some((chart) => chart.id === chartId);
}

/**
 * Describes the “item” you’re dragging.
 */
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

/**
 * Props for our DropTarget component.
 */
interface DropTargetProps {
  category: string;
  chartId: string;
  children: React.ReactNode;
  onDrop: (draggedItem: DragItem['item'], category: string, chartId: string) => void;
  onHover?: (draggedItem: DragItem['item'], category: string, chartId: string) => void;
  overlayText: string;
  overlayCondition?: boolean;
  extraChildren?: any;
  combinedData: { [category: string]: CombinedChart[] };
}

/**
 * DropTarget component: wraps charts (individual or combined)
 * and handles drag-and-drop logic.
 */
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

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, unknown, { isOver: boolean; canDrop: boolean }>(
    () => ({
      accept: 'CHART_ITEM',
      drop: (draggedItem) => {
        onDrop(draggedItem.item, category, chartId);
      },
      hover: (draggedItem, monitor) => {
        // Only set hover state if we're over this specific target (shallow = true).
        if (!monitor.isOver({ shallow: true })) return;

        // 1) Identify if dragged item is combined or individual
        const draggedIsCombined = getChartTypeFromItem(draggedItem.item) === 'combined';
        // 2) Identify if the chart we are hovering over is combined or individual
        const hoveredIsCombined = isChartCombined(chartId, category, combinedData);

        // 3) Compare them => "match" if both are the same; otherwise "no match"
        const isIndexBar = draggedItem.item.type === 'IndexBar';
        const matchStatus =  isIndexBar ||
          draggedIsCombined === hoveredIsCombined ? 'match' : 'no match';

        setHoveredTitle(matchStatus);

        // If you need additional logic in the parent, call onHover:
        if (onHover) {
          onHover(draggedItem.item, category, chartId);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
  );

  /**
   * If we're **not** over any drop target at all (this one or others),
   * we want to set "none". This ensures that once we leave all drop targets,
   * hoveredTitle resets to "none".
   *
   * NOTE: If you have multiple DropTargets close together, you might see
   * brief "none" flickers when jumping from one target to another. If that
   * becomes an issue, you can fine-tune this logic or keep a global
   * “hovered over any target?” approach.
   */
  useEffect(() => {
    if (!isOver) {
      setHoveredTitle('none');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOver]);

  // We'll show an overlay if the user is hovering and can drop,
  // or if there's some external condition passed via overlayCondition.
  const shouldShowOverlay = overlayCondition || (isOver && canDrop);

  return (
    <div
      ref={drop}
      className="relative"
      style={{
        position: 'relative',
        minHeight: '80px',
        transition: 'border-color 0.3s',
      }}
    >
      {shouldShowOverlay && (
        <ChartOverlay>
          <div className="flex items-center gap-3">
            {extraChildren} {overlayText}
          </div>
        </ChartOverlay>
      )}
      {children}
    </div>
  );
};

export default DropTarget;
