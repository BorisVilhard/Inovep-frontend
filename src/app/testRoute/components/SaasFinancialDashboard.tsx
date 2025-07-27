'use client';

import React, { useState } from 'react';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	BarChart,
	Bar,
} from 'recharts';
import {
	FaDollarSign as CurrencyDollarIcon,
	FaChartBar as ChartBarIcon,
	FaFire as FireIcon,
	FaClock as ClockIcon,
	FaMoneyBillWave as CashIcon,
	FaExclamationTriangle as AlertIcon,
	FaCheckCircle,
	FaTimesCircle,
	FaChartPie as ChartPieIcon,
	FaChartLine as TrendingUpIcon,
	FaUsers as UsersIcon,
	FaCalculator as CalculatorIcon,
	FaBalanceScale as BalanceIcon,
} from 'react-icons/fa';

// Props interface for Dashboard
interface DashboardProps {
	apiData: Category[];
}

// Define types (repeated for completeness)
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

const Dashboard: React.FC<DashboardProps> = ({ apiData }) => {
	// Find relevant categories
	const plCat =
		apiData.find((cat) => cat.cat === 'ProfitAndLoss') ||
		apiData.find((cat) => cat.cat === 'Profit and Loss');
	const cashFlowCat = apiData.find((cat) => cat.cat === 'CashFlow');
	const billsCat =
		apiData.find((cat) => cat.cat === 'Bill') ||
		apiData.find((cat) => cat.cat === 'Bills');
	const invoiceCat = apiData.find((cat) => cat.cat === 'Invoice');
	const paymentCat = apiData.find((cat) => cat.cat === 'Payment');
	const depositCat = apiData.find((cat) => cat.cat === 'Deposit');
	const salesByCustomerCat = apiData.find(
		(cat) => cat.cat === 'SalesByCustomer'
	);
	const salesByProductCat = apiData.find((cat) => cat.cat === 'SalesByProduct');
	const customerBalanceCat = apiData.find(
		(cat) => cat.cat === 'CustomerBalance'
	);
	const customerIncomeCat = apiData.find((cat) => cat.cat === 'CustomerIncome');
	const budgetCat = apiData.find((cat) => cat.cat === 'Budget');
	const purchaseCat = apiData.find((cat) => cat.cat === 'Purchase');
	const recurringCat = apiData.find(
		(cat) => cat.cat === 'RecurringTransaction'
	);
	const transactionListCat = apiData.find(
		(cat) => cat.cat === 'TransactionList'
	);
	const itemCat = apiData.find((cat) => cat.cat === 'Item');
	const billPaymentCat = apiData.find((cat) => cat.cat === 'BillPayment');
	const salesReceiptCat = apiData.find((cat) => cat.cat === 'SalesReceipt');

	// Extract key metrics from P&L
	const totalRevenue =
		plCat?.data.find((item) => item.d[0].t === 'Total Income')?.d[0].v || 0;
	const grossProfit =
		plCat?.data.find((item) => item.d[0].t === 'Gross Profit')?.d[0].v || 0;
	const totalExpenses =
		plCat?.data.find((item) => item.d[0].t === 'Total Expenses')?.d[0].v || 0;
	const netProfit =
		plCat?.data.find((item) => item.d[0].t === 'Net Income')?.d[0].v || 0;

	// From CashFlow
	const operatingCashFlow =
		cashFlowCat?.data.find((item) =>
			item.d[0].t.toLowerCase().includes('operating activities')
		)?.d[0].v || 0;
	const investingCashFlow =
		cashFlowCat?.data.find((item) =>
			item.d[0].t.toLowerCase().includes('investing activities')
		)?.d[0].v || 0;
	const financingCashFlow =
		cashFlowCat?.data.find((item) =>
			item.d[0].t.toLowerCase().includes('financing activities')
		)?.d[0].v || 0;
	const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

	// Bills total
	const totalBills =
		billsCat?.data.reduce((sum, item) => sum + (item.d[0].v || 0), 0) || 0;

	// Inflows from Deposits and Payments
	const totalDeposits =
		depositCat?.data.reduce((sum, item) => sum + (item.d[0].v || 0), 0) || 0;
	const totalPayments =
		paymentCat?.data.reduce((sum, item) => sum + (item.d[0].v || 0), 0) || 0;

	// Revenue from Invoices and SalesReceipts
	const invoiceRevenue =
		invoiceCat?.data.reduce((sum, item) => sum + (item.d[0].v || 0), 0) || 0;
	const salesReceiptRevenue =
		salesReceiptCat?.data.reduce((sum, item) => sum + (item.d[0].v || 0), 0) ||
		0;
	const totalRevenueFromSales = invoiceRevenue + salesReceiptRevenue;

	// Outflows from Purchases and BillPayments
	const totalPurchases =
		purchaseCat?.data.reduce((sum, item) => sum + (item.d[0].v || 0), 0) || 0;
	const totalBillPayments =
		billPaymentCat?.data.reduce((sum, item) => sum + (item.d[0].v || 0), 0) ||
		0;

	// Customer metrics from SalesByCustomer and CustomerIncome
	const topCustomers =
		salesByCustomerCat?.data
			?.sort((a, b) => b.d[0].v - a.d[0].v)
			.slice(0, 5)
			.map((item) => ({ name: item.d[0].t, revenue: item.d[0].v })) || [];

	// Product metrics from SalesByProduct
	const topProducts =
		salesByProductCat?.data
			?.sort((a, b) => b.d[0].v - a.d[0].v)
			.slice(0, 5)
			.map((item) => ({ name: item.d[0].t, sales: item.d[0].v })) || [];

	// AR from CustomerBalance
	const totalAR =
		customerBalanceCat?.data.reduce(
			(sum, item) => sum + (item.d[0].v || 0),
			0
		) || 0;

	// Budget vs Actual (simple variance)
	const budgetTotal =
		budgetCat?.data.reduce((sum, item) => sum + (item.d[0].v || 0), 0) || 0;
	const budgetVariance = budgetTotal - totalExpenses;

	// Recurring revenue estimate from RecurringTransaction
	const recurringRevenue =
		recurringCat?.data
			.filter((item) => item.d[0].t.toLowerCase().includes('income'))
			.reduce((sum, item) => sum + (item.d[0].v || 0), 0) || 0;

	// Mocked or calculated metrics
	const mrrGrowth = recurringRevenue > 0 ? 5.0 : 0; // Assume 5% growth if recurring exists
	const churnRate = 0; // Assume, or calculate from customer data if historical
	const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
	const monthlyBurn = totalExpenses + totalBills + totalPurchases; // Combined outflows
	const currentBalance = totalDeposits + totalPayments - monthlyBurn + totalAR; // Approx balance
	const cashRunwayMonths =
		monthlyBurn > 0 ? Math.floor(currentBalance / monthlyBurn) : Infinity;
	const netProfitMargin =
		totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
	const ltv =
		topCustomers.reduce((sum, cust) => sum + cust.revenue, 0) /
			topCustomers.length || 0; // Avg LTV approx
	const cac = monthlyBurn / topCustomers.length || 0; // Approx CAC
	const ltvCacRatio = cac > 0 ? ltv / cac : 0;

	// Top 3 Costs (from expenses in P&L + Purchases)
	const expenseItems =
		plCat?.data.filter((item) => {
			const t = item.d[0].t.toLowerCase();
			return (
				t.includes('expense') ||
				t.includes('cost') ||
				t.includes('fees') ||
				t.includes('rent') ||
				t.includes('utilities')
			);
		}) || [];
	const purchaseItems =
		purchaseCat?.data.map((item) => ({
			d: [{ t: 'Purchase', v: item.d[0].v }],
		})) || [];
	const allExpenses = [...expenseItems, ...purchaseItems];
	const topCosts = allExpenses
		.sort((a, b) => b.d[0].v - a.d[0].v)
		.slice(0, 3)
		.map((item) => ({
			name: item.d[0].t.replace(/Total /g, ''),
			amount: item.d[0].v,
		}));

	// Revenue Data (single point, mock trend)
	const date = plCat?.data[0]?.d[0].d || '2025-07-27';
	const month = new Date(date).toLocaleString('default', { month: 'short' });
	const revenueData = [
		{ month, thisYear: totalRevenue, lastYear: totalRevenue * 0.9 }, // Assume last year 90%
	];

	// Expense Breakdown Data
	const expenseData = allExpenses.map((item) => ({
		name: item.d[0].t.replace(/Total /g, ''),
		spend: item.d[0].v,
	}));

	// Income Breakdown Data
	const incomeItems =
		plCat?.data.filter((item) => {
			const t = item.d[0].t.toLowerCase();
			return (
				t.includes('income') || t.includes('sales') || t.includes('services')
			);
		}) || [];
	const incomeData = incomeItems.map((item) => ({
		name: item.d[0].t.replace(/Total /g, ''),
		amount: item.d[0].v,
	}));

	// Sparkline data (mock)
	const positiveSpark = [
		{ value: 10 },
		{ value: 15 },
		{ value: 12 },
		{ value: 18 },
		{ value: 20 },
		{ value: 25 },
		{ value: 30 },
	];
	const negativeSpark = [
		{ value: 30 },
		{ value: 25 },
		{ value: 28 },
		{ value: 22 },
		{ value: 20 },
		{ value: 15 },
		{ value: 10 },
	];

	// AI Alerts based on metrics
	const aiAlerts = [];
	if (netProfitMargin > 15)
		aiAlerts.push({
			message: `Net Profit Margin at ${netProfitMargin.toFixed(
				1
			)}% - Strong profitability!`,
			type: 'good',
		});
	if (totalExpenses / totalRevenue > 0.5)
		aiAlerts.push({
			message: `Expenses at ${((totalExpenses / totalRevenue) * 100).toFixed(
				1
			)}% of revenue - Review costs.`,
			type: 'warning',
		});
	if (totalBills > totalRevenue * 0.5)
		aiAlerts.push({
			message: `Bills total $${totalBills.toFixed(
				2
			)} exceeding 50% of revenue - Potential cash flow issue!`,
			type: 'bad',
		});
	if (grossMargin < 90)
		aiAlerts.push({
			message: `Gross Margin at ${grossMargin.toFixed(1)}% - Optimize COGS.`,
			type: 'warning',
		});
	if (cashRunwayMonths < 6)
		aiAlerts.push({
			message: `Cash Runway at ${cashRunwayMonths} months - Consider funding.`,
			type: 'bad',
		});
	if (ltvCacRatio < 3)
		aiAlerts.push({
			message: `LTV/CAC at ${ltvCacRatio.toFixed(
				1
			)} - Improve customer retention.`,
			type: 'warning',
		});

	// Runway Forecast (mock balance)
	const [extraSpend, setExtraSpend] = useState(0);
	const adjustedRunway =
		monthlyBurn > 0
			? Math.floor(currentBalance / (monthlyBurn + extraSpend))
			: Infinity;
	const runwayForecast = [
		{ month: 'Aug', balance: currentBalance - monthlyBurn },
		{ month: 'Sep', balance: currentBalance - monthlyBurn * 2 },
		{ month: 'Oct', balance: currentBalance - monthlyBurn * 3 },
		{ month: 'Nov', balance: currentBalance - monthlyBurn * 4 },
		{ month: 'Dec', balance: currentBalance - monthlyBurn * 5 },
		{ month: 'Jan', balance: currentBalance - monthlyBurn * 6 },
	];
	const adjustedForecast = runwayForecast.map((point, index) => ({
		month: point.month,
		balance: point.balance - extraSpend * (index + 1),
	}));

	const runwayColor = cashRunwayMonths < 6 ? 'text-red-500' : 'text-green-500';
	const cashFlowColor = netProfit > 0 ? 'text-green-500' : 'text-red-500';

	return (
		<div className='min-h-screen text-white p-6'>
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
				<div className='bg-gray-900 p-6 rounded-xl shadow-md flex items-center justify-between'>
					<div className='flex flex-col gap-1'>
						<h2 className='text-sm font-medium text-gray-400'>
							Money Coming In
						</h2>
						<p className='text-2xl font-bold'>${totalRevenue.toFixed(2)}</p>
						<p className='text-xs text-green-400'>From QuickBooks P&L</p>
					</div>
					<ResponsiveContainer width={120} height={50}>
						<LineChart data={positiveSpark}>
							<Line
								type='monotone'
								dataKey='value'
								stroke='#10B981'
								dot={false}
								strokeWidth={1.5}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
				<div className='bg-gray-900 p-6 rounded-xl shadow-md flex items-center justify-between'>
					<div className='flex flex-col gap-1'>
						<h2 className='text-sm font-medium text-gray-400'>
							Money Going Out
						</h2>
						<p className='text-2xl font-bold'>${monthlyBurn.toFixed(2)}</p>
						<p className='text-xs text-red-400'>From expenses + bills</p>
					</div>
					<ResponsiveContainer width={120} height={50}>
						<LineChart data={negativeSpark}>
							<Line
								type='monotone'
								dataKey='value'
								stroke='#EF4444'
								dot={false}
								strokeWidth={1.5}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
				<div className='bg-gray-900 p-6 rounded-xl shadow-md flex items-center justify-between'>
					<div className='flex flex-col gap-1'>
						<h2 className='text-sm font-medium text-gray-400'>Net Cash Flow</h2>
						<p className='text-2xl font-bold'>${netCashFlow.toFixed(2)}</p>
						<p className='text-xs text-gray-300'>From CashFlow Report</p>
					</div>
					<ResponsiveContainer width={120} height={50}>
						<LineChart data={positiveSpark}>
							<Line
								type='monotone'
								dataKey='value'
								stroke='#10B981'
								dot={false}
								strokeWidth={1.5}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
				<div className='bg-gray-900 p-6 rounded-xl shadow-md flex items-center justify-between'>
					<div className='flex flex-col gap-1'>
						<h2 className='text-sm font-medium text-gray-400'>AR Balance</h2>
						<p className='text-2xl font-bold'>${totalAR.toFixed(2)}</p>
						<p className='text-xs text-gray-300'>From CustomerBalance</p>
					</div>
					<ResponsiveContainer width={120} height={50}>
						<LineChart data={positiveSpark}>
							<Line
								type='monotone'
								dataKey='value'
								stroke='#10B981'
								dot={false}
								strokeWidth={1.5}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div className='w-full flex justify-between gap-20'>
				<div className='mb-4 w-full'>
					<div className='grid bg-gray-900 rounded-lg py-8 px-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8'>
						<div className='flex flex-col items-center text-center pb-3 border-b-2 border-solid border-gray-600'>
							<ClockIcon className='h-5 w-5 text-blue-400 mb-1' />
							<h2 className='text-xs font-medium text-gray-400'>
								Net Profit Margin
							</h2>
							<p className={`text-lg font-bold ${cashFlowColor}`}>
								{netProfitMargin.toFixed(1)}%
							</p>
							<p className='text-xs text-gray-500 mt-0.5'>
								Calculated from P&L
							</p>
						</div>
						<div className='flex flex-col items-center text-center pb-3 border-b-2 border-solid border-gray-600'>
							<CashIcon className='h-5 w-5 text-green-400 mb-1' />
							<h2 className='text-xs font-medium text-gray-400'>Net Profit</h2>
							<p className={`text-lg font-bold ${cashFlowColor}`}>
								${netProfit.toFixed(0)}
							</p>
							<p className='text-xs text-gray-500 mt-0.5'>From QuickBooks</p>
						</div>
						<div className='flex flex-col items-center text-center pb-3 border-b-2 border-solid border-gray-600'>
							<FireIcon className='h-5 w-5 text-red-400 mb-1' />
							<h2 className='text-xs font-medium text-gray-400'>Top Costs</h2>
							<ul className='text-xs mt-0.5'>
								{topCosts.map((cost, i) => (
									<li key={i} className='text-gray-300'>
										{cost.name}: ${cost.amount.toFixed(0)}
									</li>
								))}
							</ul>
							<p className='text-xs text-gray-500 mt-0.5'>From QuickBooks</p>
						</div>
						<div className='flex flex-col items-center text-center pb-3 border-b-2 border-solid border-gray-600'>
							<TrendingUpIcon className='h-5 w-5 text-purple-400 mb-1' />
							<h2 className='text-xs font-medium text-gray-400'>
								Gross Margin
							</h2>
							<p className='text-lg font-bold'>{grossMargin.toFixed(1)}%</p>
							<p className='text-xs text-gray-500 mt-0.5'>From QuickBooks</p>
						</div>
						<div className='flex flex-col items-center text-center pb-3 border-b-2 border-solid border-gray-600'>
							<UsersIcon className='h-5 w-5 text-orange-400 mb-1' />
							<h2 className='text-xs font-medium text-gray-400'>
								LTV/CAC Ratio
							</h2>
							<p className='text-lg font-bold'>{ltvCacRatio.toFixed(1)}</p>
							<p className='text-xs text-gray-500 mt-0.5'>From Customer Data</p>
						</div>
						<div className='flex flex-col items-center text-center pb-3 border-b-2 border-solid border-gray-600'>
							<CalculatorIcon className='h-5 w-5 text-indigo-400 mb-1' />
							<h2 className='text-xs font-medium text-gray-400'>
								Budget Variance
							</h2>
							<p className='text-lg font-bold'>${budgetVariance.toFixed(0)}</p>
							<p className='text-xs text-gray-500 mt-0.5'>From Budget</p>
						</div>
					</div>
				</div>

				<div className='bg-gray-900 w-[70%] p-4 rounded-xl shadow-md mb-6'>
					<h2 className='text-md font-bold text-gray-400 mb-4'>
						AI Alerts - Fix This Now
					</h2>
					<ul className='space-y-2'>
						{aiAlerts.map((alert, index) => {
							let icon, color;
							if (alert.type === 'good') {
								icon = <FaCheckCircle className='h-5 w-5 mr-2' />;
								color = 'text-green-400';
							} else if (alert.type === 'warning') {
								icon = <AlertIcon className='h-5 w-5 mr-2' />;
								color = 'text-yellow-400';
							} else {
								icon = <FaTimesCircle className='h-5 w-5 mr-2' />;
								color = 'text-red-400';
							}
							return (
								<li
									key={index}
									className={`flex items-center ${color} text-[14px] my-1`}
								>
									{icon}
									{alert.message}
								</li>
							);
						})}
					</ul>
				</div>
			</div>

			<div className='bg-gray-900 p-4 rounded-xl shadow-md mb-6'>
				<div className='mb-3'>
					<h2 className='text-sm font-medium text-gray-400 mb-4'>
						Runway Forecast (Add extra spend for scenario modeling)
					</h2>
					<div className='flex items-center space-x-4'>
						<input
							type='number'
							placeholder='Extra monthly spend ($)'
							value={extraSpend}
							onChange={(e) => setExtraSpend(Number(e.target.value))}
							className='bg-gray-700 text-white p-2 rounded-md text-sm'
						/>
						<p className='text-sm text-gray-300'>
							New Runway:{' '}
							<span className='font-bold'>{adjustedRunway} months</span>
						</p>
					</div>
				</div>
				<ResponsiveContainer width='100%' height={250}>
					<LineChart data={adjustedForecast}>
						<CartesianGrid strokeDasharray='3 3' stroke='#374151' />
						<XAxis dataKey='month' stroke='#9CA3AF' tick={{ fontSize: 12 }} />
						<YAxis stroke='#9CA3AF' tick={{ fontSize: 12 }} />
						<Tooltip
							contentStyle={{
								backgroundColor: '#1F2937',
								border: 'none',
								fontSize: 12,
							}}
						/>
						<Legend wrapperStyle={{ fontSize: 12 }} />
						<Line
							type='monotone'
							dataKey='balance'
							stroke='#3B82F6'
							name='Predicted Cash'
						/>
					</LineChart>
				</ResponsiveContainer>
				<p className='text-xs text-gray-500 mt-2'>
					From: QuickBooks (mock balance)
				</p>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
				<div className='bg-gray-900 p-4 rounded-xl shadow-md'>
					<h2 className='text-sm font-medium text-gray-400 mb-4'>
						Revenue Trend (Single Period)
					</h2>
					<ResponsiveContainer width='100%' height={250}>
						<BarChart data={revenueData}>
							<CartesianGrid strokeDasharray='3 3' stroke='#374151' />
							<XAxis dataKey='month' stroke='#9CA3AF' tick={{ fontSize: 12 }} />
							<YAxis stroke='#9CA3AF' tick={{ fontSize: 12 }} />
							<Tooltip
								contentStyle={{
									backgroundColor: '#1F2937',
									border: 'none',
									fontSize: 12,
								}}
							/>
							<Legend wrapperStyle={{ fontSize: 12 }} />
							<Bar
								dataKey='thisYear'
								fill='#3B82F6'
								name='This Year'
								radius={[4, 4, 0, 0]}
							/>
							<Bar
								dataKey='lastYear'
								fill='#A78BFA'
								name='Last Year (est.)'
								radius={[4, 4, 0, 0]}
							/>
						</BarChart>
					</ResponsiveContainer>
					<p className='text-xs text-gray-500 mt-2'>From: QuickBooks</p>
				</div>
				<div className='bg-gray-900 p-4 rounded-xl shadow-md'>
					<h2 className='text-sm font-medium text-gray-400 mb-4'>
						Expense Breakdown
					</h2>
					<ResponsiveContainer width='100%' height={250}>
						<BarChart data={expenseData}>
							<CartesianGrid strokeDasharray='3 3' stroke='#374151' />
							<XAxis dataKey='name' stroke='#9CA3AF' tick={{ fontSize: 12 }} />
							<YAxis stroke='#9CA3AF' tick={{ fontSize: 12 }} />
							<Tooltip
								contentStyle={{
									backgroundColor: '#1F2937',
									border: 'none',
									fontSize: 12,
								}}
							/>
							<Legend wrapperStyle={{ fontSize: 12 }} />
							<Bar dataKey='spend' fill='#3B82F6' radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
					<p className='text-xs text-gray-500 mt-2'>From: QuickBooks</p>
				</div>
			</div>

			<div className='bg-gray-900 p-4 rounded-xl shadow-md mb-6'>
				<h2 className='text-sm font-medium text-gray-400 mb-4'>
					Income Breakdown
				</h2>
				<ResponsiveContainer width='100%' height={250}>
					<BarChart data={incomeData}>
						<CartesianGrid strokeDasharray='3 3' stroke='#374151' />
						<XAxis dataKey='name' stroke='#9CA3AF' tick={{ fontSize: 12 }} />
						<YAxis stroke='#9CA3AF' tick={{ fontSize: 12 }} />
						<Tooltip
							contentStyle={{
								backgroundColor: '#1F2937',
								border: 'none',
								fontSize: 12,
							}}
						/>
						<Legend wrapperStyle={{ fontSize: 12 }} />
						<Bar dataKey='amount' fill='#A78BFA' radius={[4, 4, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
				<p className='text-xs text-gray-500 mt-2'>From: QuickBooks</p>
			</div>

			<div className='bg-gray-900 p-4 rounded-xl shadow-md mb-6'>
				<h2 className='text-sm font-medium text-gray-400 mb-4'>
					Top Customers by Revenue
				</h2>
				<ResponsiveContainer width='100%' height={250}>
					<BarChart data={topCustomers}>
						<CartesianGrid strokeDasharray='3 3' stroke='#374151' />
						<XAxis dataKey='name' stroke='#9CA3AF' tick={{ fontSize: 12 }} />
						<YAxis stroke='#9CA3AF' tick={{ fontSize: 12 }} />
						<Tooltip
							contentStyle={{
								backgroundColor: '#1F2937',
								border: 'none',
								fontSize: 12,
							}}
						/>
						<Legend wrapperStyle={{ fontSize: 12 }} />
						<Bar dataKey='revenue' fill='#10B981' radius={[4, 4, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
				<p className='text-xs text-gray-500 mt-2'>From: SalesByCustomer</p>
			</div>

			<div className='bg-gray-900 p-4 rounded-xl shadow-md mb-6'>
				<h2 className='text-sm font-medium text-gray-400 mb-4'>
					Top Products by Sales
				</h2>
				<ResponsiveContainer width='100%' height={250}>
					<BarChart data={topProducts}>
						<CartesianGrid strokeDasharray='3 3' stroke='#374151' />
						<XAxis dataKey='name' stroke='#9CA3AF' tick={{ fontSize: 12 }} />
						<YAxis stroke='#9CA3AF' tick={{ fontSize: 12 }} />
						<Tooltip
							contentStyle={{
								backgroundColor: '#1F2937',
								border: 'none',
								fontSize: 12,
							}}
						/>
						<Legend wrapperStyle={{ fontSize: 12 }} />
						<Bar dataKey='sales' fill='#A78BFA' radius={[4, 4, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
				<p className='text-xs text-gray-500 mt-2'>From: SalesByProduct</p>
			</div>
		</div>
	);
};

export default Dashboard;
