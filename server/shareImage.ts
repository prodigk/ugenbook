import sharp from "sharp";

export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 630;
const COVER_MAX_WIDTH = 1120;
const COVER_MAX_HEIGHT = 550;
const BACKGROUND = "#f4f4f4";

export async function renderShareImage(coverBytes: Buffer): Promise<Buffer> {
  const cover = await sharp(coverBytes, { limitInputPixels: 30_000_000 })
    .rotate()
    .resize({ width: COVER_MAX_WIDTH, height: COVER_MAX_HEIGHT, fit: "inside" })
    .toBuffer({ resolveWithObject: true });

  return sharp({
    create: {
      width: SHARE_IMAGE_WIDTH,
      height: SHARE_IMAGE_HEIGHT,
      channels: 3,
      background: BACKGROUND,
    },
  })
    .composite([{
      input: cover.data,
      left: Math.floor((SHARE_IMAGE_WIDTH - cover.info.width) / 2),
      top: Math.floor((SHARE_IMAGE_HEIGHT - cover.info.height) / 2),
    }])
    .jpeg({ quality: 88 })
    .toBuffer();
}
