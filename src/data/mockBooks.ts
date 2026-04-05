import { Book, BookAiGuide, BookTocItem } from '../types/book';

const densityTailEn =
  'This denser guide page is kept intentionally long so the reader still validates scrolling, narration, edge turning, source-PDF jumping, and the new guided-reading panels in one flow.';

const densityTailZh =
  '这一页会继续保持较高信息密度，用来联调正文滚动、朗读、翻页、目录导读、AI 导读和原 PDF 跳转，让阅读主链路仍然在同一页内可验证。';

type GuidedPage = {
  title: string;
  en: string;
  zh: string;
  tocSummary: string;
  pdfPageLabel?: string;
};

function extendPages(pages: string[], tail: string) {
  return pages.map((page) => `${page}\n\n${tail}`);
}

function buildTableOfContents(pages: GuidedPage[]): BookTocItem[] {
  return pages.map((page, pageIndex) => ({
    title: page.title,
    summary: page.tocSummary,
    pageIndex,
    pdfPageLabel: page.pdfPageLabel
  }));
}

function createEnglishBook(
  input: Omit<Book, 'pages' | 'translatedPages' | 'tableOfContents'> & {
    guidePages: GuidedPage[];
  }
): Book {
  const { guidePages, ...book } = input;
  const pages = guidePages.map((page) => `${page.title}\n\n${page.en}`);
  const translatedPages = guidePages.map((page) => `${page.title}\n\n${page.zh}`);

  return {
    ...book,
    pages: extendPages(pages, densityTailEn),
    translatedPages: extendPages(translatedPages, densityTailZh),
    tableOfContents: buildTableOfContents(guidePages)
  };
}

const nodeJsAiGuide: BookAiGuide = {
  summary:
    '这本书最适合按“运行时基础 -> 异步编排 -> 流与模块 -> 架构扩展”来读。不要把它当成单纯的模式手册，而要把每章都映射到真实服务的吞吐、边界和故障恢复问题。',
  recommendedPath: [
    '先读第 1 到 4 页，建立事件循环、回调约定和模块边界的统一心智模型。',
    '再读第 7 到 10 页，把串行、并行、背压和流式处理当成同一套异步编排工具。',
    '然后读第 11 到 15 页，理解经典模式在 Node.js 中为什么会改写成组合、装饰和中间件。',
    '最后读第 16 到 18 页，把扩缩容、消息、集成和可观测性连成一条生产链路。'
  ],
  understandingTips: [
    '每遇到一个模式，都问自己它解决的是吞吐、边界隔离、失败恢复还是团队协作成本。',
    '把 EventEmitter、Stream、Queue 看成统一的“事件和数据流”抽象，不要分开死记。',
    '对照自己的服务代码，标记哪里可能阻塞事件循环，哪里应该改成流式或消息化处理。',
    '读完一章后，尝试用一句话复述“这个模式在 Node.js 语境下的真正代价”。'
  ],
  reflectionQuestions: [
    '哪些模块应该保持同步 API，哪些必须异步化，为什么？',
    '你的服务中最容易出现背压失控的链路在哪里？',
    '当前系统是更缺少模块边界，还是更缺少消息契约？'
  ]
};

const programmingTypeScriptAiGuide: BookAiGuide = {
  summary:
    '这本书最适合按“编译器视角 -> 类型表达 -> API 设计 -> 系统迁移”来读。重点不是把语法背完，而是学会怎样用类型提前暴露歧义、约束协作边界。',
  recommendedPath: [
    '先读第 1 到 5 页，明确 TypeScript 是静态分析层，不是替代 JavaScript 的另一门语言。',
    '再读第 6 到 10 页，把联合、交叉、泛型、接口和结构化类型串成一套建模语言。',
    '接着读第 11 到 15 页，重点看高级类型、错误建模、第三方库接入和前后端边界。',
    '最后读第 16 到 18 页，把声明文件、迁移节奏和团队规范落到真实工程实践。'
  ],
  understandingTips: [
    '读每个语法点时都问自己：它减少的是哪一种不确定性，谁会因此少踩坑。',
    '优先理解类型收窄、泛型约束和接口边界，这三者最直接影响日常代码质量。',
    '遇到高级类型不要急着炫技，先判断业务是否真的需要把不变量编码进类型系统。',
    '把 tsconfig、声明文件和 IDE 提示看成同一套反馈系统，而不是零散配置项。'
  ],
  reflectionQuestions: [
    '你的团队最常见的 JavaScript 误用，能否通过类型边界提前挡住？',
    '哪些 API 应该追求表达力，哪些更该追求可推断和稳定？',
    '如果只能做一次渐进迁移，最值得先类型化的模块是哪块？'
  ]
};

