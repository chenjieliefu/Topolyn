#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const skillRoot = path.join(repoRoot, 'topolyn');
const outputRoot = path.resolve(process.argv[2] || path.join(repoRoot, 'docs'));
const artifactsRoot = path.join(outputRoot, 'gallery', 'artifacts');
const sourcesRoot = path.join(outputRoot, 'gallery', 'sources');
const localizedArtifactsRoot = path.join(outputRoot, 'gallery', 'localized-artifacts');
const localizedSourcesRoot = path.join(outputRoot, 'gallery', 'localized-sources');
const templatePath = path.join(__dirname, 'gallery-template.html');
const packageJson = JSON.parse(fs.readFileSync(path.join(skillRoot, 'package.json'), 'utf8'));

const CASES = [
  {
    id: 'agent-tool-call',
    type: 'workflow',
    input: 'agent-tool-call.workflow.json',
    output: 'agent-tool-call.workflow.html',
    focus: 'planner',
    view: 'happy-path',
    accent: '#67e8f9',
    featured: true,
    titleEn: 'Agent Tool Call',
    titleZh: '智能体工具调用',
    descriptionEn: 'A policy-aware agent loop with planning, approval, tool execution, exception handling, and observability lanes.',
    descriptionZh: '包含规划、审批、工具执行、异常处理与可观测泳道的策略感知智能体闭环。',
  },
  {
    id: 'deployment-ownership',
    type: 'architecture',
    input: 'production-deployment.architecture.json',
    output: 'production-deployment.architecture.html',
    focus: 'gateway',
    view: 'request-boundary',
    accent: '#38bdf8',
    titleEn: 'Production Deployment Ownership',
    titleZh: '生产部署与归属',
    descriptionEn: 'Regions, private networks, workload owners, state, cross-region replication, audit evidence, and named boundary crossings.',
    descriptionZh: '展示区域、私有网络、工作负载归属、状态、跨区复制、审计证据和明确的边界穿越。',
  },
  {
    id: 'cache-miss',
    type: 'sequence',
    input: 'cache-miss-request.sequence.json',
    output: 'cache-miss.sequence.html',
    focus: 'redis',
    view: 'cache-fallback',
    accent: '#c4b5fd',
    titleEn: 'Cache Miss Request',
    titleZh: '缓存未命中请求',
    descriptionEn: 'A time-ordered request path covering authentication, cache fallback, persistence, return traffic, and async tracing.',
    descriptionZh: '按时间展开鉴权、缓存回退、持久化、返回流量与异步追踪。',
  },
  {
    id: 'delivery-workflow',
    type: 'workflow',
    input: 'release-delivery.workflow.json',
    output: 'release-delivery.workflow.html',
    focus: 'approval',
    view: 'approval-to-production',
    accent: '#34d399',
    titleEn: 'Release Delivery Workflow',
    titleZh: '研发交付流程',
    descriptionEn: 'A change moves through reproducible build, blocking gates, human approval, canary verification, communication, and rollback.',
    descriptionZh: '一次变更依次经过可复现构建、阻断检查、人工审批、金丝雀验证、沟通和回滚。',
  },
  {
    id: 'incident-runbook',
    type: 'workflow',
    input: 'incident-response.workflow.json',
    output: 'incident-response.workflow.html',
    focus: 'triage',
    view: 'mitigate-and-verify',
    accent: '#fb7185',
    titleEn: 'Incident Response Runbook',
    titleZh: '事故处置 Runbook',
    descriptionEn: 'Detection, incident command, mitigation, stakeholder communication, escalation, rollback, and recovery evidence.',
    descriptionZh: '覆盖发现、事故指挥、缓解、干系人沟通、升级、回滚和恢复证据。',
  },
  {
    id: 'product-analytics',
    type: 'dataflow',
    input: 'product-analytics.dataflow.json',
    output: 'product-analytics.dataflow.html',
    focus: 'consent',
    view: 'consent-boundary',
    accent: '#f6c453',
    titleEn: 'Product Analytics',
    titleZh: '产品分析数据流',
    descriptionEn: 'Events move through consent, streaming, PII isolation, warehouse sync, and governed downstream consumers.',
    descriptionZh: '事件依次经过用户同意、流处理、PII 隔离、数仓同步和受治理的下游消费者。',
  },
  {
    id: 'async-roundtrip',
    type: 'sequence',
    input: 'async-job-roundtrip.sequence.json',
    output: 'async-job-roundtrip.sequence.html',
    focus: 'queue',
    view: 'work-and-retry',
    accent: '#a78bfa',
    titleEn: 'Async Job Roundtrip',
    titleZh: '异步任务往返链路',
    descriptionEn: 'A fast acknowledgement leads into durable queueing, background work, retry, final-state storage, webhook, and polling fallback.',
    descriptionZh: '快速确认后进入持久队列、后台处理、重试、终态存储、Webhook 和轮询回退。',
  },
  {
    id: 'event-stream',
    type: 'dataflow',
    input: 'event-stream.dataflow.json',
    output: 'event-stream.dataflow.html',
    focus: 'orders',
    view: 'order-transit',
    accent: '#fbbf24',
    titleEn: 'Order Event-stream Topology',
    titleZh: '订单事件流拓扑',
    descriptionEn: 'Named producers, partitioned topics, consumer groups, idempotent state, dead letters, operator ownership, and controlled replay.',
    descriptionZh: '展示命名生产者、分区 Topic、消费者组、幂等状态、死信、负责人和受控重放。',
  },
  {
    id: 'agent-run',
    type: 'lifecycle',
    input: 'agent-run.lifecycle.json',
    output: 'agent-run.lifecycle.html',
    focus: 'approval',
    view: 'main-lifecycle',
    accent: '#fb7185',
    titleEn: 'Agent Run Lifecycle',
    titleZh: '智能体运行生命周期',
    descriptionEn: 'Planning, execution, review, human approval, retry, cancellation, and terminal outcomes in one state model.',
    descriptionZh: '用一套状态模型表达规划、执行、复核、人工审批、重试、取消和终态。',
  },
  {
    id: 'deployment-lifecycle',
    type: 'lifecycle',
    input: 'deployment-release.lifecycle.json',
    output: 'deployment-release.lifecycle.html',
    focus: 'live',
    view: 'rollback-outcomes',
    accent: '#f472b6',
    titleEn: 'Deployment Release Lifecycle',
    titleZh: '部署发布生命周期',
    descriptionEn: 'The deployment object moves through build, verification, approval, promotion, health pause, rollback, and explicit terminal outcomes.',
    descriptionZh: '部署对象经过构建、验证、审批、晋级、健康暂停、回滚和明确终态。',
  },
  {
    id: 'web-app',
    type: 'architecture',
    input: 'web-app.architecture.json',
    output: 'web-app.architecture.html',
    focus: 'api',
    view: 'request-path',
    accent: '#6ee7b7',
    titleEn: 'Three-tier Web App',
    titleZh: '三层 Web 应用',
    descriptionEn: 'A classic AWS web stack with edge delivery, authentication, API services, cache, persistence, and background work.',
    descriptionZh: '经典 AWS Web 栈：边缘分发、鉴权、API 服务、缓存、持久化与后台任务。',
  },
];

