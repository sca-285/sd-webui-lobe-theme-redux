import{a4 as e,a,Z as r,G as s,a3 as i,cB as n,cC as o,B as t}from"./main-PBF4c4Iv.js";
/**
 * @license lucide-react v0.379.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=e("LockOpen",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]]),d=e("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]),c=1024**3,m=e=>{const a=Math.max(0,e.total-e.free),r=Math.min(e.children||0,a),s=Math.min(e.webui||0,a-r);return[s,r,Math.max(0,a-s-r)]},p=e=>null==e?"":e>=c?`${(e/c).toFixed(1)} GB`:`${Math.round(e/1048576)} MB`,x=e=>{const a=e.categories||[],r=new Set(a.map(e=>e.key)),s={};for(const i of e.holders||[]){const e=r.has(i.category)?i.category:"other";(s[e]=s[e]||[]).push(i)}return a.filter(e=>s[e.key]).map(e=>({...e,rows:s[e.key]}))},y=async(e,a)=>{const r=await fetch("/lobe/memory"+e,void 0===a?{}:{body:JSON.stringify(a),headers:{"Content-Type":"application/json"},method:"POST"});let s=null;try{s=await r.json()}catch{}if(!r.ok)throw new Error(s?.error||`HTTP ${r.status}`);return s},u=t(({css:e,token:a})=>({bar:e`
    position: relative;

    overflow: hidden;
    display: flex;

    height: 18px;

    background: ${a.colorFillTertiary};
    border-radius: ${a.borderRadiusSM}px;
  `,buttons:e`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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
  `})),h=a.memo(()=>{const{cx:e,styles:t,theme:h}=u(),{t:g}=r(),[b,f]=a.useState(null),[w,j]=a.useState(null),[$,k]=a.useState(!1),[v,N]=a.useState(!1),[T,B]=a.useState(""),[z,M]=a.useState(""),S=a.useRef(v);S.current=v;const R=a.useRef(T);R.current=T;const C=[h.colorPrimary,h.cyan,h.colorTextQuaternary],A=a.useCallback(async e=>{try{const a=await y("/status"+(e||S.current?"?full=1":""));f(a),a.holders&&j(a),k(!1)}catch(a){/HTTP 404/.test(String(a))&&k(!0)}},[]);a.useEffect(()=>{let e,a=!1;const r=async()=>{"visible"!==document.visibilityState||R.current||await A(),a||(e=window.setTimeout(r,S.current?2e3:3e3))};return r(),()=>{a=!0,window.clearTimeout(e)}},[]),a.useEffect(()=>{v?A(!0):M("")},[v]);const P=(e,a)=>{const r=[void 0===e.vram?"":`${p(e.vram)||"0 MB"} VRAM`,void 0===e.ram?"":`${p(e.ram)||"0 MB"} RAM`].filter(Boolean).join(" · "),s=e.skipped?.length?` · ${g("sidebar.memory.left",{list:e.skipped.join(", ")})}`:"";M(`${g("sidebar.memory.freed",{amount:r||"0 MB",seconds:e.seconds,what:a})}${s}`)},F=async(e,a)=>{if(!R.current){B(e),R.current=e,M("");try{await a()}catch(r){M(r?.message||String(r))}B(""),R.current="",await A(!0)}},H=(e,a,r)=>F(g("ram"===a?"sidebar.memory.busyMove":"sidebar.memory.busyUnload"),async()=>{const s=await y("/act",{action:a,id:e.id,part:r?.id});P(s,r?`${e.name} / ${r.name}`:e.name)}),V=(e,a)=>F(g("sidebar.memory.busyFree"),async()=>{const r=await y("/free",{category:a?.key,level:e});P(r,a?a.name:g("vram"===e?"sidebar.memory.freeVram":"sidebar.memory.freeAll"))});if($||!b)return null;const _=e=>{if(e.error)return g("sidebar.memory.unknown");if(e.count)return g("sidebar.memory.inRam",{count:e.count});const a=[e.vram?`GPU ${p(e.vram)}`:"",e.ram?`RAM ${p(e.ram)}`:""].filter(Boolean);return a.length||null!==e.vram||null!==e.ram?a.join(" · ")||g("sidebar.memory.nothingHeld"):g("sidebar.memory.loaded")},G=(e,a)=>{if(!a)return null;const r=m(a);return s.jsxs("div",{className:t.rows,children:[s.jsx("span",{className:t.label,children:e}),s.jsxs("div",{className:t.bar,title:`${a.name?`${a.name}\n`:""}${g("sidebar.memory.webui")} ${p(r[0])} · ${g("sidebar.memory.started")} ${p(r[1])} · ${g("sidebar.memory.others")} ${p(r[2])} · ${g("sidebar.memory.free")} ${p(a.free)}`,children:[r.map((e,r)=>s.jsx("div",{className:t.seg,style:{background:C[r],width:100*e/a.total+"%"}},r)),s.jsx("span",{className:t.text,children:`${((a.total-a.free)/c).toFixed(1)} / ${(a.total/c).toFixed(1)} GB`})]})]})},E=a=>{const r=a.usage||{},n=(a.parts||[]).filter(e=>e.vram||e.ram),o=a.id.startsWith("process:");return s.jsxs("div",{className:e(t.row,a.pinned&&t.pinned),children:[s.jsxs("div",{className:t.rowHead,children:[o?s.jsx("span",{style:{width:22}}):s.jsx(i,{disabled:Boolean(T),icon:a.pinned?s.jsx(d,{size:13}):s.jsx(l,{size:13}),onClick:()=>(e=>F(" ",async()=>{await y("/pin",{id:e.id,keep:!e.pinned})}))(a),size:"small",style:a.pinned?{color:h.colorPrimary}:void 0,title:g(a.pinned?"sidebar.memory.unkeep":"sidebar.memory.keep"),type:"text"}),s.jsxs("div",{className:t.rowName,children:[s.jsxs("strong",{title:a.name,children:[a.name,a.source&&s.jsx("span",{className:t.source,children:a.source})]}),s.jsx("span",{className:t.dim,children:_(r)})]})]}),(a.detail||a.can_ram&&r.vram||a.can_unload)&&s.jsxs("div",{className:t.rowHead,style:{paddingInlineStart:26},children:[a.detail&&s.jsx("span",{className:t.dim,style:{flex:1,fontSize:11},children:a.detail}),!a.detail&&s.jsx("span",{style:{flex:1}}),a.can_ram&&Boolean(r.vram)&&s.jsx(i,{disabled:Boolean(T),onClick:()=>H(a,"ram"),size:"small",title:g("sidebar.memory.toRamTip"),children:g("sidebar.memory.toRam")}),a.can_unload&&s.jsx(i,{danger:!0,disabled:Boolean(T),onClick:()=>H(a,"unload"),size:"small",title:g("cache"===a.kind?"sidebar.memory.clearTip":"sidebar.memory.unloadTip"),children:g("cache"===a.kind?"sidebar.memory.clear":"sidebar.memory.unload")})]}),n.length>1&&n.map(e=>s.jsxs("div",{className:t.part,children:[s.jsx("span",{style:{flex:1},children:e.name}),s.jsx("span",{className:t.dim,children:[e.vram?`GPU ${p(e.vram)}`:"",e.ram?`RAM ${p(e.ram)}`:""].filter(Boolean).join(" · ")}),a.can_part_ram&&Boolean(e.vram)&&s.jsx(i,{disabled:Boolean(T),onClick:()=>H(a,"ram",e),size:"small",title:g("sidebar.memory.toRamTip"),children:g("sidebar.memory.toRam")})]},e.id))]},a.id)},O=w?x(w):[],U=(w||b).pinned?.length||0;return s.jsxs("div",{className:t.card,children:[s.jsxs("div",{className:t.head,children:[s.jsx("span",{className:t.title,children:g("sidebar.memory.title")}),b.generating&&s.jsx("span",{className:t.tag,children:g("sidebar.memory.generating")}),s.jsx("span",{style:{flex:1}}),s.jsx(i,{icon:v?s.jsx(n,{size:14}):s.jsx(o,{size:14}),iconPosition:"end",onClick:()=>N(!v),size:"small",type:"text",children:g("sidebar.memory.details")})]}),G("VRAM",b.gauges.gpu),G("RAM",b.gauges.ram),(b.gauges.gpu||b.gauges.ram)&&s.jsxs("div",{className:t.legend,children:[s.jsxs("span",{children:[s.jsx("i",{style:{background:C[0]}}),g("sidebar.memory.webui")]}),s.jsxs("span",{children:[s.jsx("i",{style:{background:C[1]}}),g("sidebar.memory.started")]}),s.jsxs("span",{children:[s.jsx("i",{style:{background:C[2]}}),g("sidebar.memory.others")]})]}),s.jsxs("div",{className:t.buttons,children:[s.jsx(i,{disabled:Boolean(T),onClick:()=>V("vram"),size:"small",style:{flex:1},title:g("sidebar.memory.freeVramTip"),children:g("sidebar.memory.freeVram")}),s.jsx(i,{danger:!0,disabled:Boolean(T),onClick:()=>V("all"),size:"small",style:{flex:1},title:g("sidebar.memory.freeAllTip"),children:g("sidebar.memory.freeAll")})]}),v&&s.jsxs("div",{className:t.list,children:[!w&&s.jsx("span",{className:t.dim,children:g("sidebar.memory.reading")}),w&&!O.length&&s.jsx("span",{className:t.dim,children:g("sidebar.memory.nothing")}),O.map(e=>{const a=e.rows.reduce((e,a)=>e+(a.usage?.vram||0),0),r=e.rows.reduce((e,a)=>e+(a.usage?.ram||0),0),n="process"!==e.key&&e.rows.some(e=>!e.pinned&&(e.can_unload||e.can_ram)),o=(l=e.key,d=e.name,g(`sidebar.memory.categories.${l}`,{defaultValue:d}));var l,d;return s.jsxs("div",{className:t.group,children:[s.jsxs("div",{className:t.groupHead,children:[s.jsx("span",{children:`${e.icon} ${o}`}),s.jsx("span",{className:t.dim,style:{fontWeight:400},children:[a?`GPU ${p(a)}`:"",r?`RAM ${p(r)}`:""].filter(Boolean).join(" · ")}),s.jsx("span",{style:{flex:1}}),n&&s.jsx(i,{disabled:Boolean(T),onClick:()=>V("all",{key:e.key,name:o}),size:"small",title:g("sidebar.memory.sectionFreeTip"),type:"link",children:g("sidebar.memory.sectionFree")})]}),e.rows.map(E)]},e.key)}),s.jsx("span",{className:t.dim,children:U?g("sidebar.memory.kept",{count:U}):g("sidebar.memory.keepHint")})]}),(T.trim()||z)&&s.jsx("div",{className:t.message,children:T.trim()||z})]})});
/**
 * @license lucide-react v0.379.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */export{h as default,x as group,p as size,m as split};
