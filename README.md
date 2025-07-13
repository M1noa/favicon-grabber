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

## API Usage

### Endpoint
```
GET /api/favicon?url={website_url}
```

### Examples

**With HTTPS:**
```
/api/favicon?url=https://github.com
```

**With HTTP:**
```
/api/favicon?url=http://example.com
```

**Without protocol:**
```
/api/favicon?url=google.com
```

### Response Codes

- **200 OK**: Favicon found and returned
- **400 Bad Request**: Invalid or missing URL parameter
- **404 Not Found**: No favicon could be located
- **500 Internal Server Error**: Server error occurred

## Configuration

### Vercel

The `vercel.json` file configures:
- Static file serving from `/public`
- API routes under `/api`
- Function timeout settings

### Cloudflare Workers

The `wrangler.toml` file configures:
- Worker name and compatibility
- Environment settings
- Optional custom domains
- KV namespace for caching (optional)

### Environment Variables

No environment variables are required for basic functionality. Optional configurations:

- Custom timeout values
- Cache duration settings
- Rate limiting parameters

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

## License

MIT License - feel free to use this in your projects!

## Contributing

Contributions welcome! Please feel free to submit issues and pull requests.

---

**Built with ❤️ by Pliny**