const SHAPES = {
  architecture: ['components', 'connections'],
  workflow: ['nodes', 'edges'],
  sequence: ['participants', 'messages'],
  dataflow: ['nodes', 'flows'],
  lifecycle: ['states', 'transitions'],
};

const TYPE_LABELS = {
  architecture: '架构图',
  workflow: '流程图',
  sequence: '时序图',
  dataflow: '数据流图',
  lifecycle: '生命周期图',
};

// Print-depth type hues shared with the site palette (guide page uses the same map).
const TYPE_ACCENTS = {
  architecture: '#0891b2',
  workflow: '#047857',
  sequence: '#6d28d9',
  dataflow: '#b45309',
  lifecycle: '#be123c',
};

const NODE_LABEL_ZH = Object.freeze({
  'User':'用户','Users':'用户','Customers':'客户','Client':'客户端','Developer':'开发者','On-call':'值班人员',
  'Chat Surface':'对话界面','Final Reply':'最终回复','Agent Planner':'智能体规划器','Tool Router':'工具路由器','Approval Gate':'审批门','Blocked':'已阻塞','Retry Path':'重试路径','Tool Call':'工具调用','External API':'外部 API','Context Store':'上下文存储','Trace Log':'追踪日志',
  'Global Edge':'全球边缘节点','API Gateway':'API 网关','API Pods / AZ-a':'API 容器组 / 可用区 A','API Pods / AZ-b':'API 容器组 / 可用区 B','Redis':'Redis 缓存','PostgreSQL':'PostgreSQL','Postgres':'数据库','Event Bus':'事件总线','Workers':'后台工作器','Worker':'后台工作器','DR Replica':'灾备副本','Audit Archive':'审计归档','Observability':'可观测平台',
  'Web App':'网页应用','API':'接口服务','Auth':'身份认证','Trace':'异步追踪','Commit':'代码提交','Pull Request':'合并请求','Build':'构建','Quality Gates':'质量检查门','Approve':'审批','Deploy':'部署','Verify':'验证','Announce':'发布通知','Stop Release':'停止发布','Rollback':'回滚',
  'SLO Alert':'SLO 告警','Page On-call':'通知值班人员','Triage':'故障分诊','Declare':'宣布事故','Contain':'控制影响','Recover':'恢复服务','Resolve':'关闭事故','Status Update':'状态通报','Escalate':'升级处理',
  'Mobile':'移动端','Edge API':'边缘 API','Consent Gate':'授权同意门','Event Stream':'事件流','PII Vault':'隐私数据保险库','Warehouse':'数据仓库','Feature Store':'特征库','Dashboards':'数据看板','ML Model':'机器学习模型',
  'Jobs API':'任务 API','Queue':'任务队列','Provider':'外部服务商','Job Store':'任务状态库','Notifier':'通知服务',
  'Checkout API':'结算 API','Billing API':'计费 API','Order Validate':'订单校验','Payment Enrich':'支付数据补全','Order State':'订单状态库','Fulfillment':'履约服务','Analytics':'分析平台','Replay Tool':'重放工具',
  'Queued':'已排队','Planning':'规划中','Executing':'执行中','Reviewing':'复核中','Completed':'已完成','Needs Approval':'等待审批','Failed':'失败','Cancelled':'已取消','Expired':'已过期','Building':'构建中','Verifying':'验证中','Ready':'准备就绪','Live':'生产运行中','Rolling Back':'回滚中','Health Paused':'健康检查暂停','Rolled Back':'已回滚',
  'Auth Provider':'认证服务商','CloudFront':'CloudFront 边缘分发','Load Balancer':'负载均衡器','API Server':'API 服务','S3':'S3 静态存储','SQS':'SQS 任务队列',
});

