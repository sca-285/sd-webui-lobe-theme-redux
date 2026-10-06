import{a as e,Z as t,G as s,B as l}from"./main-ahieEmiL.js";import{useMemoryKeeper as r,useMemoryColors as a,MemoryControls as o,split as i,size as n}from"./MemoryKeeper-DEcVUZ6B.js";const c=l(({css:e,token:t})=>({bar:e`
    position: relative;

    overflow: hidden;

    height: 18px;

    background: ${t.colorFillTertiary};
    border-radius: ${t.borderRadiusSM}px;
  `,card:e`
    display: flex;
    flex-direction: column;
    gap: 6px;

    padding: 10px 12px;

    font-size: 12px;
    font-variant-numeric: tabular-nums;

    background: ${t.colorFillQuaternary};
    border: 1px solid ${t.colorBorderSecondary};
    border-radius: ${t.borderRadiusLG}px;
  `,fill:e`
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    transition: width 600ms ${t.motionEaseOut}, background 600ms;
  `,head:e`
    display: flex;
    gap: 8px;
    align-items: baseline;
    justify-content: space-between;

    margin-block-end: 2px;

    color: ${t.colorTextSecondary};
  `,label:e`
    width: 38px;
    color: ${t.colorTextSecondary};
  `,name:e`
    overflow: hidden;
    color: ${t.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,row:e`
    display: grid;
    grid-template-columns: 38px 1fr;
    gap: 8px;
    align-items: center;
  `,spark:e`
    display: block;
    width: 100%;
    height: 34px;
  `,text:e`
    position: absolute;
    inset: 0;

    display: flex;
    align-items: center;
    justify-content: flex-end;

    padding-inline: 6px;

    color: ${t.colorText};
    text-shadow: 0 0 3px ${t.colorBgContainer};
  `,title:e`
    font-weight: 600;
    color: ${t.colorText};
  `})),u=e=>(e/1024**3).toFixed(e>=100*1024**3?0:1),m=e.memo(({label:e,parts:t,percent:l,text:r})=>{const{styles:a,theme:o}=c(),i=Math.max(0,Math.min(100,l??0)),n=i>=90?o.colorError:i>=70?o.colorWarning:o.colorPrimary;return s.jsxs("div",{className:a.row,children:[s.jsx("span",{className:a.label,children:e}),s.jsxs("div",{className:a.bar,title:t?`${e}: ${r}\n${t.title}`:`${e}: ${r}`,children:[t?s.jsx("div",{className:a.fill,style:{display:"flex",width:`${i}%`},children:t.bytes.map((e,l)=>s.jsx("div",{style:{background:0===l?n:t.colors[l],flex:`${e} 0 0`,opacity:.6}},l))}):s.jsx("div",{className:a.fill,style:{background:n,opacity:.55,width:`${i}%`}}),s.jsx("span",{className:a.text,children:r})]})]})}),d=e.memo(({series:e})=>{const{styles:t}=c();return s.jsx("svg",{className:t.spark,preserveAspectRatio:"none",viewBox:"0 0 100 30",children:e.map(({color:e,values:t},l)=>{if(t.length<2)return null;const r=100/47,a=(48-t.length)*r,o=t.map((e,t)=>`${(a+t*r).toFixed(2)},${(30-e/100*28-1).toFixed(2)}`);return s.jsxs("g",{children:[s.jsx("polyline",{fill:e,fillOpacity:.12,points:`${o[0].split(",")[0]},30 ${o.join(" ")} 100,30`,stroke:"none"}),s.jsx("polyline",{fill:"none",points:o.join(" "),stroke:e,strokeWidth:1.2,vectorEffect:"non-scaling-stroke"})]},l)})})}),p=e.memo(({memory:l})=>{const{styles:p,theme:x}=c(),{t:h}=t(),g=r(Boolean(l)),y=a(),b=Boolean(l)&&!g.missing&&Boolean(g.status),[f,v]=e.useState(null),[$,j]=e.useState(!1),w=e.useRef({cpu:[],gpu:[],ram:[],vram:[]});if(e.useEffect(()=>{let e,t=!1;const s=(e,t)=>{null!=t&&(e.push(t),e.length>48&&e.shift())},l=async()=>{if("visible"===document.visibilityState)try{const e=await fetch("/lobe/system");if(!e.ok)throw new Error(String(e.status));const l=await e.json();if(t)return;const r=l.gpus[0];s(w.current.cpu,l.cpu),s(w.current.ram,l.ram?l.ram.used/l.ram.total*100:null),s(w.current.gpu,r?.util),s(w.current.vram,r?r.vram_used/r.vram_total*100:null),v(l),j(!1)}catch{t||j(!0)}t||(e=window.setTimeout(l,1500))};return l(),()=>{t=!0,window.clearTimeout(e)}},[]),$&&!f)return null;if(!f)return null;const k=w.current,N=(e,t,s)=>{if(!b||!s)return;const[l,r]=i({...s,free:Math.max(0,s.total-e),total:Math.max(s.total,e)}),a=[l,r,Math.max(0,e-l-r)];return{bytes:a,colors:y,title:`${h("sidebar.memory.webui")} ${n(a[0])} · ${h("sidebar.memory.started")} ${n(a[1])} · ${h("sidebar.memory.others")} ${n(a[2])}`,total:t}};return s.jsxs("div",{className:p.card,children:[s.jsxs("div",{className:p.head,children:[s.jsx("span",{className:p.title,children:h("sidebar.system.title")}),f.gpus[0]&&s.jsx("span",{className:p.name,children:f.gpus[0].name.replace(/^nvidia\s+/i,"")})]}),s.jsx(d,{series:f.gpus.length>0?[{color:x.colorTextTertiary,values:k.cpu},{color:x.colorSuccess,values:k.vram},{color:x.colorPrimary,values:k.gpu}]:[{color:x.colorSuccess,values:k.ram},{color:x.colorPrimary,values:k.cpu}]}),null!==f.cpu&&s.jsx(m,{label:"CPU",percent:f.cpu,text:`${Math.round(f.cpu)}%`}),f.ram&&s.jsx(m,{label:"RAM",parts:N(f.ram.used,f.ram.total,g.status?.gauges.ram),percent:f.ram.used/f.ram.total*100,text:`${u(f.ram.used)} / ${u(f.ram.total)} GB`}),f.gpus.map((e,t)=>s.jsxs("div",{style:{display:"contents"},children:[null!==e.util&&s.jsx(m,{label:f.gpus.length>1?`GPU${t}`:"GPU",percent:e.util,text:`${e.util}%`}),s.jsx(m,{label:"VRAM",parts:0===t?N(e.vram_used,e.vram_total,g.status?.gauges.gpu):void 0,percent:e.vram_used/e.vram_total*100,text:`${u(e.vram_used)} / ${u(e.vram_total)} GB`}),(null!==e.temp||null!==e.power)&&s.jsx(m,{label:null!==e.temp?h("sidebar.system.temp"):"PWR",percent:null!==e.temp?e.temp:e.power_limit?(e.power||0)/e.power_limit*100:null,text:[null!==e.temp?`${e.temp}°C`:"",null!==e.power?`${Math.round(e.power)} W`:""].filter(Boolean).join(" · ")})]},t)),f.disk&&s.jsx(m,{label:h("sidebar.system.disk"),percent:f.disk.used/f.disk.total*100,text:`${u(f.disk.used)} / ${u(f.disk.total)} GB`}),!f.nvml&&f.gpus.length>0&&s.jsx("span",{className:p.name,title:h("sidebar.system.noNvmlHint"),children:h("sidebar.system.noNvml")}),b&&s.jsx(o,{mk:g})]})});export{p as default};
