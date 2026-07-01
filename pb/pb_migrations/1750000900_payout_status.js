/// <reference path="../pb_data/types.d.ts" />

// Плановый график выплат: поле status в payouts.
//   'paid'    — фактическая выплата (учитывается в суммах и доходности);
//   'planned' — плановая выплата графика (только прогнозный календарь).
// Все существующие записи считаем фактическими (бэкофилл 'paid'), чтобы суммы
// «Фактически выплачено» и доходность не изменились после миграции.
migrate((app) => {
  const payouts = app.findCollectionByNameOrId("payouts");
  payouts.fields.add(new SelectField({
    name: "status",
    maxSelect: 1,
    values: ["planned", "paid"],
  }));
  app.save(payouts);

  // Бэкофилл: всем текущим выплатам — статус 'paid'.
  const records = app.findAllRecords("payouts");
  for (const rec of records) {
    if (!rec.getString("status")) {
      rec.set("status", "paid");
      app.save(rec);
    }
  }
}, (app) => {
  const payouts = app.findCollectionByNameOrId("payouts");
  payouts.fields.removeByName("status");
  app.save(payouts);
});