const NODE_SUBLABEL_ZH = Object.freeze({
  'asks for work':'提出任务','thread + files':'对话与文件','answer + changes':'回答与变更','plan next step':'规划下一步','choose capability':'选择执行能力','scope + consent':'范围与授权','wait or reject':'等待或拒绝','revise request':'修改请求','shell / browser / MCP':'终端、浏览器与 MCP','network service':'网络服务','repo + memory':'仓库与记忆','events + output':'事件与输出',
  'web + mobile':'网页端与移动端','CDN + WAF':'内容分发与防火墙','public :443':'公网 443 端口','private subnet':'私有子网','multi-AZ cache':'多可用区缓存','primary / encrypted':'主库与加密存储','private workload':'私有工作负载','immutable objects':'不可变对象','metrics + traces':'指标与链路追踪',
  'browser session':'浏览器会话','React UI':'React 界面','request handler':'请求处理器','JWT verify':'JWT 校验','cache':'缓存','source of truth':'权威数据源','async event':'异步事件',
  'signed change':'已签名变更','reviewed diff':'已复核差异','locked inputs':'锁定输入','test + scan':'测试与扫描','release owner':'发布负责人','canary 10%':'10% 金丝雀发布','smoke + SLO':'冒烟测试与 SLO','status + notes':'状态与说明','gate failed':'检查未通过','last good image':'上一个正常镜像',
  'burn rate':'错误预算消耗率','acknowledge':'确认响应','scope impact':'判断影响范围','assign commander':'指定事故负责人','stop growth':'阻止影响扩大','restore':'恢复服务','SLO + traces':'SLO 与链路追踪','final update':'最终通报','impact + ETA':'影响与预计恢复时间','specialist':'专业支持','last good':'上一个正常版本',
  'browser SDK':'浏览器 SDK','iOS / Android':'iOS 与 Android','collector':'数据采集器','policy filter':'策略过滤','Kafka topic':'Kafka 主题','encrypted':'加密存储','analytics tables':'分析数据表','daily batch':'每日批处理','product metrics':'产品指标','ranking job':'排序任务',
  'mobile app':'移动应用','request edge':'请求入口','durable work':'持久化任务','background':'后台处理','external API':'外部 API','webhook':'回调通知','order producer':'订单事件生产者','payment producer':'支付事件生产者','12 partitions':'12 个分区','8 partitions':'8 个分区','group fulfillment':'履约消费者组','group analytics':'分析消费者组','materialized view':'物化视图','poison events':'异常事件','shipping workflow':'发货流程','streaming facts':'流式事实数据','approved batch':'已审批批次','DLQ owner':'死信队列负责人',
  'request accepted':'请求已受理','build task graph':'构建任务图','tool calls':'执行工具调用','quality gate':'质量检查门','final response':'最终响应','human gate':'人工审批门','missing input':'缺少输入','recoverable error':'可恢复错误','user stopped':'用户停止','timeout':'超时','change accepted':'变更已受理','immutable image':'不可变镜像','tests + policy':'测试与策略检查','promotion pending':'等待晋级','production healthy':'生产环境健康','SLO regression':'SLO 恶化','approval denied':'审批拒绝','rollback failed':'回滚失败','service restored':'服务已恢复',
  'Browser / Mobile':'浏览器与移动端','OAuth 2.0':'OAuth 2.0 认证','CDN':'内容分发网络','HTTPS :443':'HTTPS 443 端口','FastAPI :8000':'FastAPI 8000 端口','cache :6379':'缓存 6379 端口','primary :5432':'主库 5432 端口','static assets':'静态资源','job queue':'任务队列','async jobs':'异步任务','orders.v1':'订单主题 v1','eu-west-1':'欧洲西部区域',
});

