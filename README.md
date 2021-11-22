# Metadata Extractor Obsidian plugin

This plugin allows you to write Obsidian vault metadata, which is only accessible via plugin, onto the hard drive. This enables Third-party apps to access Obsidian metadata which they normally wouldn't be able to access. Exemplary use cases are launcher apps (e.g. Alfred, Ulauncher) or graph analysis software.

See [this guide](https://github.com/kometenstaub/metadata-extractor/blob/main/docs/Guide%20-%20Controlling%20Obsidian%20via%20Third-Party-App.md) for more information on Controlling Obsidian via a Third-party App.

## There are three JSON-exports

They can be executed on a schedule.

### Tag export

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

### Markdown notes metadata export

The second one writes a JSON file to disk with metadata for each file name. This is how the JSON structure is as a TypeScript interface.

```ts
/**
 * JSON export: Metadata[]
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

The exported array contains a JSON array with `Metadata` objects, one object for each Markdown file in your vault.

All objects have a `fileName` and a `relativePath`. `fileName` doesn't contain the `.md` extension, `relativePath` is the path from your vault root. 

If a file has tags, the object has a `tags` property that contains an array of tags. Tags are all lower-cased and if a tag appears more than one time in a file, it will only appear one time in `tags`.

`aliases`, `links` and `backlinks` also only exist if there are any of the in a file.

#### `links` interface

The `links` contain both links to existing and non-existing files. If a file doesn't exist, the `links` won't have a `relativePath`.

`link` is the full link, exluding anything after the `|`, so if no alias is set, it also contains `#` or `#^` if there are headings or block references. If that is the case, there is also the `cleanLink` property which provides just the filename for the link (omitting the `.md` extension).

`displayText` is what is displayed by Obsidian in preview mode. It can be the alias, but also the file name if there is a heading or block reference. If it is a heading link or block reference to the same file, it excludes the `#`, just like Obsidian does in preview mode.

`cleanLink` and `displayText` don't exist if it is a normal link.

#### `backlinks` interface

Backlinks always have a `relativePath` property because the file linking to the current file (object) needs to exist. 

`fileName` and `relativePath` are the file which contains the backlink.

`link`, `cleanLink` and `displayText` behave as [the links interface](#links-interface)




### Non-Markdown files metadata export


The third writes a JSON file containing both all folders and non-Markdown files. The structure is like this.

```ts
/**
 * JSON export
 */
interface exceptMd {
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

#### `file` interface

The `name` is the file name including the extension, `basename` excludes it. `relativePath` is the path from the vault root.



## Configuration

If you don't touch any settings, the files will be saved to the plugin folder. You can configure their names in the settings.

You can however also specify absolute paths for each file. They need to include the file name and extension in this case. The setting above won't have any effect then.

You can also set the frequency for writing the JSON files in minutes (default setting is 0, so it is not enabled) and whether the JSON files should be written on launch (default setting is false).


## Known limitations

If you have two or more files with the same name, there could be problems because there is no logic implemented for them. Should you want to change that, please feel free to make a PR.
