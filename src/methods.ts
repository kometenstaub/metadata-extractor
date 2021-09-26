import type BridgePlugin from './main';
import {
	App,
	FileSystemAdapter,
	getAllTags,
	CachedMetadata,
	Notice,
    parseFrontMatterAliases
} from 'obsidian';

import { writeFileSync } from 'fs';

export default class Methods {
	constructor(public plugin: BridgePlugin, public app: App) {}

	// https://github.com/tillahoffmann/obsidian-jupyter/blob/e1e28db25fd74cd16844b37d0fe2eda9c3f2b1ee/main.ts#L175
	getAbsolutePath(fileName: string): string {
		let basePath;
		let relativePath;
		// base path
		if (this.app.vault.adapter instanceof FileSystemAdapter) {
			basePath = (
				this.app.vault.adapter as FileSystemAdapter
			).getBasePath();
		} else {
			throw new Error('Cannot determine base path.');
		}
		// relative path
		relativePath = `${this.app.vault.configDir}/plugins/metadata-extractor/${fileName}`;
		// absolute path
		return `${basePath}/${relativePath}`;
	}

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

	async writeTagsToJSON(fileName: string) {
		let path = this.plugin.settings.tagPath;
		// only set the path to the plugin folder if no other path is specified
		if (!this.plugin.settings.tagPath) {
			path = this.getAbsolutePath(fileName);
		}

		let tagsCache: { name: string; tags: string[] }[] = [];

		(async () => {
			this.app.vault.getMarkdownFiles().map(async (tfile) => {
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
			});
		})();

		// own version of this.app.metadataCache.getTags()
		// it doesn't include subtags if there is only one tag/subtag/subsubtag
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

		//@ts-expect-error, private method
		const numberOfNotesWithTag: {} = this.app.metadataCache.getTags();
		// Obsidian doesn' consistently lower case the tags (it's a feature, it shows the most used version)
		interface tagNumber {
			[key: string]: number;
		}
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
			tagsCache.map((fileWithTag) => {
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

		let content = tagToFile;
		writeFileSync(path, JSON.stringify(content, null, 2));
		console.log('Metadata Extractor plugin: wrote the tagToFile JSON file');
	}

	async writeCacheToJSON(fileName: string) {
		let path = this.plugin.settings.metadataPath;
		// only set the path to the plugin folder if no other path is specified
		if (!this.plugin.settings.metadataPath) {
			path = this.getAbsolutePath(fileName);
		}
		interface Metadata {
			fileName: string;
			relativePath: string;
			tags?: string[];
			headings?: { heading: string; level: number }[];
			aliases?: string[];
			links?: {
				link: string;
				relativePath?: string;
				cleanLink?: string;
				displayText?: string;
			}[];
			backlinks?: {
				fileName: string;
				relativePath: string;
			}[];
		}

		let metadataCache: Metadata[] = [];

		interface linkToPath {
			[key: string]: string;
		}

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

		(async () => {
			this.app.vault.getMarkdownFiles().map(async (tfile) => {
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
						'Something with the accessing the cache went wrong!'
					);
				}
				let currentTags: string[];
				let currentAliases: string[];
				let currentHeadings: { heading: string; level: number }[] = [];
				let currentLinks: {
					link: string;
					relativePath?: string;
					cleanLink?: string;
					displayText?: string;
				}[] = [];

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
					currentCache.headings.map((headings) => {
						currentHeadings.push({
							heading: headings.heading,
							level: headings.level,
						});
					});
					metaObj.headings = currentHeadings;
				}

				if (currentCache.links) {
					if (currentCache.embeds) {
						console.log(currentCache.embeds);
					}
					currentCache.links.map((links) => {
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
							(!aliasText.includes('#') ||
								!aliasText.includes('>'))
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
						else if (
							!fullLink.includes('#') &&
							fullLink !== aliasText
						) {
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
						else if (
							fullLink.charAt(0) === '#' &&
							fullLink !== aliasText
						) {
							const alias = aliasText;
							path = relativeFilePath;
							currentLinks.push({
								link: fullLink,
								relativePath: path,
								cleanLink: displayName,
								displayText: alias,
							});
						} // only block ref/heading to same file, no alias
						else if (
							fullLink.charAt(0) === '#' &&
							fullLink === aliasText
						) {
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

				if (Object.keys(metaObj).length > 0) {
					metadataCache.push(metaObj);
				}
			});
		})();
		//backlinks
		let backlinkObj: {
			fileName: string;
			relativePath: string;
		}[] = [];
		const newMetadataCache = metadataCache;
		metadataCache.map((file) => {
			const fileName = file.fileName;
			const relativeFilePath = file.relativePath;
			newMetadataCache.map((otherFile) => {
				if (fileName !== otherFile.fileName) {
					if (otherFile.links) {
						//something doesn't work here
						//that is because embeds aren't part of the .links in the metadataCache, so when I map over my metadataCache, it doesn't have the link and therefore doesn't find it.
						otherFile.links.map((links) => {
							if (links.relativePath === relativeFilePath) {
								// check if already present, only  push if not present
								backlinkObj.push({
									fileName: otherFile.fileName,
									relativePath: links.relativePath,
								});
							}
						});
					}
				}
			});
			file.backlinks = backlinkObj;
			backlinkObj = [];
		});

		writeFileSync(path, JSON.stringify(metadataCache, null, 2));
		console.log('Metadata Extractor plugin: wrote the metadata JSON file');
	}

	async setWritingSchedule(tagFileName: string, metadataFileName: string) {
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
		} else if (this.plugin.settings.writingFrequency === '0') {
			window.clearInterval(this.plugin.intervalId1);
			window.clearInterval(this.plugin.intervalId2);
		}
	}
}
