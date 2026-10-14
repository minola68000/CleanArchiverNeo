# CleanArchiverNeo

シンプルで便利な macOS 向けアーカイブユーティリティです。

`.DS_Store` や `Icon\r`、 `._*` などの不要なファイルを含めない **クリーン** な gzip / bzip2 / zip / 圧縮 Disk Image を作成します。

[anyakichi/CleanArchiver](https://github.com/anyakichi/CleanArchiver)（3.0a8）のフォークです。

**English:** [README.md](README.md)

## 動作環境

* macOS **12 以降**、Apple Silicon / Intel（Universal ビルド）
* **Xcode**（最新版推奨）と Command Line Tools

## ビルド

```bash
node --test scripts/carc-wiring.test.mjs   # carc 配線の静的チェック
make
# または（Release）
xcodebuild -project CleanArchiver.xcodeproj -scheme CleanArchiver -configuration Release -destination 'generic/platform=macOS' build
```

`-scheme` を使うときは `-destination 'generic/platform=macOS'` を付けてください。省略すると実行中の Mac のアーキテクチャだけがビルドされ、Universal になりません。

Sparkle の自動更新はこのフォークでは無効です。配布する場合は feed と署名を自前で設定してください。

GUI から指定したパスワードは、子プロセス `carc` へ環境変数 `CARC_PASSWORD` で渡します（コマンド行の `-P` は使いません）。

## CLI（開発用）

```bash
./CleanArchiver/carc -t zip -C -D -9 out.zip path/to/file
```
