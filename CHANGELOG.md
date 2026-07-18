# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-07-18

### Added

- Initial release
- Container introspection: `listContainers`, `getContainerDetails`
- Image introspection: `listImages`, `findDanglingImages`
- Port mapping: `getPortMap`, `findPortConflicts`
- Live stats streaming: `streamStats`
- Network & volume listing: `listNetworks`, `listVolumes`
- CLI with subcommands: `ps`, `images`, `ports`, `stats`, `dashboard`
- Color-coded terminal output via `cli-table3` + `chalk`
- Read-only by design — never starts, stops, or modifies Docker resources
