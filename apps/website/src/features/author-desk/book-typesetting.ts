import { liveBookSnapshot, livePreviewScript } from "./book-live-preview";
import { cssFont, pageDimensions, paperAppearance, type BookDesign } from "./book-design";
import type { PreviewBook } from "./book-preview";
import { blobData, type BookFont } from "./use-font-library";

export const escapeHtml = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const cssString = (text: string) => JSON.stringify(text.replace(/[<>]/g, ""));

export function bookPrintCss(design: BookDesign, title: string) {
  const { width, height } = pageDimensions(design);
  return `
  @page { size: ${width}mm ${height}mm; margin: ${design.top}mm ${design.outside}mm ${design.bottom}mm ${design.inside + design.gutter}mm;
    @bottom-center { content: ${design.folios ? "counter(page)" : "none"}; font: 9pt sans-serif; color: var(--book-running-ink, #54606a); }
  }
  @page:left { margin-left: ${design.outside}mm; margin-right: ${design.inside + design.gutter}mm;
    @top-left { content: ${design.runningHeads ? cssString(title) : "none"}; font: 8pt sans-serif; color: var(--book-running-ink, #54606a); }
  }
  @page:right { margin-left: ${design.inside + design.gutter}mm; margin-right: ${design.outside}mm;
    @top-right { content: ${design.runningHeads ? "string(chapter)" : "none"}; font: 8pt sans-serif; color: var(--book-running-ink, #54606a); }
  }
  @page:blank { @top-left { content: none; } @top-right { content: none; } @bottom-center { content: none; } }
  ${design.titlePage ? "@page:first { @top-left { content: none; } @top-right { content: none; } @bottom-center { content: none; } }" : ""}
  * { box-sizing: border-box; }
  body { margin: 0; color: var(--book-ink, #252b33); font-family: ${cssFont(design.face)}; font-size: ${design.size}pt; line-height: ${design.spacing}; letter-spacing: ${design.tracking}px; }
  .chapter { break-before: ${design.chapterStart === "recto" ? "right" : "page"}; direction: ${design.direction}; }
  .chapter:first-child { break-before: auto; }
  .frontmatter { break-after: page; } .frontmatter + .frontmatter { break-before: page; } .title-page { padding-top: 35mm; text-align: center; } .title-page h1 { font-size: 30pt; } .title-page p { text-indent: 0; }
  .contents h1 { font-size: 24pt; margin-bottom: 15mm; } .contents ol { list-style: none; padding: 0; } .contents li { margin-bottom: 5mm; } .contents a { display: block; text-decoration: none; border-bottom: .2mm dotted #b6bdc3; } .contents a::after { content: target-counter(attr(href), page); float: right; }
  .chapter > h1 { string-set: chapter content(); font-size: 24pt; text-align: center; margin: 0 0 20mm; break-after: avoid; text-indent: 0; }
  p { margin: 0 0 ${design.paragraphGap}pt; text-indent: ${design.indent}mm; orphans: 3; widows: 3; hyphens: ${design.hyphens ? "auto" : "manual"}; }
  h1,h2,h3 { break-after: avoid; text-indent: 0; } h2 { font-size: 20pt; } h3 { font-size: 16pt; }
  .chapter-content > p:first-of-type { text-indent: 0; }
  ${design.dropCap ? ".chapter-content > p:first-of-type::first-letter { float: inline-start; font-size: 3.3em; line-height: .85; padding-inline-end: .08em; }" : ""}
  img { max-width: 100%; height: auto; break-inside: avoid; } .chapter-header { width: 100%; max-height: 55mm; object-fit: cover; margin-bottom: 12mm; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; margin: 4mm 0; } td,th { border: .2mm solid #89949c; padding: 2mm; vertical-align: top; overflow-wrap: anywhere; } th { background: #eff1f3; } td p,th p { text-indent: 0; }
  tr,blockquote { break-inside: avoid; } blockquote { border-inline-start: .6mm solid #a7afb7; padding-inline-start: 5mm; margin-inline: 0; }
  hr { width: 25mm; border: 0; border-top: .2mm solid #89949c; margin: 8mm auto; }
  [data-book-page-break] { display:block; height:0; margin:0; }
  [data-book-page-break] + * { break-before:page; }
  [data-book-page-break] + p:empty { min-height:1em; }
  a { color: inherit; } mark { padding: 0; }
  .pagedjs_page { background: var(--book-paper, #ffffff); margin: 18px auto; box-shadow: 0 5px 24px #0003; }
  .pagedjs_pages { padding: 12px; } html { background: var(--book-desk, #0b1d2c); scrollbar-width: none; } html::-webkit-scrollbar { display: none; }
  @media screen { .pagedjs_pages { zoom: var(--book-zoom, .75); } }

  `;
}

