import * as path from "path";
const {
  createCanvas,
  registerFont,
  loadImage
} = require("canvas");

export default async (req, res) => {
  const forwardText = req.query.forwardText || "";
  const backwardText = req.query.backwardText || "";
  const isShow = req.query.isShow || false;

  function splitByMeasureWidth(str, maxWidth, context) {
    const lines = [];
    let line = "";
    str.split("").forEach((char) => {
      line += char;
      if (context.measureText(line).width > maxWidth) {
        lines.push(line.slice(0, -1));
        line = line.slice(-1);
      }
    });
    lines.push(line);
    return lines;
  }

  function generareBackwardText(_backwardText, isShow) {
    if (isShow) {
      return _backwardText
    }
    // backward の生成
    let array = [];
    for (let index = 0; index < _backwardText.length; index++) {
      array.push("○");
    }

    const backwardText = array.join("");
    return backwardText
  }

  async function generateImage(forwardText, _backwardText, isShow) {
    const CANVAS_WIDTH = 1200;
    const CANVAS_HEIGHT = 630;

    const TEXT_COLOR = "#000000";
    const TEXT_SIZE = 60;
    const TEXT_LINE_MARGIN_SIZE = 16;
    const TEXT_MARGIN_X = 68;

    const FONT_FAMILY = "logotypejp_corpmin";
    const FONT_PATH = path.join(__dirname, "..", "fonts", "logotypejp_corpmin.ttf");

    const BACKGROUND_IMAGE_PATH = path.join(__dirname, "..", "images", "ogp-trivia-background.png");
    registerFont(FONT_PATH, {
      family: FONT_FAMILY
    });
    const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const context = canvas.getContext("2d");

    // Add background
    const backgroundImage = await loadImage(BACKGROUND_IMAGE_PATH);
    context.drawImage(backgroundImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.font = `${TEXT_SIZE}px ${FONT_FAMILY}`;
    context.fillStyle = TEXT_COLOR;

    const backwardText = generareBackwardText(_backwardText, isShow)

    const textLines = [
      ...splitByMeasureWidth(forwardText, CANVAS_WIDTH - TEXT_MARGIN_X, context),
      ...splitByMeasureWidth(backwardText, CANVAS_WIDTH - TEXT_MARGIN_X, context),
    ];

    let lineY = CANVAS_HEIGHT / 2 - ((TEXT_SIZE + TEXT_LINE_MARGIN_SIZE) / 2) * (textLines.length - 1);

    textLines.forEach((line) => {
      const textWidth = context.measureText(line).width;
      context.fillText(line, (CANVAS_WIDTH - textWidth) / 2, lineY);
      lineY += TEXT_SIZE + TEXT_LINE_MARGIN_SIZE;
    });

    return canvas.toBuffer();
  }

  try {
    const image = await generateImage(forwardText, backwardText, isShow);

    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": image.length,
    });

    res.end(image, "binary");
  } catch (error) {
    console.log(error);
    res.end(error.message);
  }
};
