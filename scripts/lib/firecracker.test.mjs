import { describe, expect, it } from 'vitest';
import { renderFrame, WIDTH, HEIGHT, FRAME_COUNT, clampByte } from './firecracker.mjs';

function alphaAt(buf, x, y) {
  return buf[(y * WIDTH + x) * 4 + 3];
}

describe('firecracker simulation', () => {
  it('is deterministic: rendering the same frame twice yields identical bytes', () => {
    const a = renderFrame(20);
    const b = renderFrame(20);
    expect(Buffer.compare(a, b)).toBe(0);
  });

  it('returns a buffer of exactly WIDTH * HEIGHT * 4 bytes for any frame index', () => {
    for (const i of [0, 1, 12, 24, 36, FRAME_COUNT - 1]) {
      expect(renderFrame(i).length).toBe(WIDTH * HEIGHT * 4);
    }
  });

  it('is genuinely transparent at the corners, where nothing is ever drawn', () => {
    for (let i = 0; i < FRAME_COUNT; i += 3) {
      const frame = renderFrame(i);
      expect(alphaAt(frame, 0, 0)).toBe(0);
      expect(alphaAt(frame, WIDTH - 1, 0)).toBe(0);
      expect(alphaAt(frame, 0, HEIGHT - 1)).toBe(0);
      expect(alphaAt(frame, WIDTH - 1, HEIGHT - 1)).toBe(0);
    }
  });

  it('has visible non-zero alpha pixels by the middle of the show', () => {
    const frame = renderFrame(Math.floor(FRAME_COUNT / 2));
    let visiblePixels = 0;
    for (let i = 3; i < frame.length; i += 4) {
      if (frame[i] > 0) visiblePixels += 1;
    }
    expect(visiblePixels).toBeGreaterThan(0);
  });

  it('clamps additive overlap to 255 instead of wrapping around a byte', () => {
    // Two overlapping full-brightness sparks would sum well past 255; a naive
    // `Uint8Array` write wraps (256 -> 0) instead of clamping, so this pins
    // down the exact behaviour the render buffer relies on.
    expect(clampByte(255)).toBe(255);
    expect(clampByte(256)).toBe(255);
    expect(clampByte(999)).toBe(255);
    expect(clampByte(-10)).toBe(0);
  });

  it('has at least 300 lit pixels (alpha > 10) on every frame of the loop', () => {
    // The hero preview is a looping <img>; a visitor can land on ANY frame,
    // not just the middle of the show. A blank arrival frame (historically
    // frame index 0) reads as a broken/empty embed, so every frame must have
    // a baseline of visible activity -- no dead spots across the loop.
    const offenders = [];
    for (let i = 0; i < FRAME_COUNT; i += 1) {
      const frame = renderFrame(i);
      let litPixels = 0;
      for (let p = 3; p < frame.length; p += 4) {
        if (frame[p] > 10) litPixels += 1;
      }
      if (litPixels < 300) offenders.push(`frame ${i}: ${litPixels} lit pixels`);
    }
    expect(offenders, `frames below the 300 lit-pixel floor:\n${offenders.join('\n')}`).toEqual([]);
  });
});
