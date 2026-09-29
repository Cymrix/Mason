/**
 * Lightweight, dependency-free GIF89a Animated Encoder
 * 
 * Supports:
 * - Multi-frame animation sequences
 * - Color quantization & custom color palettes (up to 256 colors)
 * - Transparency index support (alpha channel thresholding)
 * - Configurable frame delay (in milliseconds) and loop count
 * - Exports standard binary GIF89a Blob
 */

export interface GifFrameOptions {
  delayMs?: number; // Delay in milliseconds (default: 100ms = 10 FPS)
  transparentColor?: [number, number, number] | null; // RGB tuple for alpha transparency
}

export class GifEncoder {
  private width: number;
  private height: number;
  private frames: Array<{
    indexedPixels: Uint8Array;
    palette: number[][]; // Array of [R, G, B]
    transparentIndex: number;
    delay: number; // In 1/100ths of a second
  }> = [];
  private loopCount: number = 0; // 0 = infinite loop

  constructor(width: number, height: number, loopCount: number = 0) {
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
    this.loopCount = loopCount;
  }

  /**
   * Add a frame from HTMLCanvasElement or ImageData
   */
  public addFrame(source: HTMLCanvasElement | ImageData, options: GifFrameOptions = {}) {
    let imgData: ImageData;
    if (source instanceof HTMLCanvasElement) {
      const ctx = source.getContext('2d');
      if (!ctx) return;
      imgData = ctx.getImageData(0, 0, this.width, this.height);
    } else {
      imgData = source;
    }

    const { indexedPixels, palette, transparentIndex } = this.quantizeFrame(imgData);
    const delayCentisecs = Math.max(2, Math.round((options.delayMs || 100) / 10));

    this.frames.push({
      indexedPixels,
      palette,
      transparentIndex,
      delay: delayCentisecs
    });
  }

  /**
   * Quantize RGBA pixels to 256-color palette with transparency support
   */
  private quantizeFrame(imgData: ImageData): {
    indexedPixels: Uint8Array;
    palette: number[][];
    transparentIndex: number;
  } {
    const data = imgData.data;
    const pixelCount = this.width * this.height;
    const indexedPixels = new Uint8Array(pixelCount);

    const palette: number[][] = [];
    const colorMap = new Map<number, number>();

    // Index 0 reserved for full transparency
    const transparentIndex = 0;
    palette.push([0, 0, 0]); // Transparent placeholder
    colorMap.set(0, transparentIndex);

    for (let i = 0; i < pixelCount; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a < 64) {
        // Transparent pixel
        indexedPixels[i] = transparentIndex;
        continue;
      }

      // Quantize RGB channels slightly to 5 bits (0-31) to fit in 255 colors cleanly
      const qr = (r >> 3) << 3;
      const qg = (g >> 3) << 3;
      const qb = (b >> 3) << 3;
      const key = (qr << 16) | (qg << 8) | qb;

      let palIdx = colorMap.get(key);
      if (palIdx === undefined) {
        if (palette.length < 256) {
          palIdx = palette.length;
          palette.push([qr, qg, qb]);
          colorMap.set(key, palIdx);
        } else {
          // Palette full: find closest existing color
          let minDist = Infinity;
          let bestIdx = 1;
          for (let p = 1; p < palette.length; p++) {
            const pr = palette[p][0];
            const pg = palette[p][1];
            const pb = palette[p][2];
            const dist = (r - pr) * (r - pr) + (g - pg) * (g - pg) + (b - pb) * (b - pb);
            if (dist < minDist) {
              minDist = dist;
              bestIdx = p;
            }
          }
          palIdx = bestIdx;
        }
      }

      indexedPixels[i] = palIdx;
    }

    // Pad palette to power of 2 (at least 2, 4, 8, 16, 32, 64, 128, 256)
    while (palette.length < 256) {
      palette.push([0, 0, 0]);
    }

