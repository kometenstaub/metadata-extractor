import type BridgePlugin from './main';
import {
	App,
	FileSystemAdapter,
	getAllTags,
	CachedMetadata,
	Notice,
	parseFrontMatterAliases,
	LinkCache,
	EmbedCache,
	TFolder,
	TFile,
	TAbstractFile,
} from 'obsidian';
import type {
	Metadata,
	linkToPath,
	tagNumber,
	links,
	backlinks,
	exceptMd,
	folder,
	file,
	tagCache,
	extendedMetadataCache,
} from './interfaces';
import { writeFile, writeFileSync } from 'fs';
//@ts-ignore
import Worker from './workers/metadata.worker';
import { makeFolderAndFileObject } from './utils';

function getAllExceptMd(allFiles: TAbstractFile[]) {
	const folders: folder[] = [];
	for (const TAFile of allFiles) {
		if (TAFile instanceof TFolder) {
			folders.push({name: TAFile.name, relativePath: TAFile.path});
		}
	}
	const otherFiles: file[] = [];
	for (const TAFile of allFiles) {
		// The basename is the name without the extension
		if (TAFile instanceof TFile && TAFile.path.slice(-3) !== '.md') {
			otherFiles.push({
				name: TAFile.name,
				basename: TAFile.basename,
				relativePath: TAFile.path,
			});
		}
	}
	const foldersAndFiles = makeFolderAndFileObject(folders, otherFiles);
	return foldersAndFiles;
}

export default class Methods {
	app: App;
	plugin: BridgePlugin;
	constructor(plugin: BridgePlugin, app: App) {
		this.plugin = plugin;
		this.app = app;
	}

	// https://github.com/tillahoffmann/obsidian-jupyter/blob/e1e28db25fd74cd16844b37d0fe2eda9c3f2b1ee/main.ts#L175
	getAbsolutePath(fileName: string): string {
		let basePath;
		// base path
		if (this.app.vault.adapter instanceof FileSystemAdapter) {
			basePath = this.app.vault.adapter.getBasePath();
		} else {
			throw new Error('Cannot determine base path.');
		}
		// relative path
		const relativePath = `${this.app.vault.configDir}/plugins/metadata-extractor/${fileName}`;
		// absolute path
		return `${basePath}/${relativePath}`;
	}

	/**
	 *
	 * @param currentCache - the object from Obsidian that contains all the metadata for the current file
	 * @returns - lower cased tags, duplicates are removed, stripped the #
	 */
	getUniqueTags(currentCache: CachedMetadata): string[] {
		let currentTags: string[] = [];
		if (getAllTags(currentCache)) {
			//@ts-ignore
			currentTags = getAllTags(currentCache);
		}
		currentTags = currentTags.map((tag) => tag.slice(1).toLowerCase());
		// remove duplicate tags in file
		currentTags = Array.from(new Set(currentTags));
		return currentTags;
	}

	writeAllExceptMd(fileName: string) {
		let path = this.plugin.settings.allExceptMdPath;
		// only change path not to be the plugin folder if the user entered a custom path
		if (!this.plugin.settings.allExceptMdPath) {
			path = this.getAbsolutePath(fileName);
		}
		const allFiles = this.app.vault.getAllLoadedFiles();
		const foldersAndFiles = getAllExceptMd(allFiles);
		writeFileSync(path, JSON.stringify(foldersAndFiles, null, 2));

		if (this.plugin.settings.consoleLog) {
			console.log(
				'Metadata Extractor plugin: wrote the allExceptMd JSON file'
			);
		}
	}


