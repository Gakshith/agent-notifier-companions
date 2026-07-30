import { describe, expect, it } from 'vitest';
import { buildCliCommand, buildInstallUrl, formatCliCommand } from './install-url';

describe('buildInstallUrl', () => {
  it('wraps an https url in the install deep link', () => {
    expect(buildInstallUrl('https://example.com/packs/community.fox/pack.zip')).toBe(
      'agent-notifier://install?url=https%3A%2F%2Fexample.com%2Fpacks%2Fcommunity.fox%2Fpack.zip',
    );
  });

  it('percent-encodes characters that would break the query', () => {
    expect(buildInstallUrl('https://example.com/x?c=1&d=2')).toBe(
      'agent-notifier://install?url=https%3A%2F%2Fexample.com%2Fx%3Fc%3D1%26d%3D2',
    );
  });

  it('round-trips a url that already contains a percent-encoded sequence', () => {
    const original = 'https://example.com/a%20b';
    const link = buildInstallUrl(original);
    const encoded = link.slice('agent-notifier://install?url='.length);
    expect(decodeURIComponent(encoded)).toBe(original);
  });

  it('does not leak leading whitespace into the emitted link', () => {
    // requireHttpsUrl validates via `new URL(...)`, which strips leading C0
    // whitespace during parsing. Emitting parsed.toString() means the link
    // reflects the normalized value, not the raw whitespace-prefixed input.
    const link = buildInstallUrl(' https://example.com/x');
    expect(link).toBe('agent-notifier://install?url=https%3A%2F%2Fexample.com%2Fx');
  });

  it.each([
    ['http', 'http://example.com/pack.zip'],
    ['a relative path', '/packs/community.fox/pack.zip'],
    ['a javascript url', 'javascript:alert(1)'],
    ['an empty string', ''],
  ])('rejects %s', (_label, value) => {
    expect(() => buildInstallUrl(value)).toThrow(/https/i);
  });
});

describe('buildCliCommand', () => {
  it('builds the equivalent terminal command', () => {
    expect(buildCliCommand('https://example.com/pack.zip')).toBe(
      'agent-notifier companion install https://example.com/pack.zip',
    );
  });

  it('rejects a non-https url', () => {
    expect(() => buildCliCommand('http://example.com/pack.zip')).toThrow(/https/i);
  });
});

describe('formatCliCommand', () => {
  it('uses the same wording as buildCliCommand', () => {
    const url = 'https://example.com/pack.zip';
    expect(formatCliCommand(url)).toBe(buildCliCommand(url));
  });

  it('accepts a local http url so the dev server can show a usable command', () => {
    expect(formatCliCommand('http://localhost:3000/packs/community.fox/pack.zip')).toBe(
      'agent-notifier companion install http://localhost:3000/packs/community.fox/pack.zip',
    );
  });
});
