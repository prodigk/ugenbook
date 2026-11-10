import sharp from "sharp";
import { expect, it } from "vitest";
import { renderShareImage, SHARE_IMAGE_HEIGHT, SHARE_IMAGE_WIDTH } from "../../server/shareImage";

it("keeps the complete portrait cover on a light gray landscape card", async () => {
  const red = await sharp({ create: { width: 300, height: 100, channels: 3, background: "#ee2222" } }).png().toBuffer();
  const blue = await sharp({ create: { width: 300, height: 100, channels: 3, background: "#2222ee" } }).png().toBuffer();
  const cover = await sharp({ create: { width: 300, height: 600, channels: 3, background: "#22aa22" } })
    .composite([{ input: red, top: 0, left: 0 }, { input: blue, top: 500, left: 0 }])
    .png()
    .toBuffer();

  const output = await renderShareImage(cover);
  const { data, info } = await sharp(output).raw().toBuffer({ resolveWithObject: true });
  expect([info.width, info.height]).toEqual([SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT]);

  const pixel = (x: number, y: number) => {
    const start = (y * info.width + x) * info.channels;
    return [...data.subarray(start, start + 3)];
  };
  const background = pixel(50, 315);
  expect(background.every((channel) => Math.abs(channel - 244) < 5)).toBe(true);
  expect(pixel(600, 50)[0]).toBeGreaterThan(180);
  expect(pixel(600, 315)[1]).toBeGreaterThan(120);
  expect(pixel(600, 580)[2]).toBeGreaterThan(180);
});
