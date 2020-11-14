function serialize(object) {
  return JSON.stringify(object);
}

function head({page, project, router}, hasStyle) {
  let canonical = page.canonical;
  if(!canonical) {
    canonical = `https://${project.domain}${router.url}`;
  }
  if(canonical.indexOf('//') === -1) {
    canonical = `https://${project.domain}${page.canonical}`;
  }
  let image = page.image;
  if(image.indexOf('//') === -1) {
    image = `https://${project.domain}${page.image}`;
  }
  return (`
    <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      ${page.title ? `<title>${page.title}</title>` : ''}
      ${page.image ? `<meta property="og:image" content="${image}">` : ''}
      ${page.description ? `<meta property="og:description" content="${page.description}">` : ''}
      ${page.description ? `<meta name="description" content="${page.description}">` : ''}
      ${page.title ? `<meta property="og:title" content="${page.title}">` : ''}
      ${project.type ? `<meta property="og:type" content="${project.type}">` : ''}
      ${project.name ? `<meta property="og:site_name" content="${project.name}">` : ''}
      <meta property="og:url" content="${canonical}">
      <link rel="canonical" href="${canonical}">
      ${page.locale ? `<meta property="og:locale" content="${page.locale}">` : ''}
      <link rel="shortcut icon" href="${project.favicon}" type="image/png">
      <link rel="icon" href="${project.favicon}" type="image/png">
      <link rel="manifest" href="/manifest.json" integrity="">
      <meta name="mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-capable" content="yes">
      ${project.name ? `<meta name="application-name" content="${project.name}">` : ''}
      ${project.name ? `<meta name="apple-mobile-web-app-title" content="${project.name}">` : ''}
      ${page.robots ? `<meta name="robots" content="${page.robots}" />` : ''}
      <meta name="msapplication-starturl" content="/">
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
      ${hasStyle ? `<link rel="stylesheet" href="/client.css" integrity="">` : ''}
      ${page.schema ? `<script type="application/ld+json">${serialize(page.schema)}</script>` : ''}
      <link rel="apple-touch-icon" sizes="180x180" href="${project.icons['180']}">
      <meta name="msapplication-TileColor" content="${project.backgroundColor || project.color}">
      <meta name="theme-color" content="${project.color}">
    </head>
  `).split('\n').join('');
}

function body({html, memory, context, page, environment}) {
  const serializableContext = {};
  const blacklist = ['scope', 'router', 'page', 'environment', 'network'];
  for(const [key, value] of Object.entries(context)) {
    if(!blacklist.includes(key) && typeof(value) !== 'function') {
      serializableContext[key] = value;
    }
  }
  return (`
    <body>
      <div id="application">${html}</div>
      <script async defer>
        window.page = ${serialize(page)};
        window.context = ${serialize(serializableContext)};
        window.instances = ${serialize(memory)};
        window.environment = ${serialize(environment)};
        document.addEventListener('DOMContentLoaded', () => {
          const script = window.document.createElement( 'script' );
          script.src = '/client.js';
          document.body.append(script);
        });
      </script>
    </body>
  `);
}

export default function(renderable, hasStyle) {
  return (`
    <!DOCTYPE html>
    <html${renderable.context.page.locale ? ` lang="${renderable.context.page.locale}"` : ''}>
      ${head(renderable.context, hasStyle)}
      ${body(renderable)}
    </html>
  `)
}