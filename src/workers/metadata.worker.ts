import type { Metadata, backlinks } from 'src/interfaces';

self.onmessage = function (e) {
	let metadataCache: Metadata[] = e.data[0];
	let backlinkObj: backlinks[] = e.data[1];
	const newMetadataCache: Metadata[] = metadataCache;

	metadataCache.forEach((file: Metadata) => {
		const fileName = file.fileName;
		const relativeFilePath = file.relativePath;
		newMetadataCache.forEach((otherFile: Metadata) => {
			// don't check the same file
			if (fileName !== otherFile.fileName) {
				if (otherFile.links) {
					otherFile.links.forEach((links) => {
						//@ts-expect-error
						let currentBacklinkObject: backlinks = {};
						// check if already present, only  push if not present
						if (links.relativePath === relativeFilePath) {
							currentBacklinkObject.fileName = otherFile.fileName;
							currentBacklinkObject.link = links.link;
							currentBacklinkObject.relativePath =
								otherFile.relativePath;
							if (links.cleanLink) {
								currentBacklinkObject.cleanLink =
									links.cleanLink;
							}
							if (links.displayText) {
								currentBacklinkObject.displayText =
									links.displayText;
							}
							backlinkObj.push(currentBacklinkObject);
						}
					});
				}
			}
		});
		if (backlinkObj.length > 0) {
			file.backlinks = backlinkObj;
		} // empty it, otherwise it would collect all of the links in the forEach loop
		backlinkObj = [];
	});

	self.postMessage(metadataCache);
};
