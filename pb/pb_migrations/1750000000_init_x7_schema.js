/// <reference path="../pb_data/types.d.ts" />

// X7 Invest Portal — базовая схема: расширение users ролью/профилем,
// коллекции deals / deal_investors / status_history + правила доступа.
// Правила реализуют две роли: committee (полный CRUD) и investor (видит только свои сделки).
migrate((app) => {
  // --- 1. Расширяем users (auth) ---
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(
    new SelectField({ name: "role", maxSelect: 1, values: ["investor", "committee"] }),
    new TextField({ name: "full_name", max: 200 }),
    new TextField({ name: "phone", max: 50 }),
    new TextField({ name: "telegram", max: 100 }),
  );
  app.save(users);
  const usersId = users.id;

  // --- 2. deals (base) --- правила list/view сначала committee-only, расширим после создания deal_investors ---
  const deals = new Collection({
    type: "base",
    name: "deals",
    listRule: '@request.auth.role = "committee"',
    viewRule: '@request.auth.role = "committee"',
    createRule: '@request.auth.role = "committee"',
    updateRule: '@request.auth.role = "committee"',
    deleteRule: '@request.auth.role = "committee"',
    fields: [
      { name: "name", type: "text", required: true, max: 250 },
      { name: "type", type: "text", max: 100 },
      { name: "city", type: "text", max: 100 },
      { name: "address", type: "text", max: 250 },
      { name: "status", type: "text", max: 100 },
      { name: "target_irr", type: "text", max: 50 },
      { name: "term_date", type: "text", max: 50 },
      { name: "grace_period", type: "text", max: 50 },
      { name: "area_sqm", type: "number" },
      { name: "rent_rate_per_sqm", type: "number" },
      { name: "property_tax_annual", type: "number" },
      { name: "paid_out", type: "number" },
      { name: "description", type: "text", max: 2000 },
      { name: "strategy", type: "text", max: 2000 },
      { name: "participation_format", type: "text", max: 100 },
      { name: "participation_details", type: "json", maxSize: 200000 },
      { name: "additional", type: "json", maxSize: 200000 },
      { name: "financials", type: "json", maxSize: 500000 },
      { name: "loan", type: "json", maxSize: 200000 },
      { name: "rent", type: "json", maxSize: 500000 },
      { name: "expenses", type: "json", maxSize: 200000 },
      { name: "performance", type: "json", maxSize: 200000 },
      { name: "comments", type: "json", maxSize: 500000 },
      { name: "metrics", type: "json", maxSize: 200000 },
      { name: "created_by", type: "relation", collectionId: usersId, maxSelect: 1 },
    ],
  });
  app.save(deals);

  // --- 3. deal_investors (base) --- связь инвестор ↔ сделка с суммой/долей ---
  const dealInvestors = new Collection({
    type: "base",
    name: "deal_investors",
    listRule: '@request.auth.role = "committee" || investor = @request.auth.id',
    viewRule: '@request.auth.role = "committee" || investor = @request.auth.id',
    createRule: '@request.auth.role = "committee"',
    updateRule: '@request.auth.role = "committee"',
    deleteRule: '@request.auth.role = "committee"',
    fields: [
      { name: "deal", type: "relation", collectionId: deals.id, maxSelect: 1, required: true, cascadeDelete: true },
      { name: "investor", type: "relation", collectionId: usersId, maxSelect: 1, required: true },
      { name: "amount", type: "number" },
      { name: "share", type: "number" },
    ],
  });
  app.save(dealInvestors);

  // --- 4. status_history (base) --- история статусов сделки ---
  const statusHistory = new Collection({
    type: "base",
    name: "status_history",
    listRule: '@request.auth.role = "committee" || (@collection.deal_investors.deal ?= deal && @collection.deal_investors.investor ?= @request.auth.id)',
    viewRule: '@request.auth.role = "committee" || (@collection.deal_investors.deal ?= deal && @collection.deal_investors.investor ?= @request.auth.id)',
    createRule: '@request.auth.role = "committee"',
    updateRule: '@request.auth.role = "committee"',
    deleteRule: '@request.auth.role = "committee"',
    fields: [
      { name: "deal", type: "relation", collectionId: deals.id, maxSelect: 1, required: true, cascadeDelete: true },
      { name: "status", type: "text", max: 100, required: true },
      { name: "comment", type: "text", max: 2000 },
    ],
  });
  app.save(statusHistory);

  // --- 5. Расширяем правила deals: инвестор видит сделки, где есть его строка в deal_investors ---
  const dealsFinal = app.findCollectionByNameOrId("deals");
  const investorVisibility = '@request.auth.role = "committee" || (@collection.deal_investors.deal ?= id && @collection.deal_investors.investor ?= @request.auth.id)';
  dealsFinal.listRule = investorVisibility;
  dealsFinal.viewRule = investorVisibility;
  app.save(dealsFinal);
}, (app) => {
  // --- откат ---
  for (const name of ["status_history", "deal_investors", "deals"]) {
    try {
      app.delete(app.findCollectionByNameOrId(name));
    } catch (_) {}
  }
  const users = app.findCollectionByNameOrId("users");
  for (const f of ["role", "full_name", "phone", "telegram"]) {
    users.fields.removeByName(f);
  }
  app.save(users);
});
