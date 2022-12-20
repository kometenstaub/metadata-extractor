# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.1.0](https://github.com/kometenstaub/metadata-extractor/compare/1.0.2...1.1.0) (2022-12-20)


### Features

* add canvas export ([2709211](https://github.com/kometenstaub/metadata-extractor/commit/2709211a75199deff92ab671d9e3ddd05769a692))


### Bug Fixes

* frequency update for canvas ([b96bca2](https://github.com/kometenstaub/metadata-extractor/commit/b96bca2853d40400c59a0e6f21bcba6ae585cc36))

### [1.0.2](https://github.com/kometenstaub/metadata-extractor/compare/1.0.0...1.0.2) (2022-07-13)


### Bug Fixes

* handle undefined file cache ([678700d](https://github.com/kometenstaub/metadata-extractor/commit/678700dadfeab5a4c4f8c8b80db97d8663e17cc2)), closes [#17](https://github.com/kometenstaub/metadata-extractor/issues/17)

### [1.0.1](https://github.com/kometenstaub/metadata-extractor/compare/1.0.0...1.0.1) (2022-03-31)


### Bug Fixes

* handle undefined file cache ([298135f](https://github.com/kometenstaub/metadata-extractor/commit/298135f2c52690b7b92ef79c286d93fe67732c38)), closes [#17](https://github.com/kometenstaub/metadata-extractor/issues/17)

## [1.0.0](https://github.com/kometenstaub/metadata-extractor/compare/0.3.2...1.0.0) (2022-02-10)


### Features

* calculate links for duplicate file names ([09b6c67](https://github.com/kometenstaub/metadata-extractor/commit/09b6c6755f628f0e7d33d378af7422aada16709c))


### Bug Fixes

* get relative path before truncating it ([baae491](https://github.com/kometenstaub/metadata-extractor/commit/baae4915ac56e295f908e9290a0ff6bc02b47e62))

### [0.3.2](https://github.com/kometenstaub/metadata-extractor/compare/0.3.1...0.3.2) (2022-02-10)


### Features

* update pos with start ([a593cd0](https://github.com/kometenstaub/metadata-extractor/commit/a593cd08d5dce0e6364aa9d5f74d69f442e3c3a2))


### Bug Fixes

* implement frontmatter export correctly ([e1cc3f5](https://github.com/kometenstaub/metadata-extractor/commit/e1cc3f5519fb2a08785ccbee378ad27c46dee11a))

### [0.3.1](https://github.com/kometenstaub/metadata-extractor/compare/0.3.0...0.3.1) (2022-01-23)


### Bug Fixes

* don't add frontmatter ([4c10379](https://github.com/kometenstaub/metadata-extractor/commit/4c10379a7fc81a4f328fcb61771d2eb9d6d8a9bc))

## [0.3.0](https://github.com/kometenstaub/metadata-extractor/compare/0.2.4...0.3.0) (2022-01-23)


### Features

* add natively supported types to frontmatter interface ([42dbb2e](https://github.com/kometenstaub/metadata-extractor/commit/42dbb2ee36ca0c0e717a7010bf62807014d935ca))
* include frontmater in metadata ([f3ae5c3](https://github.com/kometenstaub/metadata-extractor/commit/f3ae5c3f29445796882f340d6ded5349d722c5a2))
* remove duplicate props from frontmatter ([a79c85d](https://github.com/kometenstaub/metadata-extractor/commit/a79c85d56f6cd354877887d0951bb03945d9863a))
* remove position, add pos ([463cc70](https://github.com/kometenstaub/metadata-extractor/commit/463cc70b7d95764400eb4cef1ff8ea35b808b4d7))


### Bug Fixes

* remove comma ([5a8123b](https://github.com/kometenstaub/metadata-extractor/commit/5a8123b67af68292aa52b3759c36aeb33afd6cdb))
* typing ([dd02d52](https://github.com/kometenstaub/metadata-extractor/commit/dd02d521aff0d6491b6f14c8d5d19881598a0078))

### [0.2.4](https://github.com/kometenstaub/metadata-extractor/compare/0.2.3...0.2.4) (2021-11-21)


### Bug Fixes

* :bug: backlinks are now correct ([3c93705](https://github.com/kometenstaub/metadata-extractor/commit/3c937050bfbe277ed9bf432de307da62671f8eba))
* :bug: better error handling if there are no tags ([f3699ec](https://github.com/kometenstaub/metadata-extractor/commit/f3699ecbad5c3c73e1a13097dd76455a027478cf))
* :bug: lower case fileMap key ([b22896d](https://github.com/kometenstaub/metadata-extractor/commit/b22896df820740c65fdd4e67425801765042119b))
* :bug: revert wrong refactoring ([6677694](https://github.com/kometenstaub/metadata-extractor/commit/66776943a455390cfd17cff93cfa605c7786b8f4))

### [0.2.3](https://github.com/kometenstaub/metadata-extractor/compare/0.2.2...0.2.3) (2021-11-15)


### Bug Fixes

* terminate worker ([9dd028a](https://github.com/kometenstaub/metadata-extractor/commit/9dd028a3568d728b38e3efd31b13ced75add7a5a))

### [0.2.2](https://github.com/kometenstaub/metadata-extractor/compare/0.2.1...0.2.2) (2021-11-14)

### [0.2.1](https://github.com/kometenstaub/metadata-extractor/compare/0.2.0...0.2.1) (2021-11-14)


### Performance

* :zap: pass less data to worker ([38e19a4](https://github.com/kometenstaub/metadata-extractor/commit/38e19a45824a6b1403d360141e11d56ac0a5ef28))

## [0.2.0](https://github.com/kometenstaub/metadata-extractor/compare/0.1.20...0.2.0) (2021-11-07)


### Performance

* :zap: use worker for backlinks calculation ([f35f200](https://github.com/kometenstaub/metadata-extractor/commit/f35f200b2646bdfeef5cc5fb5740ae88a98472ea))

### [0.1.20](https://github.com/kometenstaub/metadata-extractor/compare/0.1.19...0.1.20) (2021-11-04)


### Bug Fixes

* :loud_sound: disable logs by default; fixes [#5](https://github.com/kometenstaub/metadata-extractor/issues/5) ([2dc5fb2](https://github.com/kometenstaub/metadata-extractor/commit/2dc5fb2b751993ba0be4d51ca65cee5015a02c21))

### [0.1.19](https://github.com/kometenstaub/metadata-extractor/compare/0.1.18...0.1.19) (2021-10-02)

### [0.1.18](https://github.com/kometenstaub/metadata-extractor/compare/0.1.17...0.1.18) (2021-10-02)

### [0.1.17](https://github.com/kometenstaub/metadata-extractor/compare/0.1.16...0.1.17) (2021-09-29)

### [0.1.16](https://github.com/kometenstaub/metadata-extractor/compare/0.1.15...0.1.16) (2021-09-29)


### Bug Fixes

* :bug: fixed wrong method call for timer, corrected settings ([309b3fe](https://github.com/kometenstaub/metadata-extractor/commit/309b3fee04e218385471ccf61b5abbee8b7e2947))

### [0.1.15](https://github.com/kometenstaub/metadata-extractor/compare/0.1.14...0.1.15) (2021-09-29)


### Bug Fixes

* remove async from synchronous functions which were previously async ([fda38be](https://github.com/kometenstaub/metadata-extractor/commit/fda38be05121220ac28ba58a196b55e24d8df14a))

### [0.1.14](https://github.com/kometenstaub/metadata-extractor/compare/0.1.13...0.1.14) (2021-09-29)


### Bug Fixes

* removed unnecessary condition ([5866326](https://github.com/kometenstaub/metadata-extractor/commit/58663264a488d335075cd7056a881cdf1e7312b5))

### [0.1.13](https://github.com/kometenstaub/metadata-extractor/compare/0.1.12...0.1.13) (2021-09-29)


### Features

* :zap: write folders and non-md files to to JSON file ([53427d8](https://github.com/kometenstaub/metadata-extractor/commit/53427d85b4ecfac788e3db6cc8ce0f44e203130c))

### [0.1.12](https://github.com/kometenstaub/metadata-extractor/compare/0.1.11...0.1.12) (2021-09-29)


### Bug Fixes

* **interfaces:** :ambulance: reuse interfaces in other interfaces, fix missing properties ([401439e](https://github.com/kometenstaub/metadata-extractor/commit/401439ea24f6007e25bffb0ea52859fdeced602b))

### [0.1.11](https://github.com/kometenstaub/metadata-extractor/compare/0.1.10...0.1.11) (2021-09-29)


### Features

* **backlinks:** :sparkles: Backlinks are implemented in metadata JSON ([33be7a9](https://github.com/kometenstaub/metadata-extractor/commit/33be7a94a2032f9d6363073c313d12d9ddc62b11))
