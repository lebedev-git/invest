// Одноразовый сид демо-данных в PocketBase.
// Запуск: node pb/seed.mjs   (PocketBase должен быть запущен на :8090)
import PocketBase from 'pocketbase';

const PB_URL = process.env.VITE_PB_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@x7.local';
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error('Укажите пароль суперюзера в переменной окружения PB_ADMIN_PASSWORD.');
  process.exit(1);
}
const pb = new PocketBase(PB_URL);

const INITIAL_DEALS = [
  { id: '1', name: 'Street Retail «Октябрь»', type: 'Стрит-ритейл', city: 'Москва', targetIrr: '12.5', termDate: '2025-12-01', gracePeriod: '2025-01-01', utilities: 0, status: 'Аренда', invested: 5000000, share: 0.15,
    statusHistory: [{ status: 'Аренда', comment: 'Объект переведен в арендный этап.' }] },
  { id: '2', name: 'Self Storage «Восток»', type: 'Склад', city: 'Казань', targetIrr: '24.0', termDate: '2026-06-01', gracePeriod: '', utilities: 0, status: 'Стройка', invested: 4200000, share: 0.08,
    statusHistory: [{ status: 'Стройка', comment: 'Проект находится на строительном этапе.' }] },
  { id: '3', name: 'Редевелопмент Loft Yard', type: 'Редевелопмент', city: 'СПБ', targetIrr: '0', termDate: '2025-12-31', gracePeriod: '', utilities: 0, status: 'Ремонт', invested: 3250000, share: 0.12,
    statusHistory: [{ status: 'Ремонт', comment: 'Запущены ремонтные работы.' }] },
  { id: '4', name: 'ГАБ «Пятерочка»', type: 'ГАБ', city: 'Екатеринбург', targetIrr: '10.8', termDate: '2027-11-15', gracePeriod: '', utilities: 0, status: 'Аренда', invested: 7000000, share: 0.05,
    statusHistory: [{ status: 'Аренда', comment: 'Объект работает в арендном режиме.' }] },
];

async function main() {
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);

  const existing = await pb.collection('deals').getFullList();
  if (existing.length) {
    console.log(`Сделки уже есть (${existing.length}) — сид пропущен.`);
    return;
  }

  for (let i = 0; i < INITIAL_DEALS.length; i++) {
    const { id, statusHistory, ...rest } = INITIAL_DEALS[i];
    const rec = await pb.collection('deals').create({
      name: rest.name,
      type: rest.type,
      city: rest.city,
      status: String(rest.status),
      target_irr: String(rest.targetIrr || ''),
      term_date: rest.termDate || '',
      data: rest,
    });

    for (const h of statusHistory || []) {
      await pb.collection('status_history').create({ deal: rec.id, status: h.status, comment: h.comment || '' });
    }

    console.log(`+ ${rest.name}`);
  }
  console.log('Сид завершён.');
}

main().catch(e => { console.error('Сид упал:', e); process.exit(1); });
