# 下班搭子管理前端

Vue 3 管理界面，用于查看设备、集会和运营概况。管理 API 和鉴权由 [offwork-pet 的 Python 后端](https://github.com/lovelyxuxu/offwork-pet/tree/main/server) 提供。

先启动后端（默认 127.0.0.1:8765），再运行：

```sh
npm ci
npm run dev
```

打开 http://localhost:5173/admin/。生产构建执行 `npm run build`，将 `dist/` 的内容放到后端的 `server/admin_web/`。管理员凭据由部署者配置。本项目自有代码采用 [MIT](LICENSE)，依赖采用各自许可。
