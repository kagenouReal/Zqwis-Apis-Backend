import { NextResponse, NextRequest } from "next/server";
import axios from "axios";
import { createCanvas, loadImage, registerFont } from "canvas";
import { addSuccess, addFail } from "@/system/lib/request-stats";
import { checkApikey } from "@/system/lib/api-guard";
import { message } from "@/system/lib/responses";

//==================
// Helper to determine rating cell color
function getRatingColor(rating: string | number) {
    const val = typeof rating === "string" ? parseFloat(rating) : rating;
    if (isNaN(val)) return '#1e1e24'; 
    if (val >= 9.0) return '#15803d'; 
    if (val >= 8.0) return '#16a34a'; 
    if (val >= 7.0) return '#eab308'; 
    if (val >= 6.0) return '#f97316'; 
    return '#dc2626'; 
}

//==================
const AXIOS_CONFIG = {
    headers: { 'User-Agent': 'okhttp/4.12.0' },
    timeout: 10000
};

//==================
async function generateSeriesGraph(query: string) {
    try {
        let showId = query;
        let backdropUrl: string | null = null;

        // 1. Search for show
        if (isNaN(Number(query))) {
            const searchUrl = `https://seriesgraph.com/api/shows/search?searchTerm=${encodeURIComponent(query)}&language=en-US`;
            const searchRes = await axios.get(searchUrl, AXIOS_CONFIG);

            if (!searchRes.data || !searchRes.data.results || searchRes.data.results.length === 0) {
                return { status: false, error: "Series not found" };
            }

            const topResult = searchRes.data.results[0];
            showId = topResult.id;
            if (topResult.backdrop_path) {
                backdropUrl = `https://image.tmdb.org/t/p/w780${topResult.backdrop_path}`;
            }
        }

        // 2. Fetch details and ratings
        const detailRes = await axios.get(`https://seriesgraph.com/api/shows/${showId}`, AXIOS_CONFIG).catch(() => null);
        const detail = detailRes ? detailRes.data : {};
        
        if (detail.backdrop_path) {
            backdropUrl = `https://image.tmdb.org/t/p/w780${detail.backdrop_path}`;
        }

        const chartUrl = `https://seriesgraph.com/api/custom-charts/by-show/${showId}?limit=10`;
        const chartRes = await axios.get(chartUrl, AXIOS_CONFIG).catch(() => ({ data: { charts: [] } }));

        let chartData = chartRes.data.charts && chartRes.data.charts.length > 0 ? chartRes.data.charts[0] : null;
        let ratings: Record<string, number> = {};
        let title = detail.name || "Unknown Series";
        let userName = "Official Ratings";
        let posterUrl = detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null;

        if (chartData) {
            title = chartData.showName;
            userName = chartData.userName;
            ratings = chartData.ratings;
            if (chartData.posterPath) posterUrl = `https://image.tmdb.org/t/p/w500${chartData.posterPath}`;
        } else {
            const seasonRes = await axios.get(`https://seriesgraph.com/api/shows/${showId}/season-ratings`, AXIOS_CONFIG).catch(() => ({ data: [] }));
            const seasons = seasonRes.data;
            
            seasons.forEach((s: any) => {
                if (s.episodes) {
                    s.episodes.forEach((e: any) => {
                        if (e.vote_average) {
                            ratings[`S${e.season_number}E${e.episode_number}`] = e.vote_average;
                        }
                    });
                }
            });
        }

        if (Object.keys(ratings).length === 0) {
            return { status: false, error: "No rating data found" };
        }

        // 3. Parsing urutan Season & Episode
        const dataMatrix: Record<number, Record<number, string>> = {};
        let maxEpisodes = 0;
        const seasonsSet = new Set<number>();

        Object.keys(ratings).forEach(key => {
            const match = key.match(/S(\d+)E(\d+)/);
            if (match) {
                const s = parseInt(match[1]);
                const e = parseInt(match[2]);
                seasonsSet.add(s);
                if (e > maxEpisodes) maxEpisodes = e;

                if (!dataMatrix[e]) dataMatrix[e] = {};
                dataMatrix[e][s] = ratings[key].toFixed(1);
            }
        });

        const sortedSeasons = Array.from(seasonsSet).sort((a, b) => a - b);

        // 4. Setup Dimension
        const cellWidth = 90;
        const cellHeight = 45;
        const padding = 25;
        const headerHeight = 70; 
        const sidebarWidth = 240;
        const tableWidth = (1 + sortedSeasons.length) * cellWidth;
        const tableHeight = (1 + maxEpisodes + 1) * cellHeight;
        const canvasWidth = Math.max(sidebarWidth + tableWidth + (padding * 2), 780);

        let imgBackdrop = null;
        let backdropHeight = 0;

        if (backdropUrl) {
            try {
                imgBackdrop = await loadImage(backdropUrl);
                const imageRatio = imgBackdrop.width / imgBackdrop.height;
                const effectiveRatio = Math.max(imageRatio, 1.0);
                backdropHeight = canvasWidth / effectiveRatio;
            } catch {}
        }

        const canvasHeight = Math.max(tableHeight + (padding * 2), 400) + backdropHeight + headerHeight;
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#0b0b0e';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Header Bar
        ctx.fillStyle = '#0b0b0e';
        ctx.fillRect(0, 0, canvasWidth, headerHeight);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('SERIES GRAPH', padding, headerHeight / 2);

        ctx.textAlign = 'right';
        ctx.font = 'italic 18px sans-serif';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(title.toUpperCase(), canvasWidth - padding, headerHeight / 2);

        // Backdrop
        if (imgBackdrop) {
            const imageRatio = imgBackdrop.width / imgBackdrop.height;
            const targetRatio = canvasWidth / backdropHeight;
            let sx, sy, sWidth, sHeight;

            if (imageRatio > targetRatio) {
                sHeight = imgBackdrop.height;
                sWidth = imgBackdrop.height * targetRatio;
                sx = (imgBackdrop.width - sWidth) / 2;
                sy = 0;
            } else {
                sWidth = imgBackdrop.width;
                sHeight = imgBackdrop.width / targetRatio;
                sx = 0;
                sy = (imgBackdrop.height - sHeight) / 2;
            }

            ctx.drawImage(imgBackdrop, sx, sy, sWidth, sHeight, 0, headerHeight, canvasWidth, backdropHeight);
            const gradient = ctx.createLinearGradient(0, headerHeight + backdropHeight - 100, 0, headerHeight + backdropHeight);
            gradient.addColorStop(0, 'rgba(11, 11, 14, 0)');
            gradient.addColorStop(1, '#0b0b0e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, headerHeight + backdropHeight - 100, canvasWidth, 100);
        }

        const contentStartY = headerHeight + backdropHeight + padding;

        // Poster
        if (posterUrl) {
            try {
                const imgPoster = await loadImage(posterUrl);
                const posterWidth = 180;
                const posterHeight = 255;
                ctx.save();
                ctx.beginPath();
                (ctx as any).roundRect(padding, contentStartY, posterWidth, posterHeight, 8);
                ctx.clip();
                ctx.drawImage(imgPoster, padding, contentStartY, posterWidth, posterHeight);
                ctx.restore();
            } catch {}
        }

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        
        let words = title.split(' ');
        let line = '';
        let currentY = contentStartY + 275;
        
        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            if (testLine.length > 20 && n > 0) {
                ctx.fillText(line, padding, currentY);
                line = words[n] + ' ';
                currentY += 26;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, padding, currentY);

        ctx.fillStyle = '#6b7280';
        ctx.font = '13px sans-serif';
        ctx.fillText(`Chart by: ${userName}`, padding, currentY + 35);

        // Grid
        const startX = padding + sidebarWidth;
        const startY = contentStartY;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 15px sans-serif';
        sortedSeasons.forEach((season, index) => {
            const x = startX + cellWidth + (index * cellWidth);
            ctx.fillText(`S${season}`, x + (cellWidth / 2), startY + (cellHeight / 2));
        });

        for (let e = 1; e <= maxEpisodes; e++) {
            const rowY = startY + (e * cellHeight);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(`E${e}`, startX + (cellWidth / 2), rowY + (cellHeight / 2));

            sortedSeasons.forEach((season, sIndex) => {
                const x = startX + cellWidth + (sIndex * cellWidth);
                const ratingValue = dataMatrix[e] && dataMatrix[e][season] ? dataMatrix[e][season] : '-';

                if (ratingValue !== '-') {
                    ctx.fillStyle = getRatingColor(ratingValue);
                    ctx.beginPath();
                    (ctx as any).roundRect(x + 4, rowY + 4, cellWidth - 8, cellHeight - 8, 6);
                    ctx.fill();
                    ctx.fillStyle = '#000000';
                    ctx.font = 'bold 14px sans-serif';
                    ctx.fillText(ratingValue, x + (cellWidth / 2), rowY + (cellHeight / 2));
                } else {
                    ctx.fillStyle = '#1f2937';
                    ctx.fillText('-', x + (cellWidth / 2), rowY + (cellHeight / 2));
                }
            });
        }

        // AVG Row
        const avgRowY = startY + ((maxEpisodes + 1) * cellHeight);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('AVG', startX + (cellWidth / 2), avgRowY + (cellHeight / 2));

        sortedSeasons.forEach((season, sIndex) => {
            const x = startX + cellWidth + (sIndex * cellWidth);
            let sum = 0, count = 0;
            for (let e = 1; e <= maxEpisodes; e++) {
                if (dataMatrix[e] && dataMatrix[e][season]) {
                    sum += parseFloat(dataMatrix[e][season]);
                    count++;
                }
            }
            const seasonAvg = count > 0 ? (sum / count).toFixed(1) : '-';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px sans-serif';
            ctx.fillText(seasonAvg, x + (cellWidth / 2), avgRowY + (cellHeight / 2));
        });

        return { status: true, buffer: canvas.toBuffer('image/png') };
    } catch (e: any) {
        return { status: false, error: e.message };
    }
}

//==================
export async function GET(req: Request) {
    const auth = await checkApikey(req);
    if (!auth.status) return auth.response;

    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("query");
        if (!query) {
            addFail(auth.user.username);
            return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
        }

        const result = await generateSeriesGraph(query);
        if (!result.status || !result.buffer) {
            addFail(auth.user.username);
            return NextResponse.json({ status: false, message: result.error || message.scrape.fetchFailed }, { status: 500 });
        }

        addSuccess(auth.user.username);
        return NextResponse.json({
            status: true,
            message: message.status.success,
            creator: "@Zqwis-Apis",
            limit_left: auth.user?.role === "user" ? auth.user.limit : 999999,
            data: {
                mimetype: "image/png",
                buffer: result.buffer.toString("base64")
            }
        });
    } catch (err) {
        addFail(auth.user.username);
        return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
    }
}
