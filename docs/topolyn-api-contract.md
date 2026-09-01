# Topolyn 网页生成 API 预留契约

本地一键启动器已内置 `/api/generate` 安全代理。DeepSeek 密钥只保存在项目根目录的 `.topolyn.env`，不会进入浏览器或被 Git 提交。

如果未来改用独立部署的后端，也可以在网页加载前设置：

```html
<script>window.TOPOLYN_API_ENDPOINT = "https://your-api.example.com/generate";</script>
```

网页会向这个地址发送 `POST` JSON 请求。

## 请求数据

```json
{
  "description": "用户对产品、业务或系统的自然语言描述",
  "diagramType": "auto | architecture | workflow | sequence | dataflow | lifecycle",
  "scenarioId": "工作台根据场景指南推荐出的配方 id",
  "clarifications": [
    {
      "questionZh": "访谈问题",
      "questionEn": "Interview question",
      "answer": "用户回答",
      "skipped": false
    }
  ],
  "repositoryUrl": "可选的仓库或网页地址",
  "materials": [
    {
      "name": "可选文件名",
      "type": "文件 MIME 类型",
      "content": "文本文件内容"
    }
  ],
  "fileNames": ["无法直接读取的文件名，例如 ZIP"],
  "language": "zh-CN | en",
  "currentModel": "继续修改时可选，当前完整系统图 JSON",
  "refinement": "继续修改时可选，用户本次修改要求"
}
```

`diagramType` 和 `scenarioId` 由工作台根据用户描述自动推荐，不要求用户在开始前选择。正式 API 可以接受推荐，也可以根据完整上下文重新判断。

## 返回数据

```json
{
  "title": "系统名称",
  "purpose": "产品目标",
  "insight": "一句话理解",
  "roles": ["角色说明"],
  "flows": ["关键业务链路"],
  "questions": [["问题分类", "需要用户确认的问题"]],
  "nodes": [
    ["id", "节点名称", "简短说明", "actor | service | data | external", "explicit | inferred | question", 10, 20, "详细说明", ["职责"]]
  ],
  "edges": [["起点 id", "终点 id", "关系说明"]]
}
```

其中 `explicit` 表示用户明确提供，`inferred` 表示 Topolyn 推断，`question` 表示仍需确认。横纵坐标使用 0 到 100 的画布百分比。
