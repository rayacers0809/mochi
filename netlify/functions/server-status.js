exports.handler = async () => {
  const SERVER = 'http://fivem-mochi.kr:30120';

  try {
    // players.json, info.json 동시에 요청
    const [playersRes, infoRes] = await Promise.allSettled([
      fetch(`${SERVER}/players.json`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${SERVER}/info.json`,    { signal: AbortSignal.timeout(5000) }),
    ]);

    let players = [];
    let maxPlayers = 64;
    let online = false;

    if (playersRes.status === 'fulfilled' && playersRes.value.ok) {
      players = await playersRes.value.json();
      online = true;
    }

    if (infoRes.status === 'fulfilled' && infoRes.value.ok) {
      const info = await infoRes.value.json();
      maxPlayers = info?.vars?.sv_maxClients || info?.vars?.onesync_population || 64;
      online = true;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        online,
        current: players.length,
        max: Number(maxPlayers),
      }),
    };
  } catch {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ online: false, current: 0, max: 0 }),
    };
  }
};
