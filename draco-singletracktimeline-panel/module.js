/* [create-plugin] version: 7.7.0 */
/* [create-plugin] plugin: draco-singletracktimeline-panel@0.0.1 */
define(["@emotion/css","@grafana/data","@grafana/runtime","@grafana/ui","module","react"],(e,t,r,a,n,o)=>(()=>{"use strict";var i={89(t){t.exports=e},781(e){e.exports=t},531(e){e.exports=r},7(e){e.exports=a},308(e){e.exports=n},959(e){e.exports=o}},l={};function s(e){var t=l[e];if(void 0!==t)return t.exports;var r=l[e]={exports:{}};return i[e](r,r.exports,s),r.exports}s.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return s.d(t,{a:t}),t},s.d=(e,t)=>{for(var r in t)s.o(t,r)&&!s.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},s.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),s.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.p="public/plugins/draco-singletracktimeline-panel/";var d={};s.r(d),s.d(d,{plugin:()=>S});var c=s(308),u=s.n(c);s.p=u()&&u().uri?u().uri.slice(0,u().uri.lastIndexOf("/")+1):"public/plugins/draco-singletracktimeline-panel/";var p=s(781),m=s(959),f=s.n(m),g=s(89),h=s(7),y=s(531);function b(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function v(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{},a=Object.keys(r);"function"==typeof Object.getOwnPropertySymbols&&(a=a.concat(Object.getOwnPropertySymbols(r).filter(function(e){return Object.getOwnPropertyDescriptor(r,e).enumerable}))),a.forEach(function(t){b(e,t,r[t])})}return e}function x(e,t){return t=null!=t?t:{},Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):function(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,a)}return r}(Object(t)).forEach(function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(t,r))}),e}const w=["green","blue","orange","purple","yellow","red"],O={startTimeField:"start",endTimeField:"end",colorByField:"status",labelField:"status",tooltipFields:[],colorMappings:"",laneHeight:28,barRadius:3,showLabels:!0,tooltipWrap:!0},N=e=>({wrapper:g.css`
      font-family: ${e.typography.fontFamily};
      position: relative;
      overflow: hidden;
      color: ${e.colors.text.primary};
    `,empty:g.css`
      align-items: center;
      color: ${e.colors.text.secondary};
      display: flex;
      height: 100%;
      justify-content: center;
      width: 100%;
    `,axisLabel:g.css`
      fill: ${e.colors.text.secondary};
      font-size: 11px;
    `,segmentLabel:g.css`
      fill: ${e.colors.text.maxContrast};
      font-size: 11px;
      font-weight: ${e.typography.fontWeightMedium};
      pointer-events: none;
    `,tooltip:g.css`
      background: ${e.colors.background.primary};
      border: 1px solid ${e.colors.border.strong};
      border-radius: ${e.shape.radius.default};
      box-shadow: ${e.shadows.z3};
      color: ${e.colors.text.primary};
      font-size: 12px;
      line-height: 1.35;
      max-width: 360px;
      padding: ${e.spacing(1)};
      pointer-events: none;
      position: absolute;
      z-index: 1;
    `,tooltipRow:g.css`
      display: grid;
      gap: ${e.spacing(1)};
      grid-template-columns: max-content minmax(0, 1fr);
      margin-bottom: 4px;

      &:last-child {
        margin-bottom: 0;
      }
    `,tooltipName:g.css`
      color: ${e.colors.text.secondary};
    `,tooltipValue:g.css`
      min-width: 0;
      overflow-wrap: anywhere;
    `,tooltipValueNoWrap:g.css`
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `});function M(e,t){const r=null==t?void 0:t.trim().toLowerCase();if(r)return e.fields.find(e=>e.name.toLowerCase()===r)}function F(e){return e.fields.find(e=>"time"===e.type)}function E(e,t){return e.fields.reduce((e,r)=>(e[r.name]=r.values[t],e),{})}function j(e){if(e instanceof Date)return e.getTime();if("number"==typeof e&&Number.isFinite(e))return e;if("string"==typeof e){const t=Date.parse(e);return Number.isNaN(t)?void 0:t}}function P(e){return new Date(e).toLocaleString()}function $(e){return null==e?"":"object"==typeof e?JSON.stringify(e):String(e)}const S=new p.PanelPlugin(({options:e,data:t,width:r,height:a,fieldConfig:n,id:o,timeRange:i})=>{const l=(0,h.useTheme2)(),s=(0,h.useStyles2)(N),d=(0,m.useMemo)(()=>v({},O,e),[e]),[c,u]=(0,m.useState)(null),p=(0,m.useMemo)(()=>function(e,t){const r=[];for(const d of e){var a,n;const e=null!==(a=M(d,t.startTimeField))&&void 0!==a?a:F(d),c=M(d,t.endTimeField),u=M(d,t.colorByField),p=null!==(n=M(d,t.labelField))&&void 0!==n?n:u;if(e)for(let t=0;t<d.length;t+=1){var o,i,l,s;const a=j(e.values[t]),n=c?j(c.values[t]):void 0,m=j(e.values[t+1]),f=null!=n?n:m;void 0===a||void 0===f||f<=a||r.push({start:a,end:f,colorValue:$(null!==(o=null!==(i=null==u?void 0:u.values[t])&&void 0!==i?i:null==p?void 0:p.values[t])&&void 0!==o?o:""),label:$(null!==(l=null!==(s=null==p?void 0:p.values[t])&&void 0!==s?s:null==u?void 0:u.values[t])&&void 0!==l?l:""),raw:E(d,t)})}}return r.sort((e,t)=>e.start-t.start||e.end-t.end)}(t.series,d),[t.series,d]),b=(0,m.useMemo)(()=>function(e){if(!(null==e?void 0:e.trim()))return{};try{const t=JSON.parse(e);if(t&&"object"==typeof t&&!Array.isArray(t))return Object.entries(t).reduce((e,[t,r])=>("string"==typeof r&&(e[t.toLowerCase()]=r),e),{})}catch(e){}return e.split(/\r?\n|,/).reduce((e,t)=>{const[r,a]=t.split(/[=:]/).map(e=>e.trim());return r&&a&&(e[r.toLowerCase()]=a),e},{})}(d.colorMappings),[d.colorMappings]),S=i.from.valueOf(),C=i.to.valueOf(),L=(0,m.useMemo)(()=>function(e,t,r){return e.filter(e=>e.end>t&&e.start<r).map(e=>x(v({},e),{start:Math.max(e.start,t),end:Math.min(e.end,r)}))}(p,S,C),[p,S,C]);if(0===t.series.length)return f().createElement(y.PanelDataErrorView,{fieldConfig:n,panelId:o,data:t,needsTimeField:!0});if(0===p.length)return f().createElement("div",{className:(0,g.cx)(s.wrapper,g.css`
            width: ${r}px;
            height: ${a}px;
          `)},f().createElement("div",{className:s.empty},"No valid segments"));if(0===L.length)return f().createElement("div",{className:(0,g.cx)(s.wrapper,g.css`
            width: ${r}px;
            height: ${a}px;
          `)},f().createElement("div",{className:s.empty},"No segments in selected time range"));const V=10,k=(T=d.laneHeight,D=8,W=Math.max(8,a-18-12),Math.min(W,Math.max(D,T)));var T,D,W;const B=Math.max(6,Math.floor((a-18-k)/2)),z=Math.min(a-2,B+k+14),R=S,I=C,A=Math.max(1,I-R),H=Math.max(1,r-20),_=e=>V+(e-R)/A*H,J=function(e,t){if(e.tooltipFields.length>0)return e.tooltipFields;const r=t[0];return r?Object.keys(r.raw):[]}(d,L);return f().createElement("div",{className:(0,g.cx)(s.wrapper,g.css`
          width: ${r}px;
          height: ${a}px;
        `),onMouseLeave:()=>u(null)},f().createElement("svg",{width:r,height:a,xmlns:"http://www.w3.org/2000/svg","data-testid":"single-lane-timeline"},f().createElement("line",{x1:V,x2:r-V,y1:z,y2:z,stroke:l.colors.border.medium,strokeWidth:1}),f().createElement("text",{className:s.axisLabel,x:V,y:a-3},P(R)),f().createElement("text",{className:s.axisLabel,x:r-V,y:a-3,textAnchor:"end"},P(I)),L.map((e,t)=>{const r=_(e.start),a=_(e.end),n=Math.max(1,a-r),o=function(e,t,r,a){const n=t[e.toLowerCase()];if(n)return n.startsWith("#")||n.startsWith("rgb")?n:r.visualization.getColorByName(n);const o=w[function(e){return e.split("").reduce((e,t)=>31*e+t.charCodeAt(0)>>>0,0)}(e||String(a))%w.length];return r.visualization.getColorByName(o)}(e.colorValue,b,l,t);return f().createElement("g",{key:`${e.start}-${e.end}-${t}`},f().createElement("rect",{"data-testid":"timeline-segment",x:r,y:B,width:n,height:k,rx:d.barRadius,ry:d.barRadius,fill:o,onMouseEnter:t=>u({record:e,x:t.nativeEvent.offsetX,y:t.nativeEvent.offsetY}),onMouseMove:t=>u({record:e,x:t.nativeEvent.offsetX,y:t.nativeEvent.offsetY})}),d.showLabels&&e.label&&n>34&&f().createElement("text",{className:s.segmentLabel,x:r+6,y:B+k/2+4},function(e,t){if(e.length<=t)return e;return`${e.slice(0,Math.max(0,t-3))}...`}(e.label,Math.max(3,Math.floor(n/7)))))})),c&&f().createElement("div",{className:s.tooltip,style:{left:Math.min(r-20,c.x+12),top:Math.max(4,c.y-8),transform:c.x>r-220?"translateX(-100%)":void 0}},J.map(e=>f().createElement("div",{className:s.tooltipRow,key:e},f().createElement("span",{className:s.tooltipName},e),f().createElement("span",{className:(0,g.cx)(s.tooltipValue,!d.tooltipWrap&&s.tooltipValueNoWrap)},function(e){if(null==e)return"-";if(e instanceof Date)return P(e.getTime());if("number"==typeof e&&Number.isFinite(e)&&e>1e11)return P(e);return $(e)}(c.record.raw[e]))))))}).setPanelOptions(e=>e.addFieldNamePicker({path:"startTimeField",name:"Start time field",description:"Column used as the segment start time.",defaultValue:"start",category:["Fields"]}).addFieldNamePicker({path:"endTimeField",name:"End time field",description:"Column used as the segment end time. If omitted, the next segment start is used.",defaultValue:"end",category:["Fields"]}).addFieldNamePicker({path:"colorByField",name:"Color by field",description:"Column whose value decides the segment color.",defaultValue:"status",category:["Fields"]}).addFieldNamePicker({path:"labelField",name:"Label field",description:"Column displayed inside each segment when labels are enabled.",defaultValue:"status",category:["Fields"]}).addStringArray({path:"tooltipFields",name:"Tooltip fields",description:"Columns shown in the hover tooltip.",defaultValue:[],category:["Fields"],settings:{placeholder:"field name"}}).addTextInput({path:"colorMappings",name:"Color mappings",description:"One mapping per line, for example: running=#73BF69. JSON objects are also supported.",defaultValue:"",category:["Colors"],settings:{useTextarea:!0,rows:6}}).addNumberInput({path:"laneHeight",name:"Lane height",description:"Height of the single status bar in pixels.",defaultValue:28,category:["Display"],settings:{min:8,max:120,integer:!0}}).addNumberInput({path:"barRadius",name:"Bar radius",description:"Corner radius of each segment.",defaultValue:3,category:["Display"],settings:{min:0,max:24,integer:!0}}).addBooleanSwitch({path:"showLabels",name:"Show labels",defaultValue:!0,category:["Display"]}).addBooleanSwitch({path:"tooltipWrap",name:"Wrap tooltip values",defaultValue:!0,category:["Display"]}));return d})());
//# sourceMappingURL=module.js.map