// Only the localized gallery-detail copy is translated. Canonical proof copy
// and source data remain English for reproducible validation.
const DETAIL_COPY_ZH = Object.freeze({
  'agent-tool-call': {
    views: [
      { label: '请求到结果', note: '沿成功路径，从用户意图一直查看到最终回复。' },
      { label: '策略与恢复', note: '查看高风险操作在哪里停止、等待授权或退回修改。' },
      { label: '证据与记忆', note: '查看可见答案背后的持久化追踪和上下文路径。' },
    ],
    cards: [
      { title: '渲染规则', items: ['泳道和列决定节点位置', '连线连接到明确的节点锚点', '跨泳道路径采用正交路由', '相邻的短连接不显示标签'] },
      { title: '工作流语义', items: ['审批是一级策略步骤', '授权门在主路径中清晰可见', '外部调用始终位于工具泳道', '追踪写入与主链路分离'] },
      { title: '为什么重要', items: ['这种结构更接近 diagram_type 渲染器', '无需直接修改 SVG 即可编辑图谱', '布局规则可以测试并持续改进', '未来的 IR 可直接复用此结构'] },
    ],
  },
  'deployment-ownership': {
    views: [
      { label: '请求穿过边缘', note: '跟随公网流量进入私有应用网络。' },
      { label: '状态与归属', note: '区分无状态平台工作负载与数据团队负责的状态。' },
      { label: '异步与运维', note: '查看异步任务以及它产生的运维证据。' },
    ],
    cards: [
      { title: '运行归属', items: ['平台团队负责边缘、网关、缓存和事件总线', '应用团队负责 API 容器组和后台工作器', '数据团队负责主状态和灾备状态'] },
      { title: '命名边界', items: ['公网 HTTPS 在托管边缘终止', 'mTLS 穿过边界进入应用网络', '跨区域 WAL 路径明确并经过加密'] },
      { title: '运维证据', items: ['工作器向 SRE 负责的可观测平台发送追踪', '审计证据进入不可变存储', '未知部署位置应明确标记，不能凭空假设'] },
    ],
  },
  'cache-miss': {
    views: [
      { label: '请求与身份', note: '跟随用户请求完成身份验证检查。' },
      { label: '缓存回退', note: '查看缓存未命中后触发的权威数据源查询。' },
      { label: '返回与追踪', note: '区分响应耗时与不阻塞请求的可观测写入。' },
    ],
    cards: [
      { title: '正常路径', items: ['主请求依次经过 Web App、API、数据源并返回响应', '返回消息的视觉权重低于正向调用', '激活条展示各参与方的占用时长'] },
      { title: '策略与回退', items: ['JWT 验证按安全交互着色', '缓存未命中清晰可见但不会压过主路径', '只有缓存回退后才访问数据库'] },
      { title: '异步追踪', items: ['追踪写入使用虚线并保持次要层级', '追踪不会阻塞响应路径', '图中区分用户感知延迟与可观测处理'] },
    ],
  },
  'delivery-workflow': {
    views: [
      { label: '提交到绿色构建', note: '跟随变更经过可复现构建和阻断式质量检查。' },
      { label: '审批与晋级', note: '查看谁授权生产发布，以及如何验证发布成功。' },
      { label: '失败与回滚', note: '查看交付在哪里安全停止或反向恢复。' },
    ],
    cards: [
      { title: '唯一成功路径', items: ['每次变更都先完成评审，再进行可复现构建', '阻断检查全部通过后才能进入人工审批', '冒烟测试与 SLO 验证完成后才算发布成功'] },
      { title: '停止条件', items: ['测试或安全失败会停止晋级', '生产环境健康异常可以反转发布', '事故发生前就明确回滚归属'] },
      { title: '发布证据', items: ['保留审批记录、不可变镜像和检查结果', '验证完成后再发布上线通知', '主路径保持清晰，同时不隐藏失败分支'] },
    ],
  },
  'incident-runbook': {
    views: [
      { label: '发现并建立指挥', note: '跟随事故最初几分钟，从信号到明确负责人。' },
      { label: '缓解并证明恢复', note: '将临时缓解与关闭事故所需的恢复证据分开。' },
      { label: '升级与沟通', note: '查看通知对象、干系人信息以及回滚开始时机。' },
    ],
    cards: [
      { title: '归属优先', items: ['告警被明确负责人接管后才成为正式事故', '扩展缓解措施前先明确严重程度与影响范围', '升级流程会指出当前缺少的专业能力'] },
      { title: '恢复需要证据', items: ['缓解可以降低影响，但不等于已经恢复', 'SLO 和链路追踪必须在固定窗口内持续健康', '最终通报应基于验证，而不是乐观判断'] },
      { title: '沟通契约', items: ['干系人会收到影响、行动和下次更新时间', '回滚作为明确的响应动作持续可见', '每条分支都有负责人和可观察的出口'] },
    ],
  },
  'product-analytics': {
    views: [
      { label: '采集路径', note: '跟随产品事件从客户端进入有序事件流。' },
      { label: '同意与隐私数据', note: '查看策略门和受限身份数据存储。' },
      { label: '治理后的消费者', note: '查看整理后的事实、看板和衍生特征路径。' },
    ],
    cards: [
      { title: '主要数据路径', items: ['事件从左到右经过来源、采集、处理、存储和消费阶段', '即使存在批处理支线，主链路仍保持清晰', '标签使用明确的数据资产名称，而不是泛化的 API 动词'] },
      { title: '敏感边界', items: ['用户同意和 PII 路径按安全流处理', 'PII 进入受限保险库，并与分析数仓隔离', '受限关联清晰可见，但不暗示默认拥有访问权限'] },
      { title: '衍生消费者', items: ['数据看板从数仓读取整理后的事实', '特征向量由分析表批量生成', '消费路径与采集、授权处理保持区分'] },
    ],
  },
  'async-roundtrip': {
    views: [
      { label: '快速受理', note: '任务可靠入队后，API 会立即返回确认。' },
      { label: '后台工作与重试', note: '超时任务重新进入队列，不占用原始请求连接。' },
      { label: '观察最终一致性', note: 'Webhook 是主要路径，轮询仅作为有限回退。' },
    ],
    cards: [
      { title: '快速确认', items: ['任务开始前，调用方先获得持久任务 ID', '受理契约清楚展示队列归属', '原始连接不等待外部服务耗时'] },
      { title: '有限恢复', items: ['超时任务依据重试策略重新进入队列', '通知前先持久化最终状态', '任务状态库始终是权威数据源'] },
      { title: '两种观察路径', items: ['签名 Webhook 会主动通知任务完成', '状态轮询只是回退，不是第二套工作流', '两条路径最终汇聚到同一任务状态'] },
    ],
  },
  'event-stream': {
    views: [
      { label: '订单事件传递', note: '跟随订单从生产者经过有序处理进入履约。' },
      { label: '支付事件传递', note: '跟踪支付事实进入共享物化状态和分析系统。' },
      { label: '失败与重放', note: '查看死信、人工检查和受控重放的归属。' },
    ],
    cards: [
      { title: '传递契约', items: ['每个事件和主题都有明确名称', '分区键保证单个订单内的事件顺序', '消费者组明确展示处理归属'] },
      { title: '状态与投递', items: ['处理器写入幂等的物化视图', '履约与分析消费不同的数据资产', '至少一次投递不应造成重复业务结果'] },
      { title: '失败归属', items: ['异常事件进入保留的死信主题', '值班人员在重放前先检查样本', '重放需要经过控制、分批执行并保留审计记录'] },
    ],
  },
  'agent-run': {
    views: [
      { label: '主要生命周期', note: '跟随任务从受理、规划、执行、复核到完成。' },
      { label: '人工与输入等待', note: '查看任务在哪些非终态位置暂停。' },
      { label: '恢复与终态出口', note: '区分可重试失败、取消和过期。' },
    ],
    cards: [
      { title: '主要路径', items: ['任务从排队到完成共有五个有序阶段', '主要生命周期由一条水平主线承载', '完成本身是阶段，而不是孤立的侧边框'] },
      { title: '人工与输入门', items: ['审批会暂停执行，但不会结束任务', '阻塞状态等待用户补充缺失输入', '等待状态在取消或过期前都不是终态'] },
      { title: '终态与恢复', items: ['重试预算尚未用尽时，失败状态可以返回执行', '取消和过期是生命周期的明确出口', '终态出口不会重新指向执行中的阶段'] },
    ],
  },
  'deployment-lifecycle': {
    views: [
      { label: '晋级主线', note: '跟随部署对象从变更受理进入健康的生产环境。' },
      { label: '审批门', note: '审批会暂停晋级，也可以干净地终止发布。' },
      { label: '回滚结果', note: '区分晋级前失败和上线后的健康恶化。' },
    ],
    cards: [
      { title: '晋级主线', items: ['发布对象依次经过五个有序阶段', '验证与审批保持为两个独立状态', '进入生产运行意味着当前健康状态已经得到证明'] },
      { title: '等待状态', items: ['人工审批暂停时不会占用工作器', '健康恶化会暂停后续放量', '每个等待状态都说明继续执行所需的事件'] },
      { title: '明确结局', items: ['审批拒绝后以取消状态结束', '回滚控制器失败后以失败状态结束', '回滚成功是服务恢复后的终态结果'] },
    ],
  },
  'web-app': {
    views: [
      { label: '主要请求路径', note: '跟随客户请求从边缘进入持久状态。' },
      { label: '身份与缓存', note: '查看请求路径旁边的身份认证和读穿缓存。' },
      { label: '静态与异步任务', note: '查看两条次要路径，同时避免给主请求增加噪声。' },
    ],
    cards: [
      { title: '边缘层', items: ['CloudFront CDN 承接全部流量', 'S3 通过 OAI 提供静态资源'] },
      { title: '应用层', items: ['FastAPI 位于 HTTPS 负载均衡器后方', 'Redis 提供读穿缓存', '工作器从 SQS 获取并处理异步任务'] },
      { title: '安全', items: ['使用 OAuth 2.0、JWT 与 PKCE', 'API 和负载均衡器隔离在安全组内'] },
    ],
  },
});