	/**
	 *
	 * @param fileName - the filename for the file
	 * If another path is set (tagPath) in the settings, then it will use that path
	 */
	writeTagsToJSON(fileName: string): void {
		// if there are no tags in the vault, exit
		const tags = (
			this.app.metadataCache as extendedMetadataCache
		).getTags();
		if (Object.keys(tags).length === 0) {
			const error = 'There are no tags in your vault.';
			if (this.plugin.settings.consoleLog) {
				console.log(error);
				return;
			} else {
				return;
			}
		}

		let path = this.plugin.settings.tagPath;
		// only set the path to the plugin folder if no other path is specified
		if (!this.plugin.settings.tagPath) {
			path = this.getAbsolutePath(fileName);
		}

		const tagsCache: tagCache[] = [];

		for (const tfile of this.app.vault.getMarkdownFiles()) {
			let currentCache!: CachedMetadata;
			if (this.app.metadataCache.getFileCache(tfile) !== null) {
				//@ts-ignore
				currentCache = this.app.metadataCache.getFileCache(tfile);
			}
			const relativePath: string = tfile.path;
			//let displayName: string = this.app.metadataCache.fileToLinktext(tfile, tfile.path, false);
			const currentTags: string[] = this.getUniqueTags(currentCache);
			if (currentTags.length !== 0) {
				tagsCache.push({
					name: relativePath,
					tags: currentTags,
				});
			}
		}

		// own version of this.app.metadataCache.getTags()
		// it doesn't include subtags if there is only one tag/subtag/subsubtag
		// (Obsidian would return tag, tag/subtag, tag/subtag/subtag for .getTags())
		const allTagsFromCache: string[][] = tagsCache.map((element) => {
			return element.tags;
		});
		const reducedAllTagsFromCache = allTagsFromCache.reduce(
			(acc, tagArray) => {
				return acc.concat(tagArray.map((tag) => tag.toLowerCase()));
			}
		);
		const uniqueAllTagsFromCache = Array.from(
			new Set(reducedAllTagsFromCache)
		);

		//private method
		const numberOfNotesWithTag = (
			this.app.metadataCache as extendedMetadataCache
		).getTags();
		// Obsidian doesn't consistently lower case the tags (it's a feature, it shows the most used version)
		// used to get a tag count; cleaning up is necessary for matching to own cleaned up version
		const tagsWithCount: tagNumber = {};
		for (const [key, value] of Object.entries(numberOfNotesWithTag)) {
			const newKey: string = key.slice(1).toLowerCase();
			const newValue: number = value;
			tagsWithCount[newKey] = newValue;
		}

		// what will be written to disk
		const tagToFile: {
			tag: string;
			tagCount: number;
			relativePaths: string[] | string;
		}[] = [];
		for (const tag of uniqueAllTagsFromCache) {
			const fileNameArray: string[] = [];
			// see which files contain the current tag
			for (const file of tagsCache) {
				if (file.tags.contains(tag)) {
					fileNameArray.push(file.name);
				}
			}
			const numberOfNotes: number = tagsWithCount[tag];
			tagToFile.push({
				tag: tag,
				tagCount: numberOfNotes,
				relativePaths: fileNameArray,
			});
		}

		writeFileSync(path, JSON.stringify(tagToFile, null, 2));
		if (this.plugin.settings.consoleLog) {
			console.log(
				'Metadata Extractor plugin: wrote the tagToFile JSON file'
			);
		}
	}

