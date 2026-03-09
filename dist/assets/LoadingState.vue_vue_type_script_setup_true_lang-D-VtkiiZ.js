import{c as m}from"./createLucideIcon-D5xczaJX.js";import{_}from"./Icon.vue_vue_type_script_setup_true_lang-CFVEJmiD.js";import{d as i,o as e,c as o,a as y,u as c,b as f,e as l,i as d,y as g,C as w,n as p,F as v,x,g as k}from"./index-Dn2axGfa.js";/**
 * @license lucide-vue-next v0.564.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=m("chevron-down",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-vue-next v0.564.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=m("inbox",[["polyline",{points:"22 12 16 12 14 15 10 15 8 12 2 12",key:"o97t9d"}],["path",{d:"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"oot6mr"}]]),b={class:"table-empty"},$={class:"text-base font-semibold text-gray-900"},S={key:0,class:"text-sm text-gray-500"},B={key:1,class:"mt-2 flex justify-center"},E=i({__name:"EmptyState",props:{title:{},description:{},icon:{}},setup(t){const a=t.icon??C;return(n,r)=>(e(),o("div",b,[y(_,{icon:c(a),size:32,className:"text-gray-400"},null,8,["icon"]),f("p",$,l(t.title),1),t.description?(e(),o("p",S,l(t.description),1)):d("",!0),n.$slots.action?(e(),o("div",B,[g(n.$slots,"action")])):d("",!0)]))}}),L=i({__name:"SkeletonLine",props:{width:{},height:{}},setup(t){const s=t,a=p(()=>s.width??"w-full"),n=p(()=>s.height??"h-3");return(r,u)=>(e(),o("div",{class:w(["animate-pulse rounded-[var(--radius-sm)] bg-gray-200",a.value,n.value])},null,2))}}),N={class:"space-y-3"},F=i({__name:"LoadingState",props:{lines:{},width:{}},setup(t){const s=t,a=s.lines??4,n=s.width??"w-full";return(r,u)=>(e(),o("div",N,[(e(!0),o(v,null,x(c(a),h=>(e(),k(L,{key:h,width:c(n)},null,8,["width"]))),128))]))}});export{D as C,C as I,E as _,F as a};