function localizeGallerySource(source, item) {
  const localized = structuredClone(source);
  const [nodeKey] = SHAPES[item.type];
  const detailCopy = DETAIL_COPY_ZH[item.id];
  localized.meta.locale = 'zh-CN';
  localized.meta.title = item.titleZh;
  if (detailCopy?.views && Array.isArray(localized.meta.views)) {
    localized.meta.views = localized.meta.views.map((view, index) => ({
      ...view,
      ...detailCopy.views[index],
    }));
  }
  if (detailCopy?.cards && Array.isArray(localized.cards)) {
    localized.cards = localized.cards.map((card, index) => ({
      ...card,
      ...detailCopy.cards[index],
    }));
  }
  if (Array.isArray(localized[nodeKey])) {
    localized[nodeKey] = localized[nodeKey].map((node) => {
      const chineseName = NODE_LABEL_ZH[node.label];
      const chineseFunction = node.sublabel ? NODE_SUBLABEL_ZH[node.sublabel] : undefined;
      const fullChineseExplanation = [chineseName, chineseFunction]
        .filter((value, index, values) => value && values.indexOf(value) === index)
        .join(' · ');
      const chineseExplanation = fullChineseExplanation.length <= 9
        ? fullChineseExplanation
        : (chineseName || chineseFunction);

      return {
        ...node,
        // English remains the canonical node name. Chinese is explanatory copy,
        // kept on the secondary line so technical terms are never mistranslated.
        label: node.label,
        ...(chineseExplanation ? { sublabel: chineseExplanation } : {}),
      };
    });
  }
  return localized;
}

