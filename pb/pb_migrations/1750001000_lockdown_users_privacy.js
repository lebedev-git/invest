/// <reference path="../pb_data/types.d.ts" />

// Фаза 5: приватность профилей.
//
// Почему так: с фазы 3 (1750000200) правила users.listRule/viewRule стояли как
// '@request.auth.id != ""' — то есть ЛЮБОЙ авторизованный (включая ботов, которые
// проходят открытую саморегистрацию) мог запросить GET /api/collections/users/records
// и получить email всех зарегистрированных. Это утечка PII.
//
// Модель owner-scoping (фаза 4) не требует видеть чужие профили: каждый аккаунт
// работает только со своими данными. Поэтому list/view профилей ограничиваем
// собственной записью пользователя. update/delete уже были self-only (фаза 3),
// createRule (открытая регистрация) в этой миграции намеренно не трогаем.
migrate((app) => {
  const SELF = '@request.auth.id != "" && id = @request.auth.id';

  const users = app.findCollectionByNameOrId("users");
  users.listRule = SELF;
  users.viewRule = SELF;
  app.save(users);
}, (app) => {
  // --- откат: правила фазы 3 (любой авторизованный видит все профили) ---
  const AUTHED = '@request.auth.id != ""';

  const users = app.findCollectionByNameOrId("users");
  users.listRule = AUTHED;
  users.viewRule = AUTHED;
  app.save(users);
});
