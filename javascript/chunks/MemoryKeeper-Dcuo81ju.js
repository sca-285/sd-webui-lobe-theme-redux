import{a4 as e,a,Z as r,G as s,a1 as i,a3 as n,cB as t,cC as o,B as l}from"./main-BIIQZkN-.js";
/**
 * @license lucide-react v0.379.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=e("LockOpen",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]]),m=e("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]),c=1024**3,p=["high","normal","low"],x=e=>{const a=Math.max(0,e.total-e.free),r=Math.min(e.children||0,a),s=Math.min(e.webui||0,a-r);return[s,r,Math.max(0,a-s-r)]},y=e=>null==e?"":e>=c?`${(e/c).toFixed(1)} GB`:`${Math.round(e/1048576)} MB`,u=e=>{const a=e.categories||[],r=new Set(a.map(e=>e.key)),s={};for(const i of e.holders||[]){const e=r.has(i.category)?i.category:"other";(s[e]=s[e]||[]).push(i)}return a.filter(e=>s[e.key]).map(e=>({...e,rows:s[e.key]}))},g=async(e,a)=>{const r=await fetch("/lobe/memory"+e,void 0===a?{}:{body:JSON.stringify(a),headers:{"Content-Type":"application/json"},method:"POST"});let s=null;try{s=await r.json()}catch{}if(!r.ok)throw new Error(s?.error||`HTTP ${r.status}`);return s},h=l(({css:e,token:a})=>({bar:e`
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
  `,mode:e`
    display: flex;
    gap: 8px;
    align-items: center;
    margin-block-start: 2px;

    .ant-segmented-item-label {
      font-size: 12px;
    }
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
  `})),b={all:"sidebar.memory.freeAll",ram:"sidebar.memory.freeRam",vram:"sidebar.memory.freeVram"},f=(e=!0)=>{const{t:s}=r(),[i,n]=a.useState(null),[t,o]=a.useState(null),[l,d]=a.useState(!1),[m,c]=a.useState(!1),[p,x]=a.useState(""),[u,h]=a.useState(""),f=a.useRef(m);f.current=m;const j=a.useRef(p);j.current=p;const w=a.useCallback(async e=>{try{const a=await g("/status"+(e||f.current?"?full=1":""));n(a),a.holders&&o(a),d(!1)}catch(a){/HTTP 404/.test(String(a))&&d(!0)}},[]);a.useEffect(()=>{if(!e)return;let a,r=!1;const s=async()=>{"visible"!==document.visibilityState||j.current||await w(),r||(a=window.setTimeout(s,f.current?2e3:3e3))};return s(),()=>{r=!0,window.clearTimeout(a)}},[e]),a.useEffect(()=>{e&&(m?w(!0):h(""))},[m,e]);const $=(e,a)=>{const r=[void 0===e.vram?"":`${y(e.vram)||"0 MB"} VRAM`,void 0===e.ram?"":`${y(e.ram)||"0 MB"} RAM`].filter(Boolean).join(" · "),i=e.skipped?.length?` · ${s("sidebar.memory.left",{list:e.skipped.join(", ")})}`:"";h(`${s("sidebar.memory.freed",{amount:r||"0 MB",seconds:e.seconds,what:a})}${i}`)},v=async(e,a)=>{if(!j.current){x(e),j.current=e,h("");try{await a()}catch(r){h(r?.message||String(r))}x(""),j.current="",await w(!0)}};return{act:(e,a,r)=>v(s("ram"===a?"sidebar.memory.busyMove":"sidebar.memory.busyUnload"),async()=>{const s=await g("/act",{action:a,id:e.id,part:r?.id});$(s,r?`${e.name} / ${r.name}`:e.name)}),busy:p,free:(e,a)=>v(s("sidebar.memory.busyFree"),async()=>{const r=await g("/free",{category:a?.key,level:e});$(r,a?a.name:s(b[e]))}),full:t,message:u,missing:l,open:m,pin:e=>v(" ",async()=>{await g("/pin",{id:e.id,keep:!e.pinned})}),setOpen:c,setVramMode:e=>v(s("sidebar.memory.busyMode"),async()=>{const a=await g("/vram-mode",{mode:e}),r=a.skipped?.length?` · ${s("sidebar.memory.left",{list:a.skipped.join(", ")})}`:"";h(`${s("sidebar.memory.modeSet",{mode:s(`sidebar.memory.modes.${e}`)})}${r}`)}),status:i}},j=e=>{const{theme:a}=h();return[e||a.colorPrimary,a.cyan,a.colorTextQuaternary]},w=a.memo(({colors:e})=>{const{styles:a}=h(),{t:i}=r();return s.jsx("div",{className:a.legend,children:["webui","started","others"].map((a,r)=>s.jsxs("span",{children:[s.jsx("i",{style:{background:e[r]}}),i(`sidebar.memory.${a}`)]},a))})}),$=a.memo(({legend:e,mk:a})=>{const{cx:l,styles:c,theme:x}=h(),{t:g}=r(),b=j(),{act:f,busy:$,free:v,full:k,message:N,open:T,pin:B,setOpen:z,setVramMode:M,status:S}=a;if(!S)return null;const R=e=>{if(e.error)return g("sidebar.memory.unknown");if(e.count)return g("sidebar.memory.inRam",{count:e.count});const a=[e.vram?`GPU ${y(e.vram)}`:"",e.ram?`RAM ${y(e.ram)}`:""].filter(Boolean);return a.length||null!==e.vram||null!==e.ram?a.join(" · ")||g("sidebar.memory.nothingHeld"):g("sidebar.memory.loaded")},C=e=>{const a=e.usage||{},r=(e.parts||[]).filter(e=>e.vram||e.ram),i=e.id.startsWith("process:");return s.jsxs("div",{className:l(c.row,e.pinned&&c.pinned),children:[s.jsxs("div",{className:c.rowHead,children:[i?s.jsx("span",{style:{width:22}}):s.jsx(n,{disabled:Boolean($),icon:e.pinned?s.jsx(m,{size:13}):s.jsx(d,{size:13}),onClick:()=>B(e),size:"small",style:e.pinned?{color:x.colorPrimary}:void 0,title:g(e.pinned?"sidebar.memory.unkeep":"sidebar.memory.keep"),type:"text"}),s.jsxs("div",{className:c.rowName,children:[s.jsxs("strong",{title:e.name,children:[e.name,e.source&&s.jsx("span",{className:c.source,children:e.source})]}),s.jsx("span",{className:c.dim,children:R(a)})]})]}),(e.detail||e.can_ram&&a.vram||e.can_unload)&&s.jsxs("div",{className:c.rowHead,style:{paddingInlineStart:26},children:[e.detail&&s.jsx("span",{className:c.dim,style:{flex:1,fontSize:11},children:e.detail}),!e.detail&&s.jsx("span",{style:{flex:1}}),e.can_ram&&Boolean(a.vram)&&s.jsx(n,{disabled:Boolean($),onClick:()=>f(e,"ram"),size:"small",title:g("sidebar.memory.toRamTip"),children:g("sidebar.memory.toRam")}),e.can_unload&&s.jsx(n,{danger:!0,disabled:Boolean($),onClick:()=>f(e,"unload"),size:"small",title:g("cache"===e.kind?"sidebar.memory.clearTip":"sidebar.memory.unloadTip"),children:g("cache"===e.kind?"sidebar.memory.clear":"sidebar.memory.unload")})]}),r.length>1&&r.map(a=>s.jsxs("div",{className:c.part,children:[s.jsx("span",{style:{flex:1},children:a.name}),s.jsx("span",{className:c.dim,children:[a.vram?`GPU ${y(a.vram)}`:"",a.ram?`RAM ${y(a.ram)}`:""].filter(Boolean).join(" · ")}),e.can_part_ram&&Boolean(a.vram)&&s.jsx(n,{disabled:Boolean($),onClick:()=>f(e,"ram",a),size:"small",title:g("sidebar.memory.toRamTip"),children:g("sidebar.memory.toRam")})]},a.id))]},e.id)},_=k?u(k):[],A=(k||S).pinned?.length||0;return s.jsxs(s.Fragment,{children:[e&&(S.gauges.gpu||S.gauges.ram)&&s.jsx(w,{colors:b}),S.vram_mode?.can&&s.jsxs("div",{className:c.mode,title:g("sidebar.memory.modeTip"),children:[s.jsx("span",{className:c.label,children:g("sidebar.memory.mode")}),s.jsx(i,{block:!0,disabled:Boolean($)||S.generating,onChange:e=>M(e),options:p.map(e=>({label:g(`sidebar.memory.modes.${e}`),title:`${g(`sidebar.memory.modeTips.${e}`)}${S.vram_mode?.startup===e?` · ${g("sidebar.memory.modeStartup")}`:""}`,value:e})),size:"small",style:{flex:1},value:S.vram_mode.mode})]}),s.jsxs("div",{className:c.buttons,children:[s.jsx(n,{disabled:Boolean($),onClick:()=>v("ram"),size:"small",style:{flex:"1 1 0"},title:g("sidebar.memory.freeRamTip"),children:g("sidebar.memory.freeRam")}),s.jsx(n,{disabled:Boolean($),onClick:()=>v("vram"),size:"small",style:{flex:"1 1 0"},title:g("sidebar.memory.freeVramTip"),children:g("sidebar.memory.freeVram")})]}),s.jsxs("div",{className:c.buttons,children:[s.jsx(n,{danger:!0,disabled:Boolean($),onClick:()=>v("all"),size:"small",style:{flex:"1 1 0"},title:g("sidebar.memory.freeAllTip"),children:g("sidebar.memory.freeAll")}),s.jsx(n,{icon:T?s.jsx(t,{size:14}):s.jsx(o,{size:14}),onClick:()=>z(!T),size:"small",style:{flex:"none"},title:g("sidebar.memory.details"),type:T?"primary":"default"})]}),T&&s.jsxs("div",{className:c.list,children:[!e&&s.jsxs("div",{className:c.head,children:[s.jsx("span",{className:c.title,children:g("sidebar.memory.title")}),S.generating&&s.jsx("span",{className:c.tag,children:g("sidebar.memory.generating")})]}),!e&&s.jsx(w,{colors:b}),!k&&s.jsx("span",{className:c.dim,children:g("sidebar.memory.reading")}),k&&!_.length&&s.jsx("span",{className:c.dim,children:g("sidebar.memory.nothing")}),_.map(e=>{const a=e.rows.reduce((e,a)=>e+(a.usage?.vram||0),0),r=e.rows.reduce((e,a)=>e+(a.usage?.ram||0),0),i="process"!==e.key&&e.rows.some(e=>!e.pinned&&(e.can_unload||e.can_ram)),t=(o=e.key,l=e.name,g(`sidebar.memory.categories.${o}`,{defaultValue:l}));var o,l;return s.jsxs("div",{className:c.group,children:[s.jsxs("div",{className:c.groupHead,children:[s.jsx("span",{children:`${e.icon} ${t}`}),s.jsx("span",{className:c.dim,style:{fontWeight:400},children:[a?`GPU ${y(a)}`:"",r?`RAM ${y(r)}`:""].filter(Boolean).join(" · ")}),s.jsx("span",{style:{flex:1}}),i&&s.jsx(n,{disabled:Boolean($),onClick:()=>v("all",{key:e.key,name:t}),size:"small",title:g("sidebar.memory.sectionFreeTip"),type:"link",children:g("sidebar.memory.sectionFree")})]}),e.rows.map(C)]},e.key)}),s.jsx("span",{className:c.dim,children:A?g("sidebar.memory.kept",{count:A}):g("sidebar.memory.keepHint")})]}),($.trim()||N)&&s.jsx("div",{className:c.message,children:$.trim()||N})]})}),v=a.memo(()=>{const{styles:e}=h(),{t:a}=r(),i=f(),n=j(),{missing:t,status:o}=i;if(t||!o)return null;const l=(r,i)=>{if(!i)return null;const t=x(i);return s.jsxs("div",{className:e.rows,children:[s.jsx("span",{className:e.label,children:r}),s.jsxs("div",{className:e.bar,title:`${i.name?`${i.name}\n`:""}${a("sidebar.memory.webui")} ${y(t[0])} · ${a("sidebar.memory.started")} ${y(t[1])} · ${a("sidebar.memory.others")} ${y(t[2])} · ${a("sidebar.memory.free")} ${y(i.free)}`,children:[t.map((a,r)=>s.jsx("div",{className:e.seg,style:{background:n[r],width:100*a/i.total+"%"}},r)),s.jsx("span",{className:e.text,children:`${((i.total-i.free)/c).toFixed(1)} / ${(i.total/c).toFixed(1)} GB`})]})]})};return s.jsxs("div",{className:e.card,children:[s.jsxs("div",{className:e.head,children:[s.jsx("span",{className:e.title,children:a("sidebar.memory.title")}),o.generating&&s.jsx("span",{className:e.tag,children:a("sidebar.memory.generating")})]}),l("VRAM",o.gauges.gpu),l("RAM",o.gauges.ram),s.jsx($,{legend:!0,mk:i})]})});
/**
 * @license lucide-react v0.379.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */export{$ as MemoryControls,p as VRAM_MODES,v as default,u as group,y as size,x as split,j as useMemoryColors,f as useMemoryKeeper};
