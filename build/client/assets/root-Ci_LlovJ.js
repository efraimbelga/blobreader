import{r as n,j as e}from"./jsx-runtime-56DGgGmo.js";import{u as x,w as y,x as m,y as S,_ as f,M as j,L as w,O as g,S as k}from"./components-CNHexPVh.js";/**
 * @remix-run/react v2.9.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let a="positions";function M({getKey:r,...l}){let{isSpaMode:c}=x(),o=y(),u=m();S({getKey:r,storageKey:a});let d=n.useMemo(()=>{if(!r)return null;let t=r(o,u);return t!==o.key?t:null},[]);if(c)return null;let h=((t,p)=>{if(!window.history.state||!window.history.state.key){let s=Math.random().toString(32).slice(2);window.history.replaceState({key:s},"")}try{let i=JSON.parse(sessionStorage.getItem(t)||"{}")[p||window.history.state.key];typeof i=="number"&&window.scrollTo(0,i)}catch(s){console.error(s),sessionStorage.removeItem(t)}}).toString();return n.createElement("script",f({},l,{suppressHydrationWarning:!0,dangerouslySetInnerHTML:{__html:`(${h})(${JSON.stringify(a)}, ${JSON.stringify(d)})`}}))}const b="/assets/tailwind-Cb79h418.css",A=()=>[{rel:"stylesheet",href:b}];function I(){return e.jsxs("html",{children:[e.jsxs("head",{children:[e.jsx("link",{rel:"icon",href:"data:image/x-icon;base64,AA"}),e.jsx("title",{children:"AIRabbit Upload"}),e.jsx(j,{}),e.jsx(w,{})]}),e.jsxs("body",{children:[e.jsx(g,{}),e.jsx(M,{}),e.jsx(k,{})]})]})}export{I as default,A as links};
