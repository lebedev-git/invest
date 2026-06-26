/// <reference path="../pb_data/types.d.ts" />

// Письмо сброса пароля → ведём на собственную страницу приложения /reset-password/{TOKEN}
// (в фирменном стиле портала), вместо встроенной админ-страницы PocketBase (/_/...).
// Маршрут объявлен в src/App.tsx, форма — src/pages/ResetPassword.tsx (confirmPasswordReset).
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.resetPasswordTemplate.subject = "Сброс пароля — X7 Invest";
  users.resetPasswordTemplate.body =
    "<p>Здравствуйте!</p>\n" +
    "<p>Вы запросили сброс пароля в портале X7 Invest. Нажмите на кнопку ниже, чтобы задать новый пароль:</p>\n" +
    "<p>\n" +
    "  <a class=\"btn\" href=\"{APP_URL}/reset-password/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Сбросить пароль</a>\n" +
    "</p>\n" +
    "<p><i>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</i></p>\n" +
    "<p>С уважением,<br/>команда X7 Invest</p>";
  app.save(users);
}, (app) => {
  // откат — на встроенную страницу PocketBase
  const users = app.findCollectionByNameOrId("users");
  users.resetPasswordTemplate.body =
    "<p>Здравствуйте!</p>\n" +
    "<p>Вы запросили сброс пароля в портале X7 Invest. Нажмите на кнопку ниже, чтобы задать новый пароль:</p>\n" +
    "<p>\n" +
    "  <a class=\"btn\" href=\"{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Сбросить пароль</a>\n" +
    "</p>\n" +
    "<p><i>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</i></p>\n" +
    "<p>С уважением,<br/>команда X7 Invest</p>";
  app.save(users);
});