	writeCacheToJSON(fileName: string) {
		let path = this.plugin.settings.metadataPath;
		// only set the path to the plugin folder if no other path is specified
		if (!this.plugin.settings.metadataPath) {
			path = this.getAbsolutePath(fileName);
		}
		let metadataCache: Metadata[] = [];

		const fileMap: linkToPath = {};
		//@ts-ignore
		for (const [key, value] of Object.entries(this.app.vault.fileMap)) {
			const newKey: string = key;
			let link = '';
			if (newKey.slice(-3) === '.md') {
				if (newKey.includes('/')) {
					const split = newKey.split('/').last();
					const isString = typeof split === 'string';
					if (isString) {
						//@ts-ignore
						link = split;
					}
				}
				link = link.slice(0, -3).toLowerCase();
				fileMap[link] = newKey;
			}
		}

		for (const tfile of this.app.vault.getMarkdownFiles()) {
			const displayName = tfile.basename;
			const relativeFilePath: string = tfile.path;
			let currentCache!: CachedMetadata;
			if (
				typeof this.app.metadataCache.getFileCache(tfile) !==
				'undefined'
			) {
				//@ts-ignore
				currentCache = this.app.metadataCache.getFileCache(tfile);
			} else {
				new Notice('Something with accessing the cache went wrong!');
				return;
			}
			let currentAliases: string[];
			const currentHeadings: { heading: string; level: number }[] = [];

			//@ts-expect-error, object needs to be initialized, but values will only be known later
			const metaObj: Metadata = {};

			metaObj.fileName = displayName;
			metaObj.relativePath = relativeFilePath;

			const currentTags = this.getUniqueTags(currentCache);
			if (currentTags !== null) {
				if (currentTags.length > 0) {
					metaObj.tags = currentTags;
				}
			}

			if (currentCache.frontmatter) {
				//@ts-expect-error, could return null so can't be assigned to current aliases,
				// check for null is done later
				currentAliases = parseFrontMatterAliases(
					currentCache.frontmatter
				);
				if (currentAliases !== null) {
					if (currentAliases.length > 0) {
						metaObj.aliases = currentAliases;
					}
				}
			}

			if (currentCache.headings) {
				currentCache.headings.forEach((headings) => {
					currentHeadings.push({
						heading: headings.heading,
						level: headings.level,
					});
				});
				metaObj.headings = currentHeadings;
			}

			const linkMetaObj = calculateLinks(
				currentCache,
				metaObj,
				fileMap,
				relativeFilePath,
				displayName
			);

			Object.assign(metaObj, linkMetaObj);

			if (Object.keys(metaObj).length > 0) {
				metadataCache.push(metaObj);
			}
		}

		//backlinks
		const backlinkObj: backlinks[] = [];

		const worker = Worker();

		worker.postMessage([metadataCache, backlinkObj]);
		worker.onerror = (event: any) => {
			new Notice('Something went wrong with the backlinks calculation.');
		};
		worker.onmessage = (event: any) => {
			metadataCache = event.data;
			writeFileSync(path, JSON.stringify(metadataCache, null, 2));
			if (this.plugin.settings.consoleLog) {
				console.log(
					'Metadata Extractor plugin: wrote the metadata JSON file'
				);
			}
			// writeFileSync(path + 'cache.json', JSON.stringify(Object.entries(this.app.vault.getMarkdownFiles())))
			worker.terminate();
		};
	}

	setWritingSchedule(
		tagFileName: string,
		metadataFileName: string,
		allExceptMdFileName: string
	) {
		if (this.plugin.settings.writingFrequency !== '0') {
			const intervalInMinutes = parseInt(
				this.plugin.settings.writingFrequency
			);
			const milliseconds = intervalInMinutes * 60000;

			// schedule for tagsToJSON
			window.clearInterval(this.plugin.intervalId1);
			this.plugin.intervalId1 = undefined;
			this.plugin.intervalId1 = window.setInterval(
				() => this.writeTagsToJSON(tagFileName),
				milliseconds
			);
			// API function to cancel interval when plugin unloads
			this.plugin.registerInterval(this.plugin.intervalId1);

			// schedule for metadataCache to JSON
			window.clearInterval(this.plugin.intervalId2);
			this.plugin.intervalId2 = undefined;
			this.plugin.intervalId2 = window.setInterval(
				() => this.writeCacheToJSON(metadataFileName),
				milliseconds
			);
			// API function to cancel interval when plugin unloads
			this.plugin.registerInterval(this.plugin.intervalId2);

			// schedule for allExceptMd to JSON
			window.clearInterval(this.plugin.intervalId3);
			this.plugin.intervalId3 = undefined;
			this.plugin.intervalId3 = window.setInterval(
				() => this.writeAllExceptMd(allExceptMdFileName),
				milliseconds
			);
			// API function to cancel interval when plugin unloads
			this.plugin.registerInterval(this.plugin.intervalId3);
		} else if (this.plugin.settings.writingFrequency === '0') {
			window.clearInterval(this.plugin.intervalId1);
			window.clearInterval(this.plugin.intervalId2);
			window.clearInterval(this.plugin.intervalId3);
		}
	}
}

