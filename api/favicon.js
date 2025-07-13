// Vercel serverless function for favicon fetching
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    try {
        const faviconBuffer = await fetchFavicon(url);
        
        if (!faviconBuffer) {
            return res.status(404).json({ error: 'Favicon not found' });
        }
        
        // Determine content type based on buffer
        const contentType = getContentType(faviconBuffer);
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        
        return res.status(200).send(faviconBuffer);
        
    } catch (error) {
        console.error('Error fetching favicon:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Normalize URL to ensure it has a protocol
function normalizeUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }
    return url;
}

// Extract base URL from full URL
function getBaseUrl(url) {
    try {
        const urlObj = new URL(normalizeUrl(url));
        return `${urlObj.protocol}//${urlObj.hostname}`;
    } catch {
        return null;
    }
}

// Fetch favicon with multiple fallback strategies
async function fetchFavicon(inputUrl) {
    const baseUrl = getBaseUrl(inputUrl);
    if (!baseUrl) {
        throw new Error('Invalid URL');
    }
    
    // Strategy 1: Try common favicon paths
    const commonPaths = [
        '/favicon.ico',
        '/favicon.png',
        '/favicon.svg',
        '/apple-touch-icon.png',
        '/apple-touch-icon-precomposed.png',
        '/images/favicon.ico',
        '/images/favicon.png',
        '/assets/favicon.ico',
        '/assets/favicon.png',
        '/static/favicon.ico',
        '/static/favicon.png'
    ];
    
    for (const path of commonPaths) {
        try {
            const response = await fetch(`${baseUrl}${path}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
            });
            
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                if (buffer.byteLength > 0 && isValidImage(new Uint8Array(buffer))) {
                    return Buffer.from(buffer);
                }
            }
        } catch (error) {
            // Continue to next path
            continue;
        }
    }
    
    // Strategy 2: Parse HTML for favicon links
    try {
        const htmlResponse = await fetch(baseUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });
        
        if (htmlResponse.ok) {
            const html = await htmlResponse.text();
            const faviconUrls = extractFaviconUrls(html, baseUrl);
            
            for (const faviconUrl of faviconUrls) {
                try {
                    const response = await fetch(faviconUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        },
                        timeout: 10000
                    });
                    
                    if (response.ok) {
                        const buffer = await response.arrayBuffer();
                        if (buffer.byteLength > 0 && isValidImage(new Uint8Array(buffer))) {
                            return Buffer.from(buffer);
                        }
                    }
                } catch (error) {
                    continue;
                }
            }
        }
    } catch (error) {
        // HTML parsing failed, continue
    }
    
    return null;
}

// Extract favicon URLs from HTML
function extractFaviconUrls(html, baseUrl) {
    const urls = [];
    
    // Match various favicon link tags
    const patterns = [
        /<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/gi,
        /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/gi
    ];
    
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
            const href = match[1];
            if (href) {
                urls.push(resolveUrl(href, baseUrl));
            }
        }
    }
    
    return [...new Set(urls)]; // Remove duplicates
}

// Resolve relative URLs to absolute URLs
function resolveUrl(href, baseUrl) {
    if (href.startsWith('http://') || href.startsWith('https://')) {
        return href;
    }
    
    if (href.startsWith('//')) {
        return `https:${href}`;
    }
    
    if (href.startsWith('/')) {
        return `${baseUrl}${href}`;
    }
    
    return `${baseUrl}/${href}`;
}

// Check if buffer contains a valid image
function isValidImage(buffer) {
    if (buffer.length < 4) return false;
    
    // Check for common image signatures
    const signatures = [
        [0x89, 0x50, 0x4E, 0x47], // PNG
        [0xFF, 0xD8, 0xFF],       // JPEG
        [0x47, 0x49, 0x46],       // GIF
        [0x00, 0x00, 0x01, 0x00], // ICO
        [0x3C, 0x73, 0x76, 0x67], // SVG (starts with <svg)
        [0x3C, 0x3F, 0x78, 0x6D], // SVG (starts with <?xml)
    ];
    
    return signatures.some(sig => 
        sig.every((byte, index) => buffer[index] === byte)
    );
}

// Determine content type from buffer
function getContentType(buffer) {
    const bytes = new Uint8Array(buffer);
    
    if (bytes.length >= 4) {
        // PNG
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
            return 'image/png';
        }
        
        // JPEG
        if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
            return 'image/jpeg';
        }
        
        // GIF
        if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
            return 'image/gif';
        }
        
        // ICO
        if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) {
            return 'image/x-icon';
        }
        
        // SVG
        const text = Buffer.from(bytes.slice(0, 100)).toString('utf8');
        if (text.includes('<svg') || text.includes('<?xml')) {
            return 'image/svg+xml';
        }
    }
    
    // Default to ICO for favicon
    return 'image/x-icon';
}