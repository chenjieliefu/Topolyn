# Topolyn

[English](README.md) | **简体中文**

当前开发版本：**2.16.0-dev.0**

<p align="center">
  <img src="docs/images/topolyn-product.png" alt="Topolyn 产品首页与在线课程平台系统图示例" width="960">
</p>

本地产品网站的真实截图。首页展示的在线课程平台系统图为内置示例。

**把产品想法、代码仓库或系统描述，转化为清晰、可交互的系统地图。**

本仓库包含产品网站、对话式工作台、场景指南和示例作品集，也保留面向 Raven、Cursor、Claude Code、Codex CLI 和 OpenCode 的 Topolyn Agent Skill。Skill 用于生成经过校验的技术系统图；本地网页工作台提供面向产品梳理的描述、修改与导出体验。

核心 Skill 功能已经实现，稳定版仍在验收中，详见[版本历史](CHANGELOG.md#unreleased)。

## 体验本地产品

需要 **Node.js 18 或更高版本**。

```bash
git clone https://github.com/chenjieliefu/Topolyn.git
cd Topolyn
node scripts/serve-topolyn-site.mjs
```

启动程序会打开本地网站，默认地址为 `http://127.0.0.1:4173/`。macOS 用户也可双击 `启动Topolyn.command`。使用期间保持终端运行，按 **Ctrl+C** 停止。

从首页进入工作台，描述产品或选择示例，查看系统节点，通过对话继续修改并导出结果。产品界面支持中文和英文。

本地服务支持在服务端配置 `DEEPSEEK_API_KEY`。未配置时使用浏览器内置演示数据；演示流程可运行不代表已获得真实模型响应。不要把 API Key 写入公开 README 或前端文件。

## 安装 Agent Skill

```bash
npx skills add chenjieliefu/Topolyn -g
```

Cursor 可使用非交互安装：

```bash
npx -y skills add chenjieliefu/Topolyn --skill topolyn --agent cursor --global --copy --yes
```

安装后告诉 Agent：

```text
分析这个仓库，然后使用 Topolyn 生成一张高层运行时架构图。
只保留 8–12 个核心组件，突出主要路径，并标出外部依赖与信任边界。
```

也可以直接描述流程：

```text
使用 Topolyn 绘制登录流程：
Browser -> Web App -> API -> JWT 校验 -> Redis 会话查询 -> PostgreSQL 回退。
```

生成后可以继续要求“加入 Redis”“把认证模块移到左侧”或“突出回滚路径”。

## Skill 的主要能力

- 读取代码仓库或有明确范围的系统描述，整理关键关系。
- 生成架构图、工作流图、时序图、数据流图和生命周期图。
- 通过结构化 JSON 和确定性规则校验结构、布局、路径与标签。
- 搜索节点、查看关系、追踪上下游及指定路径。
- 对比两个版本，查看新增、删除、修改和移动。
- 交付独立 HTML、PNG、SVG、WebM 和分享卡片。

默认生成可独立打开的 HTML，不依赖托管服务。本地网页工作台与完整 Skill 的能力不同，不能把 Skill 的全部导出与校验能力视作首页演示已具备的能力。

## 支持的图表

| 类型 | 适用场景 |
|---|---|
| 架构图 | 组件、服务、存储、边界和依赖 |
| 工作流图 | CI/CD、审批、工具调用和操作流程 |
| 时序图 | API 调用、认证、缓存回退和异步交互 |
| 数据流图 | 数据管道、血缘、敏感信息和消费者 |
| 生命周期图 | 状态变化、重试、等待和终止结果 |

```bash
node topolyn/bin/topolyn.mjs guide "展示 API 请求与 Redis 缓存未命中流程"
```

## 生成结果预览

![Topolyn 交互查看器：生产部署中的后端与数据库角色对比](docs/assets/topolyn-demo-lens.png)

仓库中的真实查看器示例，展示角色对比、引导视图与导出控件。更多示例见[上游验证作品集](https://tt-a1i.github.io/archify/gallery.html)。

## 工作方式

| 步骤 | 说明 |
|---|---|
| 生成 | Agent 根据来源证据或描述创建结构化 JSON |
| 校验 | 检查数据结构、布局、路径和标签 |
| 预览 | 按需在本地查看最近一次校验通过的结果 |
| 交付 | 生成独立 HTML，并按需导出其他格式 |
| 调整 | 根据后续要求修改局部内容，保留无关结构 |

图中关系以来源或输入为依据。作者定义的连接，不自动等于已验证的运行时影响。

## 本地开发与检查

```bash
cd topolyn
npm install
npm test
node bin/topolyn.mjs doctor
```

在 `topolyn/` 目录运行的常用命令：

```bash
node bin/topolyn.mjs demo /tmp/topolyn-demo
node bin/topolyn.mjs guide "展示 CI/CD 检查、审批、部署和回滚"
node bin/topolyn.mjs validate workflow examples/agent-tool-call.workflow.json --quality showcase --json
```

## 当前边界与文档

核心 Skill 当前不提供托管分享、所见即所得编辑和任意 Mermaid 自动转换。

- [Skill 使用说明](topolyn/SKILL.md)
- [Schema 参考](topolyn/schemas/README.md)
- [产品定义](PRODUCT.md)
- [版本历史](CHANGELOG.md)
- [开发路线](ROADMAP.md)
- [贡献指南](CONTRIBUTING.md)
- [上游场景指南](https://tt-a1i.github.io/archify/guide.html)
- [上游项目与示例](https://tt-a1i.github.io/archify/)

## 来源与许可

本仓库基于[上游 Archify / Topolyn 项目](https://github.com/tt-a1i/archify)，并包含本地产品网站与工作台适配。上方标注为“上游”的文档和作品集链接指向原项目。

采用 [MIT License](LICENSE)。