const fontDataCache = new Map<string,Promise<string>>();
function embeddedFont(url:string) {
  let cached=fontDataCache.get(url);
  if(!cached){cached=fetch(url).then(response=>{if(!response.ok)throw new Error("A document font could not be prepared.");return response.blob();}).then(blobData).catch(error=>{fontDataCache.delete(url);throw error;});fontDataCache.set(url,cached);}
  return cached;
}
async function embedFontRules(fonts: BookFont[], used: string) {
  const rules: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let cssRules: CSSRuleList;
    try { cssRules = sheet.cssRules; } catch { continue; }
    for (const rule of Array.from(cssRules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const family = rule.style.fontFamily.replaceAll(/["']/g, "");
      if (!used.includes(family)) continue;
      let css = rule.cssText;
      for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
        const absolute = new URL(match[1], sheet.href || location.href);
        if (absolute.origin !== location.origin) continue;
        css = css.replace(match[0], `url("${await embeddedFont(absolute.href)}")`);
      }
      rules.push(css);
    }
  }
  for (const font of fonts) if (font.data && used.includes(font.value)) rules.push(`@font-face{font-family:${cssString(font.value)};src:url("${font.data}");}`);
  return rules.join("\n");
}

export async function typesetDocument(book: PreviewBook, design: BookDesign, fonts: BookFont[], token: string, theme: "dark" | "light" = "dark", singlePage = false) {
  const dimensions = pageDimensions(design);
  const print = paperAppearance(design,"light",true);
  const screen = paperAppearance(design,theme);
  const desks = { light: singlePage ? "#eef1f4" : "#dce5ef", dark: singlePage ? "#0d2236" : "#0b1d2c" };
  const singlePageCss = singlePage ? ".pagedjs_pages{height:calc(100vh / var(--book-zoom,.75));justify-content:center;overflow:hidden}.pagedjs_page{position:absolute;left:-100000px;visibility:hidden;margin:0 auto}.pagedjs_page.preview-current{position:relative;left:auto;visibility:visible}" : "";
  const screenCss = `html,body{margin:0;background:var(--book-desk,#0b1d2c);scrollbar-width:none;}@media screen and (prefers-reduced-motion:no-preference){html,body,.pagedjs_page,.pagedjs_sheet{transition:background-color 320ms ease-in-out,color 320ms ease-in-out;}}html[data-theme-instant],html[data-theme-instant] body,html[data-theme-instant] .pagedjs_page,html[data-theme-instant] .pagedjs_sheet{transition:none!important;}::-webkit-scrollbar{display:none}.pagedjs_pages{display:flex;flex-direction:column;align-items:center;width:max-content;min-width:100%;padding:calc(18px / var(--book-zoom,.75));box-sizing:border-box;zoom:var(--book-zoom,.75)}.pagedjs_page{flex-shrink:0;margin:0 auto 24px;background:var(--book-paper, #ffffff);box-shadow:0 5px 24px #0004}.pagedjs_sheet{background:inherit}${singlePageCss}@media print{@page{size:${dimensions.width}mm ${dimensions.height}mm;margin:0}html,body{background:white}html{--book-paper:${print.paper} !important;--book-ink:${print.ink} !important;--book-running-ink:${print.runningInk} !important;print-color-adjust:exact;-webkit-print-color-adjust:exact}.pagedjs_pages{display:block;padding:0;zoom:1}.pagedjs_page{display:block;position:relative;left:auto;visibility:visible;margin:0;box-shadow:none;background:${print.paper} !important;break-after:page}.pagedjs_pages{height:auto;overflow:visible}}`;
  const snapshot = liveBookSnapshot(book);
  const chapters = book.chapters.map((chapter, index) => {
    const header = chapter.headerImage && /^data:image\/(png|jpeg|webp);base64,/i.test(chapter.headerImage) ? `<img class="chapter-header" alt="" src="${escapeHtml(chapter.headerImage)}">` : "";
    const blocks = snapshot[index].blocks.map((block, blockIndex) => {
      const fragment = new DOMParser().parseFromString(block.html, "text/html");
      fragment.body.firstElementChild?.setAttribute("data-live-block", `${index}:${blockIndex}`);
      return fragment.body.innerHTML;
    }).join("");
    return `<section class="chapter" id="chapter-${index}"><h1 data-live-title="${index}">${escapeHtml(snapshot[index].title)}</h1>${header}<div class="chapter-content" data-live-chapter="${index}">${blocks}</div></section>`;
  }).join("");
  const frontmatter = (design.titlePage ? `<section class="frontmatter title-page"><h1>${escapeHtml(book.title)}</h1>${book.subtitle ? `<p>${escapeHtml(book.subtitle)}</p>` : ""}</section>` : "") + (design.contents ? `<section class="frontmatter contents"><h1>Contents</h1><ol>${book.chapters.map((chapter, index) => `<li><a href="#chapter-${index}">${escapeHtml(chapter.title || "Untitled chapter")}</a></li>`).join("")}</ol></section>` : "");
  const fontRules = await embedFontRules(fonts, chapters + design.face);
  const css = (`html{--book-desk:${desks[theme]};--book-paper:${screen.paper};--book-ink:${screen.ink};--book-running-ink:${screen.runningInk};}` + fontRules + bookPrintCss(design, book.title)).replaceAll("</style", "");
  return `<!doctype html><html lang="${design.language}"><head><meta charset="utf-8"><title>${escapeHtml(book.title)}</title><style>${css}</style><script>window.PagedConfig={auto:false};</script><script src="${location.origin}/vendor/pagedjs/paged.polyfill.min.js"></script></head><body><main id="book-source">${frontmatter}${chapters}</main><script>
  const token=${JSON.stringify(token)};
  let liveSnapshot=${JSON.stringify(snapshot).replaceAll("<", "\\u003c")};
  ${livePreviewScript}
  const report=(type,extra={})=>parent.postMessage({type,token,...extra},"*");
  const desks=${JSON.stringify(desks)};
  const palettes=${JSON.stringify({light:paperAppearance(design,"light"),dark:paperAppearance(design,"dark")})};
  const applyTheme=theme=>{const light=theme==="light";const palette=palettes[light?"light":"dark"];for(const [key,value] of Object.entries({"--book-desk":desks[light?"light":"dark"],"--book-paper":palette.paper,"--book-ink":palette.ink,"--book-running-ink":palette.runningInk}))document.documentElement.style.setProperty(key,value);};
  const singlePage=${JSON.stringify(singlePage)};
  let selectedPage=1;
  let previewReady=false,zoomValue=.75,scrollFrame=0;
  const reportPosition=()=>{scrollFrame=0;if(!previewReady)return;if(singlePage){report("rawan-page-position",{page:selectedPage});return;}const pages=Array.from(document.querySelectorAll(".pagedjs_page"));const target=innerHeight*.35;let index=pages.findIndex(page=>page.getBoundingClientRect().bottom>target);report("rawan-page-position",{page:index<0?pages.length:index+1});};
  const applyZoom=()=>{const page=document.querySelector(singlePage?".preview-current":".pagedjs_page");const value=zoomValue==="fit"?Math.max(.1,Math.min(2,(innerWidth-36)/(page?.offsetWidth||576),(innerHeight-36)/(page?.offsetHeight||864))):zoomValue;document.documentElement.style.setProperty("--book-zoom",String(value));reportPosition();};
  addEventListener("scroll",()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(reportPosition);},{passive:true});
  addEventListener("resize",applyZoom);
  addEventListener("message",event=>{if(event.source!==parent||event.data?.token!==token)return;if(event.data.type==="rawan-live-update")applyLiveSnapshot(event.data.chapters);if(event.data.type==="rawan-theme"){document.documentElement.toggleAttribute("data-theme-instant",!!event.data.instant);applyTheme(event.data.theme);}if(event.data.type==="rawan-page" && Number.isInteger(event.data.page)){const target=document.querySelectorAll(".pagedjs_page")[event.data.page-1];if(target){if(singlePage){selectedPage=event.data.page;document.querySelectorAll(".pagedjs_page").forEach(page=>page.classList.toggle("preview-current",page===target));applyZoom();}else{target.scrollIntoView({block:"start"});requestAnimationFrame(reportPosition);}}}if(event.data.type==="rawan-print")window.print();if(event.data.type==="rawan-zoom"){const value=event.data.value;if(value==="fit"||(typeof value==="number"&&value>=.1&&value<=2)){zoomValue=value;applyZoom();}}});
  (async()=>{try{await document.fonts.ready;const flow=await window.PagedPolyfill.preview();const screen=document.createElement("style");screen.textContent=${JSON.stringify(screenCss)};document.head.append(screen);if(singlePage)document.querySelector(".pagedjs_page")?.classList.add("preview-current");previewReady=true;report("rawan-typeset-ready",{pages:flow.total});applyZoom();}catch{report("rawan-typeset-error");}})();
  </script></body></html>`;
}

