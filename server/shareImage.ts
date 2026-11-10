import sharp from "sharp";

export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 630;
const COVER_MAX_WIDTH = 1120;
const COVER_MAX_HEIGHT = 550;
const BACKGROUND = "#f4f4f4";
const SHADOW_PADDING = 28;
const SHADOW_OFFSET_Y = 10;

export async function renderShareImage(coverBytes: Buffer): Promise<Buffer> {
  const cover = await sharp(coverBytes, { limitInputPixels: 30_000_000 })
    .rotate()
    .resize({ width: COVER_MAX_WIDTH, height: COVER_MAX_HEIGHT, fit: "inside" })
    .toBuffer({ resolveWithObject: true });
  const coverLeft = Math.floor((SHARE_IMAGE_WIDTH - cover.info.width) / 2);
  const coverTop = Math.floor((SHARE_IMAGE_HEIGHT - cover.info.height) / 2);

  const shadowBase = await sharp({
    create: {
      width: cover.info.width,
      height: cover.info.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0.2 },
    },
  })
    .extend({
      top: SHADOW_PADDING,
      right: SHADOW_PADDING,
      bottom: SHADOW_PADDING,
      left: SHADOW_PADDING,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const shadow = await sharp(shadowBase).blur(16).png().toBuffer();

  return sharp({
    create: {
      width: SHARE_IMAGE_WIDTH,
      height: SHARE_IMAGE_HEIGHT,
      channels: 3,
      background: BACKGROUND,
    },
  })
    .composite([
      {
        input: shadow,
        left: coverLeft - SHADOW_PADDING,
        top: coverTop - SHADOW_PADDING + SHADOW_OFFSET_Y,
      },
      { input: cover.data, left: coverLeft, top: coverTop },
    ])
    .jpeg({ quality: 88 })
    .toBuffer();
}
