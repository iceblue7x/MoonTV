import { NextRequest, NextResponse } from 'next/server';

import { filterAdsFromM3U8, rewriteM3u8Urls } from '@/lib/m3u8';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const shouldFilter = searchParams.get('filter') === '1';

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing m3u8 URL' }, { status: 400 });
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid m3u8 URL' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(sourceUrl.protocol)) {
    return NextResponse.json(
      { error: 'Unsupported m3u8 URL' },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const upstreamResponse = await fetch(sourceUrl.toString(), {
      headers: {
        Accept: 'application/vnd.apple.mpegurl, application/x-mpegURL, */*',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: upstreamResponse.statusText || 'Failed to fetch m3u8' },
        { status: 502 }
      );
    }

    const m3u8Content = await upstreamResponse.text();
    const filteredContent = shouldFilter
      ? filterAdsFromM3U8(m3u8Content)
      : m3u8Content;
    const proxyBaseUrl = `${origin}/api/m3u8-proxy`;
    const rewrittenContent = rewriteM3u8Urls(
      filteredContent,
      sourceUrl.toString(),
      proxyBaseUrl,
      shouldFilter
    );

    return new Response(rewrittenContent, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-transform',
        'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'm3u8 fetch timeout'
        : 'Error fetching m3u8';

    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}
