import { App, Plugin, PluginSettingTab, Setting, FileSystemAdapter } from 'obsidian';
import { writeFileSync } from 'fs';
interface BridgeSettings {
	tagPath: string;
	metadataPath: string;
	tagFile: string;
	metadataFile: string;

}

const DEFAULT_SETTINGS: BridgeSettings = {
	tagPath: '',
	metadataPath: '',
	tagFile: 'tags.json',
	metadataFile: 'metadata.json'
}


export default class BridgePlugin extends Plugin {
	settings: BridgeSettings;

	// from: https://github.com/tillahoffmann/obsidian-jupyter/blob/e1e28db25fd74cd16844b37d0fe2eda9c3f2b1ee/main.ts#L175
	getRelativeDumpPath(fileName: string): string {
		return `${this.app.vault.configDir}/plugins/launcher-bridge/${fileName}`;
	}

	getAbsoluteDumpPath(fileName: string): string {
		return `${this.getBasePath()}/${this.getRelativeDumpPath(fileName)}`;
	}

	getBasePath(): string {
		if (this.app.vault.adapter instanceof FileSystemAdapter) {
			return (this.app.vault.adapter as FileSystemAdapter).getBasePath();
		}
		throw new Error('cannot determine base path');
	}



	async getTags(fileName: string) {
		let path = this.settings.tagPath;
		// only set the path to the plugin folder if no other path is specified
		if (!this.settings.tagPath) {
			path = this.getAbsoluteDumpPath(fileName);
		}

		let tagsCache: Array<{ name: string, tags: string[] }> = [];

		(async () => {
			const fileCache = await Promise.all(
				this.app.vault.getMarkdownFiles().map(async (tfile) => {
					let currentCache = this.app.metadataCache.getFileCache(tfile);
					let currentName: string = tfile.path
					let currentTags: string[] = [];
					// currentCache.tags contains an object with .tag as the tags and .position of where it is for each file
					if (currentCache.tags) {
						currentTags = currentCache.tags.map((tagObject) => {
							return tagObject.tag;
						});
					}
					if (currentCache.frontmatter) {
						if (currentCache.frontmatter.tags) {
							const frontMatterTags = currentCache.frontmatter.tags;
							console.log(frontMatterTags);
							if (Array.isArray(frontMatterTags)) {
								frontMatterTags.map((tag) => {
									if (tag.slice(0, 1) === '#') {
										currentTags.push(tag.slice(1));
									} else {
										currentTags.push(tag);
									}
								})
							} else if (typeof frontMatterTags === "string") {
								const splitTags = frontMatterTags.split(",")
								splitTags.map((tag) => {
									if (tag.slice(0, 1) === '#') {
										currentTags.push(tag.slice(1));
									} else {
										currentTags.push(tag);
									}
								})

								currentTags.push(frontMatterTags.slice())
							}
						}
					}
					//TODO:get frontmatter tags with currentCache.frontmatter.tags
					// consider array and string format depending on formatting in file
					tagsCache.push({ name: currentName, tags: currentTags });
				}
				))
		})();

		//@ts-ignore
		const allTags = this.app.metadataCache.getTags();
		let tagToFile: Array<{ tag: string, filePaths: string[] | string }> = [];
		const onlyAllTags = Object.keys(allTags);
		onlyAllTags.forEach((tag) => {
			let fileNameArray: string[] = [];
			tagsCache.map((fileWithTag) => {
				if (fileWithTag.tags.contains(tag)) {
					fileNameArray.push(fileWithTag.name);
				}
			})
			tagToFile.push({ tag: tag.slice(1), filePaths: fileNameArray });
		})

		let content = tagToFile;
		writeFileSync(path, JSON.stringify(content, null, 2));
		console.log('wrote the tagToFile JSON file');
	}


