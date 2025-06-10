'use client';
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Dashboard } from '../page';

interface Props {
	dashboard: Dashboard;
	onSubmit: (
		parameters: string[],
		operations: string[],
		resultName: string
	) => void;
	loading: boolean;
	error: string | null;
	fetchNumericTitles: (
		userId: string,
		dashboardId: string
	) => Promise<string[]>;
}

export default function CalculationForm({
	dashboard,
	onSubmit,
	loading,
	error,
	fetchNumericTitles,
}: Props) {
	const [parameters, setParameters] = useState<string[]>(['', '']);
	const [operations, setOperations] = useState<string[]>(['plus']);
	const [resultName, setResultName] = useState('');
	const [formError, setFormError] = useState<string | null>(null);
	const [numericParameters, setNumericParameters] = useState<string[]>([]);
	const [fetchingTitles, setFetchingTitles] = useState<boolean>(false);

	const validOperations = ['plus', 'minus', 'multiply', 'divide'];

	// Fetch numeric titles
	useEffect(() => {
		if (!dashboard?._id || !dashboard?.uid) return;

		const fetchTitles = async () => {
			setFetchingTitles(true);
			setFormError(null);
			try {
				const titles = await fetchNumericTitles(dashboard.uid, dashboard._id);
				setNumericParameters(titles);
				setParameters(titles.length >= 2 ? [titles[0], titles[1]] : ['', '']);
				if (titles.length === 0) {
					setFormError('No numeric columns available for calculation.');
				}
			} catch (err: any) {
				setFormError(`Failed to load numeric columns: ${err.message}`);
			} finally {
				setFetchingTitles(false);
			}
		};

		fetchTitles();
	}, [dashboard?._id, dashboard?.uid, fetchNumericTitles]);

	const handleParameterChange = (index: number, value: string) => {
		const newParameters = [...parameters];
		newParameters[index] = value;
		setParameters(newParameters);

		if (newParameters.length > operations.length + 1) {
			setOperations([...operations, 'plus']);
		} else if (newParameters.length <= operations.length + 1) {
			setOperations(operations.slice(0, newParameters.length - 1));
		}
	};

	const handleAddParameter = () => {
		if (parameters.length < numericParameters.length) {
			setParameters([...parameters, numericParameters[0] || '']);
		}
	};

	const handleRemoveParameter = (index: number) => {
		if (parameters.length > 2) {
			const newParameters = parameters.filter((_, i) => i !== index);
			setParameters(newParameters);
			setOperations(operations.slice(0, newParameters.length - 1));
		}
	};

	const handleOperationChange = (index: number, value: string) => {
		const newOperations = [...operations];
		newOperations[index] = value;
		setOperations(newOperations);
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		setFormError(null);

		if (parameters.length < 2) {
			setFormError('At least two parameters are required.');
			return;
		}

		if (operations.length !== parameters.length - 1) {
			setFormError('Number of operations must be one less than parameters.');
			return;
		}

		if (!resultName.trim()) {
			setFormError('Result name is required.');
			return;
		}

		if (
			parameters.some((param) => !numericParameters.includes(param) || !param)
		) {
			setFormError('Invalid or missing parameter selected.');
			return;
		}

		if (operations.some((op) => !validOperations.includes(op))) {
			setFormError('Invalid operation selected.');
			return;
		}

		onSubmit(parameters, operations, resultName);
		setResultName('');
	};

	return (
		<form
			onSubmit={handleSubmit}
			className='mt-4 p-4 bg-gray-50 rounded shadow'
		>
			<h3 className='text-lg font-medium mb-2'>Calculate New Parameter</h3>
			{error && (
				<div className='text-red-500 mb-2 p-2 bg-red-100 rounded'>{error}</div>
			)}
			{formError && (
				<div className='text-red-500 mb-2 p-2 bg-red-100 rounded'>
					{formError}
				</div>
			)}
			{fetchingTitles && (
				<div className='text-gray-500 mb-2'>Loading numeric columns...</div>
			)}
			{!fetchingTitles && numericParameters.length === 0 && !formError && (
				<div className='text-gray-500 mb-2'>No numeric columns available.</div>
			)}
			{!fetchingTitles && numericParameters.length > 0 && (
				<>
					<div className='mb-4'>
						<label className='block text-sm font-medium text-gray-700'>
							Parameters
						</label>
						{parameters.map((param, index) => (
							<div key={index} className='flex items-center mb-2'>
								<select
									value={param}
									onChange={(e: ChangeEvent<HTMLSelectElement>) =>
										handleParameterChange(index, e.target.value)
									}
									className='mt-1 p-2 border rounded w-1/2 mr-2 focus:ring-blue-500 focus:border-blue-500'
									disabled={loading || fetchingTitles}
								>
									<option value=''>Select Parameter</option>
									{numericParameters.map((p) => (
										<option key={p} value={p}>
											{p}
										</option>
									))}
								</select>
								{index >= 2 && (
									<button
										type='button'
										onClick={() => handleRemoveParameter(index)}
										className='text-red-500 hover:text-red-700 text-sm'
										disabled={loading || fetchingTitles}
									>
										Remove
									</button>
								)}
								{index < parameters.length - 1 && (
									<select
										value={operations[index] || 'plus'}
										onChange={(e: ChangeEvent<HTMLSelectElement>) =>
											handleOperationChange(index, e.target.value)
										}
										className='mt-1 p-2 border rounded w-1/4 ml-2 focus:ring-blue-500 focus:border-blue-500'
										disabled={loading || fetchingTitles}
									>
										{validOperations.map((op) => (
											<option key={op} value={op}>
												{op.charAt(0).toUpperCase() + op.slice(1)}
											</option>
										))}
									</select>
								)}
							</div>
						))}
						{parameters.length < numericParameters.length && (
							<button
								type='button'
								onClick={handleAddParameter}
								className='text-blue-500 hover:text-blue-700 text-sm'
								disabled={loading || fetchingTitles}
							>
								+ Add Parameter
							</button>
						)}
					</div>
					<div className='mb-4'>
						<label className='block text-sm font-medium text-gray-700'>
							Result Name
						</label>
						<input
							type='text'
							value={resultName}
							onChange={(e) => setResultName(e.target.value)}
							className='mt-1 p-2 border rounded w-full focus:ring-blue-500 focus:border-blue-500'
							disabled={loading || fetchingTitles}
							required
							placeholder='e.g., Total_Cost'
						/>
					</div>
					<button
						type='submit'
						className='bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
						disabled={
							loading ||
							fetchingTitles ||
							parameters.length < 2 ||
							!resultName.trim() ||
							parameters.some((p) => !p)
						}
					>
						{loading ? 'Calculating...' : 'Calculate'}
					</button>
				</>
			)}
		</form>
	);
}
