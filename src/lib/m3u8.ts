export function filterAdsFromM3U8(m3u8Content: string): string {
  if (!m3u8Content) return '';

  return m3u8Content
    .split('\n')
    .filter((line) => !line.includes('#EXT-X-DISCONTINUITY'))
    .join('\n');
}

export function createM3u8ProxyUrl(
  sourceUrl: string,
  proxyBaseUrl: string,
  filter: boolean
): string {
  const proxyUrl = new URL(proxyBaseUrl);
  proxyUrl.searchParams.set('url', sourceUrl);
  proxyUrl.searchParams.set('filter', filter ? '1' : '0');
  return proxyUrl.toString();
}

export function rewriteM3u8Urls(
  m3u8Content: string,
  sourceUrl: string,
  proxyBaseUrl: string,
  filter: boolean
): string {
  if (!m3u8Content) return '';

  return m3u8Content
    .split('\n')
    .map((line) => rewriteM3u8Line(line, sourceUrl, proxyBaseUrl, filter))
    .join('\n');
}

function rewriteM3u8Line(
  line: string,
  sourceUrl: string,
  proxyBaseUrl: string,
  filter: boolean
): string {
  const trimmedLine = line.trim();
  if (!trimmedLine) return line;

  if (trimmedLine.startsWith('#')) {
    return rewriteUriAttributes(line, sourceUrl, proxyBaseUrl, filter);
  }

  const absoluteUrl = resolveUrl(trimmedLine, sourceUrl);
  return isM3u8Url(absoluteUrl)
    ? createM3u8ProxyUrl(absoluteUrl, proxyBaseUrl, filter)
    : absoluteUrl;
}

function rewriteUriAttributes(
  line: string,
  sourceUrl: string,
  proxyBaseUrl: string,
  filter: boolean
): string {
  const shouldProxyPlaylistUri =
    !line.startsWith('#EXT-X-KEY:') && !line.startsWith('#EXT-X-MAP:');

  return line.replace(/URI=("[^"]+"|[^,]*)/g, (match, rawValue: string) => {
    const quote = rawValue.startsWith('"') ? '"' : '';
    const uri = quote ? rawValue.slice(1, -1) : rawValue;
    if (!uri) return match;

    const absoluteUrl = resolveUrl(uri, sourceUrl);
    const rewrittenUrl =
      shouldProxyPlaylistUri && isM3u8Url(absoluteUrl)
        ? createM3u8ProxyUrl(absoluteUrl, proxyBaseUrl, filter)
        : absoluteUrl;

    return `URI=${quote}${rewrittenUrl}${quote}`;
  });
}

function resolveUrl(url: string, baseUrl: string): string {
  return new URL(url, baseUrl).toString();
}

function isM3u8Url(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith('.m3u8');
  } catch {
    return url.split('?')[0].split('#')[0].toLowerCase().endsWith('.m3u8');
  }
}
