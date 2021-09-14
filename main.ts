import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, FileSystemAdapter, getAllTags, TFile, CacheItem, TagCache} from 'obsidian';
import { statSync, writeFileSync } from 'fs';
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
		return `${this.app.vault.configDir}/plugins/bridge/tags.py`;
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

		//@ts-ignore
		let tagsCache = [];
		//let counter = 0;

		(async () => {
			const fileCache = await Promise.all(
				this.app.vault.getMarkdownFiles().map(async (tfile) => {
					let currentCache = this.app.metadataCache.getFileCache(tfile);
					let currentName = this.app.metadataCache.fileToLinktext(tfile, tfile.path, false);
					let currentTags : string[] = []
					if (currentCache.tags) {
						//@ts-ignore
						currentTags = currentCache.tags.map((tag) => {
							//console.log(tag.tag)
							//if (typeof tag.tag === 'string') {
							//	currentTags.push(tag.tag)
							//}
							return tag.tag
						});
						console.log(currentTags);
					} else {
						currentTags = null
					}
					//counter += 1;
					//let stringCounter = counter.toString
					//let tagObject = {stringCounter: {name: currentName, tags: currentTags }};
					tagsCache.push([`"${currentName}"`, `"${currentTags}"`]);
				}))})();
					

		//@ts-ignore
		let content = tagsCache
		writeFileSync(path, content.toString());
		console.log('wrote the array file');
	}



	async onload() {
		console.log('loading Bridge plugin');

		await this.loadSettings();

		//this.addRibbonIcon('dice', 'Sample Plugin', () => {
		//	new Notice('This is a notice!');
		//});

		//this.addStatusBarItem().setText('Status Bar Text');

		this.addCommand({
			id: 'dump-tags-json',
			name: 'Write file names with associated tags to disk.',
			callback: () => {
				console.log('writing file...');
				this.getTags();
			}

			//checkCallback: (checking: boolean) => {
			//	let leaf = this.app.workspace.activeLeaf;
			//	if (leaf) {
			//		if (!checking) {
			//			new SampleModal(this.app).open();
			//		}
			//		return true;
			//	}
			//	return false;
			//}
		});

		this.addSettingTab(new BridgeSettingTab(this.app, this));

		//this.registerCodeMirror((cm: CodeMirror.Editor) => {
		//	console.log('codemirror', cm);
		//});

		//this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		//	console.log('click', evt);
		//});

		//this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

//class SampleModal extends Modal {
//	constructor(app: App) {
//		super(app);
//	}
//
//	onOpen() {
//		let {contentEl} = this;
//		contentEl.setText('Woah!');
//	}
//
//	onClose() {
//		let {contentEl} = this;
//		contentEl.empty();
//	}
//}
//
class BridgeSettingTab extends PluginSettingTab {
	plugin: BridgePlugin;

	constructor(app: App, plugin: BridgePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Bridge Plugin Settings'});

		new Setting(containerEl)
			.setName('file-dump path')
			.setDesc('Where the dumped files will be saved.')
			.addText(text => text
				.setPlaceholder('/home/user/Downloads/')
				.setValue('')
				.onChange(async (value) => {
					console.log('Saved path for dumping files:' + value);
					this.plugin.settings.dumpPath = value;
					await this.plugin.saveSettings();
				}));
	}
}
