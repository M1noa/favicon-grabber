# Favicon Grabber

## Quick Start

### Vercel Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fm1noa%2Ffavicon-grabber&project-name=favicon-grabber&repository-name=favicon-grabber&demo-title=vefcel%20hosted%20version&demo-description=live%20version&demo-url=https%3A%2F%2Ffavicon.minoa.cat)
(set build url to `npm run dev` and the install command to `npm install`)

### Cloudflare Workers Deployment

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/m1noa/favicon-grabber)

### Response Codes

- **200 OK**: Favicon found and returned
- **400 Bad Request**: Invalid or missing URL parameter
- **404 Not Found**: No favicon could be located
- **500 Internal Server Error**: Server error occurred

## Performance

- 10-second timeout
- 24-hour browser cache
- 11 different favicon locations to grab from

## Live Versions
[vercel version](https://favicon.minoa.cat/) (favicon-grabberr.vercel.app)

[cloudflare workers version](https://favicon-cf.minoa.cat/) (favicongrabber.minoa.workers.dev)

---

**Built with ❤️ by M1noa**
