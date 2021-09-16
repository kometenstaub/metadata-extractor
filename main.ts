import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, FileSystemAdapter, getAllTags, TFile, CacheItem, TagCache } from 'obsidian';
import { statSync, writeFileSync } from 'fs';
import { stringify } from 'querystring';
import { Interface } from 'readline';
interface BridgeSettings {
	dumpPath: string;
}

const DEFAULT_SETTINGS: BridgeSettings = {
	dumpPath: ''
}


export default class BridgePlugin extends Plugin {
	settings: BridgeSettings;

	// from: https://github.com/tillahoffmann/obsidian-jupyter/blob/e1e28db25fd74cd16844b37d0fe2eda9c3f2b1ee/main.ts#L175
	getRelativeDumpPath(): string {
		return `${this.app.vault.configDir}/plugins/bridge/tags.json`;
	}

	getAbsoluteDumpPath(): string {
		return `${this.getBasePath()}/${this.getRelativeDumpPath()}`;
	}

	getBasePath(): string {
		if (this.app.vault.adapter instanceof FileSystemAdapter) {
			return (this.app.vault.adapter as FileSystemAdapter).getBasePath();
		}
		throw new Error('cannot determine base path');
	}



	async getTags() {
		let path = this.settings.dumpPath;
		// only set the path to the plugin folder if no other path is specified
		if (!this.settings.dumpPath) {
			path = this.getAbsoluteDumpPath();
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
						tagsCache.push({ name: currentName, tags: currentTags });
					}
				}))
		})();

		//@ts-ignore
		const allTags = this.app.metadataCache.getTags();
		let tagToFile: Array<{ tag: string, files: string[] | string }> = [];
		const onlyAllTags = Object.keys(allTags);
		onlyAllTags.forEach((tag) => {
			let fileNameArray: string[] = [];
			tagsCache.map((fileWithTag) => {
				if (fileWithTag.tags.contains(tag)) {
					fileNameArray.push(fileWithTag.name);
				}
			})
			tagToFile.push({ tag: tag.slice(1), files: fileNameArray });
		})

		let content = tagToFile;
		writeFileSync(path, JSON.stringify(content, null, 2));
		console.log('wrote the tagToFile JSON file');
	}



	async onload() {
		console.log('loading Launcher Bridge plugin');

		await this.loadSettings();

		this.addCommand({
			id: 'write-tags-json',
			name: 'Write JSON file with tags and associated file names to disk.',
			callback: () => {
				this.getTags();
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
			.setName('File-write path')
			.setDesc('Where the tag-to-file-names JSON file will be saved.')
			.addText(text => text
				.setPlaceholder('/home/user/Downloads/tags.json')
				.setValue(this.plugin.settings.dumpPath)
				.onChange(async (value) => {
					this.plugin.settings.dumpPath = value;
					await this.plugin.saveSettings();

				}));

	}
}