const nodeJsGuidePages: GuidedPage[] = [
  {
    title: 'Preface',
    pdfPageLabel: 'PDF 前言',
    tocSummary: '快速说明全书的目标、章节关系，以及为什么 Node.js 模式要从运行时模型出发理解。',
    en: 'Node.js Design Patterns opens by treating Node.js as a systems platform. The book does not start with “which API do I call,” but with “what properties does this runtime give me, and what failure modes does it create.” That framing is useful because every later pattern, from callbacks to streams to messaging, is really a consequence of the same event-driven core.',
    zh: '《Node.js Design Patterns》开篇先把 Node.js 当成一套系统平台来看，而不是 API 清单。它关心的不是“先调哪个函数”，而是“这个运行时给了你什么能力，又会带来哪些失败模式”。后面的回调、流、消息和扩展性模式，本质上都建立在同一个事件驱动内核之上。'
  },
  {
    title: 'Reading Map',
    pdfPageLabel: 'PDF 目录',
    tocSummary: '把全书八章拆成四条学习主线，帮助先抓全局再深入局部模式。',
    en: 'A productive way to read this book is to group the material into four arcs. Arc one is runtime fundamentals: Node philosophy, the reactor pattern, callbacks, and module boundaries. Arc two is orchestration: sequencing work, parallelism, cancellation, and stream backpressure. Arc three is composition: patterns, wiring modules, and recipes. Arc four is architecture: scalability, queues, and integration.',
    zh: '比较高效的读法，是把全书拆成四条主线：第一条是运行时基础，包括 Node 哲学、Reactor、回调约定和模块边界；第二条是异步编排，包括串行、并行、取消和背压；第三条是组合方式，包括设计模式、模块装配和实践配方；第四条是架构层，包括扩展性、消息和集成。'
  },
  {
    title: 'Chapter 1: Node.js Philosophy',
    pdfPageLabel: 'PDF Chapter 1',
    tocSummary: '解释 small core、small modules 和 pragmatism 为什么决定了 Node.js 生态的设计风格。',
    en: 'The opening chapter argues that Node.js favors a small core, tiny modules, and pragmatic composition. This matters because it pushes engineers toward explicit boundaries and reusable pieces instead of giant frameworks. When you understand that cultural baseline, many “JavaScript ecosystem quirks” start to look like deliberate design tradeoffs around replaceability and speed of iteration.',
    zh: '第一章强调 Node.js 的文化基础是 small core、small modules 和务实组合。这会把工程师推向显式边界和可替换的小部件，而不是巨型框架。理解了这套文化背景后，很多看似“生态碎片化”的现象，其实都能被看成围绕可替换性和迭代速度做出的设计选择。'
  },
  {
    title: 'Chapter 1: Reactor and Event Loop',
    pdfPageLabel: 'PDF Chapter 1',
    tocSummary: '聚焦 Reactor 模式、事件循环和 libuv，解释单线程如何协调高并发 I/O。',
    en: 'The reactor pattern is the technical hinge of the whole book. Expensive I/O is delegated away, while JavaScript reacts when work completes. The event loop is not “magic concurrency”; it is a disciplined scheduler whose performance collapses when CPU-heavy work blocks the loop. The chapter is strong because it ties the abstract reactor diagram back to Node’s real implementation choices.',
    zh: 'Reactor 模式是全书真正的技术转轴。耗时 I/O 会被委托出去，而 JavaScript 在线程空出来时响应结果。事件循环不是“神奇并发”，而是一套有边界的调度机制；一旦 CPU 重任务阻塞主线程，吞吐就会迅速下降。这一章的价值在于，它把抽象的 Reactor 图景落回到 Node 的真实实现选择上。'
  },
  {
    title: 'Chapter 1: Callbacks and Conventions',
    pdfPageLabel: 'PDF Chapter 1',
    tocSummary: '梳理 continuation-passing style、同步/异步陷阱和 error-first 约定。',
    en: 'Callbacks are framed as a contract, not a syntax inconvenience. The chapter explains continuation-passing style, the danger of unpredictable sync versus async behavior, and why error-first callbacks became so central. The recurring lesson is that consistency is more important than cleverness: if callers cannot predict timing or error channels, the whole async graph becomes fragile.',
    zh: '本书把回调看成契约，而不是语法上的历史包袱。这里会解释 continuation-passing style、同步/异步行为不可预测的风险，以及 error-first 约定为什么会成为 Node 的核心习惯。反复出现的结论是：一致性比聪明技巧更重要，只要调用方无法预测时序和错误通道，整个异步图就会变得脆弱。'
  },
  {
    title: 'Chapter 1: Modules and Observers',
    pdfPageLabel: 'PDF Chapter 1',
    tocSummary: '把模块系统、缓存、依赖解析和 EventEmitter 视为控制复杂度的第一层工具。',
    en: 'The same chapter closes by moving from callbacks to modules and observers. CommonJS loading, module caching, export styles, and EventEmitter all serve one goal: make changing one piece of the system cheaper than rewriting the whole thing. In practice, this chapter is a reminder that architecture quality often starts with boring decisions about exports, load order, and event boundaries.',
    zh: '第一章最后会把回调过渡到模块和观察者。CommonJS 加载、模块缓存、导出形态以及 EventEmitter，本质上都在服务同一个目标：让修改系统中的一个部分，比重写整套逻辑更便宜。对实际工程来说，这章提醒我们，架构质量往往起始于那些看似普通的导出、加载顺序和事件边界决策。'
  },
  {
    title: 'Chapter 2: Why Async Code Gets Hard',
    pdfPageLabel: 'PDF Chapter 2',
    tocSummary: '从 web spider 例子切入，说明异步代码为什么容易变成 callback hell。',
    en: 'Asynchronous control flow is introduced through realistic coordination problems, not toy examples. The book shows how a crawler quickly turns into callback hell when sequencing, branching, and error propagation are left implicit. That is the key insight: async code grows hard when control flow is scattered across closures without a shared discipline.',
    zh: '第二章不是拿玩具例子讲异步，而是直接从真实协调问题入手。书里通过一个爬虫案例说明，只要把顺序、分支和错误传播都分散在闭包里，代码就会迅速变成 callback hell。核心洞察是：异步代码之所以难，并不是因为 API 多，而是因为控制流没有被统一建模。'
  },
  {
    title: 'Chapter 2: Sequencing and Parallelism',
    pdfPageLabel: 'PDF Chapter 2',
    tocSummary: '覆盖串行任务、并行任务、已知任务集和迭代任务的常见组织方式。',
    en: 'This part of the chapter is about making work order explicit. Sequential pipelines, parallel fan-out, bounded concurrency, and task iteration are all different answers to one question: what can run now, what must wait, and what should happen when something fails? Once those answers are encoded directly, async code becomes inspectable rather than mysterious.',
    zh: '第二章中段的重点，是把“工作顺序”显式化。串行流水线、并行扇出、受限并发和任务迭代，其实都在回答同一个问题：什么现在可以执行，什么必须等待，失败后该怎么收口。只要这些答案被直接编码出来，异步代码就会从神秘状态变成可检查、可推理的系统。'
  },
  {
    title: 'Chapter 2: Async Iteration Patterns',
    pdfPageLabel: 'PDF Chapter 2',
    tocSummary: '总结队列化、重试、竞速和取消这些控制流模式如何减少偶发故障。',
    en: 'Beyond basic sequencing, the book emphasizes reusable patterns for queues, retries, races, and cancellation. These are not embellishments. They are operational safeguards that keep temporary latency spikes and flaky dependencies from contaminating the rest of the process. A good reading strategy here is to map each pattern to incidents you have already seen in production.',
    zh: '除了基础顺序控制，书里还会总结队列化、重试、竞速和取消等可复用模式。这些不是锦上添花，而是防止临时延迟和不稳定依赖污染整条链路的运行保障。读这一段时，最有效的方法是把每个模式都对照到你在生产环境里真的见过的事故。'
  },
  {
    title: 'Chapter 3: Stream Mental Model',
    pdfPageLabel: 'PDF Chapter 3',
    tocSummary: '解释为什么 Stream 是 Node.js 最关键的性能和组合抽象之一。',
    en: 'Streams are presented as the place where Node’s runtime model meets application architecture head-on. Instead of buffering everything, work flows as chunks, and the system can react to readiness and pressure. This chapter matters because once you internalize streams, memory usage, latency, and composition stop being separate topics.',
    zh: '第三章把 Stream 放在 Node 运行时和应用架构正面相遇的位置。与其一次性把所有数据装进内存，不如让工作以数据块的形式持续流动，让系统根据就绪状态和压力信号做反应。真正理解 Stream 之后，内存占用、延迟和组合能力就不再是三个分离的话题。'
  },
  {
    title: 'Chapter 3: Readable, Writable, Transform',
    pdfPageLabel: 'PDF Chapter 3',
    tocSummary: '拆开可读流、可写流、Transform 和背压处理，帮助把抽象落到代码结构。',
    en: 'Readable, writable, duplex, and transform streams are not just class names. They are contracts about where data enters, where it leaves, and where it can be reshaped safely. Backpressure is the practical centerpiece: if consumers cannot keep up, the producer must slow down. This is one of the most transferable ideas in the book because it appears in networking, jobs, and UI state alike.',
    zh: 'Readable、Writable、Duplex 和 Transform 并不只是类名，它们定义的是数据从哪里进入、从哪里离开、在哪里可以被安全改写。这里真正的实战中心是背压：消费者跟不上时，生产者必须减速。这个思想的迁移性很强，因为网络、任务队列甚至 UI 状态都能遇到同类问题。'
  },
  {
    title: 'Chapter 4: Design Patterns in Node.js',
    pdfPageLabel: 'PDF Chapter 4',
    tocSummary: '把经典模式翻译成适合 JavaScript 模块、函数式组合和异步场景的形态。',
    en: 'The book does not copy classical GoF patterns mechanically. Instead, it asks which ideas survive translation into a language built around functions, modules, and async coordination. Factories, decorators, strategies, middleware pipelines, and proxies all reappear, but in more lightweight and composable forms. The payoff is learning to separate pattern intent from pattern ceremony.',
    zh: '第四章不会机械照搬 GoF 模式，而是追问：在一个以函数、模块和异步协调为核心的语言里，哪些思想仍然成立。工厂、装饰器、策略、中间件流水线和代理都会重新出现，但形态更轻、更适合组合。读这章最关键的收获，是学会把“模式的意图”和“模式的仪式感”拆开。'
  },
  {
    title: 'Chapter 4: Pattern Tradeoffs',
    pdfPageLabel: 'PDF Chapter 4',
    tocSummary: '强调创建、组合、决策和扩展点要分开，否则模式只会增加复杂度。',
    en: 'Pattern discussions are most useful when they end with tradeoffs. This section is valuable because it keeps asking whether a pattern clarifies ownership, isolates volatility, or merely adds abstraction. In Node.js, patterns earn their keep only when they reduce coupling between modules, execution timing, and deployment boundaries.',
    zh: '设计模式真正有价值的部分，通常都在“代价判断”上。这一页会不断追问：某个模式到底是在澄清所有权、隔离变化，还是只是在额外制造抽象。在 Node.js 里，只有当模式真的降低了模块耦合、时序耦合或部署耦合，它才算值得保留。'
  },
  {
    title: 'Chapter 5: Wiring Modules',
    pdfPageLabel: 'PDF Chapter 5',
    tocSummary: '讲依赖装配、初始化顺序、配置注入和组合根为什么会影响整个系统的可维护性。',
    en: 'Wiring is where clean modules meet messy reality. Dependency injection, plugin registration, bootstrapping order, and configuration all show up here. The lesson is that reusable modules still need a disciplined composition root. If assembly logic leaks everywhere, even well-designed parts produce a tangled system.',
    zh: '第五章讨论的是“装配”这件事，也就是干净模块如何落到复杂现实中。依赖注入、插件注册、启动顺序和配置都会在这里汇合。重点结论是：再好的模块，也需要一处有纪律的组合根；如果装配逻辑散落 everywhere，最后拼出来的系统依然会很乱。'
  },
  {
    title: 'Chapter 6: Recipes',
    pdfPageLabel: 'PDF Chapter 6',
    tocSummary: '用问题-方案形式覆盖子进程、缓存、命令模式和常见 Node 工程技巧。',
    en: 'The recipes chapter is practical by design. It turns the earlier principles into compact solutions for recurring engineering problems such as process isolation, command orchestration, caching, and cross-cutting concerns. A good way to use this chapter is not to memorize each recipe, but to identify which underlying pattern it is reusing.',
    zh: '第六章故意写得更像工程手册。它把前面章节的原则压缩成若干高频问题的解决方案，比如进程隔离、命令编排、缓存和横切能力。读这章时不必死记配方，更值得做的是识别每个配方背后复用了哪一种底层模式。'
  },
  {
    title: 'Chapter 7: Scalability and Architecture',
    pdfPageLabel: 'PDF Chapter 7',
    tocSummary: '把 Cluster、负载分配、工作进程和横向扩展统一放到系统容量问题里理解。',
    en: 'Scalability is presented as an architectural property, not a post-launch patch. Clustering, worker processes, sharding responsibilities, and deployment topology are discussed as ways to preserve throughput and isolation under growth. This chapter is strongest when you read it with concrete bottlenecks in mind: CPU saturation, queue lag, and uneven traffic spikes.',
    zh: '第七章把扩展性定义成架构属性，而不是上线后的补丁。Cluster、工作进程、职责切分和部署拓扑，都被统一放进“如何在增长下保持吞吐和隔离”这个问题里。阅读时最好带着具体瓶颈去看，比如 CPU 饱和、队列积压和流量尖峰。'
  },
  {
    title: 'Chapter 8: Messaging and Integration',
    pdfPageLabel: 'PDF Chapter 8',
    tocSummary: '总结消息队列、事件总线、集成边界和幂等处理如何支撑分布式 Node 服务。',
    en: 'The last major chapter shifts from in-process composition to distributed coordination. Queues, brokers, pub/sub, and idempotent handlers become necessary once work crosses service boundaries. The real takeaway is not “use messaging everywhere,” but “treat message contracts, retries, and observability as first-class design work.”',
    zh: '最后一章把视角从进程内组合推到分布式协调。只要工作穿过服务边界，队列、Broker、发布订阅和幂等处理就会变得必要。真正该记住的不是“到处都上消息系统”，而是“消息契约、重试和可观测性本身就是一等设计工作”。'
  },
  {
    title: 'Final Review',
    pdfPageLabel: 'PDF 全书收束',
    tocSummary: '收束全书，把运行时、模式和架构三层串成一条可复用的 Node 学习路径。',
    en: 'Taken as a whole, Node.js Design Patterns is a book about compounding decisions. Small choices around callback timing, module boundaries, stream contracts, and queue semantics become system behavior at scale. If you finish the book with one new habit, let it be this: every local implementation choice should be tested against its operational consequences.',
    zh: '把全书连起来看，《Node.js Design Patterns》讲的其实是“局部决策如何逐步累积成系统行为”。回调时序、模块边界、流契约和队列语义这些局部选择，最终都会在规模化后放大成系统现象。如果读完全书只留下一个新习惯，应该是：每个局部实现选择，都要拿它的运行后果来反推。'
  }
];

