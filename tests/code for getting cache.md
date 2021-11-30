## getMarkdownFiles()

```javascript
let array = []
for (let el of app.vault.getMarkdownFiles()) {newArray.push({basename: el.basename, deleted: el.deleted, extension: el.extension, name: el.name, parent: el.parent, path: el.path, saving: el.saving, stat: el.stat, unsafeCachedData: el.unsafeCachedData, vault: el.vault})}
console.log(array)
```

Doesn't work, gives us objects that it cannot copy.

### works

- sets `parent` and `vault` to null

```javascript
let array = []
for (let el of app.vault.getMarkdownFiles()) {array.push({basename: el.basename, deleted: el.deleted, extension: el.extension, name: el.name, parent: null, path: el.path, saving: el.saving, stat: el.stat, unsafeCachedData: el.unsafeCachedData, vault: null})}
console.log(array)
```

Then right-click on the object and click copy object.

---

## fileCache

###  contains console.logs

```javascript
let cacheArray = []
for (let i = 0; i < app.vault.getMarkdownFiles().length; i++) { const currFile = app.vault.getMarkdownFiles()[i] ; const cache = app.metadataCache.getFileCache(currFile) ; console.log(cache) ; const path = currFile.path ; console.log(path); const obj = {[path]: cache}; console.log(obj); cacheArray.push(obj)}
console.log(cacheArray)
```

### code for getting the metadata cache for each TFile w/o console.logs; array of objects

```javascript
let cacheArray = []
for (let i = 0; i < app.vault.getMarkdownFiles().length; i++) { const currFile = app.vault.getMarkdownFiles()[i] ; const cache = app.metadataCache.getFileCache(currFile) ; const path = currFile.path ; const obj = {[path]: cache}; cacheArray.push(obj)}
console.log(cacheArray)
```

Then right-click on the object and click copy object.

### code for metadata cache for each file, but with paths as keys and metadata cache as values

```javascript
let objForMetadata = {}
for (let i = 0; i < app.vault.getMarkdownFiles().length; i++) { const currFile = app.vault.getMarkdownFiles()[i] ; const cache = app.metadataCache.getFileCache(currFile) ; const path = currFile.path ; objForMetadata[path] = cache}
console.log(objForMetadata)
```


## fileMap

### keys of fileMap

```javascript
Object.keys(app.vault.fileMap)
```

### dummy version of fileMap

```javascript
let fmArray = []
for (let el of Object.keys(app.vault.fileMap)) { const obj = {[el]: null} ; fmArray.push(obj)}
console.log(fmArray)
```
Then right-click on the object and click copy object.

## getAllLoadedFiles

```javascript
let allFiles = []
for (let el of app.vault.getAllLoadedFiles()) { if (el.children) {allFiles.push({name: el.name, path: el.path, children: true})} else { allFiles.push({name: el.name, basename: el.basename, path: el.path})}}
```
