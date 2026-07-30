import { describe, expect, it } from 'vitest';
import { validatePackMeta } from './pack';

const valid = {
  version: 2,
  id: 'community.fox',
  displayName: 'Fox',
  author: 'Jane Doe',
  summary: 'A sleepy fox that pads across the bottom of your screen',
  symbolName: 'pawprint',
  movementStyle: 'grounded',
  renderer: 'sprite',
  animation: { fps: 18, frameCount: 36, width: 384, height: 384, loop: 'forward' },
};

describe('validatePackMeta', () => {
  it('accepts a well-formed manifest', () => {
    expect(validatePackMeta(valid)).toEqual(valid);
  });

  it('rejects a non-object', () => {
    expect(() => validatePackMeta(null)).toThrow(/object/i);
  });

  it('rejects a version other than 2', () => {
    expect(() => validatePackMeta({ ...valid, version: 1 })).toThrow(/version/i);
  });

  it.each([
    ['missing the community prefix', 'fox'],
    ['an uppercase slug', 'community.Fox'],
    ['a leading hyphen', 'community.-fox'],
    ['a trailing hyphen', 'community.fox-'],
    ['an empty slug', 'community.'],
    ['an underscore', 'community.red_fox'],
  ])('rejects %s', (_label, id) => {
    expect(() => validatePackMeta({ ...valid, id })).toThrow(/id/i);
  });

  it('accepts hyphenated slugs', () => {
    expect(validatePackMeta({ ...valid, id: 'community.red-fox' }).id).toBe('community.red-fox');
  });

  it.each(['butterfly', 'firecracker'])('rejects the reserved id %s', (id) => {
    expect(() => validatePackMeta({ ...valid, id })).toThrow(/reserved/i);
  });

  it('rejects a renderer other than sprite', () => {
    expect(() => validatePackMeta({ ...valid, renderer: 'butterfly' })).toThrow(/renderer/i);
  });

  it('rejects the burst movement style', () => {
    expect(() => validatePackMeta({ ...valid, movementStyle: 'burst' })).toThrow(/movementStyle/i);
  });

  it('rejects a blank display name', () => {
    expect(() => validatePackMeta({ ...valid, displayName: '   ' })).toThrow(/displayName/i);
  });

  it('rejects an over-long summary', () => {
    expect(() => validatePackMeta({ ...valid, summary: 'x'.repeat(161) })).toThrow(/summary/i);
  });

  it('strips control characters from text fields', () => {
    const noisy = `Fo${String.fromCharCode(7)}x${String.fromCharCode(127)}`;
    const result = validatePackMeta({ ...valid, displayName: noisy });
    expect(result.displayName).toBe('Fox');
  });

  // Guards a real mistake: writing the control-character filter as a literal
  // range that also swallows spaces and hyphens.
  it('preserves spaces and hyphens in display names', () => {
    expect(validatePackMeta({ ...valid, displayName: 'Red-Tailed Fox' }).displayName).toBe(
      'Red-Tailed Fox',
    );
  });

  it('trims surrounding whitespace', () => {
    expect(validatePackMeta({ ...valid, author: '  Jane Doe  ' }).author).toBe('Jane Doe');
  });

  it.each([
    ['fps above the cap', { fps: 25 }],
    ['fps below one', { fps: 0 }],
    ['too many frames', { frameCount: 97 }],
    ['zero frames', { frameCount: 0 }],
    ['width above the cap', { width: 513 }],
    ['height below the floor', { height: 15 }],
    ['a non-integer fps', { fps: 12.5 }],
  ])('rejects %s', (_label, patch) => {
    expect(() =>
      validatePackMeta({ ...valid, animation: { ...valid.animation, ...patch } }),
    ).toThrow(/animation/i);
  });

  it('rejects an unknown loop mode', () => {
    expect(() =>
      validatePackMeta({ ...valid, animation: { ...valid.animation, loop: 'reverse' } }),
    ).toThrow(/loop/i);
  });

  it('accepts pingPong looping', () => {
    const result = validatePackMeta({
      ...valid,
      animation: { ...valid.animation, loop: 'pingPong' },
    });
    expect(result.animation.loop).toBe('pingPong');
  });
});
