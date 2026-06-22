/// <reference path="../pb_data/types.d.ts" />

// Фаза 2: полное хранение Deal в json-поле data + штампы времени.
// data хранит весь объект Deal (форма не дробится), created — дата события/сортировки.
migrate((app) => {
  const deals = app.findCollectionByNameOrId("deals");
  deals.fields.add(new JSONField({ name: "data", maxSize: 2000000 }));
  deals.fields.add(new AutodateField({ name: "created", onCreate: true, onUpdate: false }));
  deals.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(deals);

  const history = app.findCollectionByNameOrId("status_history");
  history.fields.add(new AutodateField({ name: "created", onCreate: true, onUpdate: false }));
  history.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(history);

  const di = app.findCollectionByNameOrId("deal_investors");
  di.fields.add(new AutodateField({ name: "created", onCreate: true, onUpdate: false }));
  app.save(di);
}, (app) => {
  const deals = app.findCollectionByNameOrId("deals");
  for (const f of ["data", "created", "updated"]) deals.fields.removeByName(f);
  app.save(deals);

  const history = app.findCollectionByNameOrId("status_history");
  for (const f of ["created", "updated"]) history.fields.removeByName(f);
  app.save(history);

  const di = app.findCollectionByNameOrId("deal_investors");
  di.fields.removeByName("created");
  app.save(di);
});