function calculateLinks(
	currentCache: CachedMetadata,
	metaObj: Metadata,
	fileMap: linkToPath,
	relativeFilePath: string,
	displayName: string
): Metadata {
	const currentLinks: links[] = [];
	let bothLinks: LinkCache[] & EmbedCache[] = [];

	linksAndOrEmbeds();

	function linksAndOrEmbeds(): void {
		let onlyLinks: LinkCache[] = [];
		let onlyEmbeds: EmbedCache[] = [];
		if (currentCache.links) {
			onlyLinks = currentCache.links;
		}
		if (currentCache.embeds) {
			onlyEmbeds = currentCache.embeds.filter((embed) => {
				let link = embed.link;
				if (link.includes('/')) {
					//@ts-expect-error, if it has a slash, it will have a last part
					link = link.split('/').last();
					// remove heading/block ref from link
					if (link.includes('#')) {
						link = link.replace(/#.+/g, '');
					}
				}
				if (link.includes('#')) {
					link = link.replace(/#.+/g, '');
				}
				// only return markdown files, because only they are in the fileMap
				if (fileMap[link.toLowerCase()]) {
					return embed;
				}
			});
		}
		bothLinks = onlyLinks.concat(onlyEmbeds);
		getLinksAndEmbeds();
	}

	function getLinksAndEmbeds() {
		for (const links of bothLinks) {
			let fullLink = links.link;
			let aliasText = '';
			//@ts-expect-error, must be initialized for adding keys, but
			// TS interface requires certain keys, which will be added later
			const currentLinkObject: links = {};
			if (typeof links.displayText !== 'undefined') {
				aliasText = links.displayText;
			}
			// account for relative links
			if (fullLink.includes('/')) {
				//@ts-ignore
				fullLink = fullLink.split('/').last();
			}
			let path = '';

			if (!fullLink.includes('#')) {
				path = fileMap[fullLink.toLowerCase()];
				currentLinkObject.link = fullLink;
				// account for uncreated files
				if (path) {
					currentLinkObject.relativePath = path;
				}
				// account for alias
				if (aliasText !== fullLink) {
					currentLinkObject.displayText = aliasText;
				}
			}
			// heading/block ref and maybe an alias, but not to the same file
			else if (fullLink.includes('#') && fullLink.charAt(0) !== '#') {
				const alias = aliasText;
				const cleanLink = fullLink.replace(/#.+/g, '');
				path = fileMap[cleanLink.toLowerCase()];
				currentLinkObject.link = fullLink;
				currentLinkObject.cleanLink = cleanLink;
				// it has an alias
				if (!aliasText.includes('#') || !aliasText.includes('>')) {
					currentLinkObject.displayText = alias;
				}
				// account for uncreated files
				if (path) {
					currentLinkObject.relativePath = path;
				}
			}
			// heading/block ref to same file and maybe alias
			else if (fullLink.charAt(0) === '#') {
				path = relativeFilePath;
				currentLinkObject.link = fullLink;
				currentLinkObject.relativePath = path;
				currentLinkObject.cleanLink = displayName;
				// account for alias
				if (fullLink !== aliasText) {
					currentLinkObject.displayText = aliasText;
				}
			}
			currentLinks.push(currentLinkObject);
		}
		if (currentLinks.length > 0) {
			metaObj.links = currentLinks;
		}
	}
	return metaObj;
}

export { getAllExceptMd };
