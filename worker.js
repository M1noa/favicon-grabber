// Cloudflare Workers version of the favicon fetcher

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }
        
        // Serve static files
        if (url.pathname === '/' || url.pathname === '/index.html') {
            return new Response(HTML_CONTENT, {
                headers: {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }
        
        // Handle favicon API
        if (url.pathname === '/api/favicon') {
            return handleFaviconRequest(request);
        }
        
        return new Response('Not Found', { status: 404 });
    },
};

async function handleFaviconRequest(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'URL parameter is required' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
    
    try {
        const faviconData = await fetchFavicon(targetUrl);
        
        if (!faviconData) {
            return new Response(JSON.stringify({ error: 'Favicon not found' }), {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }
        
        const contentType = getContentType(faviconData);
        
        return new Response(faviconData, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
            },
        });
        
    } catch (error) {
        console.error('Error fetching favicon:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}

function normalizeUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }
    return url;
}

function getBaseUrl(url) {
    try {
        const urlObj = new URL(normalizeUrl(url));
        return `${urlObj.protocol}//${urlObj.hostname}`;
    } catch {
        return null;
    }
}

async function fetchFavicon(inputUrl) {
    const baseUrl = getBaseUrl(inputUrl);
    if (!baseUrl) {
        throw new Error('Invalid URL');
    }
    
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
    
    // Try common paths first
    for (const path of commonPaths) {
        try {
            const response = await fetch(`${baseUrl}${path}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                cf: {
                    timeout: 10000
                }
            });
            
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                if (buffer.byteLength > 0 && isValidImage(new Uint8Array(buffer))) {
                    return buffer;
                }
            }
        } catch (error) {
            continue;
        }
    }
    
    // Parse HTML for favicon links
    try {
        const htmlResponse = await fetch(baseUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            cf: {
                timeout: 10000
            }
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
                        cf: {
                            timeout: 10000
                        }
                    });
                    
                    if (response.ok) {
                        const buffer = await response.arrayBuffer();
                        if (buffer.byteLength > 0 && isValidImage(new Uint8Array(buffer))) {
                            return buffer;
                        }
                    }
                } catch (error) {
                    continue;
                }
            }
        }
    } catch (error) {
        // HTML parsing failed
    }
    
    return null;
}

function extractFaviconUrls(html, baseUrl) {
    const urls = [];
    
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
    
    return [...new Set(urls)];
}

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

function isValidImage(buffer) {
    if (buffer.length < 4) return false;
    
    const signatures = [
        [0x89, 0x50, 0x4E, 0x47], // PNG
        [0xFF, 0xD8, 0xFF],       // JPEG
        [0x47, 0x49, 0x46],       // GIF
        [0x00, 0x00, 0x01, 0x00], // ICO
        [0x3C, 0x73, 0x76, 0x67], // SVG
        [0x3C, 0x3F, 0x78, 0x6D], // SVG
    ];
    
    return signatures.some(sig => 
        sig.every((byte, index) => buffer[index] === byte)
    );
}

function getContentType(buffer) {
    const bytes = new Uint8Array(buffer);
    
    if (bytes.length >= 4) {
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
            return 'image/png';
        }
        
        if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
            return 'image/jpeg';
        }
        
        if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
            return 'image/gif';
        }
        
        if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) {
            return 'image/x-icon';
        }
        
        const text = new TextDecoder().decode(bytes.slice(0, 100));
        if (text.includes('<svg') || text.includes('<?xml')) {
            return 'image/svg+xml';
        }
    }
    
    return 'image/x-icon';
}

// Embedded HTML content for Cloudflare Workers
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Favicon Grabber</title>
    <style>
        body {
            line-height: 1.5;
        }
        
        .main {
            padding: 40px;
        }
        
        .result img {
            margin-top: 10px;
            width: 128px;
            height: 128px;
        }
    </style>
</head>
<body>
        <div class="main">
            <div class="input-group">
                <input type="text" id="url" placeholder="https://example.com or example.com" value="">
            </div>
            
            <button class="btn" onclick="getFavicon()">get</button>
            
            <div class="result" id="result">
                <div id="favicon-display"></div>
                <div id="api-url"></div>
            </div>
                
                <div class="endpoint">
                    GET /api/favicon?url={website_url}
                </div>
                
                <ul>
                    <li><strong>200 OK:</strong> Returns the favicon image (various formats: ICO, PNG, SVG, etc.)</li>
                    <li><strong>404 Not Found:</strong> No favicon could be found</li>
                    <li><strong>400 Bad Request:</strong> Invalid URL provided</li>
                    <li><strong>500 Internal Server Error:</strong> Server error occurred</li>
                </ul>
        </div>
    
    <script>
        async function getFavicon() {
            const urlInput = document.getElementById('url');
            const result = document.getElementById('result');
            const faviconDisplay = document.getElementById('favicon-display');
            const apiUrl = document.getElementById('api-url');
            
            const url = urlInput.value.trim();
            if (!url) {
                alert('Please enter a URL');
                return;
            }
            
            result.style.display = 'none';
            
            try {
                const apiEndpoint = \`/api/favicon?url=\${encodeURIComponent(url)}\`;
                const response = await fetch(apiEndpoint);
                
                if (response.ok) {
                    const blob = await response.blob();
                    const imageUrl = URL.createObjectURL(blob);
                    
                    faviconDisplay.innerHTML = \`<img src="\${imageUrl}" alt="Favicon">\`;
                    result.style.display = 'block';
                } else {
                    alert(\`Error: \${response.status} - \${response.statusText}\`);
                }
            } catch (error) {
                alert(\`Error: \${error.message}\`);
            }
        }
        
        // Allow Enter key to trigger search
        document.getElementById('url').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                getFavicon();
            }
        });
    </script>
</body>
</html>`;