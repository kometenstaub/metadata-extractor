# Launcher Bridge plugin

This plugin is supposed to be a bridge between launchers like Alfred or Ulauncher and Obsidian.

It contains two commands which can be executed on a cron job with the [Advanced URI plugin](https://github.com/Vinzent03/obsidian-advanced-uri).

## There are two commands

One writes a JSON file to disk with each tag and its corresponding file paths.

Example:

```json
[
  {
    "tag": "css-themes",
    "files": [
      "Advanced topics/Contributing to Obsidian.md"
    ]
  },
  {
    "tag": "insider-build",
    "files": [
      "Advanced topics/Insider builds.md"
    ]
  },
  {
    "tag": "tags",
    "files": [
      "Plugins/Markdown format converter.md",
      "How to/Working with tags.md",
      "How to/Format your notes.md",
      "How to/Basic note taking.md"
    ]
  }
]
```


The other one write a JSON file to disk with metadata for each file name.

Example:

```json
[
  {
    "displayName": "Start here",
    "cache": {
      "filePath": "Start here.md",
      "tags": [
        "tag1",
        "tag2"
      ],
      "headings": [
        "Quick Start"
      ],
      "aliases": [
        "test this alias"
      ]
    }
  },
  {
    "displayName": "Zettelkasten prefixer",
    "cache": {
      "filePath": "Plugins/Zettelkasten prefixer.md",
      "tags": [],
      "headings": [],
      "aliases": [
        [
          "first zettel",
          "second zettel"
        ]
      ]
    }
  },
  {
    "displayName": "Workspaces",
    "cache": {
      "filePath": "Plugins/Workspaces.md",
      "tags": [],
      "headings": [
        "Save a workspace",
        "Load a workspace",
        "Commands"
      ],
      "aliases": []
    }
  }
]
```

## Configuration

If you don't touch any settings, the files will be saved to the plugin folder. You can configure their names in the settings.

You can however also specify absolute paths for each file. They need to include the file name and extension in this case. The setting above won't have any effect then.