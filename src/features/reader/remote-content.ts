import { BookRemoteContent, BookRemoteContentPayload, BookTocItem } from '../../types/book';

const remoteContentCache = new Map<string, BookRemoteContentPayload>();

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isTableOfContents(value: unknown): value is BookTocItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.title === 'string' &&
        typeof item.summary === 'string' &&
        typeof item.pageIndex === 'number' &&
        (typeof item.pdfPageLabel === 'undefined' || typeof item.pdfPageLabel === 'string')
    )
  );
}

function normalizePayload(payload: unknown): BookRemoteContentPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('远端全文返回格式无效');
  }

  const candidate = payload as Record<string, unknown>;

  if (!isStringArray(candidate.pages) || candidate.pages.length === 0) {
    throw new Error('远端全文缺少可用 pages');
  }

  if (typeof candidate.translatedPages !== 'undefined' && !isStringArray(candidate.translatedPages)) {
    throw new Error('远端译文 pages 格式无效');
  }

  if (typeof candidate.tableOfContents !== 'undefined' && !isTableOfContents(candidate.tableOfContents)) {
    throw new Error('远端目录格式无效');
  }

  return {
    pages: candidate.pages,
    translatedPages: candidate.translatedPages,
    tableOfContents: candidate.tableOfContents,
    totalPdfPages: typeof candidate.totalPdfPages === 'number' ? candidate.totalPdfPages : undefined,
    sourcePdfLabel: typeof candidate.sourcePdfLabel === 'string' ? candidate.sourcePdfLabel : undefined,
    sourcePdfUri: typeof candidate.sourcePdfUri === 'string' ? candidate.sourcePdfUri : undefined,
    description: typeof candidate.description === 'string' ? candidate.description : undefined
  };
}

export async function loadRemoteBookContent(source: BookRemoteContent) {
  if (!source.manifestUrl) {
    throw new Error('未配置 EXPO_PUBLIC_READER_CONTENT_BASE_URL');
  }

  const cacheKey = `${source.manifestUrl}@${source.version}`;
  const cached = remoteContentCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await fetch(source.manifestUrl, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`远端全文请求失败（${response.status}）`);
  }

  const payload = normalizePayload(await response.json());
  remoteContentCache.set(cacheKey, payload);
  return payload;
}
