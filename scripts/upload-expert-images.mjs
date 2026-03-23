/**
 * 전문가 이미지 → Supabase Storage 업로드 + managers 테이블 URL 업데이트
 * 실행: node scripts/upload-expert-images.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const ASSETS_ROOT = resolve(PROJECT_ROOT, '..'); // 가입제안서PJ 폴더

// .env.local 파싱
const envPath = resolve(PROJECT_ROOT, '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=').map(s => s.trim()))
);

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_KEY = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// error_attachments 버킷의 expert/ 경로 사용 (별도 버킷 불필요)
const BUCKET = 'error_attachments';

const IMAGES = [
  { file: resolve(ASSETS_ROOT, 'level', 'jian.png'), managerCode: '323003978', storagePath: 'expert/jian.png' },
  { file: resolve(ASSETS_ROOT, 'yewon.png'),          managerCode: '325001957', storagePath: 'expert/yewon.png' },
];

async function run() {
  for (const img of IMAGES) {
    const localPath = img.file;
    let fileBuffer;
    try {
      fileBuffer = readFileSync(localPath);
    } catch {
      console.warn(`⚠️  ${img.file} 파일 없음: ${localPath} — 건너뜀`);
      continue;
    }

    console.log(`📤 업로드 중: ${img.file} → ${BUCKET}/${img.storagePath}`);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(img.storagePath, fileBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error(`❌ 업로드 실패 (${img.file}):`, uploadError.message);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(img.storagePath);

    const publicUrl = urlData.publicUrl;
    console.log(`✅ 업로드 완료: ${publicUrl}`);

    const { error: updateError } = await supabase
      .from('managers')
      .update({ expert_image_url: publicUrl })
      .eq('code', img.managerCode);

    if (updateError) {
      console.error(`❌ DB 업데이트 실패 (${img.managerCode}):`, updateError.message);
    } else {
      console.log(`✅ DB 업데이트: code=${img.managerCode} → expert_image_url 설정됨`);
    }
  }

  console.log('\n🎉 완료!');
}

run().catch(console.error);
