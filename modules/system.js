const propertiesReader = require('properties-reader');
const configs = propertiesReader('./config.ini');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const email = configs.get('user.email');
const pass = configs.get('user.pass');
const browserpath = configs.get('platform.browserpath');

function notEmpty(prop) {
    return !(prop === null || prop === 'none'.toLowerCase() || prop === '');
};

async function browser() {
    const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-session-crashed-bubble',
        '--no-default-browser-check',
        '--disable-extensions',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list'
    ];
    puppeteer.use(StealthPlugin());

    if (notEmpty(browserpath)) {
        return await puppeteer.launch({headless: true, ignoreHTTPSErrors: true, executablePath: browserpath, args: args});
    }
    return await puppeteer.launch({headless: true, ignoreHTTPSErrors: true, args: args});
}

function getJustSite(link) {
    return link.includes('/?') ? link.substring(link, (link.lastIndexOf('/?'))) : link;
}

async function useInterceptor(page, skipRequests=[], includeRequests=[]) {
    await page.setRequestInterception(true);
    page.on('request', request => {
        const list = ['image', 'stylesheet', 'media', 'font', 'other', 'fetch', 'manifest'];
        const type = request.resourceType();

        if (skipRequests.includes(type)) {
            request.continue();
            return;
        }

        urlFilters = [
            'clicksor',
            'doubleclick',
            'fontawesome',
            'google-analytics',
            'googlesyndication',
            'googleapis',
            'analytics',
            'optimizely',
            'imgur',
            'iconfont',
            'googletagmanager',
            'app.css',
            'cdn'
        ].some(resource => request.url().includes(resource));
        
        if (list.includes(type) || includeRequests.includes(type) || urlFilters) {
            request.abort();
            return;
        }
        request.continue();
    });
}

function getCurrentTime(includeSecs=false) {
    function format(source) {return source < 10 ? '0' + source : source}
    const today = new Date();
    const time = format(today.getHours()) + ':' + format(today.getMinutes());
    return includeSecs ? (time + ':' + format(today.getSeconds())) : time;
}


exports.configs = configs;
exports.email = email;
exports.pass = pass;
exports.browser = browser;
exports.puppeteer = puppeteer;
exports.getJustSite = getJustSite;
exports.useInterceptor = useInterceptor;
exports.getCurrentTime = getCurrentTime;