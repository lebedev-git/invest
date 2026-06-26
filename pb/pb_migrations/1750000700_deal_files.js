/// <reference path="../pb_data/types.d.ts" />

// Файловые поля для сделок: изображения объекта и документы.
// Заменяют захардкоженные Unsplash-картинки и плейсхолдер «Документы».
// Доступ к файлам owner-scoped (как и сама сделка) → на клиенте нужен file-токен.
migrate((app) => {
  const deals = app.findCollectionByNameOrId("deals");

  deals.fields.add(new FileField({
    name: "images",
    maxSelect: 12,
    maxSize: 10485760, // 10 МБ
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    thumbs: ["400x300", "1200x0"],
  }));

  deals.fields.add(new FileField({
    name: "documents",
    maxSelect: 20,
    maxSize: 20971520, // 20 МБ
    mimeTypes: [], // любой тип файла
  }));

  app.save(deals);

  // Доступ к owner-scoped файлам идёт по file-токену. Дефолт 180с слишком мал для
  // галереи/документов в портале — поднимаем до 1 часа.
  const users = app.findCollectionByNameOrId("users");
  users.fileToken.duration = 3600;
  app.save(users);
}, (app) => {
  const deals = app.findCollectionByNameOrId("deals");
  const img = deals.fields.getByName("images");
  if (img) deals.fields.removeById(img.id);
  const doc = deals.fields.getByName("documents");
  if (doc) deals.fields.removeById(doc.id);
  app.save(deals);
});