    return { indexedPixels, palette, transparentIndex };
  }

  /**
   * Encode binary GIF89a stream
   */
  public encode(): Blob {
    const bytes: number[] = [];

    // Helper writers
    const writeByte = (b: number) => bytes.push(b & 0xff);
    const writeWord = (w: number) => {
      bytes.push(w & 0xff);
      bytes.push((w >> 8) & 0xff);
    };
    const writeString = (s: string) => {
      for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i));
    };

    // 1. Header & Logical Screen Descriptor
    writeString('GIF89a');
    writeWord(this.width);
    writeWord(this.height);
    // GCT Flag: 0 (we use Local Color Tables for each frame for higher color fidelity)
    writeByte(0x70); // 8-bit color resolution, no GCT
    writeByte(0);    // Background color index
    writeByte(0);    // Pixel aspect ratio

    // 2. Netscape Loop Extension
    writeByte(0x21); // Extension Introducer
    writeByte(0xff); // Application Extension
    writeByte(11);   // Block Size
    writeString('NETSCAPE2.0');
    writeByte(3);    // Sub-block size
    writeByte(1);    // Loop sub-block ID
    writeWord(this.loopCount); // 0 = infinite
    writeByte(0);    // Block Terminator

    // 3. Write Frames
    for (const frame of this.frames) {
      // Graphic Control Extension
      writeByte(0x21); // Extension Introducer
      writeByte(0xf9); // Graphic Control Label
      writeByte(4);    // Byte size
      // Packed: Disposal Method (2 = Restore to Background), Transparent Color Flag (1 = yes)
      writeByte(0x09);
      writeWord(frame.delay); // Delay in centiseconds
      writeByte(frame.transparentIndex); // Transparent color index
      writeByte(0); // Block Terminator

      // Image Descriptor
      writeByte(0x2c); // Image separator
      writeWord(0);    // Left
      writeWord(0);    // Top
      writeWord(this.width);
      writeWord(this.height);
      // Local Color Table: Present (1), not interlaced, 256 colors (0x07)
      writeByte(0x87);

      // Local Color Table (256 * 3 bytes)
      for (let p = 0; p < 256; p++) {
        const col = frame.palette[p] || [0, 0, 0];
        writeByte(col[0]);
        writeByte(col[1]);
        writeByte(col[2]);
      }

      // LZW Image Data
      this.writeLzwData(bytes, frame.indexedPixels);
    }

    // 4. GIF Trailer
    writeByte(0x3b);

    return new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
  }

  /**
   * LZW compression encoder for GIF image raster
   */
  private writeLzwData(bytes: number[], pixels: Uint8Array) {
    const minCodeSize = 8;
    bytes.push(minCodeSize); // LZW Minimum Code Size

    const clearCode = 1 << minCodeSize; // 256
    const endCode = clearCode + 1;      // 257

    let curCodeSize = minCodeSize + 1;
    let nextCode = endCode + 1;

    // Dictionary using numeric keys: (prefix << 8) | char
    let dict = new Map<number, number>();

    const subBlock: number[] = [];
    let bitAccumulator = 0;
    let bitCount = 0;

    const outputCode = (code: number) => {
      bitAccumulator |= code << bitCount;
      bitCount += curCodeSize;

      while (bitCount >= 8) {
        subBlock.push(bitAccumulator & 0xff);
        bitAccumulator >>= 8;
        bitCount -= 8;

        if (subBlock.length === 255) {
          bytes.push(255);
          for (let i = 0; i < 255; i++) bytes.push(subBlock[i]);
          subBlock.length = 0;
        }
      }
    };

    const flushBits = () => {
      while (bitCount > 0) {
        subBlock.push(bitAccumulator & 0xff);
        bitAccumulator >>= 8;
        bitCount = Math.max(0, bitCount - 8);

        if (subBlock.length === 255) {
          bytes.push(255);
          for (let i = 0; i < 255; i++) bytes.push(subBlock[i]);
          subBlock.length = 0;
        }
      }

      if (subBlock.length > 0) {
        bytes.push(subBlock.length);
        for (let i = 0; i < subBlock.length; i++) bytes.push(subBlock[i]);
        subBlock.length = 0;
      }
    };

    // Output Clear Code
    outputCode(clearCode);

    if (pixels.length === 0) {
      outputCode(endCode);
      flushBits();
      bytes.push(0); // Terminator
      return;
    }

    let prefix = pixels[0];

    for (let i = 1; i < pixels.length; i++) {
      const c = pixels[i];
      const key = (prefix << 8) | c;

      if (dict.has(key)) {
        prefix = dict.get(key)!;
      } else {
        outputCode(prefix);

        if (nextCode < 4096) {
          dict.set(key, nextCode++);
          if (nextCode === (1 << curCodeSize) && curCodeSize < 12) {
            curCodeSize++;
          }
        } else {
          // Dictionary full: reset
          outputCode(clearCode);
          dict.clear();
          curCodeSize = minCodeSize + 1;
          nextCode = endCode + 1;
        }

        prefix = c;
      }
    }

    outputCode(prefix);
    outputCode(endCode);
    flushBits();
    bytes.push(0); // Sub-block Terminator
  }
}
