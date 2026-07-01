// Разовое наполнение сделок тестовыми фотографиями недвижимости.
// Фото берём с loremflickr (Creative Commons, без API-ключа), тег — по типу объекта.
// Только для сделок без уже загруженных фото (idempotent).
//
// Запуск (креды — через окружение, чтобы не хранить пароль в репозитории):
//   PB_URL=https://syndicate-invest.ru PB_EMAIL=you@example.com PB_PASSWORD=*** node pb/seed-photos.mjs
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'https://syndicate-invest.ru';
const EMAIL = process.env.PB_EMAIL;
const PASSWORD = process.env.PB_PASSWORD;
const PHOTOS_PER_DEAL = Number(process.env.PB_PHOTOS_PER_DEAL || 2);

if (!EMAIL || !PASSWORD) {
  console.error('Укажите PB_EMAIL и PB_PASSWORD в переменных окружения.');
  process.exit(1);
}

// Одиночный тег loremflickr по типу/названию сделки (составные теги = AND и дают
// нерелевантные совпадения, поэтому берём один сильный тег на объект).
function tagFor(deal) {
  const t = String(deal.type || '').toLowerCase();
  const n = String(deal.name || '').toLowerCase();
  if (/склад|storage/.test(t + n)) return 'warehouse';
  if (/офис|office/.test(t + n)) return 'office';
  if (/тц|молл|mall|shopping|меридиан/.test(n)) return 'mall';
  if (/габ|пятёрочка|пятерочка|supermarket/.test(t + n)) return 'supermarket';
  if (/стрит|ритейл|retail|street/.test(t + n)) return 'storefront';
  if (/редевелопмент|loft|construction/.test(t + n)) return 'architecture';
  return 'building';
}

async function fetchImage(tag, lock) {
  const url = `https://loremflickr.com/800/600/${tag}?lock=${lock}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} для ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error(`Слишком маленький файл (${buf.length} байт) для ${url}`);
  return buf;
}

async function main() {
  const pb = new PocketBase(PB_URL);
  await pb.collection('users').authWithPassword(EMAIL, PASSWORD);
  console.log(`Авторизован как ${EMAIL} на ${PB_URL}`);

  const deals = await pb.collection('deals').getFullList({ sort: '-created' });
  console.log(`Сделок найдено: ${deals.length}`);

  let updated = 0;
  for (const deal of deals) {
    const existing = Array.isArray(deal.images) ? deal.images : (deal.images ? [deal.images] : []);
    if (existing.length > 0) {
      console.log(`• «${deal.name}» — фото уже есть (${existing.length}), пропуск`);
      continue;
    }
    const tag = tagFor(deal);
    const fd = new FormData();
    let added = 0;
    for (let i = 0; i < PHOTOS_PER_DEAL; i++) {
      try {
        const buf = await fetchImage(tag, `${deal.id}-${i}`);
        fd.append('images+', new Blob([buf], { type: 'image/jpeg' }), `photo-${i + 1}.jpg`);
        added++;
      } catch (e) {
        console.warn(`  ! не удалось скачать фото [${tag}]: ${e.message}`);
      }
    }
    if (!added) {
      console.warn(`• «${deal.name}» — ни одного фото не скачалось, пропуск`);
      continue;
    }
    await pb.collection('deals').update(deal.id, fd);
    updated++;
    console.log(`✓ «${deal.name}» — загружено ${added} фото [${tag}]`);
  }

  console.log(`Готово. Обновлено сделок: ${updated}.`);
}

main().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
