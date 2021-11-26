import type { exceptMd, file, folder } from "./interfaces";

export function makeFolderAndFileObject(folders: folder[], otherFiles: file[]): exceptMd {
		//@ts-expect-error, it requires to be initialized, but values will only be added later,
		// but they are required by TS
		const foldersAndFiles: exceptMd = {};
		// there is always one folder, the root (/) folder
		if (otherFiles.length > 0) {
			Object.assign(foldersAndFiles, {
				folders: folders,
				nonMdFiles: otherFiles,
			});
		} else {
			Object.assign(foldersAndFiles, {
				folders: folders,
			});
		}
		return foldersAndFiles
	}