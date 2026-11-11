# 一封给你的婚礼请柬

当前方向：奶油纸白、酒红字、绿与粉色点缀；保留纸边和错落照片，减少装饰文案。Vite + 原生 HTML/CSS/JavaScript，不需要数据库。当前只在本地修改和检查。

当前字体：英文标题用 Quetine（`Welcome to` 加厚），英文落款也用 Quetine；日期卡、英文正文和英文名用 Courier Prime 打印体，中文用汇文明朝体。英文两套、中文一套，不额外混用正体/斜体字体文件。英文名紧挨各自中文名下方，中文标题暂用红色「婚礼请柬」。字体来源与许可见 `public/assets/fonts/SOURCES.txt`。

**先看效果：直接双击 `preview.html`。** 这是一份无需安装软件的独立预览快照，适合先讨论设计方向；修改配置后用 `npm run build` 重新生成，请勿直接修改预览文件。

另有 `preview-title-two-lines.html`，供比较 `our / wedding` 拆成两行的效果；正式页面仍用一行。两份预览均支持缩窄浏览器窗口查看手机布局，手机实机效果需要另外确认。

在 Finder 中进入本项目文件夹，右键 `preview.html` → 打开方式 → Safari 或 Chrome。里面已包含处理后的三张照片、动画和音乐，打开时静音，点右下角的音符按钮开始播放，再点暂停。音乐也嵌入了这份文件，本地查看无需额外找音频文件。

**比较照片处理：双击 `photo-study.html`。** 三张照片分别展示人物剪纸和保留背景的对比。纸边与 dress code 的「白」共用 `#FAF7ED`，虚线为夕阳粉、山景浅绿、毕业红。抠图版是之前生成的 AI 试样，人物细节需要对照原片确认；这轮只更改网页矢量边框，没有重新生成照片。

## 你现在可以往哪里放东西

| 要提供的内容 | 放这里 | 说明 |
| --- | --- | --- |
| 双方名字、年份、时间、餐厅、地址、文案 | `content/wedding.json` | 改这一个文件，开发预览会自动刷新；发布后需要重新构建 |
| 原始合照 | `materials/photos-original/` | JPG、PNG、HEIC 都可以；保留原片，不用自己抠图 |
| 处理后的高清图片 | `materials/photos-processed/` | 保存抠图样张 PNG；网页使用另存的 WebP |
| 你喜欢的风格参考 | `materials/references/` | 放截图、海报、请柬照片等；链接和喜欢的细节可以写在 `materials/reference-notes.txt` |
| 最终网页照片 | `public/assets/photos/` | 处理好的透明 PNG/WebP 放这里 |
| 分享封面 | `public/assets/share/` | 后续确定版式后再做 |
| 网页音乐 | `public/assets/audio/` | 当前使用你提供的钢琴曲副本 `wedding-piano.mp3` |

原片和参考图文件夹默认不提交 Git，也不打包到网页。`public/` 中的文件都会随网页公开发布，只放最终要展示的素材。

## 推荐的阅读顺序

1. **海报式开场**：Welcome to our wedding、双方名字、多张照片和日期；滚动提示只留箭头。
2. **见面信息**：11 月 15 日、11:00–14:00、New Haven 餐厅、具体地址和可选地图链接、白黑红粉 dress code。
3. **简短落款**：四字「届时见面」和双方名字。也可以在配置中换成「邀你同席」「诚邀赴宴」。

自然滚动，不强制翻页、不要求点开信封、不自动播放音乐。照片入场后，以不同速度持续做轻微漂浮和不到一度的角度变化，无需点击或拖动；移出视野后暂停。减少动态效果的系统设置会停用动画；即使脚本不执行，构建后的文字、照片与地点也能直接阅读。

日历现在也轻微漂浮，移出视野后暂停，并遵守减少动态效果的系统设置。副照只在电脑上放大，手机保持原来的大小。首屏保留绿色星形小图标，移除草叶装饰；页顶的日期、城市和横线已取消，保留顶部留白并把内容上移约 35 px。地图链接去掉了底线，落款显示「- 届时见面 -」。

## 填写信息

打开 `content/wedding.json`：

