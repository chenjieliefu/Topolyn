# Topolyn

Topolyn 是一个用于生成技术系统图的 Agent Skill。它可以读取代码仓库或系统描述，在对话中生成经过校验、可交互、可分享的系统地图，适用于 Raven、Cursor、Claude Code、Codex CLI 和 OpenCode。

> 当前开发版本：`v2.16.0-dev.0`。核心功能已经实现，稳定版仍在验收中，详见[版本历史](CHANGELOG.md#unreleased)。

## 产品是什么

Topolyn 主要用于把复杂的技术信息整理成清晰的可视化结果：

- 从代码仓库或文字描述中梳理系统结构；
- 生成架构图、工作流图、时序图、数据流图和生命周期图；
- 通过结构化 JSON 和确定性规则校验内容与布局；
- 在图中搜索节点、查看关系、追踪上下游和指定路径；
- 对比两个架构版本，查看新增、删除、修改和移动；
- 导出独立 HTML、PNG、SVG、WebM 和分享卡片。

生成结果默认是一个可独立打开的 HTML 文件，不依赖在线服务。

## 快速开始

### 安装

```bash
npx skills add tt-a1i/archify -g
```

如果只想临时体验：

```bash
npx skills use tt-a1i/archify@topolyn --agent codex
```

Cursor 可以使用非交互安装：

```bash
npx -y skills add tt-a1i/archify --skill topolyn --agent cursor --global --copy --yes
```

### 使用

安装后，可以直接告诉 Agent：

```text
分析这个仓库，然后使用 Topolyn 生成一张高层运行时架构图。
只保留 8–12 个核心组件，突出主要路径，并标出外部依赖与信任边界。
```

也可以描述一个具体流程：

```text
使用 Topolyn 绘制登录流程：
Browser -> Web App -> API -> JWT 校验 -> Redis 会话查询 -> PostgreSQL 回退。
```

生成后可以继续要求 Agent 调整，例如“加入 Redis”“把认证模块移到左侧”或“突出回滚路径”。

## 支持的图表

| 类型 | 适用场景 |
|---|---|
| 架构图 | 系统组件、服务、存储、边界和依赖关系 |
| 工作流图 | CI/CD、审批、工具调用和操作流程 |
| 时序图 | API 调用、认证、缓存回退和异步交互 |
| 数据流图 | 数据管道、数据血缘、敏感信息和消费者 |
| 生命周期图 | 状态变化、重试、等待和终止结果 |

不确定使用哪一种时，可以运行：

```bash
node topolyn/bin/topolyn.mjs guide "展示 API 请求与 Redis 缓存未命中流程"
```

也可以查看[场景选图指南](https://tt-a1i.github.io/archify/guide.html)。

## 工作方式

| 步骤 | 说明 |
|---|---|
| 生成 | Agent 根据仓库或描述创建结构化 JSON |
| 校验 | 检查数据结构、布局、路径和标签等规则 |
| 预览 | 可选地在本地查看最近一次校验通过的结果 |
| 交付 | 生成独立 HTML，并按需导出其他格式 |
| 调整 | 根据后续要求修改局部内容，保留无关结构 |

Topolyn 只呈现代码与输入中能够确认的关系，不会把作者定义的连接包装成未经验证的运行时影响结论。

## 本地开发与检查

需要 Node.js 18 或更高版本。

```bash
cd topolyn
npm install
npm test
node bin/topolyn.mjs doctor
```

常用命令：

```bash
node bin/topolyn.mjs demo /tmp/topolyn-demo
node bin/topolyn.mjs guide "展示 CI/CD 检查、审批、部署和回滚"
node bin/topolyn.mjs validate workflow examples/agent-tool-call.workflow.json --quality showcase --json
```

## 当前边界

Topolyn 不是通用绘图编辑器，也不是 Mermaid 主题工具。当前不提供托管分享、所见即所得编辑和任意 Mermaid 自动转换。

## 文档入口

- [项目主页](https://tt-a1i.github.io/archify/)
- [场景选图指南](https://tt-a1i.github.io/archify/guide.html)
- [示例与验证结果](https://tt-a1i.github.io/archify/gallery.html)
- [Skill 使用说明](topolyn/SKILL.md)
- [Schema 参考](topolyn/schemas/README.md)
- [版本历史](CHANGELOG.md)
- [开发路线](ROADMAP.md)
- [贡献指南](CONTRIBUTING.md)

## 开源许可

本项目采用 [MIT License](LICENSE)。
