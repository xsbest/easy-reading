import { Book } from '../types/book';

const densityTailEn =
  'This longer page keeps enough density to validate scroll behavior, narration, page turning, and the new translation toggle in the same reading flow.';

const densityTailZh =
  '这一页继续保留较长段落，用来联调正文滚动、朗读、翻页和新的页内翻译开关，保证阅读主链路在同一屏内可验证。';

function extendPages(pages: string[], tail: string) {
  return pages.map((page) => `${page}\n\n${tail}`);
}

function createEnglishBook(input: Omit<Book, 'pages' | 'translatedPages'> & {
  pages: string[];
  translatedPages: string[];
}): Book {
  return {
    ...input,
    pages: extendPages(input.pages, densityTailEn),
    translatedPages: extendPages(input.translatedPages, densityTailZh)
  };
}

export const mockBooks: Book[] = [
  createEnglishBook({
    id: 'nodejs-design-patterns',
    title: 'Node.js Design Patterns',
    author: 'Mario Casciaro / Luciano Mammino',
    description: 'Imported from the desktop PDF with English reading pages, Chinese translations, and a quick jump back to the original source file.',
    accentColor: '#2E6F40',
    language: 'English',
    sourcePdfLabel: 'Desktop PDF',
    sourcePdfUri: 'file:///Users/daniel/Desktop/Node.js-Design-Patterns.pdf',
    translationSourceLocale: 'en',
    translationTargetLocale: 'zh-CN',
    pages: [
      'Preface\n\nNode.js Design Patterns frames Node.js as an engineering platform rather than a bag of APIs. The book starts from the event loop and asynchronous I/O, then moves into modules, control flow, streams, and system-level architecture. The practical value is that every pattern is tied back to a real production concern: how to keep services scalable, modular, and maintainable while the runtime stays single-threaded.',
      'Chapter 1: The Node.js Platform\n\nThe opening chapter explains why Node.js can handle many concurrent connections with a single JavaScript thread. The key is delegation: expensive I/O is handed off to the operating system or worker facilities, and JavaScript coordinates callbacks when work is ready. Once that model is clear, tradeoffs around latency, throughput, and blocking code stop feeling mysterious.',
      'Chapter 2: Modules and Boundaries\n\nThe module system is presented as the first design tool for controlling complexity. CommonJS and ES modules are not only syntax choices, but also ways to define contracts, loading semantics, and test seams. Good modules hide volatility, expose intention, and reduce the cost of changing implementation details later.',
      'Chapter 3: Callbacks, Events, and Control Flow\n\nCallbacks and EventEmitter remain foundational because they match Node.js runtime behavior closely. The book emphasizes error-first conventions, event-driven composition, and the dangers of implicit control flow. A recurring lesson is that asynchronous code becomes unmanageable when teams treat every callback as a local trick instead of part of a larger orchestration story.',
      'Chapter 4: Promises, Async Functions, and Streams\n\nPromise chains and async or await improve readability, but the real design work is still about failure handling, concurrency limits, cancellation, and cleanup. Streams add a second major abstraction: process data as it arrives instead of buffering entire payloads in memory. In Node.js, streams are where architecture and runtime mechanics meet directly.',
      'Chapters 5 to 8: Creational, Structural, and Behavioral Patterns\n\nThe middle of the book reinterprets classic design patterns for the JavaScript and Node.js ecosystem. Factories, decorators, adapters, proxies, observers, strategies, and middleware-style pipelines appear in forms that feel natural for modules, services, and async workflows. The value is not textbook purity, but the discipline of separating construction, composition, and decision making.',
      'Chapters 9 to 12: Messaging, Scalability, and Integration\n\nAs applications grow beyond one process, the book shifts toward queues, event buses, worker processes, horizontal scaling, and distributed coordination. Node.js is strong at I/O-heavy coordination layers, but only if message contracts, idempotency, retries, and observability are designed deliberately. Scalability is described as an architectural property, not a late optimization step.',
      'Conclusion\n\nTaken together, the book reads like a map from runtime fundamentals to production architecture. It explains how local coding choices around modules, async control flow, and streams compound into system-wide behavior. For this app, the imported PDF is represented as guided reading pages so the shelf, reader, translation toggle, and source-file jump can all be validated without changing the project skeleton.'
    ],
    translatedPages: [
      '前言\n\n《Node.js Design Patterns》把 Node.js 当作一套工程平台，而不是一堆 API。全书从事件循环和异步 I/O 讲起，再进入模块化、控制流、流式处理以及系统架构。它的价值在于，每个模式都会回到真实生产问题上：在单线程运行时的前提下，如何让服务继续保持可扩展、可组合、可维护。',
      '第一章：Node.js 平台\n\n开篇重点解释 Node.js 为什么能用单个 JavaScript 线程处理大量并发连接。关键在于委托机制：耗时 I/O 交给操作系统或工作线程设施处理，JavaScript 只在结果可用时协调回调。理解这个模型后，延迟、吞吐和阻塞代码的权衡就不再抽象。',
      '第二章：模块与边界\n\n书里把模块系统视为控制复杂度的第一把工具。CommonJS 和 ES Modules 不只是语法选择，它们还定义了契约、加载语义以及测试切面。好的模块会把易变性藏起来，把意图暴露出来，并显著降低后续替换实现时的成本。',
      '第三章：回调、事件与控制流\n\n回调和 EventEmitter 仍然是基础，因为它们和 Node.js 运行时的异步行为非常贴近。书中强调错误优先约定、事件驱动组合，以及隐式控制流的风险。反复出现的结论是：当团队把每个回调都当成局部技巧，而不是整体编排的一部分时，异步代码很快就会失控。',
      '第四章：Promise、异步函数与 Stream\n\nPromise 链和 async/await 确实提升了可读性，但真正的设计工作仍然围绕失败处理、并发上限、取消和清理。Stream 提供了另一种关键抽象：数据一到就处理，而不是整块读入内存。对 Node.js 来说，流式处理正是架构思维和运行时机制直接相遇的地方。',
      '第五到第八章：创建型、结构型与行为型模式\n\n全书中段把经典设计模式重新翻译成适合 JavaScript 与 Node.js 生态的形态。工厂、装饰器、适配器、代理、观察者、策略和类似中间件的流水线，都会以更贴近模块、服务与异步流程的方式出现。重点不是教科书式纯度，而是训练团队把创建、组合和决策拆开。',
      '第九到第十二章：消息、扩展性与集成\n\n当应用不再局限于单进程，书的重心就会转向队列、事件总线、工作进程、水平扩容以及分布式协作。Node.js 很擅长 I/O 密集型协调层，但前提是消息契约、幂等、重试和可观测性都被有意识地设计过。扩展性在这里被定义为架构属性，而不是上线后的补丁。',
      '结语\n\n把全书连起来看，它更像一张从运行时基础延伸到生产架构的工程地图。它解释了模块边界、异步控制流和 Stream 这些局部选择，最终如何累积成系统级行为。在当前应用里，这个导入的 PDF 先用引导式阅读页表示，方便一起验证书架、阅读器、翻译开关和原 PDF 入口。'
    ]
  }),
  createEnglishBook({
    id: 'programming-typescript',
    title: 'Programming TypeScript',
    author: 'Boris Cherny',
    description: 'Imported from the desktop PDF as an English technical book with page-by-page Chinese translation and Google Translate jump-out support.',
    accentColor: '#2452A8',
    language: 'English',
    sourcePdfLabel: 'Desktop PDF',
    sourcePdfUri:
      'file:///Users/daniel/Desktop/Boris%20Cherny%20-%20Programming%20TypeScript_%20Making%20Your%20JavaScript%20Applications%20Scale%20-%20O%E2%80%B2Reilly%20%282019%29.pdf',
    translationSourceLocale: 'en',
    translationTargetLocale: 'zh-CN',
    pages: [
      'Preface\n\nProgramming TypeScript is written as a guided upgrade path for JavaScript developers who want stronger guarantees without losing the flexibility of the language. Boris Cherny positions TypeScript as a tool for scaling teams and codebases, not just a lint layer. The promise of the book is that types can move bugs and ambiguity earlier in the development cycle.',
      'Chapter 1 and 2: Introduction and the 10,000-Foot View\n\nThe early chapters explain the compiler, the type checker, editor tooling, and tsconfig as one coherent workflow. TypeScript is described as a static analysis layer that understands JavaScript rather than replacing it. That framing matters because adoption succeeds when teams know what remains runtime behavior and what becomes compile-time feedback.',
      'Chapter 3: All About Types\n\nThis section walks through any, unknown, primitive types, objects, unions, intersections, arrays, tuples, and enums. The important shift is conceptual: types are a language for describing intent and narrowing uncertainty. By the end of the chapter, readers are expected to stop thinking of annotations as noise and start treating them as executable design documentation.',
      'Chapter 4: Functions\n\nFunctions become the place where TypeScript starts paying off immediately. Optional parameters, overloads, generics, contextual typing, and bounded polymorphism show how rich contracts can stay ergonomic. The chapter repeatedly argues that well-typed function boundaries let APIs remain expressive while preventing an entire class of misuse.',
      'Chapter 5: Classes and Interfaces\n\nClasses and interfaces are used to clarify TypeScript’s structural type system. The book contrasts inheritance with composition, explains implementation versus declaration, and shows how interfaces model capabilities without forcing one runtime hierarchy. This makes TypeScript feel less like nominal OOP and more like a precise way to describe shapes and behaviors.',
      'Chapters 6 and 7: Advanced Types and Error Handling\n\nLater material digs into mapped types, conditional types, type operators, and ways to model failure. The complexity rises, but the book keeps returning to one principle: use the type system to encode the invariants that matter most to the business. Advanced types are worthwhile when they eliminate ambiguity, not when they merely show off cleverness.',
      'Chapters 8 to 11: Interoperability, Frontend, Backend, and Ecosystem\n\nThe book also covers how TypeScript integrates with JavaScript libraries, declaration files, build tooling, React-style frontend work, and Node.js services. Adoption is treated as an ecosystem decision, not a syntax-only change. Good TypeScript practice includes compiler settings, library boundaries, and habits around refactoring large codebases safely.',
      'Conclusion\n\nProgramming TypeScript ends up being a language guide and an engineering handbook at the same time. It teaches syntax, but its bigger contribution is a mindset: model uncertainty explicitly, tighten contracts where they matter, and let the compiler shoulder repeatable review work. In this app, the imported PDF is exposed through concise reading pages so users can flip, listen, translate, and return to the original file.'
    ],
    translatedPages: [
      '前言\n\n《Programming TypeScript》把自己写成一条给 JavaScript 开发者的升级路径：在不失去语言灵活性的前提下，获得更强的约束和反馈。Boris Cherny 把 TypeScript 定位为团队和代码库扩展工具，而不只是更严格的 lint。全书承诺的是：用类型把 bug 和歧义尽量提前到开发过程更早的阶段。',
      '第一章与第二章：导论和万英尺视角\n\n前几章把编译器、类型检查器、编辑器工具链以及 tsconfig 组织成一套完整工作流。TypeScript 被描述为“理解 JavaScript 的静态分析层”，而不是要取代 JavaScript 本身。这个视角很重要，因为团队只有分清哪些仍是运行时行为、哪些变成编译期反馈，迁移才会顺利。',
      '第三章：全面理解类型\n\n这一部分依次覆盖 any、unknown、基本类型、对象、联合、交叉、数组、元组和枚举。真正重要的变化是认知方式：类型是一种描述意图、收缩不确定性的语言。读完这一章，读者应当把类型标注看成可执行的设计文档，而不是额外噪音。',
      '第四章：函数\n\n函数是 TypeScript 最快体现价值的地方。可选参数、重载、泛型、上下文类型推断和受限多态，展示了“丰富契约”如何仍然保持易用。书里反复强调，只要函数边界被正确建模，API 就能既有表达力，又能阻止一整类错误用法。',
      '第五章：类与接口\n\n类和接口这一章主要用来讲清楚 TypeScript 的结构化类型系统。书里对比了继承与组合，解释了实现和声明的差异，也展示了接口如何描述能力而不强迫运行时层级。这样一来，TypeScript 更像是在精确定义形状和行为，而不是回到传统名义型 OOP。',
      '第六章与第七章：高级类型与错误处理\n\n后续内容会深入映射类型、条件类型、类型操作符以及对失败场景的建模。复杂度确实上升了，但全书一直在重复同一条原则：用类型系统编码业务最关心的不变量。只有当高级类型真正消除歧义时，它们才值得引入，而不是为了炫技。',
      '第八到第十一章：互操作、前端、后端与生态\n\n书里还讨论了 TypeScript 如何和 JavaScript 库、声明文件、构建工具、类 React 前端以及 Node.js 服务协作。迁移被视为生态层面的决策，而不是单纯换语法。好的 TypeScript 实践同时包含编译器配置、库边界以及安全重构大型代码库的工作习惯。',
      '结语\n\n《Programming TypeScript》最后呈现出来的，既是一本文法指南，也是一份工程手册。它教语法，但更大的贡献是一种思维方式：显式建模不确定性，在关键边界收紧契约，让编译器分担可重复的审查工作。在这个应用里，导入的 PDF 会先以精简阅读页形式提供，方便直接翻页、朗读、翻译，并回到原始文件。'
    ]
  })
];
