# Person Info Frontend

基于Vue 3 + Element Plus的人员信息管理系统前端应用。

## 🚀 技术栈

- **Vue 3.3.4** - 渐进式JavaScript框架
- **Element Plus 2.4.4** - Vue 3组件库
- **Element Plus Icons** - 图标库
- **Axios 1.6.2** - HTTP客户端
- **Vue CLI 5.0.8** - 开发工具链
- **ESLint** - 代码质量检查
- **pnpm** - 包管理器(推荐)

## 📋 系统要求

- **Node.js 16+** (推荐使用LTS版本)
- **pnpm** (推荐) 或 **npm**

## 🛠️ 快速开始

### 1. 检查Node.js版本
```bash
node --version
npm --version
```

### 2. 安装pnpm (如果尚未安装)
```bash
npm install -g pnpm
```

### 3. 进入前端项目目录
```bash
cd frontend/person-info
```

### 4. 安装依赖
```bash
# 使用pnpm (推荐)
pnpm install

# 或使用npm
npm install
```

### 5. 启动开发服务器
```bash
# 使用pnpm
pnpm serve

# 或使用npm
npm run serve
```

### 6. 访问应用
开发服务器将在 `http://localhost:8081` 启动

**注意**: 确保后端API服务已在 `http://localhost:8088` 启动

## 📁 项目结构

```
frontend/person-info/
├── public/
│   ├── favicon.ico                    # 网站图标
│   └── index.html                     # HTML模板
├── src/
│   ├── App.vue                        # 根组件
│   ├── main.js                        # 应用入口
│   ├── assets/                        # 静态资源
│   │   └── logo.png
│   └── components/                    # Vue组件
│       └── HelloWorld.vue             # 示例组件
├── babel.config.js                    # Babel配置
├── jsconfig.json                      # JavaScript配置
├── package.json                       # 项目依赖
├── pnpm-lock.yaml                     # pnpm锁定文件
├── vue.config.js                      # Vue CLI配置
└── README.md                          # 项目说明
```

## 🎨 功能特性

### 核心功能
- ✅ **人员列表展示** - 使用Element Plus表格组件
- ✅ **实时搜索** - 按姓名、邮箱、电话搜索
- ✅ **数据排序** - 表格列排序功能
- ✅ **新增人员** - 弹窗表单添加
- ✅ **编辑人员** - 行内编辑或弹窗编辑
- ✅ **删除人员** - 确认删除功能
- ✅ **表单验证** - 前端数据验证
- ✅ **错误处理** - 友好的错误提示
- ✅ **响应式设计** - 适配不同屏幕尺寸

### UI特性
- 现代化的Element Plus设计风格
- 直观的操作界面
- 流畅的用户体验
- 中文界面支持

## 🔌 API集成

### 后端接口配置
```javascript
// vue.config.js
module.exports = {
  devServer: {
    port: 8081,
    proxy: {
      '/api': {
        target: 'http://localhost:8088',
        changeOrigin: true
      }
    }
  }
}
```

### HTTP客户端使用
```javascript
import axios from 'axios'

// 获取所有人员
const getPersons = async () => {
  const response = await axios.get('/api/persons')
  return response.data
}

// 创建人员
const createPerson = async (person) => {
  const response = await axios.post('/api/persons', person)
  return response.data
}
```

## 📦 可用脚本

### 开发命令
```bash
# 启动开发服务器
pnpm serve
npm run serve

# 构建生产版本
pnpm build
npm run build

# 代码质量检查
pnpm lint
npm run lint
```

### 开发服务器特性
- **热重载** - 代码修改自动刷新
- **代理配置** - 自动代理API请求到后端
- **错误提示** - 实时显示编译错误
- **端口配置** - 默认8081端口

## 🎨 组件开发

### Element Plus使用示例
```vue
<template>
  <el-table :data="persons" style="width: 100%">
    <el-table-column prop="name" label="姓名" width="180" />
    <el-table-column prop="age" label="年龄" width="180" />
    <el-table-column prop="email" label="邮箱" />
    <el-table-column prop="phone" label="电话" />
    <el-table-column label="操作">
      <template #default="scope">
        <el-button size="small" @click="editPerson(scope.row)">
          编辑
        </el-button>
        <el-button 
          size="small" 
          type="danger" 
          @click="deletePerson(scope.row.id)"
        >
          删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>
```

