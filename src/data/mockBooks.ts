import { Book } from '../types/book';

function toDesktopPdfUri(path: string) {
  return encodeURI(`file://${path}`);
}

function createEnglishBook(partial: Omit<Book, 'language' | 'translationSourceLocale' | 'translationTargetLocale'>): Book {
  return {
    ...partial,
    language: 'English',
    translationSourceLocale: 'en',
    translationTargetLocale: 'zh-CN'
  };
}

export const mockBooks: Book[] = [
  createEnglishBook({
    id: 'nodejs-design-patterns',
    title: 'Node.js Design Patterns',
    author: 'Mario Casciaro / Luciano Mammino',
    description: 'Imported from local PDF. Covers async control flow, streams, architecture patterns, and production-ready Node.js design.',
    accentColor: '#2E6F40',
    sourcePdfLabel: 'Desktop PDF',
    sourcePdfUri: toDesktopPdfUri('/Users/daniel/Desktop/Node.js-Design-Patterns.pdf'),
    pages: [
      'Introduction\n\nNode.js Design Patterns frames Node.js as a runtime with a specific set of strengths and tradeoffs rather than a bag of APIs. The book starts by grounding the reader in the event loop, non-blocking I/O, and the reasons why concurrency in Node.js is mostly about coordination instead of threads. That framing matters because every later design choice, from module boundaries to service decomposition, depends on understanding what the runtime is actually good at.',
      'Node.js Platform Principles\n\nA recurring theme in the book is that performance does not come from clever syntax. It comes from respecting the runtime model. When a team learns how the event loop schedules work, how callbacks re-enter application logic, and how external systems influence latency, they stop treating asynchronous code as incidental complexity. Instead, they begin to model it explicitly. That shift leads to clearer service boundaries, better error handling, and less accidental blocking code in hot paths.',
      'Modules and Encapsulation\n\nThe chapters on modules explain that a module is not just a file. It is an agreement about visibility, change tolerance, and ownership. CommonJS and ES modules are presented as mechanisms, but the real lesson is architectural: if a module leaks too much internal detail, the entire codebase becomes harder to evolve. The book repeatedly shows how to hide construction details, expose small stable contracts, and design a system where replacement and testing are expected rather than painful exceptions.',
      'Callbacks, Promises, and Control Flow\n\nThe asynchronous control flow chapters move from callback conventions to Promise chains and async functions, but they do not pretend that syntax eliminates complexity. The deeper concern is how to model retries, timeouts, cancellation, fan-out, fan-in, and partial failure. Good asynchronous code is not merely readable. It is observable and interruptible. The book makes that distinction clear by showing how quickly business logic becomes fragile when sequencing, resource cleanup, and concurrency limits are not treated as first-class design problems.',
      'Streams and Backpressure\n\nStreams are presented as one of Node.js most distinctive capabilities because they transform data handling from a load-everything-first model into a flow-based model. A reader who understands streams understands backpressure, and a reader who understands backpressure can design systems that remain stable under load. The book uses streams to explain that data pipelines are architectural structures. They are not just utilities. Once data is modeled as a flow, memory behavior, throughput, and failure handling all become easier to reason about.',
      'Creational and Structural Patterns\n\nThe patterns chapters are adapted to the way JavaScript and Node.js code is actually written. Factories, dependency injection, adapters, proxies, and decorators are not introduced as ceremonial abstractions. They are shown as practical ways to remove construction logic from business logic, isolate third-party integrations, and add capabilities like caching or authorization without turning a core module into a tangled conditional mess. The benefit is not elegance for its own sake. The benefit is controlled change.',
      'Behavioral Patterns and Messaging\n\nBehavioral patterns appear when business rules become too large for ad hoc conditionals. Strategy, observer, command, and state-oriented designs help separate decisions from execution. That same mindset scales into message-driven systems, queues, and event buses. The book is strong when it explains that once a system crosses process boundaries, architecture is no longer just about code reuse. It becomes about consistency, idempotency, failure recovery, and the discipline required to keep distributed workflows understandable.',
      'Scalability and Production Practice\n\nThe final material ties patterns back to production reality. Clustering, worker threads, distributed load, configuration, logging, and resilience are treated as connected concerns. The book argues that maintainable Node.js systems come from aligning the runtime, the abstraction level, and the operational model. That is why the book remains useful: it does not ask the reader to memorize named patterns. It asks the reader to build systems whose structure matches the forces acting on them.'
    ]
  }),
  createEnglishBook({
    id: 'programming-typescript',
    title: 'Programming TypeScript',
    author: 'Boris Cherny',
    description: 'Imported from local PDF. Focuses on scalable TypeScript design, type-level modeling, tooling, and maintainable JavaScript migration.',
    accentColor: '#2F5FA7',
    sourcePdfLabel: 'Desktop PDF',
    sourcePdfUri: toDesktopPdfUri(
      '/Users/daniel/Desktop/Boris Cherny - Programming TypeScript_ Making Your JavaScript Applications Scale - O′Reilly (2019).pdf'
    ),
    pages: [
      'Introduction\n\nProgramming TypeScript treats the language as a design tool for building large JavaScript systems, not as a layer of optional annotations. Boris Cherny introduces TypeScript as a way to encode expectations, make change safer, and improve communication between humans and code. The core premise is that type systems are most valuable when they help teams express intent early, before assumptions turn into production bugs.',
      'The TypeScript Mindset\n\nA major contribution of the book is how it teaches readers to think in terms of values and types simultaneously. JavaScript remains dynamic at runtime, but TypeScript adds a compile-time model that can represent invariants, contracts, and legal state transitions. That model is not there to replace testing or thoughtful API design. It is there to catch mismatches earlier and force clarity about what a function accepts, what it returns, and what states are impossible.',
      'Type Inference and Annotation Discipline\n\nThe book repeatedly recommends restraint. Annotate where it sharpens boundaries, but let inference carry local details where possible. That balance keeps code expressive without turning every file into a wall of syntax. Strong TypeScript code is not the code with the most annotations. It is the code whose public surface is precise, whose generics have a purpose, and whose implementation remains readable enough for ordinary application engineers to maintain.',
      'Interfaces, Aliases, and Domain Modeling\n\nWhen Cherny discusses interfaces, unions, intersections, and literal types, the emphasis is on modeling the domain rather than modeling implementation trivia. Types become a way to describe business states with more rigor. Instead of scattering loose objects and booleans throughout a codebase, developers can create richer models that document what combinations are valid. This is where TypeScript starts to change architecture, because it influences how teams shape data flow and reason about edge cases.',
      'Generics and Reuse\n\nThe generics chapters show how abstraction can remain safe without becoming abstract for its own sake. Generic functions and data structures are useful when they preserve relationships between inputs and outputs, not when they simply remove duplication. The book does a good job distinguishing between reusable code and overly clever code. Well-designed generics make APIs predictable and composable. Poorly designed generics create confusion, widen types accidentally, and hide intent.',
      'Errors, Async Code, and Interop\n\nAnother practical strength of the book is its attention to real-world boundaries. TypeScript must coexist with JavaScript libraries, browser APIs, Node.js APIs, and imperfect external typings. Cherny walks through how to type asynchronous flows, manage nullability, narrow unknown values, and integrate with ambient declarations. The message is that type safety is not a switch you flip. It is a gradient you improve over time by tightening the most error-prone boundaries first.',
      'Tooling and Migration Strategy\n\nFor teams adopting TypeScript incrementally, the migration guidance is especially useful. The book recognizes that legacy JavaScript systems cannot be rewritten in one pass. Instead, it recommends using compiler options, declaration files, and progressive strictness to move toward safer code without freezing delivery. That pragmatic stance makes the book valuable for working engineers because it treats adoption as an organizational process, not just a language exercise.',
      'Scaling JavaScript Applications\n\nThe closing idea is that TypeScript scales by making assumptions explicit. As applications grow, more people touch the same modules, more data crosses boundaries, and more refactors happen under time pressure. Types create a shared language that helps engineers move faster without relying entirely on memory or tribal knowledge. Programming TypeScript is persuasive because it keeps returning to that point: type systems are ultimately about making large systems easier to understand and safer to change.'
    ]
  })
];
