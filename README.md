# CleanArchiverNeo

CleanArchiver is a simple and nifty archiving utility.

It creates **clean** gzip, bzip2, zip and compressed Disk Image archives
that don't include annoying files such as .DS_Store, Icon\r and .\_\*.

Fork of [anyakichi/CleanArchiver](https://github.com/anyakichi/CleanArchiver) (3.0a8).

## Requirements

* macOS, Command Line Tools (Xcode)

## Build

```bash
make
# or
xcodebuild -project CleanArchiver.xcodeproj -scheme CleanArchiver build
```

## CLI (development)

```bash
./CleanArchiver/carc -t zip -C -D -9 out.zip path/to/file
```