### 表单验证示例
```vue
<template>
  <el-form :model="form" :rules="rules" ref="formRef">
    <el-form-item label="姓名" prop="name">
      <el-input v-model="form.name" />
    </el-form-item>
    <el-form-item label="年龄" prop="age">
      <el-input-number v-model="form.age" :min="0" :max="150" />
    </el-form-item>
  </el-form>
</template>

<script setup>
const rules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度为2-20个字符', trigger: 'blur' }
  ],
  age: [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', min: 0, max: 150, message: '年龄范围为0-150', trigger: 'blur' }
  ]
}
</script>
```

## 🔧 配置说明

### Vue CLI配置 (vue.config.js)
```javascript
module.exports = {
  transpileDependencies: [],
  devServer: {
    port: 8081,                         // 开发服务器端口
    proxy: {
      '/api': {
        target: 'http://localhost:8088', // 后端API地址
        changeOrigin: true
      }
    }
  },
  chainWebpack: (config) => {
    // ESLint配置优化
    config.plugin('eslint').tap((args) => {
      if (args[0] && args[0].extensions) {
        delete args[0].extensions;
      }
      return args;
    });
  }
}
```

### Babel配置 (babel.config.js)
```javascript
module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ]
}
```

### 浏览器兼容性
```json
{
  "browserslist": [
    "> 1%",
    "last 2 versions",
    "not dead",
    "not ie 11"
  ]
}
```

## 🎯 开发指南

### 组件开发规范
1. **使用Composition API** - Vue 3推荐方式
2. **单文件组件** - .vue文件包含template、script、style
3. **Props验证** - 定义组件属性类型和默认值
4. **事件命名** - 使用kebab-case命名自定义事件

### 代码风格
- 使用ESLint进行代码检查
- 遵循Vue官方风格指南
- 组件名使用PascalCase
- 文件名使用kebab-case

### 状态管理
当前项目规模较小，使用组件本地状态。如需要全局状态管理，建议使用Pinia。

## 🚀 构建和部署

### 构建生产版本
```bash
pnpm build
```

构建产物将输出到 `dist/` 目录。

### 部署选项

#### 静态文件服务器
```bash
# 使用http-server
npm install -g http-server
cd dist
http-server -p 8080
```

#### Nginx配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend-server:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🧪 测试

### 手动测试检查清单
- [ ] 页面正常加载
- [ ] 人员列表正确显示
- [ ] 搜索功能正常
- [ ] 新增人员功能
- [ ] 编辑人员功能
- [ ] 删除人员功能
- [ ] 表单验证正确
- [ ] 错误处理友好
- [ ] 响应式布局

### 添加自动化测试
建议添加以下测试：
```bash
# 安装测试依赖
pnpm add -D @vue/test-utils jest

# 运行测试
pnpm test
```

## 🛠️ 故障排除

### 常见问题

1. **依赖安装失败**
   ```bash
   # 清除缓存
   pnpm store prune
   # 重新安装
   rm -rf node_modules
   pnpm install
   ```

2. **代理不工作**
   - 检查后端服务是否启动
   - 确认vue.config.js中的代理配置

3. **样式问题**
   - 检查Element Plus是否正确导入
   - 确认CSS样式优先级

4. **热重载不工作**
   - 检查文件路径是否正确
   - 重启开发服务器

### 开发工具推荐
- **VS Code** - 推荐的代码编辑器
- **Vue DevTools** - 浏览器调试插件
- **Vetur** 或 **Volar** - Vue语法支持插件

## 📚 学习资源

- [Vue 3 官方文档](https://v3.vuejs.org/)
- [Element Plus 文档](https://element-plus.org/)
- [Vue CLI 文档](https://cli.vuejs.org/)
- [Axios 文档](https://axios-http.com/)

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

**提示**: 开发时建议同时启动后端服务，以确保API调用正常工作。
