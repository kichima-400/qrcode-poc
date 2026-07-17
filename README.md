# QRコード作業工程記録POC

社員がAndroidスマホでQRコードをスキャンし、製品の作業工程進捗（開始・完了）をサーバPC（このリポジトリを動かすPC）に記録するPOCです。詳細な要件は `docs/requirements.md` を参照してください。

## 構成

- サーバ: Node.js + Express + better-sqlite3（`server/`）
- フロント: 素のHTML/CSS/JS、QRスキャンは html5-qrcode、テスト用QR生成は qrcode-generator（`public/`）
- DB: SQLiteファイル `data/app.db`（初回起動時に自動作成）

## セットアップ

```powershell
npm install
```

## 起動（HTTP、PCでの動作確認用）

証明書がまだ無い状態では自動的にHTTPで起動します。

```powershell
npm start
```

`http://localhost:3000` にアクセスすると、以下の画面が使えます。

- `/index.html`（トップ）: QRスキャン画面
- `/history.html`: スキャン履歴・製品ごとの現在状態
- `/test-qr.html`: テスト用QRコードをその場で生成する管理画面

PCのカメラであれば `localhost` はHTTPのままでも `getUserMedia`（カメラAPI）が動作するため、まずはPC上のブラウザで一通り動作確認できます。

## Android実機で使うためのHTTPS化（mkcert）

AndroidのChromeでカメラを使うには**HTTPS必須**です。同一LAN内で使えるよう、mkcertで自己署名のローカル証明書を発行します。

以下の手順は、**Windowsのシステム証明書ストアへの登録・ファイアウォール設定の変更を伴うため、必ずご自身の権限で実行してください**（本リポジトリのセットアップスクリプトやAIエージェントが自動実行することはありません）。

### 1. サーバPC（Windows）側

