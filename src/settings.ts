import { PluginSettingTab, Setting, App } from 'obsidian';
import type BridgePlugin from './main';
import type { BridgeSettings } from './interfaces';

export const DEFAULT_SETTINGS: BridgeSettings = {
	tagPath: '',
	metadataPath: '',
	tagFile: 'tags.json',
	metadataFile: 'metadata.json',
	writingFrequency: '0',
	writeFilesOnLaunch: false,
};
export class BridgeSettingTab extends PluginSettingTab {
	constructor(app: App, public plugin: BridgePlugin) {
		super(app, plugin);
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
						this.plugin.methods.setWritingSchedule(
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