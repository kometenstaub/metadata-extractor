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
import { writeFileSync } from 'fs';
//@ts-ignore
import Worker from './workers/metadata.worker';

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
		let relativePath;
		// base path
		if (this.app.vault.adapter instanceof FileSystemAdapter) {
			basePath = this.app.vault.adapter.getBasePath();
		} else {
			throw new Error('Cannot determine base path.');
		}
		// relative path
		relativePath = `${this.app.vault.configDir}/plugins/metadata-extractor/${fileName}`;
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
		let folders: folder[] = [];
		const allFiles = this.app.vault.getAllLoadedFiles();
		for (let TAFile of allFiles) {
			if (TAFile instanceof TFolder) {
				folders.push({ name: TAFile.name, relativePath: TAFile.path });
			}
		}
		let otherFiles: file[] = [];
		for (let TAFile of allFiles) {
			// The basename is the name without the extension
			if (TAFile instanceof TFile && TAFile.path.slice(-3) !== '.md') {
				otherFiles.push({
					name: TAFile.name,
					basename: TAFile.basename,
					relativePath: TAFile.path,
				});
			}
		}
		//@ts-expect-error
		let foldersAndFiles: exceptMd = {};
		// there is always one folder, the root (/) folder
		if (folders.length > 0 && otherFiles.length > 0) {
			Object.assign(foldersAndFiles, {
				folders: folders,
				nonMdFiles: otherFiles,
			});
		} else {
			Object.assign(foldersAndFiles, {
				folders: folders,
			});
		}
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

		let tagsCache: tagCache[] = [];

		for (let tfile of this.app.vault.getMarkdownFiles()) {
			let currentCache!: CachedMetadata;
			if (this.app.metadataCache.getFileCache(tfile) !== null) {
				//@ts-ignore
				currentCache = this.app.metadataCache.getFileCache(tfile);
			}
			let relativePath: string = tfile.path;
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
		const numberOfNotesWithTag: {} = (
			this.app.metadataCache as extendedMetadataCache
		).getTags();
		// Obsidian doesn't consistently lower case the tags (it's a feature, it shows the most used version)
		let tagsWithCount: tagNumber = {};
		for (let [key, value] of Object.entries(numberOfNotesWithTag)) {
			const newKey: string = key.slice(1).toLowerCase();
			const newValue: number = value;
			tagsWithCount[newKey] = newValue;
		}

		let tagToFile: Array<{
			tag: string;
			tagCount: number;
			relativePaths: string[] | string;
		}> = [];
		uniqueAllTagsFromCache.forEach((tag) => {
			const fileNameArray: string[] = [];
			tagsCache.forEach((fileWithTag) => {
				if (fileWithTag.tags.contains(tag)) {
					fileNameArray.push(fileWithTag.name);
				}
			});
			const numberOfNotes: number = tagsWithCount[tag];
			tagToFile.push({
				tag: tag,
				tagCount: numberOfNotes,
				relativePaths: fileNameArray,
			});
		});

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

		let fileMap: linkToPath = {};
		//@ts-ignore
		for (let [key, value] of Object.entries(this.app.vault.fileMap)) {
			const newKey: string = key;
			let link: string = '';
			if (newKey.slice(-3) === '.md') {
				if (newKey.includes('/')) {
					let split = newKey.split('/').last();
					let isString = typeof split === 'string';
					if (isString) {
						//@ts-ignore
						link = split;
					}
				}
				link = link.slice(0, -3);
				fileMap[link] = newKey;
			}
		}

		(() => {
			this.app.vault.getMarkdownFiles().forEach((tfile) => {
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
					new Notice(
						'Something with accessing the cache went wrong!'
					);
				}
				let currentTags: string[];
				let currentAliases: string[];
				let currentHeadings: { heading: string; level: number }[] = [];

				//@ts-expect-error
				let metaObj: Metadata = {};

				metaObj.fileName = displayName;
				metaObj.relativePath = relativeFilePath;

				currentTags = this.getUniqueTags(currentCache);
				if (currentTags !== null) {
					if (currentTags.length > 0) {
						metaObj.tags = currentTags;
					}
				}

				if (currentCache.frontmatter) {
					//@ts-expect-error
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
			});
		})();
		//backlinks
		let backlinkObj: backlinks[] = [];

		let worker = Worker();

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
			let milliseconds = intervalInMinutes * 60000;

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
	currentCache1: CachedMetadata,
	metaObj1: Metadata,
	fileMap1: linkToPath,
	relativeFilePath1: string,
	displayName1: string
): Metadata {
	let currentLinks: links[] = [];
	let currentCache = currentCache1;
	let fileMap = fileMap1;
	let metaObj = metaObj1;
	let relativeFilePath = relativeFilePath1;
	let displayName = displayName1;

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
					//@ts-expect-error
					link = link.split('/').last();
					if (link.includes('#')) {
						link = link.replace(/#.+/g, '');
					}
				}
				if (link.includes('#')) {
					link = link.replace(/#.+/g, '');
				}
				// only return markdown files, because only they are in the fileMap
				if (fileMap[link]) {
					return embed;
				}
			});
		}
		bothLinks = onlyLinks.concat(onlyEmbeds);
		getLinksAndEmbds(bothLinks);
	}

	function getLinksAndEmbds(bothlinks: LinkCache[] & EmbedCache[]) {
		bothLinks.forEach((links) => {
			let fullLink = links.link;
			let aliasText: string = '';
			if (typeof links.displayText !== 'undefined') {
				aliasText = links.displayText;
			}
			// account for relative links
			if (fullLink.includes('/')) {
				//@ts-ignore
				fullLink = fullLink.split('/').last();
			}
			let path: string = '';
			if (!fullLink.includes('#') && aliasText === fullLink) {
				path = fileMap[fullLink];
				// account for uncreated files
				if (!path) {
					currentLinks.push({
						link: fullLink,
					});
				} else {
					currentLinks.push({
						link: fullLink,
						relativePath: path,
					});
				}
			}
			// heading/block ref and alias, but not to the same file
			else if (
				fullLink.includes('#') &&
				fullLink.charAt(0) !== '#' &&
				(!aliasText.includes('#') || !aliasText.includes('>'))
			) {
				const alias = aliasText;
				const cleanLink = fullLink.replace(/#.+/g, '');
				path = fileMap[cleanLink];
				// account for uncreated files
				if (!path) {
					currentLinks.push({
						link: fullLink,
						cleanLink: cleanLink,
						displayText: alias,
					});
				} else {
					currentLinks.push({
						link: fullLink,
						relativePath: path,
						cleanLink: cleanLink,
						displayText: alias,
					});
				}
			}
			// heading/block ref and no alias, but not to the same file
			else if (
				fullLink.includes('#') &&
				fullLink.charAt(0) !== '#' &&
				aliasText.includes('#')
			) {
				const cleanLink = fullLink.replace(/#.+/g, '');
				path = fileMap[cleanLink];
				// account for uncreated files
				if (!path) {
					currentLinks.push({
						link: fullLink,
						cleanLink: cleanLink,
					});
				} else {
					currentLinks.push({
						link: fullLink,
						relativePath: path,
						cleanLink: cleanLink,
					});
				}
			} // link with alias but not headings
			else if (!fullLink.includes('#') && fullLink !== aliasText) {
				const alias = aliasText;
				path = fileMap[fullLink];
				// account for uncreated files
				if (!path) {
					currentLinks.push({
						link: fullLink,
						displayText: alias,
					});
				} else {
					currentLinks.push({
						link: fullLink,
						relativePath: path,
						displayText: alias,
					});
				}
			}
			// heading/block ref to same file and alias
			else if (fullLink.charAt(0) === '#' && fullLink !== aliasText) {
				const alias = aliasText;
				path = relativeFilePath;
				currentLinks.push({
					link: fullLink,
					relativePath: path,
					cleanLink: displayName,
					displayText: alias,
				});
			} // only block ref/heading to same file, no alias
			else if (fullLink.charAt(0) === '#' && fullLink === aliasText) {
				path = relativeFilePath;
				// account for uncreated files
				currentLinks.push({
					link: fullLink,
					relativePath: path,
				});
			}
		});
		if (currentLinks.length > 0) {
			metaObj.links = currentLinks;
		}
	}
	return metaObj;
}
