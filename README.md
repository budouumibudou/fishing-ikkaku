# フィッシング ～一獲千金～

ヒトデ、フグ、ときどきキノコ。隣のおじさんと一獲千金を目指す、小さなブラウザ釣りゲーム。

## 遊び方

「釣り糸を投げる」→ ウキが沈んだら「今！ 合わせる」→ 目印が緑の帯に入ったら「引き上げる！」。釣果を売って道具を整え、隣のおじさんと話しながら金塊を目指します。音楽はタイトル画面からオンにできます。

## 公開

このリポジトリは静的サイトです。GitHub の Settings → Pages で、Build and deployment の Source を Deploy from a branch、Branch を main、フォルダーを / (root) に設定すると公開できます。index.html はリポジトリの最上位に置いてください。

セーブはブラウザのローカルストレージに保存されます。公開先を変えると、前のURLの記録は自動では移りません。

## 構成

- index.html / style.css：画面
- game-v7.mjs / core.mjs / data.mjs：ゲーム
- music.mjs：Web Audio で演奏するオリジナルBGMと効果音
- sprites.mjs / assets：画像

ライセンスはまだ指定していません。
