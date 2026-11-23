/** Actual production Deals UI with explicit fixtures and blocked network mutations. */
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  http = require("node:http");
const esbuild = require("esbuild"),
  sass = require("sass");
const root = process.cwd(),
  output = path.join(os.tmpdir(), "marca-deals-review");
fs.mkdirSync(output, { recursive: true });
const shim = `import React from 'react';
export function usePathname(){return '/admin/deals'}
export function useSearchParams(){const[v,s]=React.useState(location.search);React.useEffect(()=>{const f=()=>s(location.search);addEventListener('popstate',f);return()=>removeEventListener('popstate',f)},[]);return React.useMemo(()=>new URLSearchParams(v),[v])}
export function useRouter(){return{push:u=>{history.pushState({},'',u);dispatchEvent(new PopStateEvent('popstate'))},replace:u=>{history.replaceState({},'',u);dispatchEvent(new PopStateEvent('popstate'))},refresh:()=>{}}}
export function Link({href,children,prefetch,...p}){return <a href={href} {...p}>{children}</a>}
export function Image({priority,unoptimized,...p}){return <img {...p}/>}
export function ClientDossierDrawer(){return null}
export function StageTransitionModal({isOpen,onClose,targetStatus}){return isOpen?<div role="dialog" aria-modal="true" aria-label="Fixture guarded transition"><h2>Guarded: {targetStatus.name}</h2><p>Fixture only. No database mutation.</p><button onClick={onClose}>Cancel transition</button></div>:null}
export async function updateLeadStatusInlineAction(id,target){await new Promise(r=>setTimeout(r,80));if(new URLSearchParams(location.search).get('state')==='move-error')return{success:false,error:'Fixture failure'};return{success:true,data:{updatedAt:new Date().toISOString()}}}
`;
const component = path
  .join(root, "src/app/admin/(workspace)/deals/DealsWorkspaceClient")
  .replaceAll("\\", "/");
