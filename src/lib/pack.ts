export type MovementStyle = 'airborne' | 'grounded' | 'hovering';
export type LoopMode = 'forward' | 'pingPong';

export type PackAnimation = {
  fps: number;
  frameCount: number;
  width: number;
  height: number;
  loop: LoopMode;
};

export type PackMeta = {
  version: 2;
  id: string;
  displayName: string;
  author: string;
  summary: string;
  symbolName: string;
  movementStyle: MovementStyle;
  renderer: 'sprite';
  animation: PackAnimation;
};

export const RESERVED_PACK_IDS: readonly string[] = ['butterfly', 'firecracker'];

const MOVEMENT_STYLES: readonly MovementStyle[] = ['airborne', 'grounded', 'hovering'];
const LOOP_MODES: readonly LoopMode[] = ['forward', 'pingPong'];
const ID_PATTERN = /^community\.[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

// Control characters carry no meaning in a display string and can corrupt
// terminal output, so they are removed rather than rejected. Match the Unicode
// control category. Do NOT write this as a literal character range: it is very
// easy to mistype into a range that also strips spaces and hyphens.
function cleanText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string`);
  }
  const cleaned = value.replace(/\p{Cc}/gu, '').trim();
  if (cleaned.length === 0) {
    throw new Error(`${field} must not be empty`);
  }
  if (cleaned.length > maxLength) {
    throw new Error(`${field} must be at most ${maxLength} characters`);
  }
  return cleaned;
}

function boundedInteger(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`animation.${field} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function validateAnimation(raw: unknown): PackAnimation {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('animation must be an object');
  }
  const source = raw as Record<string, unknown>;
  if (!LOOP_MODES.includes(source.loop as LoopMode)) {
    throw new Error(`animation.loop must be one of ${LOOP_MODES.join(', ')}`);
  }
  return {
    fps: boundedInteger(source.fps, 'fps', 1, 24),
    frameCount: boundedInteger(source.frameCount, 'frameCount', 1, 96),
    width: boundedInteger(source.width, 'width', 16, 512),
    height: boundedInteger(source.height, 'height', 16, 512),
    loop: source.loop as LoopMode,
  };
}

export function validatePackMeta(raw: unknown): PackMeta {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('pack metadata must be an object');
  }
  const source = raw as Record<string, unknown>;

  if (source.version !== 2) {
    throw new Error('version must be 2');
  }

  const id = typeof source.id === 'string' ? source.id : '';
  if (RESERVED_PACK_IDS.includes(id)) {
    throw new Error(`id "${id}" is reserved for a built-in companion`);
  }
  if (!ID_PATTERN.test(id)) {
    throw new Error(`id "${id}" must match community.<slug>`);
  }

  if (source.renderer !== 'sprite') {
    throw new Error('renderer must be "sprite"');
  }
  if (!MOVEMENT_STYLES.includes(source.movementStyle as MovementStyle)) {
    throw new Error(`movementStyle must be one of ${MOVEMENT_STYLES.join(', ')}`);
  }

  const symbolName = cleanText(source.symbolName, 'symbolName', 60);
  if (!/^[A-Za-z0-9.]+$/.test(symbolName)) {
    throw new Error('symbolName may contain only letters, digits, and dots');
  }

  return {
    version: 2,
    id,
    displayName: cleanText(source.displayName, 'displayName', 40),
    author: cleanText(source.author, 'author', 60),
    summary: cleanText(source.summary, 'summary', 160),
    symbolName,
    movementStyle: source.movementStyle as MovementStyle,
    renderer: 'sprite',
    animation: validateAnimation(source.animation),
  };
}
