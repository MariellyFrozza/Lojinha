#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn, spawnSync } = require('node:child_process');

const {
    ITEMS_PER_PAGE,
    getActiveItems,
    getTotalPages
} = require('../carousel/shared.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT_DIR, 'data.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'carousel', 'output');
const HOST = '127.0.0.1';
const PORT = Number(process.env.CAROUSEL_PORT || 4173);
const VIEWPORT = '1080,1350';
const SCREENSHOT_TIMEOUT_MS = 25000;

function startStaticServerProcess() {
    return new Promise((resolve, reject) => {
        const serverProcess = spawn(
            'python3',
            ['-m', 'http.server', String(PORT), '--bind', HOST, '--directory', ROOT_DIR],
            { stdio: 'ignore' }
        );
        let isReady = false;

        serverProcess.on('error', reject);
        const handleEarlyExit = code => {
            if (!isReady && code !== 0) {
                reject(new Error(`Servidor estático encerrou com código ${code}.`));
            }
        };
        serverProcess.on('exit', handleEarlyExit);

        setTimeout(() => {
            isReady = true;
            serverProcess.off('exit', handleEarlyExit);
            resolve(serverProcess);
        }, 800);
    });
}

function findChromeBinary() {
    const candidates = [
        process.env.CHROME_PATH,
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        'google-chrome',
        'chromium',
        'chromium-browser'
    ].filter(Boolean);

    for (const candidate of candidates) {
        if (candidate.includes(path.sep)) {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
            continue;
        }

        const whichResult = spawnSync('which', [candidate], { encoding: 'utf8' });
        if (whichResult.status === 0) {
            return whichResult.stdout.trim();
        }
    }

    return null;
}

function clearOldOutputs(outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        return;
    }

    const oldFiles = fs.readdirSync(outputDir)
        .filter(fileName => /^carousel-\d+\.png$/.test(fileName));

    for (const fileName of oldFiles) {
        fs.unlinkSync(path.join(outputDir, fileName));
    }
}

function saveScreenshot(chromePath, pageNumber, outputPath, userDataDir) {
    const pageUrl = `http://${HOST}:${PORT}/carousel/?page=${pageNumber}`;
    const args = [
        '--headless=new',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-background-networking',
        '--no-first-run',
        '--disable-extensions',
        '--disable-component-update',
        '--disable-sync',
        `--user-data-dir=${userDataDir}`,
        '--hide-scrollbars',
        `--window-size=${VIEWPORT}`,
        '--virtual-time-budget=14000',
        `--screenshot=${outputPath}`,
        pageUrl
    ];

    const result = spawnSync(chromePath, args, {
        stdio: 'ignore',
        timeout: SCREENSHOT_TIMEOUT_MS,
        killSignal: 'SIGKILL'
    });
    const screenshotWasCreated = fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0;

    if (result.status !== 0 && !screenshotWasCreated) {
        const timeoutHint = result.signal === 'SIGTERM' || result.signal === 'SIGKILL'
            ? `Processo excedeu timeout de ${SCREENSHOT_TIMEOUT_MS / 1000}s.`
            : '';
        throw new Error(`Falha no screenshot da página ${pageNumber}. ${timeoutHint}`.trim());
    }

    if (result.status !== 0 && screenshotWasCreated) {
        return;
    }
}

function formatFileName(pageNumber) {
    return `carousel-${String(pageNumber).padStart(2, '0')}.png`;
}

async function main() {
    const includeReserved = process.argv.includes('--include-reserved');
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const activeItems = getActiveItems(data.items, { includeReserved });
    const totalPages = getTotalPages(activeItems.length, ITEMS_PER_PAGE);
    const chromePath = findChromeBinary();

    if (!chromePath) {
        throw new Error(
            'Chrome/Chromium não encontrado. Defina CHROME_PATH ou instale Google Chrome.'
        );
    }

    clearOldOutputs(OUTPUT_DIR);
    const serverProcess = await startStaticServerProcess();
    const generatedFiles = [];
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lojinha-carousel-'));

    try {
        for (let page = 1; page <= totalPages; page += 1) {
            const outputFile = path.join(OUTPUT_DIR, formatFileName(page));
            console.log(`Gerando página ${page}/${totalPages}...`);
            saveScreenshot(chromePath, page, outputFile, userDataDir);
            generatedFiles.push(outputFile);
            console.log(`Imagem gerada: ${outputFile}`);
        }
    } finally {
        fs.rmSync(userDataDir, { recursive: true, force: true });
        if (!serverProcess.killed) {
            serverProcess.kill('SIGTERM');
        }

        await new Promise(resolve => {
            if (serverProcess.exitCode !== null) {
                resolve();
                return;
            }

            serverProcess.once('exit', resolve);
        });
    }

    console.log(`\nTotal de itens ativos: ${activeItems.length}`);
    console.log(`Total de imagens: ${generatedFiles.length}`);
    console.log(`Pasta de saída: ${OUTPUT_DIR}`);
}

main().catch(error => {
    console.error(error.message);
    process.exit(1);
});