const entry = `import React from'react';import{createRoot}from'react-dom/client';import{DealsWorkspaceClient}from'${component}';import{useSearchParams}from'next/navigation';import'${path.join(root, "src/app/admin/styles/tokens.scss").replaceAll("\\", "/")}';
const stages=['New','Contacted','On Hold','Qualified','Proposal Sent','Negotiation','Converted','Lost'].map((name,i)=>({id:'stage-'+i,name,sort_order:i,bucket:i<3?'open':i<6?'potential':i===6?'converted':'lost',color_code:['#808080','#808080','#b57718','#227b87','#73678e','#b16a20','#257748','#a12d45'][i],is_active:true}));
const owners=[{id:'owner-1',name:'Tariq Al-Mansoor'},{id:'owner-2',name:'Sophia Sterling'}];const sources=[{id:'source-1',name:'Website'},{id:'source-2',name:'Referral'}];
function App(){const p=useSearchParams();const role=p.get('role')||'admin',state=p.get('state')||'ready',financial=role!=='sales_executive';let records=Array.from({length:18},(_,i)=>{const s=stages[i%6];return{id:'deal-'+i,lead_id:'LD-'+(11000+i),name:['Tariq Abbas','Sophia Chen','Marcus Ellis'][i%3],company:['Alserkal Avenue Cultural Foundation','SLS Dubai Hotel & Residences','Emirates SkyCargo Luxury Logistics','A long international company title for readable wrapping'][i%4],phone:i%3?'+919999999999':null,email:null,expected_value:financial?i===0?0:65000+i*5500:null,priority:['High','Medium','Low'][i%3],next_follow_up:i%4?'2026-11-25T10:00:00Z':null,revisit_date:null,created_at:'2026-11-01T10:00:00Z',updated_at:'2026-11-20T10:00:00Z',assigned_to:i%4?'owner-'+(i%2+1):null,assigned_to_name:i%4?owners[i%2].name:'Unassigned',status_id:s.id,status_name:s.name,status_bucket:s.bucket,status_color:s.color_code,source_name:sources[i%2].name,lead_source_id:sources[i%2].id,service_category:['Branding','Web & Digital'][i%2]}});if(state==='empty')records=[];if(p.get('bucket'))records=records.filter(d=>d.status_bucket===p.get('bucket'));for(const[k,f]of[['assigned_to','assigned_to'],['source','lead_source_id'],['stage','status_id']])if(p.get(k))records=records.filter(d=>d[f]===p.get(k));if(p.get('priority'))records=records.filter(d=>d.priority.toLowerCase()===p.get('priority'));if(p.get('search'))records=records.filter(d=>(d.company+' '+d.name+' '+d.lead_id).toLowerCase().includes(p.get('search').toLowerCase()));return <div data-admin-root="true"><aside className="fixture-banner" aria-label="Fixture environment">ISOLATED UI REVIEW | Sample records | No live session or database</aside><main><DealsWorkspaceClient initialDeals={records} statuses={stages} sources={sources} owners={owners} userRole={role} canViewFinancials={financial} lookupNotice={state==='lookup-error'?'Owner names unavailable.':undefined} pagination={<p className="fixture-pagination">Showing {records.length?1:0}–{records.length} of {records.length} · Stage totals apply to this page</p>}/></main></div>}createRoot(document.getElementById('root')).render(<App/>);`;
fs.writeFileSync(path.join(output, "entry.tsx"), entry);
const css = `@font-face{font-family:CircularReview;src:url('/fonts/circular/CircularXXWeb-Book.woff2');font-weight:400}@font-face{font-family:CircularReview;src:url('/fonts/circular/CircularXXWeb-Medium.woff2');font-weight:500}@font-face{font-family:GraphikReview;src:url('/fonts/grphik-font-family/Graphik-Regular.ttf');font-weight:400}@font-face{font-family:GraphikReview;src:url('/fonts/grphik-font-family/Graphik-Medium.ttf');font-weight:500}*{box-sizing:border-box}body{margin:0;--font-circular:CircularReview;--font-graphik:GraphikReview;--font-admin-sans:GraphikReview;--font-admin-btn:GraphikReview;--font-admin-primary:GraphikReview;background:#f5f5f3;font:14px GraphikReview,sans-serif;color:#111}.fixture-banner{padding:8px 24px;background:#111;color:#fff;font:12px Arial}.fixture-heading{display:flex;justify-content:space-between;margin-bottom:24px}.fixture-heading p{font-size:12px;color:#454542}.fixture-heading h1{font:500 30px CircularReview;margin:8px 0}.fixture-heading span{color:#454542}main{padding:24px 28px;min-width:0}.fixture-pagination{color:#454542;font-size:13px}@media(max-width:700px){main{padding:20px 14px}}`;
fs.writeFileSync(path.join(output, "fixture.css"), css);
fs.writeFileSync(
  path.join(output, "index.html"),
  '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Deals fixture verification</title><link rel="stylesheet" href="/bundle.css"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script src="/bundle.js"></script></html>',
);
const adapter = {
  name: "isolated-ui-adapter",
  setup(b) {
    b.onResolve(
      {
        filter:
          /^next\/(navigation|link|image)$|DossierDrawer$|StageTransitionModal$|^@\/app\/actions\/leadInlineActions$/,
      },
      (a) => ({ path: a.path, namespace: "fixture" }),
    );
    b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
      contents:
        shim +
        (a.path === "next/link"
          ? "\nexport default Link"
          : a.path === "next/image"
            ? "\nexport default Image"
            : ""),
      loader: "tsx",
      resolveDir: root,
    }));
    b.onResolve({ filter: /^@\// }, (a) => {
      const base = path.join(root, "src", a.path.slice(2));
      return {
        path:
          fs.existsSync(base) && fs.statSync(base).isDirectory()
            ? path.join(base, "index.ts")
            : base +
              ([".ts", ".tsx", ".js"].find((e) => fs.existsSync(base + e)) ||
                ""),
      };
    });
    b.onLoad({ filter: /\.scss$/ }, (a) => ({
      contents: sass.compile(a.path, { loadPaths: [path.join(root, "src")] })
        .css,
      loader: a.path.endsWith(".module.scss") ? "local-css" : "css",
      resolveDir: path.dirname(a.path),
    }));
  },
};
esbuild
  .build({
    entryPoints: [path.join(output, "entry.tsx")],
    bundle: true,
    outfile: path.join(output, "bundle.js"),
    format: "iife",
    jsx: "automatic",
    nodePaths: [path.join(root, "node_modules")],
    plugins: [adapter],
    define: { "process.env.NODE_ENV": '"development"' },
  })
  .then(() =>
    http
      .createServer((req, res) => {
        const url = new URL(req.url, "http://127.0.0.1"),
          asset =
            url.pathname.startsWith("/fonts/") ||
            url.pathname.startsWith("/images/");
        const base = asset ? path.join(root, "public") : output;
        let file = path.resolve(base, "." + url.pathname);
        if (!file.startsWith(path.resolve(base) + path.sep)) {
          res.writeHead(403);
          res.end();
          return;
        }
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
          file = path.join(output, "index.html");
        res.setHeader(
          "Content-Type",
          {
            ".js": "text/javascript",
            ".css": "text/css",
            ".html": "text/html",
            ".svg": "image/svg+xml",
            ".woff2": "font/woff2",
            ".ttf": "font/ttf",
          }[path.extname(file)] || "application/octet-stream",
        );
        fs.createReadStream(file).pipe(res);
      })
      .listen(3021, "127.0.0.1", () =>
        console.log("Deals fixture ready http://127.0.0.1:3021/admin/deals"),
      ),
  )
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