function digest(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char]);
}

function addGalleryDetailOverrides(html) {
  const embedFit = `
    <style id="topolyn-gallery-embed-fit">
      html[data-embed="true"],
      html[data-embed="true"] body,
      html[data-embed="true"] .container,
      html[data-embed="true"] .diagram-container { height: 100%; min-height: 0; }
      html[data-embed="true"] .diagram-container {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      html[data-embed="true"] .diagram-container > svg {
        width: 100% !important;
        height: 100% !important;
        max-height: 100% !important;
      }
    </style>`;
  const detailLayout = `
    <style id="topolyn-gallery-detail-layout">
      /* Presentation mode reserves too little space for the toolbar in the
         original viewer. Move the preset badge left so it cannot sit behind
         the theme control. Embed previews keep their existing layout. */
      @media (min-width: 721px) {
        html[data-present="true"]:not([data-embed="true"]) .header {
          padding-right: 29rem;
        }
      }
    </style>`;

  return html
    .replace('</head>', `${embedFit}\n${detailLayout}\n  </head>`);
}

function formatBytes(bytes) {
  return bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`;
}

function renderCard(entry, index) {
  const classes = `showcase-card${entry.featured ? ' is-featured' : ''}`;
  const mode = entry.animation === 'trace' ? `${entry.visualPreset} · 动态追踪` : `${entry.visualPreset} · 静态`;
  const artifactZh = `gallery/localized-artifacts/${entry.output}`;
  const artifactEn = `gallery/artifacts/${entry.output}`;
  const sourceZh = `gallery/localized-sources/${entry.input}`;
  const sourceEn = `gallery/sources/${entry.input}`;
  const focusedArtifactZh = entry.view
    ? `${artifactZh}?theme=light&present=1&play=1#view=${encodeURIComponent(entry.view)}`
    : `${artifactZh}?theme=light#focus=${encodeURIComponent(entry.focus)}`;
  const focusedArtifactEn = entry.view
    ? `${artifactEn}?theme=light&present=1&play=1#view=${encodeURIComponent(entry.view)}`
    : `${artifactEn}?theme=light#focus=${encodeURIComponent(entry.focus)}`;
  const exploreEn = entry.view ? 'Play named chapter ↗' : 'Explore focus ↗';
  const exploreZh = entry.view ? '播放命名章节 ↗' : '探索聚焦路径 ↗';
  const engineeringProof = entry.engineeringProfile
    ? `\n              <div class="engineering-proof" aria-label="工程规则验证"><span>工程规则</span><strong>${esc(entry.engineeringProfile.replaceAll('-', ' ').toUpperCase())} · 通过</strong></div>`
    : '';
  return `          <article class="${classes}" id="proof-${esc(entry.id)}" data-proof-id="${esc(entry.id)}" data-type="${esc(entry.type)}" style="--accent:${esc(TYPE_ACCENTS[entry.type] || entry.accent)}">
            <header class="card-header">
              <div class="card-index">${String(index + 1).padStart(2, '0')}</div>
              <div class="card-title-wrap">
                <div class="card-kicker">${esc(TYPE_LABELS[entry.type])} / ${entry.nodeCount} 个节点${entry.viewCount ? ` / ${entry.viewCount} 个视图 · 可播放` : ''}</div>
                <h3 class="card-title" data-en="${esc(entry.titleEn)}" data-zh="${esc(entry.titleZh)}">${esc(entry.titleZh)}</h3>
              </div>
              <div class="card-mode">真实成品 · ${esc(mode)}</div>
            </header>
            <div class="preview-shell">
              <iframe src="${esc(artifactZh)}?embed=1&amp;theme=light" data-src-zh="${esc(artifactZh)}?embed=1&amp;theme=light" data-src-en="${esc(artifactEn)}?embed=1&amp;theme=light" data-title-zh="${esc(entry.titleZh)} Topolyn 交互预览" data-title-en="${esc(entry.titleEn)} Topolyn interactive preview" title="${esc(entry.titleZh)} Topolyn 交互预览" loading="${entry.featured ? 'eager' : 'lazy'}"></iframe>
            </div>
            <div class="card-body">
              <p class="card-description" data-en="${esc(entry.descriptionEn)}" data-zh="${esc(entry.descriptionZh)}">${esc(entry.descriptionZh)}</p>${engineeringProof}
              <div class="receipt" aria-label="验证结果">
                <div class="receipt-cell"><span class="receipt-label">成品检查</span><span class="receipt-value ok">${entry.checksPassed}/${entry.checkCount} 通过</span></div>
                <div class="receipt-cell"><span class="receipt-label">画面结构</span><span class="receipt-value ${entry.composition.status === 'pass' ? 'ok' : ''}" title="${entry.composition.metrics.properCrossings} 个交叉 · ${entry.composition.metrics.containerBorderRuns} 个边界重合 · ${entry.composition.metrics.microSegmentCount} 个微小线段 · ${entry.composition.metrics.shortInteriorSegmentCount} 个拥挤转角">${esc(entry.composition.profile.toUpperCase())} · ${entry.composition.status === 'pass' ? '通过' : '待检查'}</span></div>
                <div class="receipt-cell"><span class="receipt-label">图谱规模</span><span class="receipt-value">${entry.nodeCount} 节点 · ${entry.edgeCount} 关系</span></div>
                <div class="receipt-cell"><span class="receipt-label">SHA-256</span><span class="receipt-value" title="${esc(entry.artifactSha256)}">${esc(entry.artifactSha256.slice(0, 12))}</span></div>
              </div>
              <div class="card-actions">
                <a class="card-link primary" href="${esc(focusedArtifactZh)}" data-href-zh="${esc(focusedArtifactZh)}" data-href-en="${esc(focusedArtifactEn)}" target="_blank" rel="noopener" data-en="${esc(exploreEn)}" data-zh="${esc(exploreZh)}">${esc(exploreZh)}</a>
                <a class="card-link" href="${esc(artifactZh)}?theme=light" data-href-zh="${esc(artifactZh)}?theme=light" data-href-en="${esc(artifactEn)}?theme=light" target="_blank" rel="noopener" data-en="Full artifact" data-zh="完整成品">完整成品</a>
                <a class="card-link" href="${esc(sourceZh)}" data-href-zh="${esc(sourceZh)}" data-href-en="${esc(sourceEn)}" target="_blank" rel="noopener">JSON IR</a>
                <a class="card-link create-link" href="workspace.html?type=${esc(entry.type)}&amp;source=gallery" data-en="Create this type" data-zh="按此类型开始">按此类型开始</a>
              </div>
            </div>
          </article>`;
}