const programmingTypeScriptGuidePages: GuidedPage[] = [
  {
    title: 'Preface',
    pdfPageLabel: 'PDF 前言',
    tocSummary: '说明全书把 TypeScript 放在团队协作和代码库规模化的语境里，而不是只讲语法。',
    en: 'Programming TypeScript starts with a clear promise: types are most valuable when they help teams scale code and reasoning, not when they exist as decoration. Boris Cherny frames TypeScript as a static analysis layer that understands JavaScript and moves mistakes earlier. That framing is the right lens for the rest of the book.',
    zh: '《Programming TypeScript》开篇就把类型系统放回团队协作和代码库规模化的场景里。Boris Cherny 强调，TypeScript 的价值不在“多写一些标注”，而在于它能把错误和歧义提前到更早的阶段暴露出来。这个视角会决定后面所有章节该怎么理解。'
  },
  {
    title: 'Reading Map',
    pdfPageLabel: 'PDF 目录',
    tocSummary: '先给出编译器、类型表达、API 设计和迁移治理四条阅读主线。',
    en: 'A practical reading path is to divide the book into four layers. Layer one is tooling and compiler feedback. Layer two is the language of types: primitives, unions, intersections, tuples, and narrowing. Layer three is API design with functions, generics, classes, and interfaces. Layer four is systems adoption: advanced types, interop, declaration files, and migration discipline.',
    zh: '更高效的读法，是把全书拆成四层：第一层是工具链和编译器反馈；第二层是类型表达语言，包括基础类型、联合、交叉、元组和收窄；第三层是 API 设计，包括函数、泛型、类和接口；第四层是系统级接入，包括高级类型、互操作、声明文件和迁移治理。'
  },
  {
    title: 'Chapter 1: Introduction',
    pdfPageLabel: 'PDF Chapter 1',
    tocSummary: '回答为什么 JavaScript 代码库会在规模化时暴露歧义，而类型能如何提前处理。',
    en: 'The introduction positions TypeScript as a response to ambiguity in large JavaScript systems. Dynamic flexibility remains useful, but when teams grow, assumptions about data shape, control flow, and API contracts become expensive. This chapter is short, but it sets the book’s most important principle: type systems are leverage against misunderstanding.',
    zh: '第一章直接回应一个核心问题：为什么 JavaScript 代码库一旦放大，就会不断暴露数据形状、控制流和 API 契约上的歧义。动态灵活性依然有价值，但团队一大，误解成本就会飙升。这章虽然短，却先立住了全书最关键的原则：类型系统是对抗误解的杠杆。'
  },
  {
    title: 'Chapter 2: 10,000-Foot View',
    pdfPageLabel: 'PDF Chapter 2',
    tocSummary: '解释编译器、类型检查器、编辑器和 tsconfig 为什么是一套完整反馈系统。',
    en: 'The second chapter zooms out and treats the compiler, type checker, editor, and configuration as one coherent workflow. This is where many readers correct a common mistake: TypeScript is not only syntax. It is an ecosystem of feedback loops that shape how code is written, reviewed, and changed.',
    zh: '第二章拉到高空视角，把编译器、类型检查器、编辑器和配置文件看成一整套反馈系统。很多读者会在这里纠正一个常见误解：TypeScript 不只是一些新语法，它更像是一整套决定代码如何书写、审查和演进的反馈回路。'
  },
  {
    title: 'Chapter 2: Tooling and tsconfig',
    pdfPageLabel: 'PDF Chapter 2',
    tocSummary: '补充编辑器配置、strict 选项和项目入口文件如何影响团队的一致性。',
    en: 'tsconfig is presented as a strategic file rather than a one-time setup chore. Strictness flags, module settings, target levels, and source layout become part of the project’s engineering policy. The key insight is that compiler configuration quietly encodes what kinds of ambiguity your team is willing to tolerate.',
    zh: '书里把 `tsconfig` 看成工程策略文件，而不是一次性初始化步骤。严格模式、模块设置、目标环境和源码布局，都会变成团队工程政策的一部分。这里最值得记住的一点是：编译器配置实际上在悄悄定义团队愿意容忍哪类歧义。'
  },
  {
    title: 'Chapter 3: Primitive and Structural Types',
    pdfPageLabel: 'PDF Chapter 3',
    tocSummary: '梳理 any、unknown、对象类型和结构化系统的基本表达方式。',
    en: 'This chapter teaches the language of types. any, unknown, primitives, symbols, and object shapes are introduced not as syntax to memorize, but as tools for expressing certainty and uncertainty. The distinction between any and unknown is especially important because it marks the line between “I give up” and “I will prove this later.”',
    zh: '第三章开始真正建立“类型语言”。any、unknown、基本类型、symbol 和对象形状，不该被当成死记语法，而应该被当成表达确定性和不确定性的工具。其中 `any` 和 `unknown` 的差别尤其关键，因为它们分别代表“我放弃约束”和“我稍后会证明它”。'
  },
  {
    title: 'Chapter 3: Unions, Intersections, Arrays, Tuples',
    pdfPageLabel: 'PDF Chapter 3',
    tocSummary: '讲清联合、交叉、数组和元组怎样让数据建模更接近真实业务形状。',
    en: 'Unions and intersections are where TypeScript stops feeling like annotated JavaScript and starts becoming a modeling language. Arrays and tuples help distinguish “a list of similar things” from “a fixed-position contract.” When readers internalize this distinction, many API and state-modeling decisions become much easier.',
    zh: '联合类型和交叉类型，是 TypeScript 真正开始像“建模语言”而不只是“带标注的 JavaScript”的地方。数组和元组则帮助你区分“同类元素列表”和“按位置固定的契约”。一旦把这层差别吃透，很多 API 设计和状态建模决策会立刻清晰很多。'
  },
  {
    title: 'Chapter 3: Enums, Nullability, and Narrowing',
    pdfPageLabel: 'PDF Chapter 3',
    tocSummary: '总结枚举、空值处理和类型收窄如何把运行时判断转成可验证的代码路径。',
    en: 'The later part of the chapter focuses on enums, nullability, and the edges of the type space. The bigger lesson is narrowing: runtime checks should inform the compiler about what is now safe. That habit turns conditionals from ad hoc defensive code into a form of executable proof.',
    zh: '第三章后半段会覆盖枚举、空值处理以及类型空间的边界概念。更大的收获在于“收窄”思维：运行时判断应该反过来告诉编译器，哪些路径现在已经安全。这会让条件分支不再只是防御式代码，而成为一类可执行证明。'
  },
  {
    title: 'Chapter 4: Functions and Contracts',
    pdfPageLabel: 'PDF Chapter 4',
    tocSummary: '用参数、返回值、重载和上下文类型推断来重塑函数边界。',
    en: 'Functions are where TypeScript pays for itself quickly. Optional parameters, overloads, rest arguments, this typing, and contextual inference all serve one idea: function boundaries should be expressive without becoming permissive. The chapter is especially useful because it connects API ergonomics directly to type discipline.',
    zh: '函数通常是 TypeScript 最快体现收益的地方。可选参数、重载、剩余参数、`this` 类型和上下文推断，其实都在服务同一个目标：函数边界既要有表达力，又不能过度放任。书里最实用的部分，是把 API 易用性直接和类型纪律连接起来。'
  },
  {
    title: 'Chapter 4: Generics and Polymorphism',
    pdfPageLabel: 'PDF Chapter 4',
    tocSummary: '把泛型、约束和默认类型参数放到复用与误用防护之间理解。',
    en: 'Generics are presented as reusable contracts, not abstract puzzles. Type parameters, bounds, defaults, and inference all help functions stay flexible while preserving relationships between inputs and outputs. The best way to read this section is to look for where generics eliminate duplication without hiding intent.',
    zh: '第四章后半段把泛型讲成“可复用契约”，而不是抽象谜题。类型参数、约束、默认值和推断，共同作用的目标是：在保持灵活性的同时，保住输入和输出之间的重要关系。阅读时最值得关注的，是泛型在哪些地方真正消除了重复而没有遮蔽意图。'
  },
  {
    title: 'Chapter 5: Classes and Interfaces',
    pdfPageLabel: 'PDF Chapter 5',
    tocSummary: '解释结构化类型系统下，类与接口如何描述实现、能力和可替换性。',
    en: 'Classes and interfaces are used to clarify that TypeScript is structurally typed. What matters is not nominal inheritance alone, but whether a value satisfies the required shape and behavior. This chapter helps readers stop over-importing object-oriented habits and start using interfaces as capability descriptions.',
    zh: '第五章会把类和接口重新放回 TypeScript 的结构化类型系统里理解。真正重要的不是名义继承本身，而是某个值是否满足目标形状和行为。很多读者会在这里把传统 OOP 习惯收一收，开始把接口看成“能力描述”，而不是强制层级。'
  },
  {
    title: 'Chapter 6: Advanced Types',
    pdfPageLabel: 'PDF Chapter 6',
    tocSummary: '映射类型、条件类型和类型操作符用于编码真正重要的不变量。',
    en: 'Advanced types raise the abstraction level significantly. Mapped types, conditional types, keyof, indexed access, and related operators make the type system expressive enough to encode families of transformations. The book’s discipline here is useful: advanced types are worthwhile when they remove ambiguity, not when they merely show cleverness.',
    zh: '第六章把抽象层级再往上提了一大步。映射类型、条件类型、`keyof`、索引访问等能力，让类型系统足以表达一整类转换关系。这一章最值得吸收的不是技巧本身，而是节制原则：只有当高级类型真的减少了歧义，它们才值得出现。'
  },
  {
    title: 'Chapter 7: Error Handling',
    pdfPageLabel: 'PDF Chapter 7',
    tocSummary: '讨论怎样把失败路径显式建模，而不是把异常当成类型系统之外的黑盒。',
    en: 'Error handling extends the book’s core philosophy into failure states. Instead of hoping exceptions are handled later, the chapter encourages modeling invalid states and unhappy paths intentionally. That approach is powerful because it shifts discussion from “did we remember to catch” toward “what failure modes does this API admit.”',
    zh: '第七章把全书的方法论推进到失败路径上。与其把异常留给未来某处再处理，不如主动在类型层面承认哪些状态无效、哪些失败路径是 API 合法的一部分。这样一来，团队讨论的焦点就会从“记得 catch 了吗”转向“这个 API 允许哪些失败模式存在”。'
  },
  {
    title: 'Chapter 8: Interop with JavaScript',
    pdfPageLabel: 'PDF Chapter 8',
    tocSummary: '讲与现有 JS 库、声明文件和渐进迁移共存的策略。',
    en: 'Interop chapters prevent the book from becoming academically pure. Real teams inherit JavaScript, third-party packages, and incomplete type information. The guidance here is pragmatic: use declaration files, wrappers, and typed boundaries to improve confidence gradually rather than waiting for a total rewrite.',
    zh: '第八章让全书保持工程现实感。真实团队会继承大量 JavaScript、第三方库以及不完整的类型信息，因此迁移不可能靠一次重写完成。这里给出的策略相当务实：通过声明文件、包裹层和类型边界逐步提升可信度，而不是等一次性全改。'
  },
  {
    title: 'Chapter 9: Frontend TypeScript',
    pdfPageLabel: 'PDF Chapter 9',
    tocSummary: '聚焦前端状态、组件边界和事件处理如何受益于更严格的类型约束。',
    en: 'Frontend examples show that TypeScript is not just for library authors. Components, props, events, and client-side state all become easier to refactor when their contracts are explicit. The hidden insight is that UI complexity often comes from ambiguous state transitions, and types can narrow those transitions meaningfully.',
    zh: '前端章节会说明 TypeScript 并不只是写库的人才需要。组件、props、事件和客户端状态，只要边界明确，重构成本就会明显下降。这里的隐藏重点是：很多 UI 复杂度其实来自模糊的状态迁移，而类型正好可以把这些迁移路径收窄清楚。'
  },
  {
    title: 'Chapter 10: Backend and Ecosystem',
    pdfPageLabel: 'PDF Chapter 10',
    tocSummary: '总结 Node 服务、构建工具、声明生态和团队规范如何一起影响 TypeScript 落地。',
    en: 'On the backend, types become a way to stabilize service boundaries, configuration, and shared contracts. The ecosystem discussion also matters: compiler settings, library quality, and declaration maintenance all influence whether TypeScript improves velocity or becomes friction. Adoption is therefore an organizational decision, not only a syntax choice.',
    zh: '来到后端和生态章节时，类型开始承担稳定服务边界、配置结构和共享契约的职责。这里还会提醒你，编译器设置、库质量和声明维护成本都会决定 TypeScript 到底是提升效率，还是制造摩擦。因此，落地 TypeScript 从来都不只是语法决策，而是组织决策。'
  },
  {
    title: 'Migration Playbook',
    pdfPageLabel: 'PDF Chapter 8-11',
    tocSummary: '把声明文件、strict 策略、边界优先和渐进迁移串成一份落地顺序建议。',
    en: 'If you are reading with a real codebase in mind, the most useful synthesis is a migration playbook. Start from high-churn boundaries and shared domain objects, raise strictness intentionally, and let compiler feedback guide cleanup work. The point is not to type every file first; it is to reduce ambiguity where collaboration costs are highest.',
    zh: '如果你是带着真实项目来读，这本书最值得提炼出来的其实是一份迁移打法：先抓高变更边界和共享领域对象，再有意识地提高 strict 程度，让编译器反馈带着你推进清理。目标不是先把所有文件都补满类型，而是优先降低协作成本最高的那部分歧义。'
  },
  {
    title: 'Final Review',
    pdfPageLabel: 'PDF 全书收束',
    tocSummary: '收束全书，把类型系统归纳为减少歧义、稳定边界和支撑重构的工程工具。',
    en: 'Programming TypeScript ends as both a language guide and a design handbook. Its main contribution is not that it catalogs syntax, but that it teaches how to express intent, encode invariants, and let tooling shoulder repetitive review work. That is the reading outcome to keep: better types should produce clearer engineering decisions.',
    zh: '《Programming TypeScript》最后呈现出来的，既是语言指南，也是设计手册。它最重要的贡献不在于罗列语法，而在于教你怎样表达意图、编码不变量，并把可重复的审查工作交给工具。这本书真正应该留下来的阅读结果，是更清晰的工程决策，而不只是更长的类型声明。'
  }
];

