import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

/** Generate original PNG icons without external image libraries. */
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length, 0);
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([head, name, data, tail]);
}
function renderIcon(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const a = x / size, b = y / size;
      const border = a > .058 && a < .942 && b > .058 && b < .942;
      const inside = a > .078 && a < .922 && b > .078 && b < .922;
      const stem = a >= .265 && a <= .355 && b >= .22 && b <= .79;
      const top = a >= .3 && a <= .67 && b >= .22 && b <= .31;
      const mid = a >= .3 && a <= .66 && b >= .44 && b <= .53;
      const bowl = a >= .62 && a <= .71 && b >= .25 && b <= .49;
      const leg = b >= .5 && b <= .80 && Math.abs(a - (.54 + (b-.5)*.62)) < .06;
      let rgb;
      if (stem || top || mid || bowl || leg) rgb = [164,203,159];
      else if (border && !inside) rgb = [105,150,118];
      else if (inside) rgb = [23,43,43];
      else rgb = [13,19,26];
      const pos = row + 1 + x * 4;
      raw[pos] = rgb[0]; raw[pos+1] = rgb[1]; raw[pos+2] = rgb[2]; raw[pos+3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}
for (const size of [192, 512]) {
  writeFileSync("docs/icon-" + size + ".png", renderIcon(size));
  process.stdout.write("Created docs/icon-" + size + ".png\n");
}
