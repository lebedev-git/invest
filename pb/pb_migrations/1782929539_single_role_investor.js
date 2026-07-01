/// <reference path="../pb_data/types.d.ts" />
// Одна роль — investor. Убираем committee: переводим всех существующих пользователей
// на investor и сужаем список значений select-поля role до ["investor"].
// Роль по-прежнему не влияет на доступ (owner-scoping), поле остаётся как метка.
migrate((app) => {
  // 1) все текущие пользователи → investor (в т.ч. бывшие committee и пустые)
  app.db().newQuery("UPDATE users SET role = 'investor'").execute();

  // 2) сузить значения select до одного 'investor'
  const users = app.findCollectionByNameOrId("users");
  const role = users.fields.getByName("role");
  role.values = ["investor"];
  app.save(users);
}, (app) => {
  // down: вернуть committee в список допустимых значений (данные не откатываем)
  const users = app.findCollectionByNameOrId("users");
  const role = users.fields.getByName("role");
  role.values = ["investor", "committee"];
  app.save(users);
});
