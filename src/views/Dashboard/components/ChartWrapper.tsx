import React from 'react';
import Button from '@/app/components/Button/Button';
import { ReactNode } from 'react';
import { numberCatcher } from '../../../../utils/numberCatcher';

interface Props {
	title?: string;
	value?: number | string;
	children: ReactNode;
	percentageDifference?: string;
	id?: string;
	className?: string;
	onClick?: () => void;
	isEditingMode?: boolean;
	getIsChartCHange?: (ChartChange: string) => void;
}

export const ChartWrapper = (props: Props) => {
	return (
		<div>
			{props.isEditingMode && (
				<div className='ml-[20px] flex items-center gap-2'>
					<Button
						onClick={() =>
							props.getIsChartCHange &&
							props.getIsChartCHange(props.title ?? '')
						}
						size='small'
						type={'secondary'}
					>
						Change / Combine Chart
					</Button>
				</div>
			)}
			<div
				style={{ boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px' }}
				className={`relative m-[10px] flex flex-col items-stretch justify-between rounded-[10px] p-[10px] ${props.className}`}
				onClick={props.onClick}
			>
				{props.title !== '' && (
					<h1 className='mb-4 ml-[3px] text-[16px] font-medium'>
						{numberCatcher(props.title ?? '')}
					</h1>
				)}
				<div>
					<h1 className='font-500 text-[35px]'>{props.value}</h1>
					<div style={{ width: '100%', height: '100%' }}>{props.children}</div>
				</div>
			</div>
		</div>
	);
};
