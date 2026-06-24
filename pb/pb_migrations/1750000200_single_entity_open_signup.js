/// <reference path="../pb_data/types.d.ts" />

// Фаза 3: «одна сущность». Тестовый режим single-tenant — все авторизованные
// пользователи имеют полный доступ ко всем данным (роли investor/committee больше
// не разграничивают доступ). Плюс открытая саморегистрация в коллекции users.
//
// Почему так: проект переходит на модель «админ = инвестор», разделение прав не
// нужно. Это попутно закрывает прежнюю утечку (инвестор больше не «недо-видит»/
// «частично видит» — модель явная: вошёл → видишь всё).
migrate((app) => {
  const AUTHED = '@request.auth.id != ""';

  // deals: полный доступ любому авторизованному
  const deals = app.findCollectionByNameOrId("deals");
  deals.listRule = AUTHED;
  deals.viewRule = AUTHED;
  deals.createRule = AUTHED;
  deals.updateRule = AUTHED;
  deals.deleteRule = AUTHED;
  app.save(deals);

  // deal_investors
  const di = app.findCollectionByNameOrId("deal_investors");
  di.listRule = AUTHED;
  di.viewRule = AUTHED;
  di.createRule = AUTHED;
  di.updateRule = AUTHED;
  di.deleteRule = AUTHED;
  app.save(di);

  // status_history
  const sh = app.findCollectionByNameOrId("status_history");
  sh.listRule = AUTHED;
  sh.viewRule = AUTHED;
  sh.createRule = AUTHED;
  sh.updateRule = AUTHED;
  sh.deleteRule = AUTHED;
  app.save(sh);

  // users: открытая регистрация (createRule пустой = разрешено всем, включая гостей).
  // list/view/update/delete оставляем для авторизованных (свой и чужой профиль в
  // тестовом режиме видны — это осознанно). Пароль защищён самим PocketBase.
  const users = app.findCollectionByNameOrId("users");
  users.createRule = "";
  users.listRule = AUTHED;
  users.viewRule = AUTHED;
  users.updateRule = '@request.auth.id != "" && id = @request.auth.id';
  users.deleteRule = '@request.auth.id != "" && id = @request.auth.id';
  app.save(users);
}, (app) => {
  // --- откат: возвращаем committee-only / investor-visibility правила фазы 1 ---
  const investorVisibility = '@request.auth.role = "committee" || (@collection.deal_investors.deal ?= id && @collection.deal_investors.investor ?= @request.auth.id)';
  const committeeOnly = '@request.auth.role = "committee"';

  const deals = app.findCollectionByNameOrId("deals");
  deals.listRule = investorVisibility;
  deals.viewRule = investorVisibility;
  deals.createRule = committeeOnly;
  deals.updateRule = committeeOnly;
  deals.deleteRule = committeeOnly;
  app.save(deals);

  const di = app.findCollectionByNameOrId("deal_investors");
  di.listRule = '@request.auth.role = "committee" || investor = @request.auth.id';
  di.viewRule = '@request.auth.role = "committee" || investor = @request.auth.id';
  di.createRule = committeeOnly;
  di.updateRule = committeeOnly;
  di.deleteRule = committeeOnly;
  app.save(di);

  const sh = app.findCollectionByNameOrId("status_history");
  const shVis = '@request.auth.role = "committee" || (@collection.deal_investors.deal ?= deal && @collection.deal_investors.investor ?= @request.auth.id)';
  sh.listRule = shVis;
  sh.viewRule = shVis;
  sh.createRule = committeeOnly;
  sh.updateRule = committeeOnly;
  sh.deleteRule = committeeOnly;
  app.save(sh);

  const users = app.findCollectionByNameOrId("users");
  users.createRule = null;
  users.listRule = null;
  users.viewRule = null;
  users.updateRule = null;
  users.deleteRule = null;
  app.save(users);
});
