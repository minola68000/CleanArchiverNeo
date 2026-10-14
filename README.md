# CleanArchiverNeo

CleanArchiver is a simple and nifty archiving utility.

It creates **clean** gzip, bzip2, zip and compressed Disk Image archives
that don't include annoying files such as .DS_Store, Icon\r and .\_\*.

Fork of [anyakichi/CleanArchiver](https://github.com/anyakichi/CleanArchiver) (3.0a8).

**日本語:** [README.ja.md](README.ja.md)

## Requirements

* macOS **12+**, Apple Silicon / Intel (Universal build)
* **Xcode** (recent release) and Command Line Tools

## Build

```bash
node --test scripts/carc-wiring.test.mjs   # static check of carc wiring
make
# or (Release)
xcodebuild -project CleanArchiver.xcodeproj -scheme CleanArchiver -configuration Release -destination 'generic/platform=macOS' build
```

When using `-scheme`, include `-destination 'generic/platform=macOS'`. Without it, Xcode builds only for the host Mac’s architecture and the product will not be Universal.

Sparkle automatic updates are disabled in this fork. Configure your own update feed and signing before distribution.

GUI archive passwords are passed to the `carc` child process via the `CARC_PASSWORD` environment variable (not `-P` on the command line).

## CLI (development)

```bash
./CleanArchiver/carc -t zip -C -D -9 out.zip path/to/file
```
