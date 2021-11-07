import type { Metadata, backlinks } from 'src/interfaces';

self.onmessage = function(e) {
	let metadataCache: Metadata[] = e.data[0]
	let backlinkObj: backlinks[] = e.data[1]
	let newMetadataCache: Metadata[] = e.data[2]
	
	metadataCache.forEach((file: Metadata) => {
		const fileName = file.fileName;
		const relativeFilePath = file.relativePath;
		newMetadataCache.forEach((otherFile: Metadata) => {
			// don't check the same file
			if (fileName !== otherFile.fileName) {
				if (otherFile.links) {
					otherFile.links.forEach((links) => {
						if (links.relativePath === relativeFilePath) {
							// check if already present, only  push if not present
							if (links.cleanLink && links.displayText) {
								backlinkObj.push({
									fileName: otherFile.fileName,
									link: links.link,
									relativePath: otherFile.relativePath,
									cleanLink: links.cleanLink,
									displayText: links.displayText,
								});
							} else if (
								links.cleanLink &&
								!links.displayText
							) {
								backlinkObj.push({
									fileName: otherFile.fileName,
									link: links.link,
									relativePath: otherFile.relativePath,
									cleanLink: links.cleanLink,
								});
							} else if (
								!links.cleanLink &&
								links.displayText
							) {
								backlinkObj.push({
									fileName: otherFile.fileName,
									link: links.link,
									relativePath: otherFile.relativePath,
									displayText: links.displayText,
								});
							} else {
								backlinkObj.push({
									fileName: otherFile.fileName,
									link: links.link,
									relativePath: otherFile.relativePath,
								});
							}
						}
					});
				}
			}
		});
		if (backlinkObj.length > 0) {
			file.backlinks = backlinkObj;
		}// empty it, otherwise it would collect all of the links in the forEach loop
		backlinkObj = [];
	});

	self.postMessage(metadataCache)
}



