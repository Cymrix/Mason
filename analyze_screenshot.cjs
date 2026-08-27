const fs = require('fs');
const { PNG } = require('pngjs');

function analyze(file) {
  const data = fs.readFileSync(file);
  const png = PNG.sync.read(data);
  let rSum = 0, gSum = 0, bSum = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      rSum += png.data[idx];
      gSum += png.data[idx+1];
      bSum += png.data[idx+2];
    }
  }
  const count = png.width * png.height;
  console.log(`${file}: Avg RGB = [${Math.round(rSum/count)}, ${Math.round(gSum/count)}, ${Math.round(bSum/count)}]`);
}
analyze('screenshot_sprite.png');
analyze('screenshot_app.png');
