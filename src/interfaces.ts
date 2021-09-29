export interface BridgeSettings {
	writeFilesOnLaunch: boolean;
	writingFrequency: string;
	tagPath: string;
	metadataPath: string;
	tagFile: string;
	metadataFile: string;
}

export interface Metadata {
	fileName: string;
	relativePath: string;
	tags?: string[];
	headings?: { heading: string; level: number }[];
	aliases?: string[];
	links?: links[];
	backlinks?: backlinks[];
}

export interface linkToPath {
	[key: string]: string;
}

export interface tagNumber {
	[key: string]: number;
}

export interface links {
	link: string;
	relativePath?: string;
	cleanLink?: string;
	displayText?: string;
}

/**
 * a backlink always has a relative path because it needs to exist
 */
export interface backlinks {
	fileName: string;
	link: string;
	relativePath: string;
	cleanLink?: string;
	displayText?: string;
}
