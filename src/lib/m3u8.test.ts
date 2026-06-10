import { createM3u8ProxyUrl, filterAdsFromM3U8, rewriteM3u8Urls } from './m3u8';

const SOURCE_URL = 'https://cdn.example.com/video/master.m3u8';
const PROXY_BASE_URL = 'https://app.example.com/api/m3u8-proxy';

describe('m3u8 helpers', () => {
  it('removes discontinuity lines when filtering ads', () => {
    const result = filterAdsFromM3U8(
      ['#EXTM3U', '#EXT-X-DISCONTINUITY', '#EXTINF:6,', 'seg001.ts'].join('\n')
    );

    expect(result).toBe(['#EXTM3U', '#EXTINF:6,', 'seg001.ts'].join('\n'));
  });

  it('preserves discontinuity lines when only rewriting urls', () => {
    const result = rewriteM3u8Urls(
      ['#EXTM3U', '#EXT-X-DISCONTINUITY', '#EXTINF:6,', 'seg001.ts'].join('\n'),
      SOURCE_URL,
      PROXY_BASE_URL,
      false
    );

    expect(result).toContain('#EXT-X-DISCONTINUITY');
  });

  it('rewrites relative segment urls to absolute urls', () => {
    const result = rewriteM3u8Urls(
      ['#EXTM3U', '#EXTINF:6,', 'seg001.ts'].join('\n'),
      SOURCE_URL,
      PROXY_BASE_URL,
      true
    );

    expect(result).toContain('https://cdn.example.com/video/seg001.ts');
  });

  it('rewrites variant playlist urls back through the proxy', () => {
    const variantUrl = 'https://cdn.example.com/video/720/index.m3u8';
    const result = rewriteM3u8Urls(
      ['#EXTM3U', '#EXT-X-STREAM-INF:BANDWIDTH=800000', '720/index.m3u8'].join(
        '\n'
      ),
      SOURCE_URL,
      PROXY_BASE_URL,
      true
    );

    expect(result).toContain(
      createM3u8ProxyUrl(variantUrl, PROXY_BASE_URL, true)
    );
  });

  it('rewrites key and map uri attributes to absolute urls', () => {
    const result = rewriteM3u8Urls(
      [
        '#EXTM3U',
        '#EXT-X-KEY:METHOD=AES-128,URI="keys/key.key"',
        '#EXT-X-MAP:URI="init.mp4"',
      ].join('\n'),
      SOURCE_URL,
      PROXY_BASE_URL,
      true
    );

    expect(result).toContain(
      'URI="https://cdn.example.com/video/keys/key.key"'
    );
    expect(result).toContain('URI="https://cdn.example.com/video/init.mp4"');
  });
});
