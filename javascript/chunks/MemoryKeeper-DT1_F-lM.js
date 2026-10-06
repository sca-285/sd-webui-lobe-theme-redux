import{a4 as e,a,Z as r,G as s,a3 as i,cB as n,cC as t,B as o}from"./main-DT02ropY.js";
/**
 * @license lucide-react v0.379.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=e("LockOpen",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]]),d=e("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]),m=1024**3,c=e=>{const a=Math.max(0,e.total-e.free),r=Math.min(e.children||0,a),s=Math.min(e.webui||0,a-r);return[s,r,Math.max(0,a-s-r)]},p=e=>null==e?"":e>=m?`${(e/m).toFixed(1)} GB`:`${Math.round(e/1048576)} MB`,x=e=>{const a=e.categories||[],r=new Set(a.map(e=>e.key)),s={};for(const i of e.holders||[]){const e=r.has(i.category)?i.category:"other";(s[e]=s[e]||[]).push(i)}return a.filter(e=>s[e.key]).map(e=>({...e,rows:s[e.key]}))},u=async(e,a)=>{const r=await fetch("/lobe/memory"+e,void 0===a?{}:{body:JSON.stringify(a),headers:{"Content-Type":"application/json"},method:"POST"});let s=null;try{s=await r.json()}catch{}if(!r.ok)throw new Error(s?.error||`HTTP ${r.status}`);return s},y=o(({css:e,token:a})=>({bar:e`
    position: relative;

    overflow: hidden;
    display: flex;

    height: 18px;

    background: ${a.colorFillTertiary};
    border-radius: ${a.borderRadiusSM}px;
  `,buttons:e`
    display: flex;
    gap: 6px;
    margin-block-start: 2px;

    /* the theme gives every button min-width: fit-content !important: these share one row */
    .ant-btn {
      min-width: 0 !important;
      padding-inline: 6px;
      font-size: 12px;
    }

    .ant-btn > span:not(.ant-btn-icon) {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `,card:e`
    display: flex;
    flex-direction: column;
    gap: 6px;

    padding: 10px 12px;

    font-size: 12px;
    font-variant-numeric: tabular-nums;

    background: ${a.colorFillQuaternary};
    border: 1px solid ${a.colorBorderSecondary};
    border-radius: ${a.borderRadiusLG}px;

    .ant-btn {
      font-size: 12px;
    }
  `,dim:e`
    color: ${a.colorTextTertiary};
  `,group:e`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,groupHead:e`
    display: flex;
    gap: 6px;
    align-items: center;

    font-size: 11px;
    font-weight: 600;
    color: ${a.colorTextSecondary};
  `,head:e`
    display: flex;
    gap: 8px;
    align-items: center;

    margin-block-end: 2px;
  `,label:e`
    width: 38px;
    color: ${a.colorTextSecondary};
  `,legend:e`
    display: flex;
    flex-wrap: wrap;
    gap: 2px 10px;

    font-size: 11px;
    color: ${a.colorTextTertiary};

    i {
      display: inline-block;

      width: 8px;
      height: 8px;
      margin-inline-end: 4px;

      vertical-align: -1px;

      border-radius: 2px;
    }
  `,list:e`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-block-start: 4px;

    .ant-btn {
      font-size: 12px;
    }
  `,message:e`
    padding: 4px 6px;
    color: ${a.colorTextSecondary};
    background: ${a.colorFillTertiary};
    border-radius: ${a.borderRadiusSM}px;
  `,part:e`
    display: flex;
    gap: 6px;
    align-items: center;

    padding-inline-start: 26px;

    font-size: 11px;

    > span:nth-child(2) {
      white-space: nowrap;
    }
  `,pinned:e`
    border-color: ${a.colorPrimaryBorder} !important;
  `,row:e`
    display: flex;
    flex-direction: column;
    gap: 3px;

    padding: 5px 6px;

    border: 1px solid ${a.colorBorderSecondary};
    border-radius: ${a.borderRadius}px;
  `,rowHead:e`
    display: flex;
    gap: 4px;
    align-items: center;
  `,rowName:e`
    display: flex;
    flex: 1;
    flex-direction: column;

    min-width: 0;

    strong {
      overflow: hidden;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,rows:e`
    display: grid;
    grid-template-columns: 38px 1fr;
    gap: 8px;
    align-items: center;
  `,seg:e`
    height: 100%;
    opacity: 0.7;
    transition: width 600ms ${a.motionEaseOut};
  `,source:e`
    margin-inline-start: 4px;
    padding: 0 4px;

    font-size: 10px;
    font-weight: 500;
    color: ${a.purple};

    background: ${a.purple1};
    border-radius: 4px;
  `,tag:e`
    padding: 0 6px;
    font-size: 11px;
    color: ${a.colorWarning};
    background: ${a.colorWarningBg};
    border-radius: 4px;
  `,text:e`
    position: absolute;
    inset: 0;

    display: flex;
    align-items: center;
    justify-content: flex-end;

    padding-inline: 6px;

    color: ${a.colorText};
    text-shadow: 0 0 3px ${a.colorBgContainer};
  `,title:e`
    font-weight: 600;
    color: ${a.colorText};
  `})),g=(e=!0)=>{const{t:s}=r(),[i,n]=a.useState(null),[t,o]=a.useState(null),[l,d]=a.useState(!1),[m,c]=a.useState(!1),[x,y]=a.useState(""),[g,h]=a.useState(""),b=a.useRef(m);b.current=m;const f=a.useRef(x);f.current=x;const w=a.useCallback(async e=>{try{const a=await u("/status"+(e||b.current?"?full=1":""));n(a),a.holders&&o(a),d(!1)}catch(a){/HTTP 404/.test(String(a))&&d(!0)}},[]);a.useEffect(()=>{if(!e)return;let a,r=!1;const s=async()=>{"visible"!==document.visibilityState||f.current||await w(),r||(a=window.setTimeout(s,b.current?2e3:3e3))};return s(),()=>{r=!0,window.clearTimeout(a)}},[e]),a.useEffect(()=>{e&&(m?w(!0):h(""))},[m,e]);const j=(e,a)=>{const r=[void 0===e.vram?"":`${p(e.vram)||"0 MB"} VRAM`,void 0===e.ram?"":`${p(e.ram)||"0 MB"} RAM`].filter(Boolean).join(" · "),i=e.skipped?.length?` · ${s("sidebar.memory.left",{list:e.skipped.join(", ")})}`:"";h(`${s("sidebar.memory.freed",{amount:r||"0 MB",seconds:e.seconds,what:a})}${i}`)},$=async(e,a)=>{if(!f.current){y(e),f.current=e,h("");try{await a()}catch(r){h(r?.message||String(r))}y(""),f.current="",await w(!0)}};return{act:(e,a,r)=>$(s("ram"===a?"sidebar.memory.busyMove":"sidebar.memory.busyUnload"),async()=>{const s=await u("/act",{action:a,id:e.id,part:r?.id});j(s,r?`${e.name} / ${r.name}`:e.name)}),busy:x,free:(e,a)=>$(s("sidebar.memory.busyFree"),async()=>{const r=await u("/free",{category:a?.key,level:e});j(r,a?a.name:s("vram"===e?"sidebar.memory.freeVram":"sidebar.memory.freeAll"))}),full:t,message:g,missing:l,open:m,pin:e=>$(" ",async()=>{await u("/pin",{id:e.id,keep:!e.pinned})}),setOpen:c,status:i}},h=e=>{const{theme:a}=y();return[e||a.colorPrimary,a.cyan,a.colorTextQuaternary]},b=a.memo(({colors:e})=>{const{styles:a}=y(),{t:i}=r();return s.jsx("div",{className:a.legend,children:["webui","started","others"].map((a,r)=>s.jsxs("span",{children:[s.jsx("i",{style:{background:e[r]}}),i(`sidebar.memory.${a}`)]},a))})}),f=a.memo(({legend:e,mk:a})=>{const{cx:o,styles:m,theme:c}=y(),{t:u}=r(),g=h(),{act:f,busy:w,free:j,full:$,message:v,open:k,pin:N,setOpen:T,status:B}=a;if(!B)return null;const z=e=>{if(e.error)return u("sidebar.memory.unknown");if(e.count)return u("sidebar.memory.inRam",{count:e.count});const a=[e.vram?`GPU ${p(e.vram)}`:"",e.ram?`RAM ${p(e.ram)}`:""].filter(Boolean);return a.length||null!==e.vram||null!==e.ram?a.join(" · ")||u("sidebar.memory.nothingHeld"):u("sidebar.memory.loaded")},M=e=>{const a=e.usage||{},r=(e.parts||[]).filter(e=>e.vram||e.ram),n=e.id.startsWith("process:");return s.jsxs("div",{className:o(m.row,e.pinned&&m.pinned),children:[s.jsxs("div",{className:m.rowHead,children:[n?s.jsx("span",{style:{width:22}}):s.jsx(i,{disabled:Boolean(w),icon:e.pinned?s.jsx(d,{size:13}):s.jsx(l,{size:13}),onClick:()=>N(e),size:"small",style:e.pinned?{color:c.colorPrimary}:void 0,title:u(e.pinned?"sidebar.memory.unkeep":"sidebar.memory.keep"),type:"text"}),s.jsxs("div",{className:m.rowName,children:[s.jsxs("strong",{title:e.name,children:[e.name,e.source&&s.jsx("span",{className:m.source,children:e.source})]}),s.jsx("span",{className:m.dim,children:z(a)})]})]}),(e.detail||e.can_ram&&a.vram||e.can_unload)&&s.jsxs("div",{className:m.rowHead,style:{paddingInlineStart:26},children:[e.detail&&s.jsx("span",{className:m.dim,style:{flex:1,fontSize:11},children:e.detail}),!e.detail&&s.jsx("span",{style:{flex:1}}),e.can_ram&&Boolean(a.vram)&&s.jsx(i,{disabled:Boolean(w),onClick:()=>f(e,"ram"),size:"small",title:u("sidebar.memory.toRamTip"),children:u("sidebar.memory.toRam")}),e.can_unload&&s.jsx(i,{danger:!0,disabled:Boolean(w),onClick:()=>f(e,"unload"),size:"small",title:u("cache"===e.kind?"sidebar.memory.clearTip":"sidebar.memory.unloadTip"),children:u("cache"===e.kind?"sidebar.memory.clear":"sidebar.memory.unload")})]}),r.length>1&&r.map(a=>s.jsxs("div",{className:m.part,children:[s.jsx("span",{style:{flex:1},children:a.name}),s.jsx("span",{className:m.dim,children:[a.vram?`GPU ${p(a.vram)}`:"",a.ram?`RAM ${p(a.ram)}`:""].filter(Boolean).join(" · ")}),e.can_part_ram&&Boolean(a.vram)&&s.jsx(i,{disabled:Boolean(w),onClick:()=>f(e,"ram",a),size:"small",title:u("sidebar.memory.toRamTip"),children:u("sidebar.memory.toRam")})]},a.id))]},e.id)},S=$?x($):[],R=($||B).pinned?.length||0;return s.jsxs(s.Fragment,{children:[e&&(B.gauges.gpu||B.gauges.ram)&&s.jsx(b,{colors:g}),s.jsxs("div",{className:m.buttons,children:[s.jsx(i,{disabled:Boolean(w),onClick:()=>j("vram"),size:"small",style:{flex:"1 1 0"},title:u("sidebar.memory.freeVramTip"),children:u("sidebar.memory.freeVram")}),s.jsx(i,{danger:!0,disabled:Boolean(w),onClick:()=>j("all"),size:"small",style:{flex:"1 1 0"},title:u("sidebar.memory.freeAllTip"),children:u("sidebar.memory.freeAll")}),s.jsx(i,{icon:k?s.jsx(n,{size:14}):s.jsx(t,{size:14}),onClick:()=>T(!k),size:"small",style:{flex:"none"},title:u("sidebar.memory.details"),type:k?"primary":"default"})]}),k&&s.jsxs("div",{className:m.list,children:[!e&&s.jsxs("div",{className:m.head,children:[s.jsx("span",{className:m.title,children:u("sidebar.memory.title")}),B.generating&&s.jsx("span",{className:m.tag,children:u("sidebar.memory.generating")})]}),!e&&s.jsx(b,{colors:g}),!$&&s.jsx("span",{className:m.dim,children:u("sidebar.memory.reading")}),$&&!S.length&&s.jsx("span",{className:m.dim,children:u("sidebar.memory.nothing")}),S.map(e=>{const a=e.rows.reduce((e,a)=>e+(a.usage?.vram||0),0),r=e.rows.reduce((e,a)=>e+(a.usage?.ram||0),0),n="process"!==e.key&&e.rows.some(e=>!e.pinned&&(e.can_unload||e.can_ram)),t=(o=e.key,l=e.name,u(`sidebar.memory.categories.${o}`,{defaultValue:l}));var o,l;return s.jsxs("div",{className:m.group,children:[s.jsxs("div",{className:m.groupHead,children:[s.jsx("span",{children:`${e.icon} ${t}`}),s.jsx("span",{className:m.dim,style:{fontWeight:400},children:[a?`GPU ${p(a)}`:"",r?`RAM ${p(r)}`:""].filter(Boolean).join(" · ")}),s.jsx("span",{style:{flex:1}}),n&&s.jsx(i,{disabled:Boolean(w),onClick:()=>j("all",{key:e.key,name:t}),size:"small",title:u("sidebar.memory.sectionFreeTip"),type:"link",children:u("sidebar.memory.sectionFree")})]}),e.rows.map(M)]},e.key)}),s.jsx("span",{className:m.dim,children:R?u("sidebar.memory.kept",{count:R}):u("sidebar.memory.keepHint")})]}),(w.trim()||v)&&s.jsx("div",{className:m.message,children:w.trim()||v})]})}),w=a.memo(()=>{const{styles:e}=y(),{t:a}=r(),i=g(),n=h(),{missing:t,status:o}=i;if(t||!o)return null;const l=(r,i)=>{if(!i)return null;const t=c(i);return s.jsxs("div",{className:e.rows,children:[s.jsx("span",{className:e.label,children:r}),s.jsxs("div",{className:e.bar,title:`${i.name?`${i.name}\n`:""}${a("sidebar.memory.webui")} ${p(t[0])} · ${a("sidebar.memory.started")} ${p(t[1])} · ${a("sidebar.memory.others")} ${p(t[2])} · ${a("sidebar.memory.free")} ${p(i.free)}`,children:[t.map((a,r)=>s.jsx("div",{className:e.seg,style:{background:n[r],width:100*a/i.total+"%"}},r)),s.jsx("span",{className:e.text,children:`${((i.total-i.free)/m).toFixed(1)} / ${(i.total/m).toFixed(1)} GB`})]})]})};return s.jsxs("div",{className:e.card,children:[s.jsxs("div",{className:e.head,children:[s.jsx("span",{className:e.title,children:a("sidebar.memory.title")}),o.generating&&s.jsx("span",{className:e.tag,children:a("sidebar.memory.generating")})]}),l("VRAM",o.gauges.gpu),l("RAM",o.gauges.ram),s.jsx(f,{legend:!0,mk:i})]})});
/**
 * @license lucide-react v0.379.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */export{f as MemoryControls,w as default,x as group,p as size,c as split,h as useMemoryColors,g as useMemoryKeeper};
