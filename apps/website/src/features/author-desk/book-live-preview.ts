import DOMPurify from "dompurify";
import { textChange } from "./book-text-change";
import type { PreviewBook } from "./book-preview";

/** Shared sanitized source for the immediate view and the paginated layout. */
export function liveBookSnapshot(book: PreviewBook) {
  return book.chapters.map((chapter) => {
    const safe = DOMPurify.sanitize(chapter.html, {
      FORBID_TAGS: ["style", "iframe", "script", "form", "input"],
      ADD_ATTR: ["data-book-page-break"],
    });
    const document = new DOMParser().parseFromString(safe, "text/html");
    for (const image of Array.from(document.images))
      if (!/^data:image\/(png|jpeg|webp);base64,/i.test(image.src)) image.remove();
    return {
      title: chapter.title || "Untitled chapter",
      headerImage: chapter.headerImage && /^data:image\/(png|jpeg|webp);base64,/i.test(chapter.headerImage) ? chapter.headerImage : null,
      blocks: Array.from(document.body.children).map((block) => ({
        html: block.outerHTML,
        text: block.textContent || "",
      })),
    };
  });
}

// Runs inside the sandbox, alongside the authenticated message bridge. Text edits are
// applied to existing page fragments before the replacement pagination is ready.
export const livePreviewScript = `
  const findTextChange=${textChange.toString()};
  const patchLiveBlock=(fragments,before,after)=>{
    if(!fragments.length)return;
    const parsed=new DOMParser().parseFromString(after.html,"text/html").body.firstElementChild;
    if(!parsed)return;
    if(fragments.length===1){
      const target=fragments[0];
      const key=target.getAttribute("data-live-block");
      parsed.setAttribute("data-live-block",key);
      // Keep Paged.js fragment identity for its running headers and page counters.
      for(const attr of target.attributes)if(attr.name.startsWith("data-")&&!parsed.hasAttribute(attr.name))parsed.setAttribute(attr.name,attr.value);
      target.replaceWith(parsed);
      return;
    }
    const nodes=[];
    for(const fragment of fragments){const walker=document.createTreeWalker(fragment,NodeFilter.SHOW_TEXT);while(walker.nextNode())nodes.push(walker.currentNode);}
    const rendered=nodes.map(node=>node.data).join("");
    if(rendered!==before.text)return;
    const {start,endBefore,replacement}=findTextChange(before.text,after.text);
    let offset=0,inserted=false;
    for(const node of nodes){
      const length=node.data.length,localStart=Math.max(0,start-offset),localEnd=Math.min(length,endBefore-offset);
      if(start<=offset+length&&endBefore>=offset){
        const insert=!inserted&&start>=offset&&start<=offset+length;
        if(localEnd>=localStart)node.replaceData(localStart,localEnd-localStart,insert?replacement:"");
        if(insert)inserted=true;
      }
      offset+=length;
    }
    // Carry inline marks and alignment through split prose without waiting for repagination.
    if(!parsed.querySelector("img,table,[data-book-page-break]")&&parsed.textContent&&fragments.map(fragment=>fragment.textContent).join("")===after.text){
      const sourceNodes=[];
      const walker=document.createTreeWalker(parsed,NodeFilter.SHOW_TEXT);
      while(walker.nextNode())sourceNodes.push(walker.currentNode);
      const point=position=>{let offset=0;for(const node of sourceNodes){if(position<=offset+node.length)return [node,position-offset];offset+=node.length;}const last=sourceNodes.at(-1);return [last,last.length];};
      let position=0;
      for(const fragment of fragments){
        const length=fragment.textContent.length;
        const range=document.createRange();
        range.setStart(...point(position));range.setEnd(...point(position+length));
        const replacement=parsed.cloneNode(false);
        for(const attr of fragment.attributes)if(attr.name.startsWith("data-")&&!replacement.hasAttribute(attr.name))replacement.setAttribute(attr.name,attr.value);
        replacement.append(range.cloneContents());fragment.replaceWith(replacement);
        position+=length;
      }
    }
  };
  const applyLiveSnapshot=next=>{
    if(!Array.isArray(next)||next.length!==liveSnapshot.length)return;
    next.forEach((chapter,index)=>{
      if(!chapter||!Array.isArray(chapter.blocks))return;
      document.querySelectorAll('[data-live-title="'+index+'"]').forEach(title=>title.textContent=chapter.title);
      const before=liveSnapshot[index];
      if(before.headerImage!==chapter.headerImage){
        const section=document.querySelector('[data-live-title="'+index+'"]')?.closest(".chapter");
        let header=section?.querySelector(".chapter-header");
        if(!chapter.headerImage)header?.remove();
        else if(section){if(!header){header=document.createElement("img");header.className="chapter-header";header.alt="";section.querySelector("h1").after(header);}header.src=chapter.headerImage;}
      }
      chapter.blocks.forEach((block,blockIndex)=>{
        const key=index+":"+blockIndex;
        const fragments=Array.from(document.querySelectorAll('[data-live-block="'+key+'"]'));
        if(before.blocks[blockIndex]?.html===block.html)return;
        if(fragments.length)patchLiveBlock(fragments,before.blocks[blockIndex]||{text:""},block);
        else {
          const parent=Array.from(document.querySelectorAll('[data-live-chapter="'+index+'"]')).at(-1);
          if(parent){const parsed=new DOMParser().parseFromString(block.html,"text/html").body.firstElementChild;if(parsed){parsed.setAttribute("data-live-block",key);parent.append(parsed);}}
        }
      });
      for(let i=chapter.blocks.length;i<before.blocks.length;i++)document.querySelectorAll('[data-live-block="'+index+":"+i+'"]').forEach(block=>block.remove());
    });
    liveSnapshot=next;
  };
`;
