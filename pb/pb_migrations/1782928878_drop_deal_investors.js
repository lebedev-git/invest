/// <reference path="../pb_data/types.d.ts" />
// Удаляем коллекцию deal_investors — рудимент старой модели «синдикат-маркетплейс»
// (связь инвестор↔сделка с суммой/долей). После перехода на модель «личный портфель»
// (owner-scoping, self-only) фронтенд к ней не обращается; на её месте — deal.data.investors.
migrate((app) => {
  // up: удалить коллекцию (её правила уже никем не ссылаются после owner_scope-миграции)
  try {
    app.delete(app.findCollectionByNameOrId("deal_investors"));
  } catch (_) {
    // уже отсутствует — ничего не делаем
  }
}, (app) => {
  // down: воссоздать коллекцию (без данных), правила — в актуальной owner-scoped модели
  const deals = app.findCollectionByNameOrId("deals");
  const users = app.findCollectionByNameOrId("users");
  const scope = "deal.created_by = @request.auth.id";
  const col = new Collection({
    type: "base",
    name: "deal_investors",
    listRule: scope,
    viewRule: scope,
    createRule: scope,
    updateRule: scope,
    deleteRule: scope,
    fields: [
      { name: "deal", type: "relation", collectionId: deals.id, maxSelect: 1, required: true, cascadeDelete: true },
      { name: "investor", type: "relation", collectionId: users.id, maxSelect: 1, required: true },
      { name: "amount", type: "number" },
      { name: "share", type: "number" },
    ],
  });
  app.save(col);
  col.fields.add(new AutodateField({ name: "created", onCreate: true, onUpdate: false }));
  app.save(col);
});
