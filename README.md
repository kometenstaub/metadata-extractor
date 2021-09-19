# Obsidian Metadata Extractor

This plugin allows you to write Obsidian vault metadata, which is only accessible via plugin, onto the hard drive. This enables Third-party apps to access Obsidian metadata which they normally wouldn't be able to access. Exemplary use cases are launcher apps (e.g. Alfred, Ulauncher) or graph analysis software.

Obsidian Metadata Extractor has two commands which can be triggered by third-party apps via the [Advanced URI plugin](https://github.com/Vinzent03/obsidian-advanced-uri), or automatically on Obsidian startup and/or a regular interval defined in the plugin's settings.

## There are two commands

The first one writes a JSON file to disk with each tag and its corresponding file paths.

ID: `write-tags-json`

Example:

```json
[
  {
    "tag": "css-themes",
    "relativePaths": [
      "Advanced topics/Contributing to Obsidian.md"
    ]
  },
  {
    "tag": "insider-build",
    "relativePaths": [
      "Advanced topics/Insider builds.md"
    ]
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


The other one writes a JSON file to disk with metadata for each file name.

ID: `write-file-cache`

Example:

```json
[
  {
    "fileName": "Start here",
    "relativePath": "Start here.md",
    "tags": [
      "tag1",
      "tag2"
    ],
    "headings": [
      {
        "heading": "Quick Start",
        "level": 2
      }
    ],
    "aliases": [
      "test this alias"
    ]
  },
  {
    "fileName": "Zettelkasten prefixer",
    "relativePath": "Plugins/Zettelkasten prefixer.md",
    "tags": [
      "test1",
      "test2",
      "tag",
      "anothertag"
    ],
    "headings": [
      {
        "heading": "heading 1",
        "level": 1
      },
      {
        "heading": "heading 2",
        "level": 2
      }
    ],
    "aliases": [
      "help"
    ]
  },
]
```

If there are no tags, headings or aliases, their value is `null`.

## Configuration

If you don't touch any settings, the files will be saved to the plugin folder. You can configure their names in the settings.

You can however also specify absolute paths for each file. They need to include the file name and extension in this case. The setting above won't have any effect then.
