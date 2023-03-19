# henkaku-ticket-contract

## 環境構築

## 1. node.js v16 系をインストール

### 1.1 nvm をインストール

nvm は複数の node.js バージョンを管理できるマネージャーです。

[Mac の方はこちら](https://zenn.dev/tet0h/articles/m1mac-nodejs)
[Win（Ubuntu）の方はこちら](https://zenn.dev/keijiek/articles/4976559b876090)

### 1.2 nvm をつかって、node.js をインストール

上記、zenn 記事の後半に node.js を install するところがあるので、**バージョンを 16 系（ex: 16.17.0）**にして install

```
$ nvm install 16.17.0
```

### 1.3 node.js がインストールできるか確認

```
$ node -v
```

を実行すると、v16.17.0 みたいな出力が出ると成功しています。

### ローカルノードにデプロイしてフロントエンドと繋いで開発するためには[こちら](https://github.com/henkaku-center/henkaku-ticket-contract/blob/main/docs/local_node.md)を参考にしてください。
