(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const sourceCopy = {
    explicit: ['描述中明确', '这个模块来自你明确写出的需求。'],
    inferred: ['Topolyn 推断', '这是为了让业务链路闭环而补充的合理推断。'],
    question: ['需要确认', '需求中还没有足够信息，建议确认后再定稿。'],
  };
  const kindCopy = { actor: '用户角色', service: '业务模块', data: '数据与存储', external: '外部服务' };
  const sourceCopyEn = {
    explicit: ['Explicit in the brief', 'This module comes directly from the information you provided.'],
    inferred: ['Inferred by Topolyn', 'This is a reasonable inference added to complete the product loop.'],
    question: ['Needs confirmation', 'There is not enough information yet. Confirm this before finalizing the map.'],
  };
  const kindCopyEn = { actor: 'User role', service: 'Business module', data: 'Data & storage', external: 'External service' };
  const edgeEn = { '使用':'uses','创作':'creates','浏览 / 编辑':'browse / edit','发起购买':'purchase','评论':'review','支付':'payment','读写':'read / write','审核':'review','管理':'manage','选购':'shop','维护':'maintain','查询':'query','下单':'order','锁定库存':'reserve','发货':'fulfill','预约':'book','维护排班':'schedule','查询 / 提交':'query / submit','创建就诊':'create visit','诊疗':'treat','计费':'bill','提问':'ask','鉴权':'authorize','检索':'retrieve','同步':'sync','召回':'recall','证据':'evidence','生成':'generate','回答':'answer','调用':'call' };
  const englishModels = {
    '在线课程平台': { title:'Online learning platform', purpose:'Help teachers publish and sell courses while students purchase, learn, and interact in one governed platform.', insight:'A three-role content marketplace whose core journey is publish → purchase → learn.', roles:['Student: discover, purchase, and learn','Teacher: create courses and review performance','Administrator: review content and govern the platform'], flows:['Teacher publishes → platform reviews → course goes live','Student selects course → pays → receives access','Student learns → reviews → teacher receives feedback'], questions:[['Business model','One-time purchase, membership, or both?'],['Content review','Do courses require administrator approval?'],['Refund policy','When does a watched course become non-refundable?']], nodes:{student:['Student','Buy & learn'],teacher:['Teacher','Content creator'],portal:['Learning portal','Web / Mobile'],course:['Course service','Core domain'],order:['Order service','Transactions'],review:['Engagement service','Reviews & messages'],payment:['Payment provider','External service'],database:['Business database','Persistent data'],admin:['Admin console','Governance']} },
    '跨境电商平台': { title:'Cross-border commerce', purpose:'Connect shoppers, merchants, inventory, payments, and international fulfillment in one transaction platform.', insight:'A commerce and fulfillment system centered on shop → pay → ship → deliver → support.', roles:['Shopper: find, buy, and track products','Merchant: manage catalog, pricing, and stock','Operator: govern risk, service, and exceptions'], flows:['List product → synchronize stock → place order','Create order → risk check → cross-border payment','Warehouse dispatch → international delivery → receipt'], questions:[['Markets','Which countries, currencies, and languages are in scope?'],['Inventory','Owned warehouse, bonded warehouse, or merchant-direct?'],['Tax','Are duties and import taxes included in displayed prices?']], nodes:{buyer:['Shopper','Buy & receive'],merchant:['Merchant','Operate supply'],store:['Storefront','Web / App'],catalog:['Catalog service','Product & pricing'],order:['Order service','Transaction flow'],inventory:['Inventory service','Stock & warehouse'],payment:['Cross-border payment','External service'],logistics:['International logistics','Fulfillment'],data:['Commerce database','Business data']} },
    '宠物医院预约平台': { title:'Pet clinic booking', purpose:'Let pet owners book appointments while doctors manage schedules, records, prescriptions, and billing.', insight:'A clinical service platform centered on book → visit → record → prescribe → pay.', roles:['Pet owner: maintain pet profile and book visits','Doctor: manage schedule, diagnose, and prescribe','Clinic administrator: manage staff, services, and fees'], flows:['View schedule → choose slot → submit booking','Check in → consult → save medical record','Issue prescription → create bill → complete payment'], questions:[['Scope','One clinic or multiple locations?'],['Booking rules','How are cancellation and late arrival handled?'],['Medical data','How long are records kept and who can access them?']], nodes:{owner:['Pet owner','Book & visit'],doctor:['Veterinarian','Clinical care'],app:['Booking portal','Web / Mini app'],schedule:['Scheduling','Core domain'],record:['Records & prescriptions','Clinical data'],billing:['Billing service','Charges'],payment:['Payment provider','External service'],data:['Medical database','Sensitive data']} },
    '企业 AI 知识库': { title:'Enterprise AI knowledge base', purpose:'Help employees find permission-aware company knowledge and receive answers with traceable sources.', insight:'A permission-aware RAG system centered on ingest → index → authorize → retrieve → answer with citations.', roles:['Employee: ask, search, and verify sources','Knowledge administrator: manage sources and answer quality','System administrator: configure models, security, and audit'], flows:['Upload document → parse → build index','Employee asks → authorize → retrieve allowed knowledge','Evidence → AI answer → return citations'], questions:[['Identity','Which SSO or collaboration identity should be used?'],['Model','Public model API or private enterprise model?'],['Freshness','How quickly must changed documents be re-indexed?']], nodes:{employee:['Employee','Ask & search'],admin:['Knowledge admin','Content governance'],portal:['Question portal','Web / Bot'],auth:['Authorization','Identity & access'],retrieval:['Knowledge retrieval','RAG core'],ai:['AI answer service','Model orchestration'],docs:['Document sources','Enterprise material'],index:['Knowledge index','Vector & full text'],model:['Model API','External capability']} },
  };

  const language = () => window.TopolynSite?.language || (document.documentElement.lang.startsWith('en') ? 'en' : 'zh');
  function displayModel() {
    if (language() !== 'en') return state.model;
    const overlay = englishModels[state.model.title];
    if (!overlay) {
      const fallback = structuredClone(state.model);
      fallback.title = 'Generated system map';
      fallback.purpose = 'A structured map generated from the current product description.';
      fallback.insight = 'Topolyn organized the current brief into users, core services, data, and external capabilities.';
      fallback.roles = fallback.nodes.filter(row => row[3] === 'actor').map(row => `${row[1]}: user role`);
      fallback.flows = fallback.edges.slice(0, 4).map(([a,b,label]) => `${a} → ${edgeEn[label] || label} → ${b}`);
      fallback.questions = [['Scope','Which capabilities are required for the first release?'],['Ownership','Who owns each major module?'],['Constraints','What security, cost, or compliance constraints apply?']];
      return fallback;
    }
    const model = structuredClone(state.model);
    Object.assign(model,{title:overlay.title,purpose:overlay.purpose,insight:overlay.insight,roles:overlay.roles,flows:overlay.flows,questions:overlay.questions});
    model.nodes = model.nodes.map(row => { const translated=overlay.nodes[row[0]]; if(!translated)return row; const next=[...row];next[1]=translated[0];next[2]=translated[1];next[7]=`${translated[0]} is part of the ${overlay.title} system.`;next[8]=['Manage its core domain','Expose clear interfaces','Record state changes','Handle exceptions'];return next });
    model.edges = model.edges.map(([a,b,label])=>[a,b,edgeEn[label]||label]);
    return model;
  }

  const templates = {
    course: {
      title: '在线课程平台',
      insight: '这是一个三角色的内容交易平台，核心链路是“发布课程 → 购买 → 学习”。',
      purpose: '让老师能够发布和经营课程，让学生完成购买、学习和互动，管理员负责平台治理。',
      roles: ['学生：发现、购买和学习课程', '老师：创建课程并查看经营数据', '管理员：审核内容、处理异常和维护平台'],
      flows: ['老师发布课程 → 平台审核 → 课程上架', '学生选课 → 创建订单 → 支付 → 获得学习权限', '学习完成 → 评论课程 → 老师收到反馈'],
      questions: [
        ['商业模式', '课程是单次购买、会员订阅，还是两种方式都支持？'],
        ['内容审核', '课程发布后直接上架，还是必须由管理员审核？'],
        ['退款规则', '观看到什么程度后不能退款？'],
      ],
      nodes: [
        ['student','学生','购买与学习','actor','explicit',6,18,'浏览课程、购买并完成学习。',['注册与登录','搜索课程','观看课程','评分评论']],
        ['teacher','老师','内容创作者','actor','explicit',6,61,'创建和管理课程内容。',['创建课程','上传内容','查看学员','回复评论']],
        ['portal','学习门户','Web / Mobile','service','inferred',28,38,'承载学生和老师的主要操作界面。',['身份识别','页面导航','内容播放','状态反馈']],
        ['course','课程服务','核心业务','service','explicit',51,14,'管理课程、章节和发布状态。',['课程编辑','章节管理','上下架','可见性控制']],
        ['order','订单服务','交易核心','service','inferred',51,39,'连接课程购买与支付结果。',['创建订单','价格计算','退款状态','权益发放']],
        ['review','互动服务','评论与通知','service','explicit',51,66,'承载课程评论和站内消息。',['发表评论','回复互动','消息通知','内容举报']],
        ['payment','支付平台','第三方服务','external','explicit',76,26,'完成收款、退款和支付结果通知。',['支付下单','支付回调','退款','对账']],
        ['database','业务数据库','持久化数据','data','inferred',76,58,'保存用户、课程、订单与互动数据。',['数据持久化','一致性约束','查询索引','审计记录']],
        ['admin','管理后台','治理与审核','service','explicit',76,78,'供管理员审核内容和处理平台异常。',['课程审核','用户管理','举报处理','经营数据']],
      ],
      edges: [['student','portal','使用'],['teacher','portal','创作'],['portal','course','浏览 / 编辑'],['portal','order','发起购买'],['portal','review','评论'],['order','payment','支付'],['course','database','读写'],['order','database','读写'],['review','database','读写'],['admin','course','审核'],['admin','database','管理']],
    },
    commerce: {
      title: '跨境电商平台', insight: '这是一个连接消费者、商家与履约体系的交易平台，主链路是“选购 → 支付 → 出库 → 跨境配送 → 售后”。', purpose: '让消费者跨境购买商品，同时让商家、仓库和物流协同完成履约。',
      roles: ['消费者：搜索商品、下单并跟踪物流','商家：维护商品、价格和库存','运营人员：处理审核、风控与售后'],
      flows: ['商品上架 → 库存同步 → 用户下单','创建订单 → 风控检查 → 跨境支付','仓库出库 → 物流配送 → 用户签收'],
      questions: [['销售范围','首期支持哪些国家、币种和语言？'],['库存模式','使用自营仓、保税仓还是商家直发？'],['税费计算','商品价格是否包含关税和进口税？']],
      nodes: [
        ['buyer','消费者','购买与收货','actor','explicit',5,18,'浏览、购买并接收跨境商品。',['搜索商品','创建订单','跟踪物流','申请售后']],['merchant','商家','商品经营','actor','inferred',5,64,'维护商品与供给。',['商品上架','价格管理','库存管理','处理售后']],['store','商城前台','Web / App','service','inferred',28,39,'承载消费者购物体验。',['商品展示','购物车','结算','订单中心']],['catalog','商品中心','商品与定价','service','explicit',51,12,'统一管理商品、类目和价格。',['商品资料','多币种价格','上下架','类目管理']],['order','订单中心','交易编排','service','explicit',51,38,'编排下单、支付和履约状态。',['订单创建','优惠计算','状态流转','售后入口']],['inventory','库存中心','库存与仓储','service','explicit',51,66,'管理可售库存和仓库出入库。',['库存锁定','库存释放','仓库路由','出库任务']],['payment','跨境支付','第三方服务','external','explicit',76,22,'处理多币种支付、退款和结算。',['收款','换汇','退款','商家结算']],['logistics','国际物流','履约服务','external','explicit',76,51,'承接报关、运输和轨迹回传。',['物流下单','报关信息','轨迹同步','签收确认']],['data','交易数据库','业务数据','data','inferred',76,76,'保存商品、订单、库存和履约记录。',['持久化','事务一致性','查询索引','审计']],
      ], edges:[['buyer','store','选购'],['merchant','catalog','维护'],['store','catalog','查询'],['store','order','下单'],['order','payment','支付'],['order','inventory','锁定库存'],['inventory','logistics','发货'],['catalog','data','读写'],['order','data','读写'],['inventory','data','读写']],
    },
    pet: {
      title:'宠物医院预约平台', insight:'这是一个连接宠物主人、医生与医院运营的医疗服务平台，核心链路是“预约 → 就诊 → 病历 → 处方 → 支付”。', purpose:'让宠物主人便捷预约就诊，让医生统一管理排班、病历和处方。',
      roles:['宠物主人：维护宠物档案并预约就诊','医生：管理排班、接诊并开具处方','医院管理员：维护科室、人员与收费规则'], flows:['查看医生排班 → 选择时段 → 提交预约','到院签到 → 医生接诊 → 保存病历','开具处方 → 费用结算 → 支付完成'], questions:[['服务范围','是否支持多家医院或连锁门店？'],['预约规则','取消预约和迟到如何处理？'],['医疗数据','病历需要保留多久，谁可以查看？']],
      nodes:[['owner','宠物主人','预约与就诊','actor','explicit',5,18,'为宠物预约、就诊和支付。',['宠物档案','在线预约','就诊记录','费用支付']],['doctor','宠物医生','医疗服务','actor','explicit',5,64,'提供诊疗服务并维护医疗记录。',['排班管理','接诊','病历记录','开具处方']],['app','预约前台','Web / 小程序','service','inferred',28,40,'承载预约与就诊信息查询。',['医生查询','时段选择','签到提醒','账单查询']],['schedule','排班预约','核心业务','service','explicit',51,15,'管理医生可约时段和预约状态。',['排班','号源锁定','取消改期','到诊状态']],['record','病历处方','医疗数据','service','explicit',51,44,'管理就诊过程、诊断和处方。',['病历录入','诊断记录','处方开具','历史查询']],['billing','收费服务','费用结算','service','explicit',51,70,'生成账单并协调支付。',['项目计价','账单生成','退款','发票']],['payment','支付平台','第三方服务','external','explicit',77,30,'完成支付与退款。',['支付','退款','回调','对账']],['data','医疗数据库','敏感数据','data','inferred',77,62,'保存宠物档案、病历和预约记录。',['数据加密','权限控制','审计记录','备份']],], edges:[['owner','app','预约'],['doctor','schedule','维护排班'],['app','schedule','查询 / 提交'],['schedule','record','创建就诊'],['doctor','record','诊疗'],['record','billing','计费'],['billing','payment','支付'],['schedule','data','读写'],['record','data','读写']],
    },
    knowledge: {
      title:'企业 AI 知识库', insight:'这是一个带权限边界和来源追溯的企业问答系统，核心链路是“文档接入 → 索引 → 权限过滤 → AI 回答 → 引用来源”。', purpose:'让员工在权限允许的范围内快速找到公司知识，并获得可以追溯来源的回答。', roles:['员工：提问、搜索并验证答案来源','知识管理员：维护文档、权限和内容质量','系统管理员：配置模型、安全和审计策略'], flows:['文档上传 → 解析切分 → 建立向量索引','员工提问 → 身份鉴权 → 权限过滤 → 检索','检索结果 → AI 生成回答 → 返回来源引用'], questions:[['身份系统','接入企业微信、钉钉、飞书还是公司 SSO？'],['模型选择','使用公有云模型还是企业私有模型？'],['内容更新','文档变化后多长时间必须完成重建索引？']],
      nodes:[['employee','企业员工','提问与搜索','actor','explicit',5,20,'查找公司知识并验证答案。',['自然语言提问','关键词搜索','查看引用','反馈答案']],['admin','知识管理员','内容治理','actor','inferred',5,65,'管理知识来源和问答质量。',['文档管理','权限配置','质量评估','失效内容清理']],['portal','问答门户','Web / Bot','service','inferred',28,41,'提供统一的搜索和问答入口。',['登录','会话','搜索','答案反馈']],['auth','权限服务','身份与授权','service','explicit',51,12,'确保用户只能访问有权限的知识。',['身份认证','组织同步','文档权限','访问审计']],['retrieval','知识检索','RAG 核心','service','explicit',51,40,'从企业知识中找到与问题相关的片段。',['内容解析','向量检索','关键词召回','结果排序']],['ai','AI 回答服务','模型编排','service','explicit',51,69,'基于检索证据组织回答并标注来源。',['提示编排','答案生成','引用绑定','安全过滤']],['docs','文档源','企业材料','external','explicit',77,20,'提供制度、项目和业务材料。',['文档同步','版本检测','元数据','权限映射']],['index','知识索引','向量与全文索引','data','inferred',77,49,'保存可检索的知识片段和向量。',['切片存储','向量索引','全文索引','增量更新']],['model','大模型 API','外部能力','external','inferred',77,76,'提供理解和生成能力。',['文本生成','上下文理解','用量控制','失败降级']],], edges:[['employee','portal','提问'],['admin','docs','维护'],['portal','auth','鉴权'],['portal','retrieval','检索'],['docs','index','同步'],['retrieval','index','召回'],['retrieval','ai','证据'],['ai','model','生成'],['ai','portal','回答']],
    },
  };

  const state = {
    model: structuredClone(templates.course), zoom: 1, selected: null, busy: false,
    type: 'auto', phase: 'idea', originalIdea: '', recommendation: null,
    clarifications: [], questions: [], questionIndex: 0, recordId: '',
  };
  const HISTORY_KEY='topolyn-history-v1';
  const WORKSPACE_KEY='topolyn-workspace';
  const MAX_HISTORY_RECORDS=30;
  const isLocalSite = ['127.0.0.1','localhost'].includes(location.hostname);
  const apiEndpoint = () => window.TOPOLYN_API_ENDPOINT || document.querySelector('meta[name="topolyn-api-endpoint"]')?.content || (isLocalSite ? '/api/generate' : '');

  function readHistory() {
    try {
      const records=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');
      return Array.isArray(records)?records.filter(record=>record?.id&&record?.model?.nodes&&record?.model?.edges):[];
    } catch { return [] }
  }

  function writeHistory(records) {
    try { localStorage.setItem(HISTORY_KEY,JSON.stringify(records.slice(0,MAX_HISTORY_RECORDS))) }
    catch { toast(language()==='en'?'Browser storage is full':'浏览器存储空间不足') }
  }

  function recordIdentifier() {
    return globalThis.crypto?.randomUUID?.()||`map-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function historyTime(timestamp) {
    const date=new Date(timestamp);if(Number.isNaN(date.getTime()))return '';
    const today=new Date(),sameDay=date.toDateString()===today.toDateString();
    if(sameDay)return new Intl.DateTimeFormat(language()==='en'?'en':'zh-CN',{hour:'2-digit',minute:'2-digit'}).format(date);
    return new Intl.DateTimeFormat(language()==='en'?'en':'zh-CN',{month:'short',day:'numeric'}).format(date);
  }

  function historyRecordTitle(record) {
    const title=String(record.model?.title||record.prompt||'Untitled map').trim();
    return language()==='en'?(englishModels[title]?.title||title):title;
  }

  function renderHistoryList() {
    const list=$('#history-list'),empty=$('#history-empty');if(!list||!empty)return;
    const records=readHistory();list.replaceChildren();empty.hidden=records.length>0;
    records.forEach(record=>{
      const button=el('button','history-item');button.type='button';button.dataset.recordId=record.id;button.setAttribute('aria-current',String(record.id===state.recordId));
      button.append(el('strong','',historyRecordTitle(record)),el('span','',historyTime(record.updatedAt||record.createdAt)));
      button.addEventListener('click',()=>openHistoryRecord(record.id));list.append(button);
    });
  }

  function saveActiveWorkspace() {
    if(state.phase!=='generated')return;
    try {localStorage.setItem(WORKSPACE_KEY,JSON.stringify({recordId:state.recordId,model:state.model,prompt:state.originalIdea,type:state.type,phase:state.phase,clarifications:state.clarifications,scenarioId:state.recommendation?.id||''}))} catch {}
  }

  function saveHistoryRecord() {
    if(state.phase!=='generated'||!state.model?.nodes||!state.model?.edges)return;
    const records=readHistory(),now=new Date().toISOString();
    if(!state.recordId)state.recordId=recordIdentifier();
    const existing=records.find(record=>record.id===state.recordId);
    const record={id:state.recordId,model:structuredClone(state.model),prompt:state.originalIdea,type:state.type,clarifications:structuredClone(state.clarifications),scenarioId:state.recommendation?.id||existing?.scenarioId||'',createdAt:existing?.createdAt||now,updatedAt:now};
    writeHistory([record,...records.filter(item=>item.id!==record.id)]);saveActiveWorkspace();renderHistoryList();
  }

  function setHistoryOpen(open) {
    $('#history-sidebar')?.classList.toggle('is-open',open);const backdrop=$('#history-backdrop');if(backdrop)backdrop.hidden=!open;
    $('#history-toggle')?.setAttribute('aria-expanded',String(open));
  }

  function openHistoryRecord(recordId) {
    const record=readHistory().find(item=>item.id===recordId);if(!record)return;
    state.recordId=record.id;state.model=structuredClone(record.model);state.originalIdea=record.prompt||'';state.type=record.type||'auto';state.phase='generated';state.zoom=1;state.selected=null;state.clarifications=structuredClone(record.clarifications||[]);state.questions=[];state.questionIndex=0;
    const recipe=(window.TopolynScenarios||[]).find(item=>item.id===record.scenarioId);state.recommendation=recipe||null;
    $('#conversation-feed').replaceChildren();$('#conversation-actions').replaceChildren();$('#conversation-actions').hidden=true;
    if(state.originalIdea)appendChatMessage('user',state.originalIdea,state.originalIdea);
    appendChatMessage('assistant',`已打开历史图「${state.model.title}」。你可以继续修改，它会更新在同一条记录里。`,`Opened “${displayModel().title}”. You can keep refining it and the same history item will update.`);
    $('.welcome-message').hidden=true;$('.welcome-examples').hidden=true;$('#workspace').classList.remove('is-conversation');$('#workspace').classList.add('is-generated');
    $$('#diagram-type button').forEach(button=>button.classList.toggle('selected',button.dataset.type===state.type));renderModel(false);saveActiveWorkspace();renderHistoryList();setComposerPhase();setHistoryOpen(false);
  }

  function startNewMap() {
    localStorage.removeItem(WORKSPACE_KEY);state.model=structuredClone(templates.course);state.zoom=1;state.recordId='';resetConversation();renderHistoryList();setHistoryOpen(false);toast(language()==='en'?'Describe your new project':'请描述你的新项目');
  }

  function setEngineStatus(zhTitle,enTitle,zhCopy,enCopy) {
    const title=$('#engine-status'),copy=$('#engine-copy');if(!title||!copy)return;
    title.dataset.zh=zhTitle;title.dataset.en=enTitle;copy.dataset.zh=zhCopy;copy.dataset.en=enCopy;
    title.textContent=language()==='en'?enTitle:zhTitle;copy.textContent=language()==='en'?enCopy:zhCopy;
  }

  async function updateApiStatus() {
    if(!apiEndpoint()){
      setEngineStatus('浏览器演示模式','Browser demo mode','当前站点没有配置生成服务，将使用内置示例完成体验。','No generation service is configured, so built-in examples will be used.');return;
    }
    try {
      const response=await fetch('/api/status',{headers:{Accept:'application/json'}});const status=await response.json();
      if(response.ok&&status.configured)setEngineStatus('DeepSeek 已连接','DeepSeek connected',`真实生成已启用 · ${status.model}`,`Live generation enabled · ${status.model}`);
      else setEngineStatus('AI 服务尚未配置','AI service not configured','请在本机配置 DeepSeek 密钥后重新启动网站。','Configure the DeepSeek key locally, then restart the site.');
    } catch {
      setEngineStatus('本地服务未连接','Local service unavailable','请通过“一键启动”文件打开网站。','Open the site with the one-click launcher.');
    }
  }

  function chooseTemplate(text) {
    if (/宠物|医院|医生|处方|病历|pet|clinic|doctor|prescription|medical/i.test(text)) return 'pet';
    if (/电商|商品|订单|库存|物流|跨境|商城|commerce|catalog|order|inventory|logistics|shop/i.test(text)) return 'commerce';
    if (/知识库|文档|AI|问答|权限|RAG|knowledge|document|permission|question answering/i.test(text)) return 'knowledge';
    return 'course';
  }

  const scenarioTypeNames = {
    zh:{architecture:'架构图',workflow:'流程图',sequence:'时序图',dataflow:'数据流图',lifecycle:'生命周期图'},
    en:{architecture:'architecture map',workflow:'workflow',sequence:'sequence diagram',dataflow:'data-flow map',lifecycle:'lifecycle map'},
  };

  const followUpQuestions = {
    architecture:{
      zh:[['主要用户','第一版主要给哪些人使用？其中谁最重要？'],['系统边界','哪些能力必须由系统自己完成，哪些可以交给外部服务？']],
      en:[['Primary users','Who will use the first version, and who matters most?'],['System boundary','Which capabilities must the product own, and which can be delegated to external services?']],
    },
    workflow:{
      zh:[['流程起点','这条流程由什么事件开始，谁负责发起？'],['完成标准','流程成功结束时必须得到什么结果？失败时应该怎样处理？']],
      en:[['Starting point','What event starts this workflow, and who initiates it?'],['Completion criteria','What must exist when the workflow succeeds, and what should happen on failure?']],
    },
    sequence:{
      zh:[['参与方','这次交互里必须出现哪些用户、系统或外部服务？'],['时序约束','哪些步骤必须同步完成，哪些步骤可以异步或稍后处理？']],
      en:[['Participants','Which users, systems, or external services must take part?'],['Timing constraints','Which steps must be synchronous, and which may happen asynchronously or later?']],
    },
    dataflow:{
      zh:[['数据来源','核心数据从哪里产生，最终要流向哪些系统或人员？'],['敏感边界','哪些数据涉及隐私、权限或合规要求？']],
      en:[['Data sources','Where does the core data originate, and which systems or people receive it?'],['Sensitive boundaries','Which data carries privacy, permission, or compliance requirements?']],
    },
    lifecycle:{
      zh:[['核心对象','这套生命周期描述的是哪一个核心对象？'],['终态出口','它有哪些成功、失败、取消或过期状态？']],
      en:[['Core object','Which core object does this lifecycle describe?'],['End states','Which success, failure, cancellation, or expiry states can it reach?']],
    },
  };

  function recommendScenario(text) {
    const recipes=window.TopolynScenarios||[];
    if(!recipes.length)return null;
    const normalized=String(text||'').normalize('NFKC').toLowerCase();
    const ranked=recipes.map((recipe,index)=>({recipe,index,score:recipe.signals.reduce((sum,[signal,weight])=>sum+(normalized.includes(String(signal).toLowerCase())?weight:0),0)})).sort((a,b)=>b.score-a.score||a.index-b.index);
    return ranked[0].score>0?ranked[0].recipe:(recipes.find(recipe=>recipe.id==='system-boundaries')||recipes[0]);
  }

  function localizedScenario(recipe,lang=language()) {
    return recipe?.[lang==='en'?'en':'zh'];
  }

  function localizedNode(tag,className,zh,en) {
    const node=el(tag,className,language()==='en'?en:zh);node.dataset.zh=zh;node.dataset.en=en;return node;
  }

  function appendChatMessage(role,zh,en=zh) {
    const article=el('article',`chat-message ${role}`);
    if(role==='assistant')article.append(el('span','chat-avatar','✦'));
    article.append(localizedNode('div','chat-bubble',zh,en));
    $('#conversation-feed').append(article);
    $('#chat-thread').scrollTop=$('#chat-thread').scrollHeight;
    return article;
  }

  function setComposerPhase() {
    const input=$('#system-prompt'),label=$('#generate-button span');
    const copy=state.phase==='idea'
      ?{zh:'描述你的想法或场景……',en:'Describe your idea or scenario…',buttonZh:'发送',buttonEn:'Send'}
      :state.phase==='clarify'
        ?{zh:'回答上面的问题，或补充你已经确定的信息……',en:'Answer the question above, or add what you already know…',buttonZh:'继续',buttonEn:'Continue'}
        :state.phase==='review'
          ?{zh:'还想补充什么？补充后我会更新上面的需求摘要……',en:'Anything else to add? I will update the brief above…',buttonZh:'补充',buttonEn:'Add'}
          :{zh:'继续修改，例如：增加会员系统……',en:'Keep refining, e.g. add membership…',buttonZh:'发送',buttonEn:'Send'};
    input.dataset.placeholderZh=copy.zh;input.dataset.placeholderEn=copy.en;input.placeholder=language()==='en'?copy.en:copy.zh;
    label.dataset.zh=copy.buttonZh;label.dataset.en=copy.buttonEn;label.textContent=language()==='en'?copy.buttonEn:copy.buttonZh;
  }

  function buildClarifyingQuestions(recipe) {
    const extras=followUpQuestions[recipe.type]||followUpQuestions.architecture;
    return [{zh:['场景边界',recipe.zh.question],en:['Scenario boundary',recipe.en.question]},...extras.zh.map((question,index)=>({zh:question,en:extras.en[index]}))];
  }

  function renderClarificationQuestion() {
    const current=state.questions[state.questionIndex];if(!current){showRequirementReview();return}
    const previous=$('#active-clarification-card');if(previous)previous.remove();
    const card=el('article','clarify-card');card.id='active-clarification-card';
    card.append(localizedNode('span','question-progress',`问题 ${state.questionIndex+1} / ${state.questions.length} · ${current.zh[0]}`,`Question ${state.questionIndex+1} / ${state.questions.length} · ${current.en[0]}`),localizedNode('h3','',current.zh[1],current.en[1]),localizedNode('p','',`直接回答即可；暂时不确定的内容也可以跳过，稍后会进入待确认清单。`,`Answer directly, or skip anything uncertain so it becomes an open question.`));
    $('#conversation-feed').append(card);
    const actions=$('#conversation-actions');actions.replaceChildren();
    const answer=localizedNode('button','',`回答这个问题`,`Answer this question`);answer.type='button';answer.addEventListener('click',()=>$('#system-prompt').focus());
    const skip=localizedNode('button','',`暂时跳过`,`Skip for now`);skip.type='button';skip.addEventListener('click',()=>recordClarification('',true));
    const review=localizedNode('button','primary',`整理当前信息`,`Review what we have`);review.type='button';review.addEventListener('click',showRequirementReview);
    actions.append(answer,skip,review);actions.hidden=false;setComposerPhase();$('#chat-thread').scrollTop=$('#chat-thread').scrollHeight;
  }

  function recordClarification(answer,skipped=false) {
    const question=state.questions[state.questionIndex];if(!question)return;
    state.clarifications.push({questionZh:question.zh[1],questionEn:question.en[1],answer,skipped});
    if(skipped)appendChatMessage('assistant','已放入待确认清单，我们继续下一个问题。','Added to the open-question list. Let us continue.');
    state.questionIndex+=1;renderClarificationQuestion();
  }

  function showRequirementReview() {
    state.phase='review';$('#active-clarification-card')?.remove();$('#requirement-review-card')?.remove();
    const card=el('article','review-card');card.id='requirement-review-card';
    card.append(localizedNode('span','review-eyebrow','生成前确认','Review before generation'),localizedNode('h3','',`我目前这样理解你的想法`,`Here is how I understand your idea`),localizedNode('p','review-idea',state.originalIdea,state.originalIdea));
    const list=el('dl','review-list');
    const type=state.recommendation?.type||state.type;
    const typeRow=document.createDocumentFragment();typeRow.append(localizedNode('dt','',`推荐图形`,`Recommended map`),localizedNode('dd','',scenarioTypeNames.zh[type]||type,scenarioTypeNames.en[type]||type));list.append(typeRow);
    state.clarifications.forEach(item=>{const dt=localizedNode('dt','',item.questionZh,item.questionEn);const dd=item.skipped?localizedNode('dd','is-open','待确认','Open'):localizedNode('dd','',item.answer,item.answer);list.append(dt,dd)});
    card.append(list,localizedNode('p','review-note','未确定的信息会保留为图中的待确认问题，不会被当成事实。','Unresolved details will remain open questions instead of being treated as facts.'));$('#conversation-feed').append(card);
    const actions=$('#conversation-actions');actions.replaceChildren();
    const add=localizedNode('button','','继续补充','Add more details');add.type='button';add.addEventListener('click',()=>$('#system-prompt').focus());
    const confirm=localizedNode('button','primary','确认并生成','Confirm and generate');confirm.type='button';confirm.addEventListener('click',generateFirstDraft);actions.append(add,confirm);actions.hidden=false;setComposerPhase();$('#chat-thread').scrollTop=$('#chat-thread').scrollHeight;
  }

  function showScenarioRecommendation(text,preferredId='') {
    const detected=recommendScenario(text);const recipes=window.TopolynScenarios||[];
    const preferred=recipes.find(item=>item.id===preferredId);const recipe=preferred||detected;if(!recipe)return;
    state.recommendation=recipe;state.type=recipe.type;state.phase='clarify';state.questions=buildClarifyingQuestions(recipe);state.questionIndex=0;state.clarifications=[];
    const zh=recipe.zh,en=recipe.en,card=el('article','scenario-card');
    const header=el('header');header.append(localizedNode('span','',preferred?`已选择场景`:`推荐表达方式`,preferred?`Selected scenario`:`Recommended visual form`),localizedNode('em','',scenarioTypeNames.zh[recipe.type]||recipe.type,scenarioTypeNames.en[recipe.type]||recipe.type));
    card.append(header,localizedNode('h3','',zh.title,en.title),localizedNode('p','',zh.summary,en.summary));
    const list=el('ul');zh.include.forEach((item,index)=>list.append(localizedNode('li','',item,en.include[index]||item)));card.append(list);$('#conversation-feed').append(card);
    $$('#diagram-type button').forEach(button=>button.classList.toggle('selected',button.dataset.type===state.type));
    renderClarificationQuestion();
  }

  function startLinkedScenario(scenarioId) {
    const recipe=(window.TopolynScenarios||[]).find(item=>item.id===scenarioId);if(!recipe)return false;
    const zh=recipe.zh,en=recipe.en;
    state.originalIdea=zh.prompt||zh.summary||zh.title;
    $('.welcome-message').hidden=true;$('.welcome-examples').hidden=true;
    appendChatMessage('assistant',`你选择了「${zh.title}」。我已经把这个场景带入工作台，接下来会按这个方向帮你梳理。`,`You selected “${en.title}”. I have carried this scenario into the workspace and will use it as the active lens.`);
    showScenarioRecommendation(state.originalIdea,scenarioId);
    return true;
  }

  function resetConversation() {
    state.phase='idea';state.originalIdea='';state.recommendation=null;state.type='auto';state.clarifications=[];state.questions=[];state.questionIndex=0;state.recordId='';state.selected=null;
    $('#conversation-feed').replaceChildren();$('#conversation-actions').replaceChildren();$('#conversation-actions').hidden=true;$('#system-prompt').value='';$('#prompt-count').textContent='0';
    $('.welcome-message').hidden=false;$('.welcome-examples').hidden=false;
    $('#workspace').classList.add('is-conversation');$('#workspace').classList.remove('is-generated');setComposerPhase();$('#system-prompt').focus();
  }

  function genericModel(text) {
    const topic = text.replace(/[，。,.！!？?].*/, '').slice(0,18) || '新产品';
    const base = structuredClone(templates.course);
    base.title = topic;
    base.purpose = text;
    base.insight = 'Topolyn 已先按“用户入口 → 核心业务 → 数据与外部能力”的通用结构完成第一版梳理。';
    base.nodes[0][1] = '目标用户'; base.nodes[1][1] = '运营人员'; base.nodes[3][1] = '核心业务'; base.nodes[4][1] = '业务流程';
    return base;
  }

  async function collectInput(description='',extras={}) {
    const files = [...$('#material-files').files];
    const materials = await Promise.all(files.filter(file => file.size < 500000 && !file.name.endsWith('.zip')).map(async file => ({ name:file.name, type:file.type, content:await file.text() })));
    return { description:description||$('#system-prompt').value.trim(), diagramType:state.type, scenarioId:state.recommendation?.id||'', clarifications:structuredClone(state.clarifications), repositoryUrl:$('#repo-url').value.trim(), materials, fileNames:files.map(file => file.name), language:language()==='en'?'en':'zh-CN', ...extras };
  }

  async function generateArchitecture(input) {
    if (apiEndpoint()) {
      const response = await fetch(apiEndpoint(), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(input) });
      const model = await response.json().catch(()=>({}));
      const canUseDemo=response.status===503&&/尚未配置|not configured/i.test(model.error||'');
      if (!response.ok&&!canUseDemo) throw new Error(model.error||`API 返回 ${response.status}`);
      if(response.ok){if (!Array.isArray(model.nodes) || !Array.isArray(model.edges)) throw new Error('API 返回的数据格式不正确');return model}
    }
    const key = chooseTemplate(`${input.description} ${input.fileNames.join(' ')}`);
    if (key === 'course' && !/课程|教育|老师|学生|学习|course|learning|teacher|student|education/i.test(input.description)) return genericModel(input.description);
    return structuredClone(templates[key]);
  }

  function nodeObject(row) {
    const [id,label,meta,kind,source,x,y,description,responsibilities] = row;
    return { id,label,meta,kind,source,x,y,description,responsibilities };
  }

  function renderGraph() {
    const layer = $('#node-layer');
    layer.replaceChildren();
    displayModel().nodes.map(nodeObject).forEach(node => {
      const button = el('button', `diagram-node${state.selected === node.id ? ' selected' : ''}`);
      button.type = 'button'; button.dataset.id = node.id; button.dataset.kind = node.kind;
      button.style.left = `${node.x}%`; button.style.top = `${node.y}%`;
      const head = el('div','node-header');
      head.append(el('span','node-symbol',node.label.slice(0,1)));
      const copy = el('span','node-copy'); copy.append(el('strong','',node.label),el('span','',node.meta)); head.append(copy);
      button.append(head,el('i',`source-flag ${node.source}`));
      button.addEventListener('click',() => selectNode(node.id)); layer.append(button);
    });
    requestAnimationFrame(renderEdges);
    $('#graph-surface').style.transform = `translate(-50%,-50%) scale(${state.zoom})`;
    $('#zoom-label').textContent = `${Math.round(state.zoom*100)}%`;
  }

  function renderEdges() {
    const svg = $('#edge-layer'); svg.replaceChildren();
    const surfaceRect = $('#graph-surface').getBoundingClientRect();
    const scale = state.zoom || 1;
    const points = new Map();
    $$('.diagram-node').forEach(node => { const r=node.getBoundingClientRect(); points.set(node.dataset.id,{x:(r.left-surfaceRect.left+r.width/2)/scale,y:(r.top-surfaceRect.top+r.height/2)/scale,w:r.width/scale,h:r.height/scale}); });
    const NS='http://www.w3.org/2000/svg';
    displayModel().edges.forEach(([from,to,label]) => {
      const a=points.get(from),b=points.get(to); if(!a||!b)return;
      const dx=b.x-a.x, direction=Math.sign(dx)||1, x1=a.x+direction*a.w/2, x2=b.x-direction*b.w/2, bend=Math.max(28,Math.abs(x2-x1)*.46);
      const path=document.createElementNS(NS,'path'); path.setAttribute('class','graph-edge'); path.setAttribute('d',`M ${x1} ${a.y} C ${x1+direction*bend} ${a.y}, ${x2-direction*bend} ${b.y}, ${x2} ${b.y}`); svg.append(path);
      const arrow=document.createElementNS(NS,'path'); arrow.setAttribute('class','edge-arrow'); arrow.setAttribute('d',direction>0?`M ${x2} ${b.y} l -6 -3 l 0 6 z`:`M ${x2} ${b.y} l 6 -3 l 0 6 z`); svg.append(arrow);
      const text=document.createElementNS(NS,'text'); text.setAttribute('class','edge-label'); text.setAttribute('x',String((x1+x2)/2)); text.setAttribute('y',String((a.y+b.y)/2-5)); text.setAttribute('text-anchor','middle'); text.textContent=label; svg.append(text);
    });
  }

  function renderTextViews() {
    const model = displayModel();
    const summary=$('#summary-content'); summary.replaceChildren();
    const titles=language()==='en'?['Product goal','Primary roles','Key journeys']:['产品目标','主要角色','关键业务链路'];
    [[titles[0],[model.purpose]],[titles[1],model.roles],[titles[2],model.flows]].forEach(([title,items])=>{ const card=el('article','summary-card'); card.append(el('h3','',title)); if(items.length===1)card.append(el('p','',items[0])); else { const ul=el('ul'); items.forEach(item=>ul.append(el('li','',item))); card.append(ul); } summary.append(card); });
    const questions=$('#question-list'); questions.replaceChildren();
    model.questions.forEach(([type,question],index)=>{ const card=el('article','question-card'); card.append(el('span','',`${language()==='en'?'Question':'问题'} ${String(index+1).padStart(2,'0')} · ${type}`),el('h3','',question),el('p','',language()==='en'?'Answer in the chat below and Topolyn will update the map.':'你可以在下方对话框直接回答，Topolyn 会据此更新架构图。')); questions.append(card); });
    $('#question-count').textContent=model.questions.length;
  }

  function renderModel(persist=false) {
    const model=displayModel();
    $('#map-title').textContent=model.title; $('#map-subtitle').textContent=language()==='en'?'Updated just now · Autosaved':'刚刚更新 · 自动保存';
    $('#insight-copy').replaceChildren(); $('#insight-copy').append(el('b','',language()==='en'?'Topolyn understands: ':'Topolyn 的理解：'),document.createTextNode(model.insight));
    renderGraph(); renderTextViews(); closeDetail();
    if(persist)saveHistoryRecord();
  }

  function selectNode(id) {
    state.selected=id; renderGraph();
    const model=displayModel(); const node=model.nodes.map(nodeObject).find(item=>item.id===id); if(!node)return;
    $('#detail-empty').hidden=true; $('#detail-content').hidden=false; $('#detail-type').textContent=(language()==='en'?kindCopyEn:kindCopy)[node.kind]; $('#detail-symbol').textContent=node.label.slice(0,1); $('#detail-title').textContent=node.label; $('#detail-description').textContent=node.description;
    const [label,copy]=(language()==='en'?sourceCopyEn:sourceCopy)[node.source]; $('#detail-source-label').textContent=label; $('#detail-source-copy').textContent=copy; $('#detail-source-dot').className=node.source;
    const responsibilities=$('#detail-responsibilities'); responsibilities.replaceChildren(...node.responsibilities.map(item=>el('li','',item)));
    const related=new Set(); model.edges.forEach(([a,b])=>{if(a===id)related.add(b);if(b===id)related.add(a)}); const relations=$('#detail-relations'); relations.replaceChildren(); related.forEach(otherId=>{const other=model.nodes.map(nodeObject).find(item=>item.id===otherId); const button=el('button','',other?.label||otherId); button.addEventListener('click',()=>selectNode(otherId)); relations.append(button)});
  }

  function closeDetail(){state.selected=null;$$('.diagram-node').forEach(n=>n.classList.remove('selected'));$('#detail-empty').hidden=false;$('#detail-content').hidden=true}
  function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
  function toast(message){const box=$('#toast');box.textContent=message;box.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>box.classList.remove('visible'),1800)}

  async function runGeneration(description='') {
    if(state.busy)return; const prompt=(description||$('#system-prompt').value).trim(); if(prompt.length<8){toast(language()==='en'?'Tell me a little more first':'再多描述一点，我才能准确梳理');$('#system-prompt').focus();return}
    state.busy=true; $('#generate-button').disabled=true; $('#generation-status').hidden=false; $('#graph-surface').style.opacity='.18';
    const steps=language()==='en'?[['Understanding your description…','Finding user roles and core capabilities'],['Mapping business relationships…','Connecting journeys and data'],['Generating the first map…','Separating facts, inferences, and questions']]:[['正在理解你的描述…','识别用户角色和核心功能'],['正在梳理业务关系…','连接关键流程与数据'],['正在生成第一版架构…','标记明确、推断和待确认内容']];
    const working=appendChatMessage('assistant','我正在把已知信息整理成第一版，并把不确定的部分单独标出来……','I am turning what we know into a first draft and separating the uncertain parts…');
    try { const inputPromise=collectInput(prompt); for(const [title,detail] of steps){$('#generation-step').textContent=title;$('#generation-detail').textContent=detail;await delay(380)} state.model=await generateArchitecture(await inputPromise);state.zoom=1;state.phase='generated';renderModel(true);$('#workspace').classList.remove('is-conversation');$('#workspace').classList.add('is-generated');$('#conversation-actions').hidden=true;working.remove();appendChatMessage('assistant','第一版已经生成。左边继续和我聊，右边的图会跟着你的要求更新。','The first draft is ready. Keep chatting on the left and the map will update with your requests.');setComposerPhase();toast(apiEndpoint()?(language()==='en'?'Map generated by API':'架构图已由 API 生成'):(language()==='en'?'First map generated':'第一版架构图已生成')); }
    catch(error){toast(`生成失败：${error.message}`)} finally {state.busy=false;$('#generate-button').disabled=false;$('#generation-status').hidden=true;$('#graph-surface').style.opacity='1'}
  }

  function generateFirstDraft() {
    if(state.busy)return;
    const answers=state.clarifications.filter(item=>!item.skipped&&item.answer).map(item=>`${item.questionZh}：${item.answer}`);
    const description=[state.originalIdea,...answers].filter(Boolean).join('\n补充：');
    runGeneration(description);
  }

  async function submitConversation() {
    const input=$('#system-prompt'),text=input.value.trim();
    if(state.phase==='idea'){
      if(text.length<8){toast(language()==='en'?'Tell me a little more first':'再多描述一点，我才能准确理解');input.focus();return}
      state.originalIdea=text;appendChatMessage('user',text,text);input.value='';$('#prompt-count').textContent='0';showScenarioRecommendation(text,new URLSearchParams(location.search).get('scenario')||'');return;
    }
    if(state.phase==='clarify'){
      if(!text){toast(language()==='en'?'Answer the question or choose Skip':'请回答问题，或选择“暂时跳过”');input.focus();return}
      appendChatMessage('user',text,text);input.value='';$('#prompt-count').textContent='0';recordClarification(text);return;
    }
    if(state.phase==='review'){
      if(!text)return;appendChatMessage('user',text,text);state.clarifications.push({questionZh:'补充信息',questionEn:'Additional context',answer:text,skipped:false});input.value='';$('#prompt-count').textContent='0';showRequirementReview();return;
    }
    if(!text)return;
    appendChatMessage('user',text,text);input.value='';$('#prompt-count').textContent='0';
    if(await addRefinement(text))appendChatMessage('assistant','收到，我已经用 AI 重新梳理并更新了当前版本。','Got it. AI has reworked and updated the current draft.');
  }

  async function addRefinement(text) {
    if(apiEndpoint()){
      if(state.busy)return false;state.busy=true;$('#generate-button').disabled=true;$('#generation-status').hidden=false;$('#generation-step').textContent=language()==='en'?'Applying your change with AI…':'AI 正在应用你的修改…';$('#generation-detail').textContent=language()==='en'?'Rechecking modules, relationships, and open questions':'重新检查模块、关系和待确认项';
      const working=appendChatMessage('assistant','我正在根据这条要求重新检查整张图，而不只是添加一个节点……','I am rechecking the whole map against this request, not just adding one node…');
      try{state.model=await generateArchitecture(await collectInput(state.originalIdea,{currentModel:state.model,refinement:text}));renderModel(true);working.remove();toast(language()==='en'?'Map updated by DeepSeek':'DeepSeek 已更新系统图');return true}
      catch(error){working.remove();toast(`${language()==='en'?'Update failed':'修改失败'}：${error.message}`);return false}
      finally{state.busy=false;$('#generate-button').disabled=false;$('#generation-status').hidden=true}
    }
    const candidates=[['会员','membership','会员服务','会员权益','service'],['membership','membership','会员服务','会员权益','service'],['Redis','cache','缓存服务','Redis Cache','data'],['cache','cache','缓存服务','Redis Cache','data'],['搜索','search','搜索服务','内容检索','service'],['search','search','搜索服务','内容检索','service'],['物流','logistics2','物流服务','配送履约','external'],['logistics','logistics2','物流服务','配送履约','external'],['通知','notification','通知服务','消息触达','service'],['notification','notification','通知服务','消息触达','service'],['风控','risk','风控服务','交易安全','service'],['risk','risk','风控服务','交易安全','service']];
    const found=candidates.find(([keyword])=>text.includes(keyword));
    if(found&&!state.model.nodes.some(row=>row[0]===found[1])){const [,id,label,meta,kind]=found;state.model.nodes.push([id,label,meta,kind,'explicit',76,88,`根据你的修改要求新增的${label}。`,['规则配置','状态管理','数据记录','异常处理']]);const center=state.model.nodes.find(row=>row[0]==='order'||row[0]==='portal'||row[0]==='app')?.[0]||state.model.nodes[2][0];state.model.edges.push([center,id,'调用']);state.model.insight+=` 已按你的要求加入${label}。`;renderModel(true);toast(`已加入${label}`)} else {state.model.insight=`已记录你的修改：“${text.slice(0,32)}${text.length>32?'…':''}”。接入 API 后会据此重新推理整张图。`;renderModel(true);toast('修改要求已记录')}return true
  }

  function download(name,type,content){const url=URL.createObjectURL(new Blob([content],{type}));const a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  function svgMarkup(){const model=displayModel(),nodes=model.nodes.map(nodeObject),width=1000,height=620;let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f9fafb"/>`;const pos=new Map(nodes.map(n=>[n.id,{x:n.x/100*820+40,y:n.y/100*500+35}]));model.edges.forEach(([a,b,label])=>{const p=pos.get(a),q=pos.get(b);if(p&&q)svg+=`<path d="M ${p.x+130} ${p.y+28} C ${p.x+190} ${p.y+28}, ${q.x-60} ${q.y+28}, ${q.x} ${q.y+28}" fill="none" stroke="#aeb5bd"/><text x="${(p.x+q.x+130)/2}" y="${(p.y+q.y)/2+20}" text-anchor="middle" font-family="Arial" font-size="10" fill="#777">${label}</text>`});nodes.forEach(n=>{const p=pos.get(n.id);svg+=`<rect x="${p.x}" y="${p.y}" width="140" height="58" rx="12" fill="white" stroke="#cfd3d8"/><circle cx="${p.x+18}" cy="${p.y+17}" r="4" fill="${n.source==='explicit'?'#0071e3':n.source==='inferred'?'#7657dc':'#d66b16'}"/><text x="${p.x+14}" y="${p.y+34}" font-family="Arial" font-size="12" font-weight="600" fill="#1d1d1f">${n.label}</text><text x="${p.x+14}" y="${p.y+49}" font-family="Arial" font-size="9" fill="#777">${n.meta}</text>`});return svg+'</svg>'}
  function exportSvg(){const model=displayModel();download(`${model.title}.svg`,'image/svg+xml',svgMarkup())}
  function exportPng(){const model=displayModel(),url=URL.createObjectURL(new Blob([svgMarkup()],{type:'image/svg+xml'})),image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=2000;canvas.height=1240;canvas.getContext('2d').drawImage(image,0,0,2000,1240);URL.revokeObjectURL(url);canvas.toBlob(blob=>{const downloadUrl=URL.createObjectURL(blob);const a=el('a');a.href=downloadUrl;a.download=`${model.title}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(downloadUrl),1000)},'image/png')};image.src=url}
  function summaryText(){const model=displayModel(),headings=language()==='en'?['Product goal','Primary roles','Key journeys','Open questions']:['产品目标','主要角色','关键链路','待确认'];return `${model.title}\n\n${headings[0]}\n${model.purpose}\n\n${headings[1]}\n${model.roles.map(x=>`- ${x}`).join('\n')}\n\n${headings[2]}\n${model.flows.map(x=>`- ${x}`).join('\n')}\n\n${headings[3]}\n${model.questions.map((x,i)=>`${i+1}. ${x[1]}`).join('\n')}`}

  $('#system-prompt').addEventListener('input',event=>$('#prompt-count').textContent=event.target.value.length);
  $('#example-chips').addEventListener('click',event=>{const value=language()==='en'?(event.target.dataset.exampleEn||event.target.dataset.example):event.target.dataset.example;if(value){$('#system-prompt').value=value;$('#prompt-count').textContent=value.length;submitConversation()}});
  $('#shuffle-examples').addEventListener('click',()=>{const list=$$('#example-chips button');list.unshift(list.pop());$('#example-chips').replaceChildren(...list)});
  $('#diagram-type').addEventListener('click',event=>{if(!event.target.dataset.type)return;state.type=event.target.dataset.type;$$('#diagram-type button').forEach(button=>button.classList.toggle('selected',button===event.target))});
  $('#material-files').addEventListener('change',event=>$('#file-status').textContent=event.target.files.length?(language()==='en'?`${event.target.files.length} files selected`:`已选择 ${event.target.files.length} 个文件`):(language()==='en'?'Docs, code, or ZIP':'支持文档、代码或 ZIP'));
  $('#generate-button').addEventListener('click',submitConversation);document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key==='Enter'){event.preventDefault();submitConversation()}});
  $('#view-tabs').addEventListener('click',event=>{const view=event.target.closest('button')?.dataset.view;if(!view)return;$$('#view-tabs button').forEach(button=>button.classList.toggle('active',button.dataset.view===view));['graph','summary','questions'].forEach(name=>$(`#${name}-view`).hidden=name!==view)});
  $('#zoom-in').addEventListener('click',()=>{state.zoom=Math.min(1.35,state.zoom+.1);renderGraph()});$('#zoom-out').addEventListener('click',()=>{state.zoom=Math.max(.65,state.zoom-.1);renderGraph()});$('#fit-button').addEventListener('click',()=>{state.zoom=1;renderGraph();toast(language()==='en'?'Fit to canvas':'已适应画布')});
  $('#close-detail').addEventListener('click',closeDetail);$('#refine-form').addEventListener('submit',event=>{event.preventDefault();const input=$('#refine-input');if(input.value.trim()){addRefinement(input.value.trim());input.value=''}});
  $('#export-button').addEventListener('click',()=>$('#export-menu').hidden=!$('#export-menu').hidden);$('#export-menu').addEventListener('click',event=>{const type=event.target.closest('button')?.dataset.export;if(!type)return;if(type==='png')exportPng();if(type==='svg')exportSvg();if(type==='json')download(`${displayModel().title}.json`,'application/json',JSON.stringify(displayModel(),null,2));if(type==='summary')download(`${displayModel().title}-${language()==='en'?'brief':'需求摘要'}.txt`,'text/plain',summaryText());$('#export-menu').hidden=true;toast(language()==='en'?'File exported':'文件已导出')});
  $('#new-map-button').addEventListener('click',startNewMap);$('#history-new-button').addEventListener('click',startNewMap);$('#history-toggle').addEventListener('click',()=>setHistoryOpen(!$('#history-sidebar').classList.contains('is-open')));$('#history-close').addEventListener('click',()=>setHistoryOpen(false));$('#history-backdrop').addEventListener('click',()=>setHistoryOpen(false));
  window.addEventListener('resize',renderEdges);window.addEventListener('topolyn:language',()=>{renderModel(false);renderHistoryList();setComposerPhase()});document.addEventListener('keydown',event=>{if(event.key==='Escape')setHistoryOpen(false)});
  const params=new URLSearchParams(location.search),linkedPrompt=params.get('prompt'),linkedType=params.get('type'),linkedScenario=params.get('scenario');
  if(linkedPrompt){$('#system-prompt').value=linkedPrompt;state.originalIdea=linkedPrompt}else if(!linkedScenario){try{const saved=JSON.parse(localStorage.getItem(WORKSPACE_KEY));if(saved?.model?.nodes&&saved?.model?.edges&&saved.phase==='generated'){state.recordId=saved.recordId||'';state.model=saved.model;state.type=saved.type||'auto';state.originalIdea=saved.prompt||'';state.clarifications=saved.clarifications||[];state.phase='generated';state.recommendation=(window.TopolynScenarios||[]).find(item=>item.id===saved.scenarioId)||null;$('#workspace').classList.remove('is-conversation');$('#workspace').classList.add('is-generated');if(!state.recordId||!readHistory().some(record=>record.id===state.recordId))saveHistoryRecord()}}catch{localStorage.removeItem(WORKSPACE_KEY)}}
  if(linkedType&&['auto','architecture','workflow','sequence','dataflow','lifecycle'].includes(linkedType))state.type=linkedType;
  $$('#diagram-type button').forEach(button=>button.classList.toggle('selected',button.dataset.type===state.type));
  $('#prompt-count').textContent=$('#system-prompt').value.length;
  window.TopolynApp={generate:generateArchitecture,recommend:recommendScenario,getModel:()=>structuredClone(state.model),getConversation:()=>({phase:state.phase,idea:state.originalIdea,scenarioId:state.recommendation?.id||'',clarifications:structuredClone(state.clarifications)}),getHistory:()=>structuredClone(readHistory()),openHistory:openHistoryRecord,newMap:startNewMap,apiContract:{method:'POST',input:['description','diagramType','scenarioId','clarifications','repositoryUrl','materials','currentModel','refinement'],output:['title','purpose','insight','roles','flows','questions','nodes','edges']}};
  renderModel(false);renderHistoryList();
  setComposerPhase();
  updateApiStatus();
  if(linkedScenario&&!linkedPrompt)setTimeout(()=>startLinkedScenario(linkedScenario),80);
  if(linkedPrompt)setTimeout(()=>submitConversation(),80);
})();
