import * as zod from 'zod';

export const DashboardFormSchema = zod.object({
	dashboardData: zod.array(
		zod.object({
			categoryName: zod.string(),
			mainData: zod.array(
				zod.object({
					id: zod.string(),
					chartType: zod.enum([
						'EntryArea',
						'IndexArea',
						'EntryLine',
						'IndexLine',
						'TradingLine',
						'IndexBar',
						'Bar',
						'Pie',
						'Line',
						'Radar',
						'Area',
					]),
					data: zod.array(
						zod.object({
							title: zod.string(),
							value: zod.union([zod.number(), zod.string()]),
							date: zod.string().refine((date) => !isNaN(Date.parse(date)), {
								message: 'Invalid date format',
							}),
							fileName: zod.string(),
						})
					),
					isChartTypeChanged: zod.boolean().optional(),
					fileName: zod.string(),
				})
			),
			combinedData: zod
				.array(
					zod.object({
						id: zod.string(),
						chartType: zod.enum([
							'EntryArea',
							'IndexArea',
							'EntryLine',
							'IndexLine',
							'TradingLine',
							'IndexBar',
							'Bar',
							'Pie',
							'Line',
							'Radar',
							'Area',
						]),
						chartIds: zod.array(zod.string()),
						data: zod.array(
							zod.object({
								title: zod.string(),
								value: zod.union([zod.number(), zod.string()]),
								date: zod.string(),
								fileName: zod.string(),
							})
						),
					})
				)
				.optional(),

			summaryData: zod
				.array(
					zod.object({
						title: zod.string(),
						value: zod.union([zod.number(), zod.string()]),
						date: zod.string(),
						fileName: zod.string(),
					})
				)
				.optional(),
			appliedChartType: zod
				.enum([
					'EntryArea',
					'IndexArea',
					'EntryLine',
					'IndexLine',
					'TradingLine',
					'IndexBar',
					'Bar',
					'Pie',
					'Line',
					'Radar',
					'Area',
				])
				.optional(),
			checkedIds: zod.array(zod.string()).optional(),
		})
	),
});

export type DashboardFormValues = zod.infer<typeof DashboardFormSchema>;
