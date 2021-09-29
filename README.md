# Metadata Extractor Obsidian plugin

This Obsidian plugin provides metadata export for third-party apps.

## There are three JSON-exports

They can be executed on a schedule.

One writes a JSON file to disk with each tag and its corresponding file paths.

Example:

```json
[
	{
		"tag": "css-themes",
		"relativePaths": ["Advanced topics/Contributing to Obsidian.md"]
	},
	{
		"tag": "insider-build",
		"relativePaths": ["Advanced topics/Insider builds.md"]
	},
	{
		"tag": "anothertag",
		"relativePaths": [
			"Plugins/Zettelkasten prefixer.md",
			"Advanced topics/Using obsidian URI.md"
		]
	}
]
```

The second one writes a JSON file to disk with metadata for each file name. This is how the JSON structure is as a TypeScript interface.

```ts
/**
 * JSON export
 */
interface Metadata {
	fileName: string;
	relativePath: string;
	tags?: string[];
	headings?: { heading: string; level: number }[];
	aliases?: string[];
	links?: links[];
	backlinks?: backlinks[];
}

interface links {
	link: string;
	relativePath?: string;
	cleanLink?: string;
	displayText?: string;
}

interface backlinks {
	fileName: string;
	link: string;
	relativePath: string;
	cleanLink?: string;
	displayText?: string;
}
```

The third writes a JSON file containing both all folders and non-Markdown files. The structure is like this.

```ts
/**
 * JSON export
 */
interface excectMd {
	folders: folder[];
	nonMdFiles?: file[];
}

interface folder {
	name: string;
	relativePath: string;
}

interface file {
	name: string;
	basename: string;
	relativePath: string;
}
```

## Configuration

If you don't touch any settings, the files will be saved to the plugin folder. You can configure their names in the settings.

You can however also specify absolute paths for each file. They need to include the file name and extension in this case. The setting above won't have any effect then.

You can also set the frequency for writing the JSON files in minutes (default setting is 0, so it is not enabled) and whether the JSON files should be written on launch (default setting is false).
