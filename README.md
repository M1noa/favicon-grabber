# Favicon Grabber

## Quick Start

### Vercel Deployment

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Local development:**
   ```bash
   npm run dev
   ```

3. **Deploy to Vercel:**
   ```bash
   npm run deploy
   ```

### Cloudflare Workers Deployment

1. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Local development:**
   ```bash
   npm run wrangler:dev
   ```

4. **Deploy to Cloudflare:**
   ```bash
   npm run wrangler:deploy
   ```

### Response Codes

- **200 OK**: Favicon found and returned
- **400 Bad Request**: Invalid or missing URL parameter
- **404 Not Found**: No favicon could be located
- **500 Internal Server Error**: Server error occurred

## Performance

- **Timeout**: 10-second request timeout
- **Caching**: 24-hour browser cache
- **Fallbacks**: Up to 11 different favicon locations tested
- **Validation**: Image signature verification prevents false positives

## Security

- CORS headers properly configured
- User-Agent spoofing for better compatibility
- Input validation and sanitization
- No sensitive data exposure

---

**Built with ❤️ by M1noa**
