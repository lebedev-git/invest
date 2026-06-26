/// <reference path="../pb_data/types.d.ts" />

// Сущность «Выплата» по сделке (дивиденды/возврат тела/прочее).
// Заменяет одно поле paidOut: теперь фактические выплаты — отдельные записи,
// из которых считается сумма выплат, реестр и календарь в портале.
// Доступ owner-scoped через родительскую сделку (deal.created_by).
migrate((app) => {
  const deals = app.findCollectionByNameOrId("deals");
  const users = app.findCollectionByNameOrId("users");
  const OWNER = '@request.auth.id != "" && deal.created_by = @request.auth.id';

  const payouts = new Collection({
    type: "base",
    name: "payouts",
    listRule: OWNER,
    viewRule: OWNER,
    createRule: OWNER,
    updateRule: OWNER,
    deleteRule: OWNER,
    fields: [
      { name: "deal", type: "relation", required: true, collectionId: deals.id, maxSelect: 1, cascadeDelete: true },
      { name: "date", type: "date" },
      { name: "amount", type: "number" },
      { name: "kind", type: "select", maxSelect: 1, values: ["dividend", "return", "other"] },
      { name: "comment", type: "text", max: 500 },
      { name: "created_by", type: "relation", collectionId: users.id, maxSelect: 1 },
    ],
  });
  app.save(payouts);
}, (app) => {
  const payouts = app.findCollectionByNameOrId("payouts");
  app.delete(payouts);
});
