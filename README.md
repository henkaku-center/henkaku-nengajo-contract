# henkaku-nengajo-contract

## 環境構築
**yarn test が回ればOKです**

## 1. node.js v16系をインストール

### 1.1 nvmをインストール
nvmは複数のnode.jsバージョンを管理できるマネージャーです。

[Macの方はこちら](https://zenn.dev/tet0h/articles/m1mac-nodejs)
[Win（Ubuntu）の方はこちら](https://zenn.dev/keijiek/articles/4976559b876090)

### 1.2 nvmをつかって、node.jsをインストール

上記、zenn記事の後半にnode.jsをinstallするところがあるので、**バージョンを16系（ex: 16.17.0）**にしてinstall

```
$ nvm install 16.17.0
```

### 1.3 node.jsがインストールできるか確認

```
$ node -v
```

を実行すると、v16.17.0 みたいな出力が出ると成功しています。
