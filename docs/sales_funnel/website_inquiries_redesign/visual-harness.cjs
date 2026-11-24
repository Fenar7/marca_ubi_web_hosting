const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const esbuild = require('esbuild');
const sass = require('sass');

const root = path.resolve(__dirname, '../../..');
const port = Number(process.env.INQUIRIES_FIXTURE_PORT || 3027);
const dir = path.join(root, 'src/app/admin/(workspace)/ingestion');
const componentPath = JSON.stringify(
  path.join(dir, 'components/IngestionWorkspaceClient'),
);
const modelPath = JSON.stringify(path.join(dir, 'inquiryView'));

const siteStyles = [
  '@font-face{font-family:CircularReview;src:url(/fonts/circular/CircularXXWeb-Book.woff2);font-weight:400}',
  '@font-face{font-family:CircularReview;src:url(/fonts/circular/CircularXXWeb-Medium.woff2);font-weight:500 900}',
  '@font-face{font-family:GraphikReview;src:url(/fonts/grphik-font-family/Graphik-Regular.ttf);font-weight:400}',
  '@font-face{font-family:GraphikReview;src:url(/fonts/grphik-font-family/Graphik-Medium.ttf);font-weight:500 900}',
  '*{box-sizing:border-box}body{margin:0;--font-circular:CircularReview;--font-graphik:GraphikReview;background:#f8f8f7;color:#111}',
  'main{min-width:0;padding:20px}.fixture-banner{background:#111;color:white;padding:10px 20px;font:12px Verdana,sans-serif}',
].join('\n');

const html =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Inquiries fixture</title><link rel="stylesheet" href="/fixture.css"><link rel="stylesheet" href="/bundle.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>';

const stubs = [
  'export default function Link({ href, children, ...props }) { return <a href={href} {...props}>{children}</a> }',
  'export const useRouter = () => ({ refresh() { location.reload() }, push(href) { location.assign(href) } });',
  "export async function findInquiryMatchesAction() { return {success:true,data:[{id:'10000000-0000-0000-0000-000000000001',lead_ref:'LD-TEST',name:'Asha Mehta',company:'Field Notes Studio'}]} }",
  "async function write(operation, data) { (globalThis.fixtureWrites ??= []).push({operation,data}); await new Promise(resolve=>setTimeout(resolve,100)); return {success:false,error:'Fixture write rejected.'} }",
  "export const addInquiryAction = data => write('add',data);",
  "export const updateInquiryAction = data => write('triage',data);",
  "export const linkInquiryAction = data => write('link',data);",
].join('\n');

const source = [
  "import {createRoot} from 'react-dom/client';",
  'import {IngestionWorkspaceClient} from ' + componentPath + ';',
  'import {DetailManagement} from ' + JSON.stringify(path.join(dir, '[id]/DetailManagement')) + ';',
  'import {readInboxFilters} from ' + modelPath + ';',
  'const params = Object.fromEntries(new URLSearchParams(location.search));',
  'const filters = readInboxFilters(params);',
  'const seeds = [',
  "  ['01','Asha Mehta','Field Notes Studio','contact','new','Branding'],",
  "  ['02','Diego Hale','Sea Fig Editions','manual','reviewed','Web & Digital'],",
  "  ['03','Eli Khan','Night Signal','chat_pod','closed','Mobile Apps'],",
  "  ['04','Kira Martin','Loom Archive','start_project','new','UI/UX Design'],",
  '];',
  "const rows = seeds.map(([number,name,company,origin,state,service_category]) => ({ id:'10000000-0000-0000-0000-0000000000'+number, inquiry_ref:'INQ-SAMPLE-'+number, name, company, origin, state, service_category, received_at:'2026-11-23T13:45:07.123456+00:00',assigned_to:null,is_historical:false }));",
  "const owner = {id:'21000000-0000-0000-0000-000000000001',name:'Sample Owner'};",
  "const directoryOnly = {id:'21000000-0000-0000-0000-000000000002',name:'Directory Only'};",
  "const selected = rows.find(row=>location.pathname==='/admin/ingestion/'+row.id);",
  "const detail = selected ? {...selected, updated_at:selected.received_at, original_channel:selected.origin==='manual'?'phone':null, email:'client@example.test', phone:null, summary:'Brand identity and an editorial website for a newly established architecture practice.', lead_id:null, has_link:false, timeline:'Three months',budget:null,close_reason:null} : null;",
  "const visible = params.empty ? [] : rows.filter(row=>(filters.channel==='all'||(filters.channel==='manual')===(row.origin==='manual'))&&(!filters.origin||row.origin===filters.origin)&&(!filters.state||row.state===filters.state||filters.state==='open'&&row.state!=='closed')&&(!filters.q||[row.name,row.company,row.inquiry_ref].join(' ').toLowerCase().includes(filters.q.toLowerCase())));",
  "createRoot(document.getElementById('root')).render(<><aside className='fixture-banner' aria-label='Fixture environment'>Local UI test · synthetic inquiries · writes simulated</aside><main>{location.pathname===`/admin/ingestion`?<IngestionWorkspaceClient canWrite={!params.viewer} canResolve={!params.viewer&&!params.no_leads} filters={filters} rows={visible} listUnavailable={Boolean(params.error)} metrics={{needsReview:params.error?null:2,unassigned:3,received:4}} owners={[owner,directoryOnly]} assignmentOwners={[owner]} triageOwners={[owner]} previous={null} next={null}/>:detail?<><a href={`/admin/ingestion`}>Back to inquiries</a><h1>{detail.company}</h1><h2>Original inquiry</h2><p>{detail.summary}</p><p>Inquiry received</p>{!params.viewer&&<DetailManagement detail={detail} owners={[owner]} canResolve={!params.no_leads}/>}</>:<h1>Inquiry unavailable</h1>}</main></>);",
].join('\n');

