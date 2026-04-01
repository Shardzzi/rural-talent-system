# API 参考文档

本系统提供标准 RESTful API 接口，支持人员信息管理、农村特色画像、技能库统计及用户认证等功能。

## 目录
1. [通用规范](#通用规范)
2. [认证接口](#认证接口)
3. [人员信息接口](#人员信息接口)
4. [统计与搜索](#统计与搜索)
5. [错误处理](#错误处理)

## 通用规范

### 认证方式
除公开接口外，所有请求需在 Header 中包含 JWT 令牌：
`Authorization: Bearer <your_token>`

### 角色说明
- **访客 (Guest)**: 未登录用户，可查看脱敏数据。
- **普通用户 (User)**: 已登录用户，可查看完整数据，仅能编辑关联的个人资料。
- **管理员 (Admin)**: 系统管理员，拥有所有数据的读写和导出权限。

### 数据脱敏
访客访问时，敏感字段将进行脱敏处理：
- 手机号：`138****8000`
- 地址：仅保留省级信息
- 身份证号：不返回

---

## 认证接口

### POST /api/auth/register
- **描述**: 用户注册，带频率限制 (3次/小时)
- **请求体**:
  ```json
  {
    "username": "user123",
    "password": "password123",
    "email": "user@example.com"
  }
  ```
- **验证规则**:
  - `username`: 3-20字符，仅字母、数字、下划线
  - `password`: 6-50字符，需包含字母和数字
  - `email`: 必须为有效邮箱格式
- **状态码**: 201成功, 400验证错误, 409已存在, 429频率限制

### POST /api/auth/login
- **描述**: 用户登录，获取令牌
- **频率限制**: 5次/15分钟
- **请求体**: `{ "username": "admin", "password": "..." }`
- **响应数据**: `{ "token": "...", "refreshToken": "...", "user": { ... } }`
- **状态码**: 200成功, 401凭据错误, 429频率限制

### POST /api/auth/refresh
- **描述**: 刷新访问令牌 (T9实现)
- **认证**: 需要有效的 Refresh Token (在 Authorization Header 中)
- **说明**: 访问令牌24小时有效，刷新令牌7天有效

### POST /api/auth/logout
- **描述**: 用户登出，废弃当前令牌
- **认证**: 需要 Bearer Token

### GET /api/auth/me
- **描述**: 获取当前登录用户的详细信息及关联的人员画像
- **认证**: 需要 Bearer Token

### PUT /api/auth/change-password
- **描述**: 修改当前用户密码
- **请求体**: `{ "currentPassword": "...", "newPassword": "...", "confirmPassword": "..." }`
- **认证**: 需要 Bearer Token

### PUT /api/auth/link-person
- **描述**: 将当前用户账号关联到特定的技术人才 ID
- **请求体**: `{ "personId": 123 }`
- **认证**: 需要 Bearer Token

---

## 人员信息接口

### GET /api/persons
- **描述**: 分页获取所有人员列表
- **说明**: 访客获取脱敏数据，登录用户获取完整数据

### GET /api/persons/:id
- **描述**: 获取指定 ID 的人员基础信息
- **说明**: 访客看到脱敏数据

### GET /api/persons/:id/details
- **描述**: 获取人员深度详情（包括农村画像、技能列表、合作意向）

### POST /api/persons
- **描述**: 创建新的人员基础记录
- **认证**: 需要登录。普通用户若已有关联记录则不可重复创建

### POST /api/persons/comprehensive
- **描述**: 一键创建完整人才档案（基础+画像+技能+意向）
- **请求体**: `{ "person": {...}, "ruralProfile": {...}, "skills": [...], "cooperation": {...} }`

### PUT /api/persons/:id
- **描述**: 更新人员基础信息
- **权限**: 管理员可修改任意记录，普通用户仅限修改“关联到自己”的记录

### PUT /api/persons/:id/comprehensive
- **描述**: 全量更新人才详情（包括子表数据同步）

### POST/PUT /api/persons/:id/rural-profile
- **描述**: 创建或更新人员的农村特色画像（务农年限、作物、规模等）

### POST /api/persons/:id/skills
- **描述**: 为指定人员添加新技能
- **请求体**: `{ "skill_name": "水稻种植", "skill_category": "农业技术", "proficiency_level": "advanced" }`

### DELETE /api/skills/:skillId
- **描述**: 删除指定的技能记录

### DELETE /api/persons/:id
- **描述**: 删除整个人才档案
- **权限**: 仅管理员 (Admin)

---

## 统计与搜索

### GET /api/health
- **描述**: 服务健康检查
- **响应**: `{ "success": true, "message": "Server is running" }`

### GET /api/search
- **描述**: 复合条件高级搜索 (T11)
- **查询参数**:
  - `name`: 姓名模糊匹配
  - `minAge`, `maxAge`: 年龄范围
  - `gender`: 性别 (male/female/other)
  - `education_level`: 学历筛选
  - `skill`: 技能名称
  - `crop`: 种植作物
  - `page`, `limit`: 分页控制

### GET /api/statistics
- **描述**: 系统全局统计大屏数据 (T10)
- **权限**: 仅管理员 (Admin)
- **返回内容**: 人才总量、平均年龄、技能分类分布、农业规模统计、注册趋势等

### GET /api/skills-library-stats
- **描述**: 获取全库技能热度统计
- **说明**: 访客可访问，用于展示热门技能标签

### GET /api/persons/export
- **描述**: 导出人才数据为 CSV 文件 (T13)
- **权限**: 仅管理员 (Admin)
- **说明**: 支持带过滤条件导出，自动处理 CSV 转码与脱敏

---

## 安全特性

- **速率限制 (Rate Limiting)**:
  - 登录：5次 / 15分钟 / IP
  - 注册：3次 / 1小时 / IP
- **输入过滤**: 所有输入均经过 `sanitizeString` 处理，去除 HTML 标签，防止 XSS。
- **防止注入**: 采用参数化查询 (Parameterized Queries) 杜绝 SQL 注入。
- **JWT 安全**: 令牌采用三段式结构，服务端强制校验 ID 与过期时间。

## 错误处理

系统采用统一的错误响应格式：

```json
{
  "success": false,
  "message": "错误描述信息",
  "errors": [
    {
      "msg": "具体验证错误",
      "param": "字段名",
      "location": "body"
    }
  ]
}
```

### 常见状态码
- `400`: 请求参数验证失败
- `401`: 未认证或令牌过期
- `403`: 权限不足（如普通用户访问管理员接口）
- `404`: 资源不存在
- `409`: 资源冲突（如重复的邮箱或手机号）
- `429`: 请求过于频繁
- `500`: 服务器内部错误
