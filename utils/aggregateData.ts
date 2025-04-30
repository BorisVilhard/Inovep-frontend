import { useCallback } from 'react';
import { Entry, CombinedChart } from '@/types/types';

type Props = {
	data: CombinedChart[];
	checkedIds: string[];
	getAggregatedData: (data: Entry[]) => void;
};

export const useAggregateData = () => {
	return useCallback((props: Props) => {
		let aggregate: { [title: string]: number } = {};

		props.data.forEach((chart) => {
			chart.data.forEach((entry) => {
				if (props.checkedIds.includes(chart.id)) {
					if (typeof entry.value === 'number') {
						if (!aggregate[entry.title]) {
							aggregate[entry.title] = 0;
						}
						aggregate[entry.title] += entry.value;
					}
				}
			});
		});

		const aggregatedArray: Entry[] = Object.entries(aggregate).map(
			([title, value]) => ({
				title,
				value,
				date: new Date().toISOString(),
				fileName: props.data[0]?.data[0]?.fileName || 'aggregatedFile',
			})
		);

		props.getAggregatedData(aggregatedArray);
	}, []);
};