async function start() {
  const { outputFiles } = await esbuild.build({
    stdin: { contents: source, loader: 'tsx', resolveDir: root },
    tsconfig: path.join(root, 'tsconfig.json'),
    bundle: true,
    write: false,
    outfile: path.join(root, 'bundle.js'),
    jsx: 'automatic',
    plugins: [
      {
        name: 'isolated-inquiry-ui',
        setup(build) {
          build.onResolve(
            {
              filter: /^next\/(link|navigation)$|^@\/app\/actions\/inquiries$/,
            },
            () => ({ path: 'stubs', namespace: 'fixture' }),
          );
          build.onLoad({ filter: /^stubs$/, namespace: 'fixture' }, () => ({
            contents: stubs,
            loader: 'tsx',
            resolveDir: root,
          }));
          build.onLoad({ filter: /\.scss$/ }, ({ path: filename }) => ({
            contents: sass.compile(filename).css,
            loader: filename.endsWith('.module.scss') ? 'local-css' : 'css',
            resolveDir: path.dirname(filename),
          }));
        },
      },
    ],
  });

  const bundles = new Map(
    outputFiles.map(({ path: filename, contents }) => [
      '/' + path.basename(filename),
      contents,
    ]),
  );
  const permittedFonts = new Map([
    ['/fonts/circular/CircularXXWeb-Book.woff2', 'font/woff2'],
    ['/fonts/circular/CircularXXWeb-Medium.woff2', 'font/woff2'],
    ['/fonts/grphik-font-family/Graphik-Regular.ttf', 'font/ttf'],
    ['/fonts/grphik-font-family/Graphik-Medium.ttf', 'font/ttf'],
  ]);
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const type = permittedFonts.get(url.pathname);
    if (type) {
      response.setHeader('content-type', type);
      fs.createReadStream(path.join(root, 'public', url.pathname))
        .on('error', () => response.end())
        .pipe(response);
    } else if (bundles.has(url.pathname)) {
      response.setHeader(
        'content-type',
        url.pathname.endsWith('.js') ? 'text/javascript' : 'text/css',
      );
      response.end(bundles.get(url.pathname));
    } else if (url.pathname === '/fixture.css') {
      response.setHeader('content-type', 'text/css');
      response.end(siteStyles);
    } else if (/^\/admin\/ingestion(?:\/[a-f0-9-]{36})?$/.test(url.pathname)) {
      response.setHeader('content-type', 'text/html; charset=utf-8');
      response.end(html);
    } else {
      response.writeHead(404).end();
    }
  });
  server.listen(port, '127.0.0.1', () =>
    console.log('Inquiry fixtures at http://127.0.0.1:' + port),
  );
}

start().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
