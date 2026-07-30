import { describe, expect, it } from 'vitest';
import { crc32, inflateSync } from 'node:zlib';
import { encodePng } from './png.mjs';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function readChunks(png) {
  const chunks = [];
  let offset = 8;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString('ascii');
    const data = png.subarray(offset + 8, offset + 8 + length);
    const crc = png.subarray(offset + 8 + length, offset + 12 + length);
    chunks.push({ type, data, crc });
    offset += 12 + length;
  }
  return chunks;
}

describe('encodePng', () => {
  it('starts with the PNG signature', () => {
    const png = encodePng(2, 2, Buffer.alloc(2 * 2 * 4, 0xff));
    expect(png.subarray(0, 8)).toEqual(SIGNATURE);
  });

  it('writes IHDR, IDAT, and IEND in order', () => {
    const png = encodePng(2, 2, Buffer.alloc(2 * 2 * 4, 0xff));
    expect(readChunks(png).map((chunk) => chunk.type)).toEqual(['IHDR', 'IDAT', 'IEND']);
  });

  it('declares 8-bit RGBA in IHDR', () => {
    const png = encodePng(3, 5, Buffer.alloc(3 * 5 * 4, 0x40));
    const ihdr = readChunks(png).find((chunk) => chunk.type === 'IHDR').data;
    expect(ihdr.readUInt32BE(0)).toBe(3);
    expect(ihdr.readUInt32BE(4)).toBe(5);
    expect(ihdr[8]).toBe(8);
    expect(ihdr[9]).toBe(6);
  });

  it('round-trips pixel data with a filter byte per row', () => {
    const rgba = Buffer.from([
      1, 2, 3, 4, 5, 6, 7, 8,
      9, 10, 11, 12, 13, 14, 15, 16,
    ]);
    const png = encodePng(2, 2, rgba);
    const idat = readChunks(png).find((chunk) => chunk.type === 'IDAT').data;
    const raw = inflateSync(idat);
    expect(raw).toEqual(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 9, 10, 11, 12, 13, 14, 15, 16]));
  });

  it('rejects a buffer whose length does not match the dimensions', () => {
    expect(() => encodePng(2, 2, Buffer.alloc(4))).toThrow(/length/i);
  });

  it('writes a valid CRC trailer for every chunk, per zlib.crc32', () => {
    const png = encodePng(2, 2, Buffer.alloc(2 * 2 * 4, 0xab));
    const chunks = readChunks(png);
    expect(chunks.map((c) => c.type)).toEqual(['IHDR', 'IDAT', 'IEND']);
    for (const { type, data, crc } of chunks) {
      const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
      const expected = crc32(typeAndData) >>> 0;
      expect(crc.readUInt32BE(0)).toBe(expected);
    }
  });
});
