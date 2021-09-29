import { Plugin } from 'obsidian';

import Methods from './methods';
import { BridgeSettingTab, DEFAULT_SETTINGS } from './settings';
import type { BridgeSettings } from './interfaces';

export default class BridgePlugin extends Plugin {
	settings!: BridgeSettings;
	intervalId1: number | undefined = undefined;
	intervalId2: number | undefined = undefined;
	intervalId3: number | undefined = undefined;
	methods = new Methods(this, this.app);

	async onload() {
		console.log('loading Metadata Extractor plugin');

		await this.loadSettings();

		this.addCommand({
			id: 'write-tags-json',
			name: 'Write JSON file with tags and associated file names to disk.',
			callback: () => {
				this.methods.writeTagsToJSON(this.settings.tagFile);
			},
		});

		this.addCommand({
			id: 'write-metadata-json',
			name: 'Write JSON file with metadata to disk.',
			callback: () => {
				this.methods.writeCacheToJSON(this.settings.metadataFile);
			},
		});

		this.addCommand({
			id: 'write-allExceptMd-json',
			name: 'Write JSON file with all folders and non-MD files to disk.',
			callback: () => {
				this.methods.writeAllExceptMd(this.settings.allExceptMdFile);
			},
		});

		this.addSettingTab(new BridgeSettingTab(this.app, this));

		if (this.settings.writeFilesOnLaunch) {
			this.app.workspace.onLayoutReady(() => {
				this.methods.writeTagsToJSON(this.settings.tagFile);
				this.methods.writeCacheToJSON(this.settings.metadataFile);
				this.methods.writeAllExceptMd(this.settings.allExceptMdFile)
			});
		}

		await this.methods.setWritingSchedule(
			this.settings.tagFile,
			this.settings.metadataFile,
			this.settings.allExceptMdFile
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
