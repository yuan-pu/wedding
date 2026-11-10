"""Optional font preparation; generated WOFF2 files are kept with site assets.

Requires fonttools and brotli. Run after changing text or names to refresh coverage.
The normal Vite build uses the prepared fonts without installing Python packages.
"""
from pathlib import Path
from shutil import copyfile
import json
import re
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parent.parent
text = json.dumps(json.loads((root / 'content/wedding.json').read_text()), ensure_ascii=False)
text += '星期一二三四五六日年月当地时间'
for source in ('src/render.mjs', 'src/main.js'):
    text += (root / source).read_text()
characters = set(text) | set(chr(code) for code in range(32, 127))
coverage = {}
for source, output, family in [
    ('HuiwenMincho-Regular.ttf', 'wedding-mincho.woff2', 'Wedding Mincho'),
    ('Quetine.ttf', 'quetine.ttf', None),
    ('CourierPrime-Regular.ttf', 'wedding-text.woff2', 'Wedding Text'),
]:
    path = root / 'materials/fonts' / source
    if not path.is_file():
        raise SystemExit(f'Missing font source: {path}. See public/assets/fonts/SOURCES.txt.')
    font = TTFont(path)
    if family is None:
        # Keep Quetine's complete, unmodified font and original name records.
        destination = root / 'public/assets/fonts' / output
        copyfile(path, destination)
        coverage[output] = sorted(font.getBestCmap())
        print(f'{output}: {destination.stat().st_size / 1024:.1f} KB, complete original font')
        continue
    if 'fvar' in font:
        instantiateVariableFont(font, {'wght': 400}, inplace=True)
    cmap = font.getBestCmap()
    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.name_legacy = True
    options.name_languages = ['*']
    subsetter = subset.Subsetter(options=options)
    included = {ord(c) for c in characters if ord(c) in cmap}
    subsetter.populate(unicodes=included)
    subsetter.subset(font)
    # The subsets have project-local names; copyright and license records remain.
    for name in font['name'].names:
        value = {1: family, 2: 'Regular', 3: f'{family} Subset', 4: f'{family} Regular', 6: family.replace(' ', '') + '-Regular', 16: family, 17: 'Regular'}.get(name.nameID)
        if value is not None:
            name.string = value.encode(name.getEncoding(), errors='replace')
    font.flavor = 'woff2'
    destination = root / 'public/assets/fonts' / output
    font.save(destination)
    coverage[output] = sorted(included)
    print(f'{output}: {destination.stat().st_size / 1024:.1f} KB, {len(included)} characters')
(root / 'public/assets/fonts/coverage.json').write_text(json.dumps(coverage, indent=2))
