import type {MetadataCache, FrontMatterCache, Pos} from 'obsidian';

export interface BridgeSettings {
	writeFilesOnLaunch: boolean;
	writingFrequency: string;
	tagPath: string;
	metadataPath: string;
	tagFile: string;
	metadataFile: string;
	allExceptMdFile: string;
	allExceptMdPath: string;
	consoleLog: boolean;
}

/**
 * the metadata that will be written to disk as an array of {@link Metadata}
 */
export interface Metadata {
	fileName: string;
	relativePath: string;
	tags?: string[];
	headings?: { heading: string; level: number }[];
	aliases?: string[];
	links?: links[];
	backlinks?: backlinks[];
	frontmatter?: extendedFrontMatterCache;
}

/**
 * the key is lower cased
 */
export interface linkToPath {
	[key: string]: string;
}

/**
 * the lower cased version plus removal of # from .getTags()
 */
export interface tagNumber {
	[key: string]: number;
}

/**
 * name - relative path to the file containing the tags
 * tags - cleaned up tags for the file from {@link Methods.getUniqueTags}
 */
export interface tagCache {
	name: string;
	tags: string[];
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

/**
 * There is at least the root folder
 */
export interface exceptMd {
	folders: folder[];
	nonMdFiles?: file[];
}

export interface folder {
	name: string;
	relativePath: string;
}

export interface file {
	name: string;
	basename: string;
	relativePath: string;
}

export interface extendedMetadataCache extends MetadataCache {
	getTags(): {
		string?: number;
	};
}

export interface extendedFrontMatterCache extends FrontMatterCache {
	cssclass?: string;
	publish?: boolean;
	position: Pos;
	[key: string]: any;
}

