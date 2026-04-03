"use strict";(()=>{var e={};e.id=121,e.ids=[121],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},8791:e=>{e.exports=require("https")},5315:e=>{e.exports=require("path")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},2623:e=>{e.exports=require("worker_threads")},1568:e=>{e.exports=require("zlib")},7561:e=>{e.exports=require("node:fs")},4492:e=>{e.exports=require("node:stream")},2477:e=>{e.exports=require("node:stream/web")},6687:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>h,patchFetch:()=>q,requestAsyncStorage:()=>l,routeModule:()=>c,serverHooks:()=>x,staticGenerationAsyncStorage:()=>m});var s={};t.r(s),t.d(s,{POST:()=>d});var o=t(9303),i=t(8716),n=t(670),a=t(7070);let u=new(t(672)).ZP;async function p(e,r){let t=r?`Industry context: ${r}

`:"",s=(await u.messages.create({model:"claude-haiku-4-5-20251001",max_tokens:400,messages:[{role:"user",content:`${t}Extract requirements from this job description. Return ONLY valid JSON, no explanation.

Format:
{
  "mustHaves": ["requirement 1", "requirement 2", ...],
  "niceToHaves": ["requirement 1", "requirement 2", ...],
  "searchQuery": "concise search string for finding matching candidates on GitHub/LinkedIn"
}

Rules:
- mustHaves: hard requirements, "required", "must have", "essential", minimum qualifications
- niceToHaves: "preferred", "nice to have", "bonus", "plus", "ideally"
- If not clearly categorized, lean toward mustHaves
- searchQuery: 3-5 specific technical keywords only, space-separated, NO boolean operators like AND/OR (e.g. "rust trading risk engine", "quant hft market-making"). No generic words like "developer", "engineer", "lead", "senior". Think about what this person would actually build or have in their GitHub repos/bio
- Keep each requirement short (under 10 words)
- Max 8 mustHaves, max 6 niceToHaves

Job description:
${e.slice(0,3e3)}`}]})).content[0];if("text"!==s.type)throw Error("Unexpected response");let o=s.text.match(/\{[\s\S]*\}/);if(!o)throw Error("No JSON in response");return JSON.parse(o[0])}async function d(e){if(!process.env.ANTHROPIC_API_KEY)return a.NextResponse.json({error:"ANTHROPIC_API_KEY not set"},{status:503});let{jobSpec:r,background:t}=await e.json();if(!r||"string"!=typeof r||!r.trim())return a.NextResponse.json({error:"jobSpec is required"},{status:400});try{let e=await p(r.trim(),t?.trim());return a.NextResponse.json(e)}catch(e){return console.error("[parse-jd] error:",e),a.NextResponse.json({error:e instanceof Error?e.message:"Failed to parse job description"},{status:500})}}let c=new o.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/parse-jd/route",pathname:"/api/parse-jd",filename:"route",bundlePath:"app/api/parse-jd/route"},resolvedPagePath:"C:\\Users\\lczab\\OneDrive\\Dokumenty\\Playground\\sourcing-tool\\app\\api\\parse-jd\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:l,staticGenerationAsyncStorage:m,serverHooks:x}=c,h="/api/parse-jd/route";function q(){return(0,n.patchFetch)({serverHooks:x,staticGenerationAsyncStorage:m})}}};var r=require("../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[276,972,672],()=>t(6687));module.exports=s})();