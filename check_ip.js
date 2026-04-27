import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import 'dotenv/config';

async function checkIp() {
    const proxyUrl = process.env.OUTBOUND_PROXY_URL;
    const targetUrl = 'https://www.kwikapi.com/api/v2/ip_detect.php';
    
    console.log('--- IP Detection Check ---');
    console.log('Target:', targetUrl);
    
    let options = {};
    if (proxyUrl) {
        console.log('Using Proxy:', proxyUrl.split('@').pop());
        options.agent = new HttpsProxyAgent(proxyUrl);
    } else {
        console.log('No Proxy configured, using direct connection.');
    }

    try {
        const response = await fetch(targetUrl, options);
        const text = await response.text();
        console.log('\nResponse from KwikAPI:');
        console.log(text);
        
        // Also check with icanhazip.com for comparison
        const response2 = await fetch('https://icanhazip.com', options);
        const ip2 = await response2.text();
        console.log('\nResponse from icanhazip.com:');
        console.log(ip2.trim());

    } catch (error) {
        console.error('Error detecting IP:', error.message);
    }
}

checkIp();
