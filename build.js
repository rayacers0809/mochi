const fs = require('fs');
const path = require('path');

// dist 폴더 생성
if (!fs.existsSync('dist')) fs.mkdirSync('dist');
if (!fs.existsSync('dist/netlify')) fs.mkdirSync('dist/netlify', { recursive: true });

// Firebase config 객체 (빌드 시 환경변수에서 읽음)
const firebaseConfig = JSON.stringify({
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.FIREBASE_DB_URL || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
});

// HTML 파일들에 config 주입
const htmlFiles = ['index.html', 'patchnote.html', 'admin.html'];

htmlFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');

  // /.netlify/functions/config 호출을 인라인 config로 교체
  html = html.replace(
    /const res = await fetch\('\/\.netlify\/functions\/config'\);\s*const cfg = await res\.json\(\);/g,
    `const cfg = ${firebaseConfig};`
  );
  // 혹시 다른 패턴도 처리
  html = html.replace(
    /fetch\('\/\.netlify\/functions\/config'\)[^;]*;[\s\S]*?const cfg = await res\.json\(\);/g,
    `const cfg = ${firebaseConfig};`
  );

  fs.writeFileSync(`dist/${file}`, html);
  console.log(`✅ ${file} → dist/${file} (config 주입 완료)`);
});

// netlify/functions 폴더 복사 (auth, server-status는 여전히 필요)
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(file => {
    const s = path.join(src, file);
    const d = path.join(dest, file);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  });
}
copyDir('netlify', 'dist/netlify');
console.log('✅ netlify/functions 복사 완료');

console.log('🎉 빌드 완료!');
