// api/player.js
// Proxy reverso para limpar anúncios da RedeFlixApi

const cheerio = require('cheerio');

module.exports = async (req, res) => {
    // Pega a URL de destino que será passada pelo front-end
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('URL não fornecida.');
    }

    try {
        // 1. Faz a requisição para a RedeFlixApi
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://redeflixapi.store/'
            }
        });

        let html = await response.text();

        // 2. Carrega o HTML no Cheerio
        const $ = cheerio.load(html);

        // 3. Remove scripts maliciosos e de anúncio
        $('script').each((i, el) => {
            const src = $(el).attr('src') || '';
            const content = $(el).html() || '';
            
            // Lista de palavras-chave que indicam anúncios ou scripts suspeitos
            const adKeywords = /ads|advert|popup|popunder|captcha|googlesyndication|doubleclick|adservice|propeller|popads|exoclick|trafficjunky|juicyads|adsterra|clickadu|hilltopads|onclick|monetiz|banner/;
            
            if (adKeywords.test(src) || adKeywords.test(content)) {
                $(el).remove();
            }
        });

        // 4. Remove elementos visuais de anúncio
        $('a[target="_blank"]').remove(); // Links que abrem em nova aba (comuns em ads)
        $('iframe').not('[src*="redeflixapi"], [id*="player"], [class*="player"]').remove(); // Remove iframes de ads, mas mantém o player
        $('div[class*="ad"], div[id*="ad"], div[class*="banner"], div[id*="banner"]').remove(); // Divs de anúncio

        // 5. Pega o HTML limpo
        const cleanedHtml = $.html();

        // 6. Envia a resposta limpa
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).send(cleanedHtml);

    } catch (error) {
        console.error('[Ricoflix Proxy] Erro:', error);
        res.status(500).send('Erro ao processar o vídeo.');
    }
};
