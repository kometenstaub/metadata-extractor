import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	FileSystemAdapter,
	getAllTags,
	parseFrontMatterAliases,
	CachedMetadata,
} from 'obsidian';
import { writeFileSync } from 'fs';
interface BridgeSettings {
	writeFilesOnLaunch: boolean;
	writingFrequency: string;
	tagPath: string;
	metadataPath: string;
	tagFile: string;
	metadataFile: string;
}

const DEFAULT_SETTINGS: BridgeSettings = {
	tagPath: '',
	metadataPath: '',
	tagFile: 'tags.json',
	metadataFile: 'metadata.json',
	writingFrequency: '0',
	writeFilesOnLaunch: false,
};

export default class BridgePlugin extends Plugin {
	settings: BridgeSettings;
	intervalId1: number | null = null;
	intervalId2: number | null = null;

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
		let currentTags = getAllTags(currentCache);
		currentTags = currentTags.map((tag) => tag.slice(1).toLowerCase());
		// remove duplicate tags in file
		currentTags = Array.from(new Set(currentTags));
		return currentTags;
	}

	async writeTagsToJSON(fileName: string) {
		let path = this.settings.tagPath;
		// only set the path to the plugin folder if no other path is specified
		if (!this.settings.tagPath) {
			path = this.getAbsolutePath(fileName);
		}

		let tagsCache: { name: string; tags: string[] }[] = [];

		(async () => {
			const fileCache = await Promise.all(
				this.app.vault.getMarkdownFiles().map(async (tfile) => {
					let currentCache =
						this.app.metadataCache.getFileCache(tfile);
					let relativePath: string = tfile.path;
					//let displayName: string = this.app.metadataCache.fileToLinktext(tfile, tfile.path, false);
					const currentTags: string[] =
						this.getUniqueTags(currentCache);
					if (currentTags.length !== 0) {
						tagsCache.push({
							name: relativePath,
							tags: currentTags,
						});
					}
				})
			);
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

		let tagToFile: Array<{
			tag: string;
			relativePaths: string[] | string;
		}> = [];
		uniqueAllTagsFromCache.forEach((tag) => {
			//tag = tag.slice(1);
			let fileNameArray: string[] = [];
			tagsCache.map((fileWithTag) => {
				if (fileWithTag.tags.contains(tag)) {
					fileNameArray.push(fileWithTag.name);
				}
			});
			tagToFile.push({ tag: tag, relativePaths: fileNameArray });
		});

		let content = tagToFile;
		writeFileSync(path, JSON.stringify(content, null, 2));
		console.log('Metadata Extractor plugin: wrote the tagToFile JSON file');
	}

	async writeCacheToJSON(fileName: string) {
		let path = this.settings.metadataPath;
		// only set the path to the plugin folder if no other path is specified
		if (!this.settings.metadataPath) {
			path = this.getAbsolutePath(fileName);
		}
		let metadataCache: {
			fileName: string;
			relativePath: string;
			tags: string[];
			headings: { heading: string; level: number }[] | null;
			aliases: string[];
		}[] = [];

		(async () => {
			const fileCache = await Promise.all(
				this.app.vault.getMarkdownFiles().map(async (tfile) => {
					const displayName = tfile.basename;
					const relativeFilePath: string = tfile.path;
					const currentCache =
						this.app.metadataCache.getFileCache(tfile);
					let currentTags: string[] | null;
					let currentFrontmatterAliases: string[] | null;
					let currentHeadings:
						| { heading: string; level: number }[]
						| null = [];

					currentTags = this.getUniqueTags(currentCache);
					if (currentTags.length === 0) {
						currentTags = null;
					}

					currentFrontmatterAliases = parseFrontMatterAliases(
						currentCache.frontmatter
					);

					if (currentCache.headings) {
						currentCache.headings.map((headings) => {
							currentHeadings.push({
								heading: headings.heading,
								level: headings.level,
							});
						});
					} else {
						currentHeadings = null;
					}

					metadataCache.push({
						fileName: displayName,
						relativePath: relativeFilePath,
						tags: currentTags,
						headings: currentHeadings,
						aliases: currentFrontmatterAliases,
					});
				})
			);
		})();
		writeFileSync(path, JSON.stringify(metadataCache, null, 2));
		console.log('Metadata Extractor plugin: wrote the metadata JSON file');
	}

	async setWritingSchedule(tagFileName: string, metadataFileName: string) {
		if (this.settings.writingFrequency !== '0') {
			const intervalInMinutes = parseInt(this.settings.writingFrequency);
			let milliseconds = intervalInMinutes * 60000;

			// schedule for tagsToJSON
			window.clearInterval(this.intervalId1);
			this.intervalId1 = null;
			this.intervalId1 = window.setInterval(
				() => this.writeTagsToJSON(tagFileName),
				milliseconds
			);
			// API function to cancel interval when plugin unloads
			this.registerInterval(this.intervalId1);

			// schedule for metadataCache to JSON
			window.clearInterval(this.intervalId2);
			this.intervalId2 = null;
			this.intervalId2 = window.setInterval(
				() => this.writeCacheToJSON(metadataFileName),
				milliseconds
			);
			// API function to cancel interval when plugin unloads
			this.registerInterval(this.intervalId2);
		} else if (this.settings.writingFrequency === '0') {
			window.clearInterval(this.intervalId1);
			window.clearInterval(this.intervalId2);
		}
	}

	async onload() {
		console.log('loading Metadata Extractor plugin');

		await this.loadSettings();

		this.addCommand({
			id: 'write-tags-json',
			name: 'Write JSON file with tags and associated file names to disk.',
			callback: () => {
				this.writeTagsToJSON(this.settings.tagFile);
			},
		});

		this.addCommand({
			id: 'write-metadata-json',
			name: 'Write JSON file with metadata to disk.',
			callback: () => {
				this.writeCacheToJSON(this.settings.metadataFile);
			},
		});

		this.addSettingTab(new BridgeSettingTab(this.app, this));

		if (this.settings.writeFilesOnLaunch) {
			this.app.workspace.onLayoutReady(() => {
				this.writeTagsToJSON(this.settings.tagFile);
				this.writeCacheToJSON(this.settings.metadataFile);
			});
		}

		await this.setWritingSchedule(
			this.settings.tagFile,
			this.settings.metadataFile
		);
	}

	onunload() {
		console.log('unloading Metadata Extractor plugin');
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class BridgeSettingTab extends PluginSettingTab {
	plugin: BridgePlugin;

	constructor(app: App, plugin: BridgePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Metadata Extractor Settings' });

		new Setting(containerEl)
			.setName('File-write path for tags')
			.setDesc(
				"Where the tag-to-file-names JSON file will be saved. Requires the file name with extension. \
			If this is filled in, the setting below won't have any effect."
			)
			.addText((text) =>
				text
					.setPlaceholder('/home/user/Downloads/tags.json')
					.setValue(this.plugin.settings.tagPath)
					.onChange(async (value) => {
						this.plugin.settings.tagPath = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('File name of tag-to-file-names JSON')
			.setDesc(
				'Requires the .json extension. \
			Only change this setting if you want to change the name of the saved json in the plugin folder.'
			)
			.addText((text) =>
				text
					.setPlaceholder('tags.json')
					.setValue(this.plugin.settings.tagFile)
					.onChange(async (value) => {
						this.plugin.settings.tagFile = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('File-write path for metadata')
			.setDesc(
				"Where the metadata JSON file will be saved. Requires the file name with extension. \
			If this is filled in, the setting below won't have any effect."
			)
			.addText((text) =>
				text
					.setPlaceholder('/home/user/Downloads/metadata.json')
					.setValue(this.plugin.settings.metadataPath)
					.onChange(async (value) => {
						this.plugin.settings.metadataPath = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('File name of metadata JSON')
			.setDesc(
				'Requires the .json extension; leave empty if setting above was changed. \
			Only change this setting if you want to change the name of the saved json in the plugin folder.'
			)
			.addText((text) =>
				text
					.setPlaceholder('metadata.json')
					.setValue(this.plugin.settings.metadataFile)
					.onChange(async (value) => {
						this.plugin.settings.metadataFile = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Configure frequency for writing both JSON files')
			.setDesc(
				'The frequency has to be entered in minutes. Set it to 0 to disable the periodic writing.'
			)
			.addText((text) =>
				text
					.setPlaceholder('120')
					.setValue(this.plugin.settings.writingFrequency)
					.onChange(async (value) => {
						if (value === '') {
							this.plugin.settings.writingFrequency = '0';
						} else {
							this.plugin.settings.writingFrequency = value;
						}
						await this.plugin.saveSettings();
						this.plugin.setWritingSchedule(
							this.plugin.settings.tagFile,
							this.plugin.settings.metadataFile
						);
					})
			);

		new Setting(containerEl)
			.setName('Write JSON files automatically when Obsidian launches')
			.setDesc(
				'If enabled, the JSON files will be written each time Obsidian starts.'
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.writeFilesOnLaunch)
					.onChange((state) => {
						this.plugin.settings.writeFilesOnLaunch = state;
						this.plugin.saveSettings();
					});
			});
	}
}