- `couple.name1` / `name2`：中文或常用名字，不限定双方称谓。
- `couple.english1` / `english2`：紧挨各自中文名下方的英文名字，留空则隐藏。
- `event.year`：四位数字；暂未确认时可填 `null`，页面会省略年份与星期。
- 日期与星期会根据配置生成中英对照，如「11 月 15 日 / 星期日」与「November 15th / Sunday」；英文日期后缀 st / nd / rd / th 自动处理。
- `event.startTime` / `endTime`：24 小时制，当前是 `11:00` 和 `14:00`。
- `event.timeZone`：当地时区，目前沿用你填写的 `EST`。如需随夏令时变化，可使用 `America/New_York`。
- `event.timeline`：绿色日历卡中、当地时间下方的中英流程。每项填写 `time`、`chinese`、`english`；当前为 11:00–11:30 宾客签到与茶点、11:30 婚礼仪式、12:00 午宴。沿用当地时间的 10px 小字和现有字体，每项中文与英文各一行。
- `venue.name` / `address`：餐厅名称、街道地址。填好地址后，会自动出现 Google Maps 链接。
- `venue.mapUrl`：可选，填入餐厅实际的地图链接会优先使用。
- `copy`：页面上的邀请、dress code 和落款文字。`invitationTitle` 是英文标题下的中文标题，目前为「婚礼请柬」。用 `\n` 换行；`eyebrow`、`intro`、`detailsTitle`、`closingEnglish` 留空时不会占位。英文落款已恢复为 `With love, and a seat for you.`。
- `sharing`：浏览器标题、页面简介，以及其他平台可读取的分享元数据。`siteUrl` 等 GitHub Pages 地址确定后再填。
- `music.src`：背景音乐文件路径；留空则不显示音乐按钮。当前使用 `assets/audio/wedding-piano.mp3`。`music.volume` 是 0–1 的初始音量值，默认 0.35；实际音量由设备控制方式决定。
- `dressCode[].name` / `english`：每块色卡的中英文名称，目前为白 White、黑 Black、红 Red、粉 Pink。
- `appearance.calendarColor`：日历底色，同时用于山景照片的浅绿虚线。`appearance.greenInk` 是绿色图形和文字的颜色。页面设计用的红色、粉色、纸白都直接读取 dress code 色卡，避免同一颜色有多个数值。
- `copy.dressCodeNote` / `dressCodeNoteEnglish`：穿搭说明的中英两行。地图链接显示「地图 Map」，地址保留原文；时间卡、穿搭及音乐按钮都有中英文标注。

JSON 不能写注释或尾随逗号。正式发送前核对姓名、日期和餐厅信息。

## 照片怎么准备

先放 2–5 张原始合照到 `materials/photos-original/`。推荐人物完整、轮廓清楚、两人靠近的照片；不要提前裁掉头顶、手臂或裙摆。可以额外放 1–2 张餐厅或绿植照片用于后续配色参考，不要求每张都上网页。

目前已经接入三张照片：

- `IMG_1993.JPG`：夕阳合照，人物剪纸主照。
- `IMG_1994.JPG`：山景合照，已去背景，作为第二张人物剪纸。
- `IMG_1996.JPG`：毕业合照，已移除周围人群，作为第三张人物剪纸。

人物剪纸没有额外的矩形白底，宽纸边沿人物轮廓走。三张原始 JPG 都未修改，网页素材是另存的 WebP 副本；旧版和完整背景副本也保留着。最新版提示词与资产路径见 `materials/photo-treatment-v2.json`，原片校验值见 `materials/photo-treatment-notes.txt`。

当前主预览采用原有图片加 SVG 裁切轮廓，先隐藏图片里原来烘焙的白边，再画固定屏幕宽度的纸边：桌面每张 26 px，手机每张 18 px，不随照片大小改变。虚线位于白边中部。`photos.*.cutline` 选择 `pink`、`green`、`red`；其中 green 与日历底色一致。原照片像素没有被重新绘制，图中近白高光也不再经过纸边着色滤镜。

轮廓保存在 `content/photo-contours.json`。以后更换抠图素材，可安装 Pillow、NumPy 并运行 `python3 scripts/trace-photo-contours.py` 重新分析轮廓；普通构建直接读取已生成的 JSON，不依赖图像处理工具。

最终文件示例：`public/assets/photos/couple-cutout.webp`，然后修改：

```json
"photos": {
  "hero": {
    "src": "assets/photos/couple-cutout.webp",
    "alt": "我们俩的合照",
    "style": "cutout"
  },
  "gallery": [
    {
      "src": "assets/photos/together-02.webp",
      "alt": "我们的另一张合照",
      "style": "photo"
    },
    {
      "src": "assets/photos/together-03.webp",
      "alt": "我们想分享的一个瞬间",
      "style": "photo"
    }
  ]
}
```

