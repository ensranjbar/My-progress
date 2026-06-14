import zlib
import struct

ACCENT = (0xE8, 0x64, 0x3A)
WHITE = (0xFF, 0xFF, 0xFF)


def make_icon(size):
    px = [[ACCENT for _ in range(size)] for _ in range(size)]

    # Three bars forming a simple "growth" bar-chart mark
    bar_w = max(1, round(size * 0.13))
    gap = max(1, round(size * 0.08))
    heights = [size * 0.30, size * 0.50, size * 0.72]
    base_y = size * 0.80
    start_x = size * 0.20

    for i, h in enumerate(heights):
        x0 = round(start_x + i * (bar_w + gap))
        x1 = x0 + bar_w
        y1 = round(base_y)
        y0 = round(base_y - h)
        for y in range(max(0, y0), min(size, y1)):
            for x in range(max(0, x0), min(size, x1)):
                px[y][x] = WHITE

    return px


def write_png(path, px):
    size = len(px)
    raw = bytearray()
    for row in px:
        raw.append(0)  # filter: none
        for (r, g, b) in row:
            raw.extend((r, g, b))

    compressed = zlib.compress(bytes(raw), 9)

    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)  # 8-bit, RGB truecolor
    with open(path, "wb") as f:
        f.write(sig)
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", compressed))
        f.write(chunk(b"IEND", b""))


for size, name in [(180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
    write_png(f"/home/user/My-progress/public/{name}", make_icon(size))

print("done")
