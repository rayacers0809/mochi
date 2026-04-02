const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Bad Request' };
  }

  const { password } = body;
  if (!password) {
    return { statusCode: 400, body: JSON.stringify({ ok: false }) };
  }

  // 입력된 비밀번호를 SHA-256 해시로 변환 후 환경변수 해시와 비교
  const inputHash = crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');

  const stored = process.env.ADMIN_PASSWORD_HASH || '';

  // timing-safe 비교 (브루트포스 타이밍 공격 방지)
  let match = false;
  try {
    match = crypto.timingSafeEqual(
      Buffer.from(inputHash, 'hex'),
      Buffer.from(stored, 'hex')
    );
  } catch {
    match = false;
  }

  if (match) {
    // 세션 토큰 발급 (랜덤 32바이트)
    const token = crypto.randomBytes(32).toString('hex');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, token }),
    };
  }

  // 실패
  return {
    statusCode: 401,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: false }),
  };
};