`cutout` 适合尚未带纸边的透明底素材，网页会通过 SVG 滤镜添加厚白边；它不会自动抠除原片背景。`sticker` 适合已经带好撕纸边的透明素材，不重复加边，也不加矩形相框。`photo` 适合保留完整背景的方形照片，会放入方形纸框中。

当前三张照片都使用 `sticker`。想换回完整背景时，将相应照片的 `src` 改为它的 `originalSrc`，将 `style` 改成 `photo`，并填写正确宽高，然后重新构建。`originalSrc` 也供本地对比页使用。

`photos.hero` 是主照，`photos.gallery` 是其他照片的数组。主照和前两张副照放在首屏错落排布；继续添加的照片会在下方排成照片列，不会被丢弃。删除 `gallery` 中的项目即可减少照片，设为 `[]` 则只保留主照。每个照片位都可独立选择 `cutout`、`sticker` 或 `photo`。

建议网页成品宽约 1200–1600 px，单张尽量压到 500 KB 左右；这些是制作目标，实际根据照片细节调整。文件名用英文小写和短横线。

## 本地预览

音乐原文件 `materials/art_roseman-gentle-romantic-piano-600952.mp3` 保持不变。网页使用 `public/assets/audio/wedding-piano.mp3`，通过右下角按钮开始或暂停，循环播放。离开页面或切到其他标签页时暂停。正式网页设置 `preload="none"`，不主动预加载音乐；独立的 `preview.html` 为便于双击查看，会嵌入音频，因此文件体积更大。

安装 Node.js 24 LTS 后：

```sh
npm ci
npm run dev
```

打开终端显示的本地地址，默认是 `http://127.0.0.1:5173`。预览生产构建：

```sh
npm run build
npm run preview
```

`npm run build` 会同时更新 `dist/`、独立的 `preview.html`、标题两行对比版和 `photo-study.html`。对比页不会打包进正式网页。配置在构建时写入 HTML，因此分享平台不需要执行 JavaScript 才能读取标题与简介。照片、字体和纹理均无需第三方 CDN。

网页字体已经打包在 `public/assets/fonts/`，独立预览也会嵌入字体。Quetine 使用完整原始 TTF，Courier Prime 和汇文明朝体使用当前内容的 WOFF2 字符子集。以后更改姓名或文案并出现缺字时，使用 `fonttools`、`brotli` 运行 `python3 scripts/prepare-fonts.py` 更新字库，然后重新构建。普通 Vite 构建直接使用已保存的字体文件，不需要下载字体或安装 Python 依赖。

## GitHub Pages

部署文件已经放在 `.github/workflows/deploy.yml`，目前没有创建或发布任何 GitHub 仓库。

1. 将项目上传到 GitHub 仓库的 `main` 分支。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 工作流会安装依赖、生成 `dist/`，并发布到 GitHub Pages。
4. 将得到的完整网址填进 `sharing.siteUrl`，重新提交发布。

Vite 已配置相对资源路径 `base: './'`，支持 `https://用户名.github.io/仓库名/`，无需先确定仓库名称。部署方式参考 [Vite 官方文档](https://vite.dev/guide/static-deploy.html)。不要把 `dist/` 手动当作源代码维护。

## 微信浏览与分享

布局以手机为先，同时适配桌面；不锁定屏幕高度、不劫持滚动、不依赖 hover，不使用视频或自动播放声音。仅提供普通的网页链接分享。

普通 HTML 分享元数据已经预留，但微信聊天卡片的自定义标题、摘要和缩略图不能仅靠 Open Graph 保证；若后续需要精确控制，要单独确认可用的微信公众号和 JS-SDK 域名配置。相关接口以 [微信官方 JS-SDK 文档](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html) 为准。

正式发送前，用真实 iPhone 和 Android 微信分别打开最终 HTTPS 链接，检查图片速度、文字换行、地图跳转及转发效果。当前桌面浏览器预览不能替代微信实机检查；GitHub Pages 在不同网络的实际打开速度也需要检查。

## 接下来最有帮助的素材

- 双方展示姓名、婚礼年份、餐厅名称和地址。
- 2–5 张候选合照。
- 3–6 张参考图，每张留一句“喜欢哪里”，例如纸边、排版、配色或照片摆法。

结构和配色只是可讨论的初稿。拿到照片和参考后，再决定是偏杂志海报、手工剪贴簿，还是更克制的纸质请柬。
