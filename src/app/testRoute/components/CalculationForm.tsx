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

	// Fetch numeric titles when dashboard changes
	useEffect(() => {
		if (!dashboard?._id || !dashboard?.uid) {
			setFormError('Invalid dashboard or user ID.');
			return;
		}

		const fetchTitles = async () => {
			setFetchingTitles(true);
			setFormError(null);
			try {
				const titles = await fetchNumericTitles(dashboard.uid, dashboard._id);
				setNumericParameters(titles);
				// Initialize parameters with first two titles if available
				if (titles.length >= 2) {
					setParameters([titles[0], titles[1]]);
				} else if (titles.length === 1) {
					setParameters([titles[0], '']);
				} else {
					setParameters(['', '']);
					setFormError('No numeric columns available for calculation.');
				}
			} catch (err: any) {
				setFormError(`Failed to load numeric columns: ${err.message}`);
				setNumericParameters([]);
			} finally {
				setFetchingTitles(false);
			}
		};

		fetchTitles();
	}, [dashboard?._id, dashboard?.uid, fetchNumericTitles]);

	// Handle parameter selection
	const handleParameterChange = (index: number, value: string) => {
		const newParameters = [...parameters];
		newParameters[index] = value;
		setParameters(newParameters);

		// Adjust operations array based on parameter count
		if (newParameters.length > operations.length + 1) {
			setOperations([...operations, 'plus']);
		} else if (newParameters.length <= operations.length + 1) {
			setOperations(operations.slice(0, newParameters.length - 1));
		}
	};

	// Add a new parameter field
	const handleAddParameter = () => {
		if (parameters.length < numericParameters.length) {
			// Find an unused parameter
			const available = numericParameters.find(
				(param) => !parameters.includes(param)
			);
			setParameters([...parameters, available || '']);
		}
	};

	// Remove a parameter field
	const handleRemoveParameter = (index: number) => {
		if (parameters.length > 2) {
			const newParameters = parameters.filter((_, i) => i !== index);
			setParameters(newParameters);
			setOperations(operations.slice(0, newParameters.length - 1));
		}
	};

	// Handle operation selection
	const handleOperationChange = (index: number, value: string) => {
		const newOperations = [...operations];
		newOperations[index] = value;
		setOperations(newOperations);
	};

	// Validate and submit form
	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		setFormError(null);

		// Validate minimum parameters
		if (parameters.length < 2) {
			setFormError('At least two parameters are required.');
			return;
		}

		// Validate all parameters are selected
		if (parameters.some((param) => !param)) {
			setFormError('All parameters must be selected.');
			return;
		}

		// Validate no duplicate parameters
		const uniqueParams = new Set(parameters);
		if (uniqueParams.size !== parameters.length) {
			setFormError('Duplicate parameters are not allowed.');
			return;
		}

		// Validate parameters are numeric
		if (parameters.some((param) => !numericParameters.includes(param))) {
			setFormError('Invalid parameter selected.');
			return;
		}

		// Validate operations count
		if (operations.length !== parameters.length - 1) {
			setFormError('Number of operations must be one less than parameters.');
			return;
		}

		// Validate operations
		if (operations.some((op) => !validOperations.includes(op))) {
			setFormError('Invalid operation selected.');
			return;
		}

		// Validate result name
		if (!resultName.trim()) {
			setFormError('Result name is required.');
			return;
		}

		if (numericParameters.includes(resultName.trim())) {
			setFormError('Result name must not match an existing parameter.');
			return;
		}

		// Submit form
		onSubmit(parameters, operations, resultName.trim());
		setResultName(''); // Reset result name after submission
	};

	return (
		<form
			onSubmit={handleSubmit}
			className='mt-4 p-4 bg-gray-50 rounded shadow'
		>
			<h3 className='text-lg font-medium mb-2'>Calculate New Parameter</h3>
			{(error || formError) && (
				<div className='text-red-500 mb-2 p-2 bg-red-100 rounded'>
					{error || formError}
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
									aria-label={`Parameter ${index + 1}`}
								>
									<option value=''>Select Parameter</option>
									{numericParameters
										.filter(
											// Exclude already selected parameters (except for current)
											(p) => !parameters.includes(p) || p === param
										)
										.map((p) => (
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
										aria-label={`Remove parameter ${index + 1}`}
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
										aria-label={`Operation ${index + 1}`}
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
								aria-label='Add another parameter'
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
							placeholder='e.g., Days_spent'
							aria-label='Result name'
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
							parameters.some((p) => !p) ||
							new Set(parameters).size !== parameters.length
						}
						aria-label='Calculate new parameter'
					>
						{loading ? 'Calculating...' : 'Calculate'}
					</button>
				</>
			)}
		</form>
	);
}
