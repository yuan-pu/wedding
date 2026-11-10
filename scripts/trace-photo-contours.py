"""Analyze existing cutouts and emit SVG geometry, without editing photo pixels.

Requires Pillow and NumPy. The generated JSON is used directly by the webpage;
normal Vite builds do not require these Python dependencies.
"""
from collections import defaultdict, deque
from pathlib import Path
import hashlib
import json
import math
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent


def largest_component(mask):
    height, width = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    largest = []
    for y, x in np.argwhere(mask):
        if visited[y, x]:
            continue
        queue = deque([(int(x), int(y))])
        visited[y, x] = True
        component = []
        while queue:
            px, py = queue.popleft()
            component.append((px, py))
            for nx, ny in ((px + 1, py), (px - 1, py), (px, py + 1), (px, py - 1)):
                if 0 <= nx < width and 0 <= ny < height and mask[ny, nx] and not visited[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((nx, ny))
        if len(component) > len(largest):
            largest = component
    output = np.zeros_like(mask, dtype=bool)
    for x, y in largest:
        output[y, x] = True
    return output


def outer_loop(mask):
    padded = np.pad(mask, 1)
    edges = defaultdict(list)
    for y, x in np.argwhere(mask):
        x, y = int(x), int(y)
        if not padded[y, x + 1]: edges[(x, y)].append((x + 1, y))
        if not padded[y + 1, x + 2]: edges[(x + 1, y)].append((x + 1, y + 1))
        if not padded[y + 2, x + 1]: edges[(x + 1, y + 1)].append((x, y + 1))
        if not padded[y + 1, x]: edges[(x, y + 1)].append((x, y))
    loops = []
    while edges:
        start = next(iter(edges))
        points, current = [start], start
        for _ in range(mask.size * 4):
            if current not in edges: break
            following = edges[current].pop()
            if not edges[current]: del edges[current]
            points.append(following)
            current = following
            if current == start: break
        if points[-1] == start and len(points) > 3:
            area = abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(points, points[1:])))
            loops.append((area, points))
    if not loops:
        raise ValueError('Could not trace a closed subject contour')
    return max(loops, key=lambda loop: loop[0])[1]


def simplify(points, tolerance=1.1):
    if len(points) <= 2:
        return points
    start, end = points[0], points[-1]
    dx, dy = end[0] - start[0], end[1] - start[1]
    length = math.hypot(dx, dy)
    if length:
        distances = [abs(dy * (x - start[0]) - dx * (y - start[1])) / length for x, y in points]
    else:
        distances = [math.hypot(x - start[0], y - start[1]) for x, y in points]
    index = max(range(len(points)), key=distances.__getitem__)
    if distances[index] <= tolerance:
        return [start, end]
    return simplify(points[:index + 1], tolerance)[:-1] + simplify(points[index:], tolerance)


def rounded_path(points):
    def midpoint(a, b): return ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    first = midpoint(points[-1], points[0])
    path = [f'M{first[0]:.1f},{first[1]:.1f}']
    for index, point in enumerate(points):
        following = midpoint(point, points[(index + 1) % len(points)])
        path.append(f'Q{point[0]:.1f},{point[1]:.1f} {following[0]:.1f},{following[1]:.1f}')
    return ' '.join(path) + ' Z'


def trace(photo):
    original = ROOT / 'materials/photos-processed' / (Path(photo['src']).stem + '.png')
    if not original.is_file(): original = ROOT / 'public' / photo['src']
    image = Image.open(original).convert('RGBA')
    width, height = image.size
    scale = min(1, 560 / max(width, height))
    sample = image.resize((round(width * scale), round(height * scale)), Image.Resampling.LANCZOS)
    rgba = np.asarray(sample).astype(np.int16)
    rgb = rgba[:, :, :3]
    # The surrounding baked paper is near-neutral white; subject interiors and
    # all original photo pixels remain untouched. Internal white areas are filled
    # by selecting only the outer boundary of the largest connected subject.
    candidate = (rgba[:, :, 3] > 150) & ((rgb.min(axis=2) < 225) | (rgb.max(axis=2) - rgb.min(axis=2) > 30))
    closed = Image.fromarray((candidate * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    mask = largest_component(np.asarray(closed) > 0)
    points = simplify(outer_loop(mask))[:-1]
    points = [[round(x / scale, 2), round(y / scale, 2)] for x, y in points]
    if len(points) < 20:
        raise ValueError(f'Unexpected contour for {photo["src"]}')
    return {
        'width': width, 'height': height, 'path': rounded_path(points),
        'points': points, 'sourceSHA256': hashlib.sha256(original.read_bytes()).hexdigest(),
    }


if __name__ == '__main__':
    config = json.loads((ROOT / 'content/wedding.json').read_text())
    result = {}
    for photo in [config['photos']['hero'], *config['photos'].get('gallery', [])]:
        if photo.get('style') == 'sticker' and photo.get('src'):
            result[photo['src']] = trace(photo)
            print(f'{photo["src"]}: {len(result[photo["src"]]["points"])} contour points')
    (ROOT / 'content/photo-contours.json').write_text(json.dumps(result, indent=2))
