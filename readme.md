# 中医处方结算系统

一个纯前端 Vue3 项目，用于中医诊所的处方开具、结算和统计管理。

## 功能特性

- 📋 **处方开具**：手动开方、模板开方、图片识别（OCR）
- 🌿 **药材管理**：成本价、销售价、折扣、库存管理
- 👤 **患者管理**：患者信息记录和就诊历史
- 💰 **结算系统**：支持多种支付方式，自动计算折扣
- 📊 **统计报表**：营收、利润、热门药材分析
- 🖨️ **打印功能**：支持 A4 纸和小票纸打印
- 💾 **数据管理**：本地 IndexedDB 存储，支持导入导出
- 📱 **PWA 支持**：可安装为桌面应用，离线可用

## 技术栈

- Vue 3 + Vite
- Vue Router
- Pinia（状态管理）
- LocalForage（IndexedDB 封装）
- Day.js（日期处理）
- html2canvas + jsPDF（打印导出）

## 部署方式

### 方式一：Termux（推荐）

在安卓手机上安装 Termux 应用，然后执行：

```bash
# 安装 Node.js
pkg install nodejs

# 进入项目目录
cd ~/tcm-prescription-system

# 安装依赖
npm install

# 构建
npm run build

# 启动服务器
npx serve -s dist -l 3000
```

访问地址：
- 手机浏览器：`http://localhost:3000`
- 局域网电脑：`http://<手机IP>:3000`

### 方式二：静态文件

构建后直接打开 HTML 文件：

```bash
npm run build
```

将 `dist` 文件夹复制到手机，用浏览器打开 `index.html`。

## OCR 配置

图片识别功能需要配置 OCR API，支持：
- 百度智能云 OCR
- 腾讯云 OCR
- 阿里云 OCR

在 `src/views/OCR.vue` 中添加 API 配置即可使用。

## 数据备份

系统使用浏览器 IndexedDB 存储数据，建议定期导出备份：

1. 进入「设置」→「导出数据」
2. 保存 JSON 文件到安全位置
3. 需要恢复时选择「导入数据」

## 浏览器兼容性

- Chrome / Edge（推荐）
- Safari
- Firefox
- 安卓 WebView

## 开发运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 预览
npm run preview
```

## 目录结构

```
tcm-prescription-system/
├── public/              # 静态资源
├── src/
│   ├── components/      # 公共组件
│   ├── db/             # 数据库配置
│   ├── router/         # 路由配置
│   ├── stores/         # Pinia 状态管理
│   ├── views/          # 页面视图
│   ├── App.vue         # 根组件
│   ├── main.js         # 入口文件
│   └── style.css       # 全局样式
├── index.html
├── package.json
└── vite.config.js
```

## 许可证

MIT License