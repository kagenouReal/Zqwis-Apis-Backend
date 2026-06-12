import { NextResponse, NextRequest } from "next/server";
import axios from "axios";
import crypto from "crypto";
import { addSuccess, addFail } from "@/system/lib/request-stats";
import { checkApikey } from "@/system/lib/api-guard";
import { message } from "@/system/lib/responses";

//==================
function generateSignature(auth_secret: string) {
    const secretPrefix = "8IAcbWyCsVhYv82S2eofRqK1DF3nNDAv&";
    const dataToHash = secretPrefix + auth_secret;
    return crypto.createHash('md5').update(dataToHash).digest('hex');
}

//==================
async function searchFreeReels(keyword: string) {
    try {
        const COMMON_HEADERS = {
            'host': 'apiv2.free-reels.com',
            'app-name': 'com.freereels.app',
            'user-agent': 'okhttp/4.12.0',
            'content-type': 'application/json; charset=UTF-8'
        };

        const deviceId = crypto.randomBytes(7).toString('hex');
        const loginPayload = {
            "device_id": deviceId,
            "device_name": "Xiomay kage ultra promek"
        };

        const loginRes = await axios.post(`https://apiv2.free-reels.com/frv2-api/anonymous/login`, loginPayload, {
            headers: COMMON_HEADERS
        });

        if (loginRes.data.code !== 200) return { status: false, error: 'Login failed' };
        
        const { auth_key, auth_secret, user_id } = loginRes.data.data;
        const currentTimestamp = Date.now().toString();
        
        const searchPayload = {
            "next": "",
            "keyword": keyword,
            "timestamp": currentTimestamp
        };
        
        const signature = generateSignature(auth_secret);
        const authHeaders = {
            ...COMMON_HEADERS,
            'Authorization': `oauth_signature=${signature},oauth_token=${auth_key},ts=${currentTimestamp}`
        };

        const searchRes = await axios.post(`https://apiv2.free-reels.com/frv2-api/search/drama`, searchPayload, {
            headers: authHeaders
        });

        if (searchRes.data.code !== 200) return { status: false, error: 'Search failed' };
        
        const items = searchRes.data.data.items;
        if (!items || items.length === 0) {
            return { status: false, error: 'Ah Missing the drama' };
        }

        const seriesId = items[0].id;
        const infoRes = await axios.get(`https://apiv2.free-reels.com/frv2-api/drama/info_v2?series_id=${seriesId}&clip_content=`, {
            headers: authHeaders
        });

        if (infoRes.data.code !== 200) return { status: false, error: 'Fetch info failed' };
        
        const dramaInfo = infoRes.data.data.info;
        
        return {
            status: true,
            creator: "@Zqwis-Apis",
            auth_info: { user_id, auth_key }, 
            metadata: {
                id: dramaInfo.id,
                title: dramaInfo.name,
                description: dramaInfo.desc,
                cover_url: dramaInfo.cover,
                tags: {
                    content: dramaInfo.content_tags || []
                },
                stats: {
                    total_episodes: dramaInfo.episode_count,
                    followers: dramaInfo.follow_count,
                    comments: dramaInfo.comment_count
                },
                pricing: {
                    price_per_eps: dramaInfo.episode_price,
                    pay_mode: dramaInfo.pay_mode,
                    is_free: dramaInfo.free
                }
            },
            episodes: dramaInfo.episode_list.map((eps: any) => ({
                episode_number: eps.index,
                episode_id: eps.id,
                is_unlocked: eps.unlock,
                duration_seconds: eps.duration,
                m3u8: {
                    h264: eps.external_audio_h264_m3u8,
                    h265: eps.external_audio_h265_m3u8
                },
                subtitles: eps.subtitle_list ? eps.subtitle_list.map((sub: any) => ({
                    language: sub.display_name,
                    code: sub.language,
                    url: sub.subtitle,
                    vtt: sub.vtt || null
                })) : []
            }))
        };
    } catch (error: any) {
        return { 
            status: false, 
            error: error?.response?.data || error.message 
        };
    }
}

//==================
export async function GET(req: Request) {
    const auth = await checkApikey(req);
    if (!auth.status) return auth.response;

    try {
        const { searchParams } = new URL(req.url);
        const keyword = searchParams.get("keyword");
        if (!keyword) {
            addFail();
            return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
        }

        const result = await searchFreeReels(keyword);
        if (!result.status) {
            addFail();
            return NextResponse.json({ status: false, message: result.error || message.scrape.fetchFailed }, { status: 500 });
        }

        addSuccess();
        return NextResponse.json({
            status: true,
            message: message.status.success,
            limit_left: auth.user?.role === "user" ? auth.user.limit : 999999,
            data: result
        });
    } catch (err) {
        addFail();
        return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
    }
}
