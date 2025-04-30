export type ChartType =
	| 'EntryArea'
	| 'IndexArea'
	| 'EntryLine'
	| 'IndexLine'
	| 'TradingLine'
	| 'IndexBar'
	| 'Bar'
	| 'Pie'
	| 'Line'
	| 'Radar'
	| 'Area';

export interface Entry {
	title: string;
	value: string | number;
	date: string;
	fileName: string;
}

export interface IndexedEntries {
	id: string;
	chartType: ChartType;
	data: Entry[];
	isChartTypeChanged: boolean; // Made required to match DashboardSchema
	fileName: string;
}

export interface CombinedChart {
	id: string;
	chartType: ChartType;
	chartIds: string[];
	data: Entry[];
}

export interface DashboardCategory {
	categoryName: string; // e.g., "Salary", "Groceries"
	mainData: IndexedEntries[];
	combinedData?: CombinedChart[];
	summaryData?: Entry[];
	appliedChartType?: ChartType;
	checkedIds?: string[];
}

export interface FileRecord {
	fileId?: string; // Optional for cloud files (e.g., Google Drive fileId)
	filename: string;
	content: DashboardCategory[]; // Matches FileRecordSchema's content field
	lastUpdate?: Date; // Optional, set for cloud files or updates
	source: 'local' | 'google';
	isChunked: boolean;
	chunkCount: number;
	monitoring: {
		status: 'active' | 'expired';
		expireDate?: Date;
		folderId?: string | null;
	};
}

export interface DocumentData {
	_id: string;
	dashboardName: string;
	dashboardData: DashboardCategory[];
	files: FileRecord[];
	userId: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface AccordionItemData {
	imageUrl: string;
	imageHeight?: number;
	imageWidth?: number;
	type: string;
	title: string;
	dataType: string;
}

export interface AccordionSection {
	name: string;
	items: AccordionItemData[];
}
