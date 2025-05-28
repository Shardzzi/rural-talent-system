# 数字乡村人才信息系统 (Node.js版本)

一个专为农村人才信息管理而设计的基于Node.js + Express + Vue 3的全栈Web应用系统。

## 📁 项目结构

```
person-info-nodejs/
├── 📋 项目文档
│   ├── README.md                      # 项目主要说明文档
│   ├── IMPLEMENTATION_PLAN.md         # 实施计划文档
│   ├── PROJECT_STRUCTURE.md          # 详细项目结构文档
│   ├── PROJECT_OVERVIEW.md           # 项目概览报告
│   └── 数字乡村人才信息系统项目文档.md  # 完整项目文档
│
├── 🖥️ backend/                       # Node.js + Express 后端
│   ├── app.js                         # 主应用入口文件
│   ├── config/                        # 配置文件
│   ├── controllers/                   # 控制器层
│   ├── data/persons.db               # SQLite数据库文件
│   ├── middleware/                    # 中间件
│   ├── routes/                        # 路由定义
│   └── services/                      # 服务层
│
├── 🎨 frontend/                       # Vue 3 前端界面
│   ├── src/                          # 源代码
│   │   ├── components/               # 可复用组件
│   │   ├── views/                    # 页面视图
│   │   ├── stores/                   # 状态管理
│   │   └── api/                      # API接口
│   └── public/                       # 静态资源
│
├── 🧪 test/                          # 测试脚本和工具
│   ├── run-tests.sh                  # 自动化测试脚本
│   └── test_*.js                     # 各类功能测试
│
├── 📊 report/                        # 项目报告和文档
│   └── *.md                          # 各阶段开发报告
│
└── 🛠️ 配置文件                       # 项目配置和脚本
    ├── setup.bat                     # 环境安装脚本
    └── start-dev.bat                 # 开发启动脚本
```

## 🚀 技术栈

### 后端
- **Node.js 16+** - JavaScript 运行时环境
- **Express.js** - Web 应用框架
- **SQLite3** - 嵌入式数据库
- **jsonwebtoken** - JWT认证
- **bcryptjs** - 密码加密
- **winston** - 日志管理
- **express-validator** - 数据验证中间件
- **cors** - 跨域资源共享

### 前端
- **Vue 3** - 渐进式前端框架
- **Element Plus** - Vue 3 UI组件库
- **Vue Router 4** - 官方路由管理器
- **Pinia** - Vue 3 状态管理
- **Axios** - HTTP客户端
- **pnpm** - 高效包管理器

## ✨ 核心功能特性

### 🔐 用户认证系统
- ✅ 用户注册/登录功能
- ✅ JWT令牌认证机制  
- ✅ 多角色权限控制 (管理员/普通用户)
- ✅ 会话状态管理

### 👥 人员信息管理
- ✅ 完整的CRUD操作（增删改查）
- ✅ 农村特色信息管理 (种植年限、主要作物、种植规模等)
- ✅ 技能特长记录 (专业技能、认证等级等)
- ✅ 合作意向管理 (合作类型、投资能力、偏好规模等)
- ✅ 实时搜索功能（姓名、邮箱、电话）
- ✅ 多条件数据筛选

### 🎛️ 用户界面
- ✅ 访客浏览模式 (公开信息查看)
- ✅ 用户个人中心 (个人信息管理)
- ✅ 管理员仪表板 (全局数据管理)
- ✅ 详细信息查看对话框
- ✅ 响应式设计支持
- ✅ 现代化UI界面

### 🔧 技术特性
- ✅ RESTful API设计
- ✅ 统一错误处理机制
- ✅ 数据验证和安全防护
- ✅ 日志记录和监控
- ✅ 中文编码完全支持
- ✅ 跨域请求支持

## 快速开始

### 方法一：使用批处理脚本 (推荐)

```bash
# 首次运行 - 安装所有依赖
setup.bat

# 开发模式 - 同时启动前后端
start-dev.bat
```

### 方法二：手动启动

### 环境要求

- Node.js 16+
- npm 或 pnpm
- Python 3.7+ (用于编译 SQLite 依赖)

### Python 安装 (Windows)

如果您还没有安装Python，请访问 [Python官网](https://www.python.org/downloads/) 下载并安装最新版本的Python。

或者使用以下命令安装：
```bash
# 使用winget (Windows 10+)
winget install Python.Python.3

# 或者使用Chocolatey
choco install python
```

安装完成后，确认Python已正确安装：
```bash
python --version
# 或
python3 --version
```

### 后端启动

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 或者正式启动
npm start
```

后端服务器将运行在 `http://localhost:8080`

### 前端启动

```bash
# 进入前端目录
cd frontend

# 安装依赖
pnpm install
# 或者使用 npm install

# 启动开发服务器
pnpm serve
# 或者使用 npm run serve
```

前端应用将运行在 `http://localhost:8081`

## API 接口

### 基础URL
`http://localhost:8080/api`

### 接口列表

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/persons` | 获取所有人员信息 |
| GET | `/persons/:id` | 根据ID获取人员信息 |
| POST | `/persons` | 创建新人员 |
| PUT | `/persons/:id` | 更新人员信息 |
| DELETE | `/persons/:id` | 删除人员 |

### 数据格式

```json
{
  "id": 1,
  "name": "张三",
  "age": 25,
  "email": "zhangsan@example.com",
  "phone": "13800138000"
}
```

### 验证规则

- **姓名**: 必填，2-20个字符
- **年龄**: 必填，0-150之间的整数
- **邮箱**: 必填，有效邮箱格式
- **电话**: 必填，中国大陆手机号格式 (1开头，11位数字)

## 开发说明

### 与Java版本的差异

1. **后端技术栈**: 从Spring Boot改为Node.js + Express
2. **数据库操作**: 从Hibernate JPA改为SQLite3原生操作
3. **验证机制**: 从Bean Validation改为express-validator
4. **日志处理**: 从SLF4J改为console.log
5. **错误处理**: 统一的Express错误处理中间件

### 前端配置

前端代码与Java版本基本相同，只需要确保API调用的端口与Node.js后端一致。

## 注意事项

- 数据库文件 `person.db` 会在首次运行时自动创建
- 默认后端端口为 8080，前端为 8081
- 支持热重载开发（使用nodemon）
- 生产环境建议使用PM2或其他进程管理器

## 许可证

MIT License
