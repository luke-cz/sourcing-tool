"use strict";(()=>{var e={};e.id=955,e.ids=[955],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},8791:e=>{e.exports=require("https")},5315:e=>{e.exports=require("path")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},2623:e=>{e.exports=require("worker_threads")},1568:e=>{e.exports=require("zlib")},7561:e=>{e.exports=require("node:fs")},4492:e=>{e.exports=require("node:stream")},2477:e=>{e.exports=require("node:stream/web")},371:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>m,patchFetch:()=>x,requestAsyncStorage:()=>l,routeModule:()=>c,serverHooks:()=>h,staticGenerationAsyncStorage:()=>d});var o={};t.r(o),t.d(o,{POST:()=>p});var s=t(9303),n=t(8716),a=t(670),i=t(7070);let u=new(t(672)).ZP;async function p(e){if(!process.env.ANTHROPIC_API_KEY)return i.NextResponse.json({error:"ANTHROPIC_API_KEY not set"},{status:503});let{cvs:r,mustHaves:t,niceToHaves:o,background:s}=await e.json();if(!r?.length)return i.NextResponse.json({matches:[]});let n=r.map((e,r)=>{let t=e.parsed,o=t.experience.slice(0,4).map(e=>`  - ${e.title} at ${e.company}${e.duration?` (${e.duration})`:""}${e.description?`: ${e.description.slice(0,100)}`:""}`).join("\n");return`CV ${r+1} [id: ${e.id}]
Name: ${t.name??e.fileName}
Headline: ${t.headline??"N/A"}
Skills: ${t.skills.slice(0,20).join(", ")||"N/A"}
Experience:
${o||"  N/A"}
Education: ${t.education.join(", ")||"N/A"}`}).join("\n\n---\n\n"),a=t?.length?`Must-haves: ${t.join(", ")}`:"",p=o?.length?`Nice-to-haves: ${o.join(", ")}`:"",c=s?`Role context: ${s}`:"",l=`You are a senior technical recruiter. Evaluate the following CVs against the job requirements.

${c}
${a}
${p}

CVs to evaluate:

${n}

For each CV, provide a match score (0–100), up to 3 key strengths, up to 2 gaps vs requirements, and a 1-sentence summary.

Return ONLY a JSON array (no markdown, no explanation):
[
  {
    "cvId": "the id value from the CV entry",
    "score": 85,
    "strengths": ["5 years React Native experience", "worked at top fintech"],
    "gaps": ["no TypeScript mentioned"],
    "summary": "Strong React Native engineer with fintech background, well-aligned with the role."
  }
]`;try{let e;let r=(await u.messages.create({model:"claude-haiku-4-5-20251001",max_tokens:1e3,messages:[{role:"user",content:l}]})).content[0];if("text"!==r.type)throw Error("Unexpected response type");try{let t=r.text.replace(/^```(?:json)?\n?/,"").replace(/\n?```$/,"").trim();e=JSON.parse(t)}catch{throw Error("Claude returned invalid JSON")}return e.sort((e,r)=>r.score-e.score),i.NextResponse.json({matches:e})}catch(e){return console.error("[match-cvs] error:",e),i.NextResponse.json({error:e instanceof Error?e.message:"Failed to match CVs"},{status:500})}}let c=new s.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/match-cvs/route",pathname:"/api/match-cvs",filename:"route",bundlePath:"app/api/match-cvs/route"},resolvedPagePath:"C:\\Users\\lczab\\OneDrive\\Dokumenty\\Playground\\sourcing-tool\\app\\api\\match-cvs\\route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:l,staticGenerationAsyncStorage:d,serverHooks:h}=c,m="/api/match-cvs/route";function x(){return(0,a.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:d})}}};var r=require("../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),o=r.X(0,[276,972,672],()=>t(371));module.exports=o})();