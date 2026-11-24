/** Renders the real Works UI in Chromium with a loopback-only server and stubbed mutations. */
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const esbuild = require("esbuild");
const sass = require("sass");

const root = path.resolve(__dirname, "../../..");
const port = 3026;
const works = path.join(root, "src/app/admin/(workspace)/works");
const importPath = (name) => JSON.stringify(path.join(works, name));

const styles = `
  @font-face { font-family: CircularReview; src: url('/fonts/circular/CircularXXWeb-Book.woff2'); font-weight: 400; }
  @font-face { font-family: CircularReview; src: url('/fonts/circular/CircularXXWeb-Medium.woff2'); font-weight: 500; }
  @font-face { font-family: GraphikReview; src: url('/fonts/grphik-font-family/Graphik-Regular.ttf'); font-weight: 400; }
  @font-face { font-family: GraphikReview; src: url('/fonts/grphik-font-family/Graphik-Medium.ttf'); font-weight: 500; }
  * { box-sizing: border-box; }
  body { margin: 0; --font-circular: CircularReview; --font-graphik: GraphikReview;
    --font-admin-sans: GraphikReview; --font-admin-primary: CircularReview;
    color: #111; background: #f8f8f7; font: 14px GraphikReview, sans-serif; }
  .fixture-banner { padding: 10px 24px; background: #111; color: #fff; font: 12px GraphikReview, sans-serif; }
  main { padding: 24px 28px; min-width: 0; }
  @media (max-width: 700px) { main { padding: 16px; } .fixture-banner { padding-inline: 16px; } }
`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Client Works fixture verification</title><link rel="stylesheet" href="/fixture.css">
  <link rel="stylesheet" href="/bundle.css"></head><body><div id="root"></div>
  <script src="/bundle.js"></script></body></html>`;

const stubs = `
  export default function Link({ href, children, prefetch, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  }
  export const usePathname = () => '/admin/works';
  export const useSearchParams = () => new URLSearchParams(location.search);
  export const useRouter = () => ({ refresh() { location.reload(); } });
  async function write(operation, data) {
    (globalThis.fixtureWrites ??= []).push({ operation, data });
    await new Promise(resolve => setTimeout(resolve, 100));
    if (new URLSearchParams(location.search).has('reject')) {
      return { success: false, error: 'Fixture write rejected.' };
    }
    return { success: true, data };
  }
  export const updateClientWorkMilestoneAction = data => write('milestone', data);
  export const updateClientWorkStageAction = data => write('stage', data);
  export const updateClientWorkHealthAction = data => write('health', data);
  export const assignClientWorkDirectorsAction = data => write('directors', data);
`;

const entry = `
  import React from 'react';
  import { createRoot } from 'react-dom/client';
  import { WorksWorkspaceClient } from ${importPath("WorksWorkspaceClient")};
  import { createSampleClientWorks } from ${importPath("worksSample")};
  import pageStyles from ${importPath("works.module.scss")};
  import ${JSON.stringify(path.join(root, "src/app/admin/styles/tokens.scss"))};
  const params = new URLSearchParams(location.search);
  const sample = params.has('sample');
  const initialWorks = params.has('empty') ? [] : createSampleClientWorks();
  const profiles = [
    { id: 'fixture-creative', full_name: 'Sample Creative Lead', role: 'admin' },
    { id: 'fixture-technical', full_name: 'Sample Technical Lead', role: 'sales_manager' },
  ];
  createRoot(document.getElementById('root')).render(
    <div data-admin-root="true">
      <aside className="fixture-banner" aria-label="Fixture environment">Local UI test · synthetic records · writes simulated</aside>
      <main>
        <div className={pageStyles.worksWorkspace}>
          <header className={pageStyles.header}>
            <div>
              <h1 className={pageStyles.heading}>Client works</h1>
              <p className={pageStyles.subheading}>Track delivery stages, milestones, and project owners.</p>
            </div>
          </header>
          <WorksWorkspaceClient initialWorks={initialWorks} sample={sample}
            userRole={params.get('role') ?? 'admin'} userId={params.get('user') ?? 'fixture-creative'}
            profiles={profiles} directoryAvailable={!params.has('directory-error')} />
        </div>
      </main>
    </div>
  );
`;

const adapter = {
  name: "isolated-works",
  setup(build) {
    build.onResolve(
      { filter: /^next\/(link|navigation)$|^@\/app\/actions\/works$/ },
      () => ({
        path: "stubs",
        namespace: "fixture",
      }),
    );
    build.onLoad({ filter: /^stubs$/, namespace: "fixture" }, () => ({
      contents: stubs,
      loader: "tsx",
      resolveDir: root,
    }));
    build.onLoad({ filter: /\.scss$/ }, ({ path: filename }) => ({
      contents: sass.compile(filename, { loadPaths: [path.join(root, "src")] })
        .css,
      loader: filename.endsWith(".module.scss") ? "local-css" : "css",
      resolveDir: path.dirname(filename),
    }));
  },
};

async function serve() {
  const { outputFiles } = await esbuild.build({
    stdin: { contents: entry, loader: "tsx", resolveDir: root },
    tsconfig: path.join(root, "tsconfig.json"),
    bundle: true,
    write: false,
    outfile: path.join(root, "bundle.js"),
    jsx: "automatic",
    plugins: [adapter],
    define: { "process.env.NODE_ENV": '"development"' },
  });
  const files = new Map(
    outputFiles.map((file) => [`/${path.basename(file.path)}`, file.contents]),
  );
  files.set("/fixture.css", styles);
  const fonts = new Set([
    "/fonts/circular/CircularXXWeb-Book.woff2",
    "/fonts/circular/CircularXXWeb-Medium.woff2",
    "/fonts/grphik-font-family/Graphik-Regular.ttf",
    "/fonts/grphik-font-family/Graphik-Medium.ttf",
  ]);
  const types = {
    ".js": "application/javascript",
    ".css": "text/css",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
  };

  http
    .createServer((request, response) => {
      const url = new URL(request.url, `http://127.0.0.1:${port}`);
      if (url.pathname === "/admin/works" || url.pathname === "/") {
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(html);
      } else if (files.has(url.pathname)) {
        response.setHeader("Content-Type", types[path.extname(url.pathname)]);
        response.end(files.get(url.pathname));
      } else if (fonts.has(url.pathname)) {
        response.setHeader("Content-Type", types[path.extname(url.pathname)]);
        fs.createReadStream(path.join(root, "public", url.pathname)).pipe(
          response,
        );
      } else {
        response.writeHead(404).end();
      }
    })
    .listen(port, "127.0.0.1", () =>
      console.log(
        `Client Works fixture ready at http://127.0.0.1:${port}/admin/works`,
      ),
    );
}

serve().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