export const mockBooks: Book[] = [
  createEnglishBook({
    id: 'nodejs-design-patterns',
    title: 'Node.js Design Patterns',
    author: 'Mario Casciaro / Luciano Mammino',
    description:
      'Desktop PDF 已完整挂接，阅读页扩展为 18 个章节导读页，并补充目录导读与 AI 导读，方便从运行时到架构逐层消化全书。',
    accentColor: '#2E6F40',
    language: 'English',
    totalPdfPages: 454,
    sourcePdfLabel: 'Desktop PDF',
    sourcePdfUri: 'file:///Users/daniel/Desktop/Node.js-Design-Patterns.pdf',
    translationSourceLocale: 'en',
    translationTargetLocale: 'zh-CN',
    aiGuide: nodeJsAiGuide,
    guidePages: nodeJsGuidePages
  }),
  createEnglishBook({
    id: 'programming-typescript',
    title: 'Programming TypeScript',
    author: 'Boris Cherny',
    description:
      'Desktop PDF 已完整挂接，阅读页扩展为 18 个章节导读页，并增加目录导读与 AI 导读，便于按“编译器 -> 类型 -> API -> 迁移”顺序阅读。',
    accentColor: '#2452A8',
    language: 'English',
    totalPdfPages: 324,
    sourcePdfLabel: 'Desktop PDF',
    sourcePdfUri:
      'file:///Users/daniel/Desktop/Boris%20Cherny%20-%20Programming%20TypeScript_%20Making%20Your%20JavaScript%20Applications%20Scale%20-%20O%E2%80%B2Reilly%20%282019%29.pdf',
    translationSourceLocale: 'en',
    translationTargetLocale: 'zh-CN',
    aiGuide: programmingTypeScriptAiGuide,
    guidePages: programmingTypeScriptGuidePages
  })
];