	async getFileCache(fileName: string) {
		let path = this.settings.metadataPath;
		// only set the path to the plugin folder if no other path is specified
		if (!this.settings.metadataPath) {
			path = this.getAbsoluteDumpPath(fileName);
		}
		let metadataCache: { fileName: string, relativePath: string, tags: string[], headings: string[], aliases: string[] }[] = [];

		(async () => {
			const fileCache = await Promise.all(
				this.app.vault.getMarkdownFiles().map(async (tfile) => {
					const displayName = tfile.basename
					const relativeFilePath: string = tfile.path
					const currentCache = this.app.metadataCache.getFileCache(tfile);
					let currentTags: string[] = [];
					let currentFrontmatter: string[] = [];
					let currentHeadings: string[] = [];
					//TODO: get the tags from frontmatter as well, maybe make it a function
					// because it is needed at two places
					if (currentCache.tags) {
						currentTags = currentCache.tags.map((tagObject) => {
							return tagObject.tag.slice(1);
						})
					};

					if (Array.isArray(currentCache.frontmatter)) {
						currentFrontmatter = currentCache.frontmatter.aliases

					} else if (currentCache.frontmatter) {
						//@ts-ignore
						currentFrontmatter = [currentCache.frontmatter.aliases]
					}// #check if `null`, then let it be empty
					// Obsidian does this when `aliases:` is empty

					if (currentCache.headings) {
						currentHeadings = currentCache.headings.map((headings) => {
							return headings.heading;
						})
					}//TODO: get heading data: currentCache.headings.level

					metadataCache.push({ fileName: displayName, relativePath: relativeFilePath, tags: currentTags, headings: currentHeadings, aliases: currentFrontmatter })


				}))
		})();
		writeFileSync(path, JSON.stringify(metadataCache, null, 2));
		console.log('wrote the metadata JSON file');
	}

	async onload() {
		console.log('loading Launcher Bridge plugin');

		await this.loadSettings();

		this.addCommand({
			id: 'write-tags-json',
			name: 'Write JSON file with tags and associated file names to disk.',
			callback: () => {
				this.getTags(this.settings.tagFile);
			}

		});

		this.addCommand({
			id: 'write-file-cache',
			name: 'Write JSON with file metadata (headings, aliases, tags) to disk.',
			callback: () => {
				this.getFileCache(this.settings.metadataFile);
			}

		});

		this.addSettingTab(new BridgeSettingTab(this.app, this));

	}

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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

		containerEl.createEl('h2', { text: 'Bridge Plugin Settings' });

		new Setting(containerEl)
			.setName('File-write path for tags')
			.setDesc('Where the tag-to-file-names JSON file will be saved. Requires the file name with extension. \
			If this is filled in, the setting below won\'t have any effect.')
			.addText(text => text
				.setPlaceholder('/home/user/Downloads/tags.json')
				.setValue(this.plugin.settings.tagPath)
				.onChange(async (value) => {
					this.plugin.settings.tagPath = value;
					await this.plugin.saveSettings();

				}));

		new Setting(containerEl)
			.setName('File name of tag-to-file-names JSON')
			.setDesc('Requires the .json extension. \
			Only change this setting if you want to change the name of the saved json in the plugin folder.')
			.addText(text => text
				.setPlaceholder('tags.json')
				.setValue(this.plugin.settings.tagFile)
				.onChange(async (value) => {
					this.plugin.settings.tagFile = value;
					await this.plugin.saveSettings();

				}));

		new Setting(containerEl)
			.setName('File-write path for metadata')
			.setDesc('Where the metadata JSON file will be saved. Requires the file name with extension. \
			If this is filled in, the setting below won\'t have any effect.')
			.addText(text => text
				.setPlaceholder('/home/user/Downloads/metadata.json')
				.setValue(this.plugin.settings.metadataPath)
				.onChange(async (value) => {
					this.plugin.settings.metadataPath = value;
					await this.plugin.saveSettings();

				}));


		new Setting(containerEl)
			.setName('File name of metadata JSON')
			.setDesc('Requires the .json extension; leave empty if setting above was changed. \
			Only change this setting if you want to change the name of the saved json in the plugin folder.')
			.addText(text => text
				.setPlaceholder('metadata.json')
				.setValue(this.plugin.settings.metadataFile)
				.onChange(async (value) => {
					this.plugin.settings.metadataFile = value;
					await this.plugin.saveSettings();

				}));
	}
}