fs.rmSync(artifactsRoot, { recursive: true, force: true });
fs.rmSync(sourcesRoot, { recursive: true, force: true });
fs.rmSync(localizedArtifactsRoot, { recursive: true, force: true });
fs.rmSync(localizedSourcesRoot, { recursive: true, force: true });
fs.mkdirSync(artifactsRoot, { recursive: true });
fs.mkdirSync(sourcesRoot, { recursive: true });
fs.mkdirSync(localizedArtifactsRoot, { recursive: true });
fs.mkdirSync(localizedSourcesRoot, { recursive: true });

const entries = [];
for (const item of CASES) {
  const inputPath = path.join(skillRoot, 'examples', item.input);
  const sourceBuffer = fs.readFileSync(inputPath);
  const source = JSON.parse(sourceBuffer.toString('utf8'));
  const localizedSource = localizeGallerySource(source, item);
  const localizedSourceBuffer = Buffer.from(`${JSON.stringify(localizedSource, null, 2)}\n`);
  const artifactPath = path.join(artifactsRoot, item.output);
  const sourcePath = path.join(sourcesRoot, item.input);
  const localizedArtifactPath = path.join(localizedArtifactsRoot, item.output);
  const localizedSourcePath = path.join(localizedSourcesRoot, item.input);

  fs.copyFileSync(inputPath, sourcePath);
  fs.writeFileSync(localizedSourcePath, localizedSourceBuffer);
  execFileSync(process.execPath, [
    path.join(skillRoot, 'renderers', item.type, `render-${item.type}.mjs`),
    inputPath,
    artifactPath,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  execFileSync(process.execPath, [
    path.join(skillRoot, 'renderers', item.type, `render-${item.type}.mjs`),
    localizedSourcePath,
    localizedArtifactPath,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  fs.writeFileSync(
    artifactPath,
    addGalleryDetailOverrides(fs.readFileSync(artifactPath, 'utf8')),
  );
  fs.writeFileSync(
    localizedArtifactPath,
    addGalleryDetailOverrides(fs.readFileSync(localizedArtifactPath, 'utf8')),
  );

  const checkOutput = execFileSync(process.execPath, [
    path.join(skillRoot, 'scripts', 'check-render-output.mjs'),
    artifactPath,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const validation = JSON.parse(checkOutput);
  const localizedCheckOutput = execFileSync(process.execPath, [
    path.join(skillRoot, 'scripts', 'check-render-output.mjs'),
    localizedArtifactPath,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const localizedValidation = JSON.parse(localizedCheckOutput);
  const artifactBuffer = fs.readFileSync(artifactPath);
  const localizedArtifactBuffer = fs.readFileSync(localizedArtifactPath);
  const [nodeKey, edgeKey] = SHAPES[item.type];
  const checksPassed = validation.checks.filter((check) => check.ok).length;

  entries.push({
    ...item,
    title: source.meta.title,
    subtitle: source.meta.subtitle || '',
    schemaVersion: source.schema_version,
    visualPreset: source.meta.visual_preset || 'classic',
    animation: source.meta.animation || 'static',
    engineeringProfile: source.meta.engineering_profile || null,
    viewCount: Array.isArray(source.meta.views) ? source.meta.views.length : 0,
    viewIds: Array.isArray(source.meta.views) ? source.meta.views.map((view) => view.id) : [],
    nodeCount: Array.isArray(source[nodeKey]) ? source[nodeKey].length : 0,
    edgeCount: Array.isArray(source[edgeKey]) ? source[edgeKey].length : 0,
    artifactBytes: artifactBuffer.byteLength,
    sourceBytes: sourceBuffer.byteLength,
    artifactSha256: digest(artifactBuffer),
    localizedArtifactSha256: digest(localizedArtifactBuffer),
    localizedSourceSha256: digest(localizedSourceBuffer),
    sourceSha256: digest(sourceBuffer),
    checkCount: validation.checks.length,
    checksPassed,
    checks: validation.checks.map((check) => ({ name: check.name, ok: check.ok })),
    composition: validation.composition,
    localizedChecksPassed: localizedValidation.checks.filter((check) => check.ok).length,
  });
}

const manifest = {
  schemaVersion: 1,
  generator: 'scripts/build-gallery.mjs',
  archifyVersion: packageJson.version,
  entryCount: entries.length,
  checkCount: entries.reduce((sum, entry) => sum + entry.checkCount, 0),
  entries: entries.map((entry) => ({
    id: entry.id,
    type: entry.type,
    title: entry.title,
    subtitle: entry.subtitle,
    input: `gallery/sources/${entry.input}`,
    artifact: `gallery/artifacts/${entry.output}`,
    localizedArtifact: `gallery/localized-artifacts/${entry.output}`,
    localizedInput: `gallery/localized-sources/${entry.input}`,
    focus: entry.focus,
    view: entry.view || null,
    viewCount: entry.viewCount,
    viewIds: entry.viewIds,
    guidedPlayback: entry.viewCount > 0,
    schemaVersion: entry.schemaVersion,
    visualPreset: entry.visualPreset,
    animation: entry.animation,
    engineeringProfile: entry.engineeringProfile,
    nodeCount: entry.nodeCount,
    edgeCount: entry.edgeCount,
    artifactBytes: entry.artifactBytes,
    artifactSha256: entry.artifactSha256,
    localizedArtifactSha256: entry.localizedArtifactSha256,
    localizedSourceSha256: entry.localizedSourceSha256,
    localizedChecksPassed: entry.localizedChecksPassed,
    sourceBytes: entry.sourceBytes,
    sourceSha256: entry.sourceSha256,
    checks: entry.checks,
    composition: entry.composition,
  })),
};

const manifestJson = JSON.stringify(manifest, null, 2);
fs.writeFileSync(path.join(outputRoot, 'gallery', 'manifest.json'), `${manifestJson}\n`);

const replacements = {
  '[[ARCHIFY_VERSION]]': packageJson.version,
  '[[ENTRY_COUNT]]': String(manifest.entryCount),
  '[[CHECK_COUNT]]': String(manifest.checkCount),
  '[[GALLERY_CARDS]]': entries.map(renderCard).join('\n'),
  '[[MANIFEST_JSON]]': manifestJson.replace(/<\/script/gi, '<\\/script'),
};

let html = fs.readFileSync(templatePath, 'utf8');
for (const [placeholder, value] of Object.entries(replacements)) {
  html = html.split(placeholder).join(value);
}
if (/\[\[[A-Z0-9_]+\]\]/.test(html)) {
  throw new Error('Gallery template contains unresolved placeholders');
}
fs.writeFileSync(path.join(outputRoot, 'gallery.html'), html);

console.log(`gallery ${manifest.entryCount} artifacts / ${manifest.checkCount} checks`);
console.log(path.join(outputRoot, 'gallery.html'));
