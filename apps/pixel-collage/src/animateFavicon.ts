const HEART = [
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
];

const COLS = HEART[0].length;
const ROWS = HEART.length;
const SIZE = 32;
const CELL = SIZE / COLS;
const OFFSET_Y = (SIZE - ROWS * CELL) / 2;
const COLOR = "#ff4f8a";
const HIGHLIGHT = "#ff87b2";

export function animateFavicon() {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d")!;

    const link =
        document.querySelector<HTMLLinkElement>("link[rel='icon']") ??
        document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    document.head.appendChild(link);

    let angle = 0;
    const SPEED = (2 * Math.PI) / 300;

    function draw() {
        const scaleX = Math.cos(angle);
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.save();
        ctx.translate(SIZE / 2, 0);
        ctx.scale(scaleX, 1);
        ctx.translate(-SIZE / 2, 0);

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (!HEART[row][col]) continue;
                ctx.fillStyle = row === 1 && col === 2 ? HIGHLIGHT : COLOR;
                ctx.fillRect(col * CELL, OFFSET_Y + row * CELL, CELL, CELL);
            }
        }

        ctx.restore();
        link.href = canvas.toDataURL("image/png");
        angle += SPEED;
        requestAnimationFrame(draw);
    }

    draw();
}