1. mkcertをインストール（wingetが使える場合はこちらが簡単です）
   ```powershell
   winget install FiloSottile.mkcert
   ```
   インストール後、PATHを反映させるため**新しいターミナルを開いて**ください。
   wingetが無い場合はChocolateyで `choco install mkcert`、またはいずれも無い場合は [mkcertのGitHub Releases](https://github.com/FiloSottile/mkcert/releases) から `mkcert-vX.X.X-windows-amd64.exe` をダウンロードし、`mkcert.exe` にリネームしてPATHの通ったフォルダに配置してください。

2. ローカルCAをインストール（初回のみ。Windowsの信頼された証明書ストアにルートCAが登録されます）
   ```powershell
   mkcert -install
   ```
   「The local CA is now installed in the system trust store!」と表示されれば成功です。PC内にJavaがインストールされている環境では、続けて `ERROR: failed to execute "keytool -importcert"` というJavaの証明書ストア（cacerts）への登録失敗メッセージが出ることがありますが、これはJavaアプリ向けの追加登録が失敗しただけで、Windows本体・ブラウザでの利用には影響ありません。無視して問題ありません。

3. サーバPCのLAN IPアドレスを確認
   ```powershell
   ipconfig
   ```
   Wi-Fiアダプターの `IPv4 アドレス` を確認します。例: `192.168.1.50`。ルータでこのPCのIPを固定化（DHCP予約や固定IP設定）しておくと、IP変動による証明書再発行の手間を避けられます。

4. IPアドレスを明示指定して証明書を発行し、このリポジトリの `server/certs/` に配置します
   ```powershell
   cd server\certs
   mkcert -key-file server.key -cert-file server.crt localhost 127.0.0.1 192.168.1.50
   ```
   （`192.168.1.50` の部分は実際のサーバPCのLAN IPに置き換えてください）

5. 現在接続しているWi-Fiのネットワークプロファイルを確認します
   ```powershell
   Get-NetConnectionProfile | Select-Object Name, InterfaceAlias, NetworkCategory
   ```
   `NetworkCategory` が `Public` と表示されることがあります（自宅Wi-Fiでも初期状態ではPublic扱いのことがあります）。この場合、ファイアウォールルールを「プライベートのみ」に限定すると通信がブロックされ、Android側から接続した際に `ERR_CONNECTION_TIMED_OUT` になります。

6. Windows Defender ファイアウォールで、待受ポート（デフォルト3443）への受信を許可します。上記で `Public` だった場合は `-Profile Any` を指定してください（自宅Wi-Fi等、信頼できるネットワークであることを前提とします）。
   ```powershell
   New-NetFirewallRule -DisplayName "QRコードPOC HTTPS" -Direction Inbound -Protocol TCP -LocalPort 3443 -Action Allow -Profile Any
   ```

### 2. サーバを起動

`server/certs/server.key` と `server/certs/server.crt` が存在すると、自動的にHTTPSで起動します。

```powershell
npm start
```

`HTTPSサーバ起動: https://localhost:3443` と表示されれば成功です。

### 3. Android実機側（ルートCAの信頼設定）

1. サーバPCで、mkcertのルートCA証明書ファイルの場所を確認します
   ```powershell
   mkcert -CAROOT
   ```
   出力されたフォルダ内の `rootCA.pem` を使用します。

2. `rootCA.pem` をAndroid端末に転送します（メール添付、USBケーブルでのファイルコピーなど）。

3. Android端末: 設定 → セキュリティ（機種により「詳細設定」配下）→「暗号化と認証情報」→「証明書のインストール」→「CA証明書」を選択 → 転送した `rootCA.pem` を指定してインストールします。
   - Android 11以降は警告ダイアログが出ますが、開発用ローカル環境の自己署名CAなので許容してインストールします。
   - 画面ロック（PIN/パターン）の設定を求められる場合は先に設定してください。

4. サーバPCとAndroid端末を**同一Wi-Fi/LAN**に接続した状態で、AndroidのChromeから `https://<サーバPCのLAN IP>:3443/` にアクセスします。証明書警告が出ず、カメラ許可ダイアログが表示されれば成功です。

### トラブルシューティング

- `ERR_CONNECTION_TIMED_OUT` になる場合: ほぼファイアウォールが原因です。上記5・6番の手順で `NetworkCategory` が `Public` になっていないか確認し、`-Profile Any` でルールを作り直してください（既にルールがある場合は `Remove-NetFirewallRule -DisplayName "QRコードPOC HTTPS"` で削除してから作り直します）。
- 証明書警告が出続ける場合: Android設定 → セキュリティ → 信頼できる認証情報 → 「ユーザー」タブに mkcert のCAが表示されているか確認してください。
- サーバPCのIPアドレスが変わった場合: 証明書を再発行（上記4番）してください。
- Wi-Fiのゲストネットワーク分離機能（AP分離）があると端末間通信ができないことがあるため、同一の通常ネットワークに接続してください。

## テスト用QRコードの用意

`http://<サーバ>/test-qr.html`（またはHTTPS版）を開き、社員番号・製品番号・工程種別を入力して「生成」ボタンを押すとその場でQRコードが表示されます。PC画面をAndroid実機で直接スキャンするか、印刷して使ってください。160種類すべてを事前に用意する必要はありません。

## 動作確認の流れ（例）

1. `test-qr.html` で `EMP-001` の社員QRを生成し、スキャン画面（`index.html`）でスキャン → 「ログイン中: EMP-001」と表示される
2. `PROD-01` の製品QRをスキャン
3. `PROC-01-S1_START` → `S1_END` → `S2_START` → `S2_END` → `ALL_END` の順にスキャンし、すべて成功記録されることを確認
4. 順序を飛ばしたスキャン（例: `S1_START` を跳ばして `S2_START`）を試し、エラーメッセージが表示されることを確認
5. `history.html` で履歴一覧・エラー行のハイライトを確認

## 開発用コマンド

```powershell
npm test    # 状態遷移ロジック(server/lib)の単体テスト
```
