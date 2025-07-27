'use client';

import React, { useState } from 'react';
import UploadBar from './components/UploadBar';
import Dashboard from './testRoute/components/SaasFinancialDashboard';
import ComponentDrawer from '@/views/Dashboard/components/ComponentDrawer';

// Define types for apiData
interface DataPoint {
	t: string;
	v: number;
	d: string;
	accountRef?: { name: string; value: string };
}

interface DataItem {
	i: string;
	d: DataPoint[];
	comb: any[];
	sum: any[];
	chart: string;
	ids: any[];
}

interface Category {
	cat: string;
	data: DataItem[];
	comb: any[];
	sum: any[];
	chart: string;
	ids: any[];
}

interface Props {}

const Home: React.FC<Props> = () => {
	const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
	const [apiData, setApiData] = useState<Category[]>([]);
	const [error, setError] = useState<string | null>(null);

	// No transform needed for QuickBooks since backend already restructures
	// For Pohoda, transform raw to categories
	const transformPohodaData = (pohoda: any): Category[] => {
		const transformedData: Category[] = [];

		// Received Invoices as Expenses
		if (pohoda.receivedInvoices) {
			transformedData.push({
				cat: 'Pohoda Received Invoices',
				data: pohoda.receivedInvoices.map((item: any) => ({
					i: item.Id.toString(),
					d: [
						{
							t: 'Expenses',
							v: item.DocumentRecapitulation?.TotalPrice || 0,
							d: item.IssueDate || new Date().toISOString().split('T')[0],
						},
					],
					comb: [],
					sum: [],
					chart: 'LineChart',
					ids: [],
				})),
				comb: [],
				sum: [],
				chart: 'LineChart',
				ids: [],
			});
		}

		// Issued Invoices as Revenue
		if (pohoda.issuedInvoices) {
			transformedData.push({
				cat: 'Pohoda Issued Invoices',
				data: pohoda.issuedInvoices.map((item: any) => ({
					i: item.Id.toString(),
					d: [
						{
							t: 'Revenue',
							v: item.DocumentRecapitulation?.TotalPrice || 0,
							d: item.IssueDate || new Date().toISOString().split('T')[0],
						},
					],
					comb: [],
					sum: [],
					chart: 'LineChart',
					ids: [],
				})),
				comb: [],
				sum: [],
				chart: 'LineChart',
				ids: [],
			});
		}

		// Received Orders
		if (pohoda.receivedOrders) {
			transformedData.push({
				cat: 'Pohoda Received Orders',
				data: pohoda.receivedOrders.map((item: any) => ({
					i: item.Id.toString(),
					d: [
						{
							t: 'Orders',
							v: item.DocumentRecapitulation?.TotalPrice || 0,
							d: item.ReceivedDate || new Date().toISOString().split('T')[0],
						},
					],
					comb: [],
					sum: [],
					chart: 'BarChart',
					ids: [],
				})),
				comb: [],
				sum: [],
				chart: 'BarChart',
				ids: [],
			});
		}

		// Stock Items (as Inventory Value)
		if (pohoda.stockItems) {
			transformedData.push({
				cat: 'Pohoda Stock Items',
				data: pohoda.stockItems.map((item: any) => ({
					i: item.Id.toString(),
					d: [
						{
							t: 'Inventory',
							v: item.Price * item.Quantity || 0,
							d: new Date().toISOString().split('T')[0],
						},
					],
					comb: [],
					sum: [],
					chart: 'BarChart',
					ids: [],
				})),
				comb: [],
				sum: [],
				chart: 'BarChart',
				ids: [],
			});
		}

		// Bills as Expenses
		if (pohoda.bills) {
			transformedData.push({
				cat: 'Pohoda Bills',
				data: pohoda.bills.map((item: any) => ({
					i: item.Id.toString(),
					d: [
						{
							t: 'Expenses',
							v: item.TotalAmount || 0,
							d: item.Date || new Date().toISOString().split('T')[0],
						},
					],
					comb: [],
					sum: [],
					chart: 'LineChart',
					ids: [],
				})),
				comb: [],
				sum: [],
				chart: 'LineChart',
				ids: [],
			});
		}

		// Profit Loss Report
		if (pohoda.profitLossReport) {
			transformedData.push({
				cat: 'Pohoda Profit/Loss',
				data: [
					{
						i: 'revenue',
						d: [
							{
								t: 'Total Revenue',
								v: pohoda.profitLossReport.totalIncome || 0,
								d:
									pohoda.profitLossReport.period?.to ||
									new Date().toISOString().split('T')[0],
							},
						],
						comb: [],
						sum: [],
						chart: 'LineChart',
						ids: [],
					},
					{
						i: 'expenses',
						d: [
							{
								t: 'Total Expenses',
								v: pohoda.profitLossReport.totalExpenses || 0,
								d:
									pohoda.profitLossReport.period?.to ||
									new Date().toISOString().split('T')[0],
							},
						],
						comb: [],
						sum: [],
						chart: 'LineChart',
						ids: [],
					},
					{
						i: 'net_profit',
						d: [
							{
								t: 'Net Profit',
								v: pohoda.profitLossReport.netProfit || 0,
								d:
									pohoda.profitLossReport.period?.to ||
									new Date().toISOString().split('T')[0],
							},
						],
						comb: [],
						sum: [],
						chart: 'LineChart',
						ids: [],
					},
				],
				comb: [],
				sum: [],
				chart: 'LineChart',
				ids: [],
			});
		}

		return transformedData;
	};

	// Handle platform connections and data updates
	const handleConnectionChange = (platforms: string[], newApiData?: any) => {
		setConnectedPlatforms(platforms);
		const transformedData: Category[] = [];

		// Handle Pohoda data
		if (platforms.includes('pohoda') && newApiData?.pohoda) {
			transformedData.push(...transformPohodaData(newApiData.pohoda));
		}

		// Handle QuickBooks data - already restructured from backend
		if (platforms.includes('quickbooks') && newApiData?.quickbooks) {
			transformedData.push(...newApiData.quickbooks);
		}

		setApiData((prevData) => [
			...prevData.filter(
				(cat) => !platforms.some((p) => cat.cat.toLowerCase().includes(p))
			),
			...transformedData,
		]);
	};

	const dashboard = {
		_id: 'sample_dashboard',
		name: 'Financial Dashboard',
		ref: null,
		data:
			apiData.length > 0
				? apiData
				: [
						{
							cat: 'Default',
							data: [],
							comb: [],
							sum: [],
							chart: 'LineChart',
							ids: [],
						},
				  ],
		f: [],
		uid: 'user_123',
		ca: new Date().toISOString(),
		ua: new Date().toISOString(),
		recommendations: [
			{
				result_name: 'Net Profit Margin',
				parameters: ['Revenue', 'Expenses'],
				operator: '({parameter1} - {parameter2}) / {parameter1} * 100',
			},
		],
	};

	return (
		<div className='w-full bg-slate-300'>
			{error && (
				<div className='bg-red-500 text-white p-4 rounded-md mb-4'>{error}</div>
			)}
			<div className='absolute z-50 w-full top-[120px]'>
				<UploadBar onConnectionChange={handleConnectionChange} />
				<Dashboard apiData={dashboard.data} />
			</div>
			<ComponentDrawer isOpen={() => {}} accordionItems={[]} />
		</div>
	);
};

export default Home;
