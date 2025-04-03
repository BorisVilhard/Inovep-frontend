export const formatDate = (dateInput: string | Date) => {
	const date = new Date(dateInput);
	return date.toISOString().split('T')[0];
};
