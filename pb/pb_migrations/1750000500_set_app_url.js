/// <reference path="../pb_data/types.d.ts" />

// Прод-URL приложения для писем PocketBase.
//
// Почему так: плейсхолдер {APP_URL} в письмах (сброс пароля, верификация) брался из
// meta.appURL, который оставался дефолтным http://localhost:8090. Из-за этого ссылка
// сброса пароля вела на localhost (встроенная страница подтверждения недоступна).
// Ставим боевой домен — ссылка ведёт на {APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}.
migrate((app) => {
  const s = app.settings();
  s.meta.appURL = "https://syndicate-invest.ru";
  app.save(s);
}, (app) => {
  const s = app.settings();
  s.meta.appURL = "http://localhost:8090";
  app.save(s);
});
