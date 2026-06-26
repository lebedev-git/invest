/// <reference path="../pb_data/types.d.ts" />

// Локализация письма «Сброс пароля» на русский.
//
// Почему так: флоу восстановления пароля (requestPasswordReset) использует глобальный
// шаблон resetPasswordTemplate, который по умолчанию на английском. Ссылка ведёт на
// встроенную страницу подтверждения PocketBase (/_/#/auth/confirm-password-reset/{TOKEN}),
// где пользователь задаёт новый пароль — отдельную страницу в приложении не делаем.
// Плейсхолдеры {APP_URL} и {TOKEN} — стандартные для этого шаблона.
migrate((app) => {
  const s = app.settings();
  s.resetPasswordTemplate.subject = "Сброс пароля — X7 Invest";
  s.resetPasswordTemplate.body =
    "<p>Здравствуйте!</p>\n" +
    "<p>Вы запросили сброс пароля в портале X7 Invest. Нажмите на кнопку ниже, чтобы задать новый пароль:</p>\n" +
    "<p>\n" +
    "  <a class=\"btn\" href=\"{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Сбросить пароль</a>\n" +
    "</p>\n" +
    "<p><i>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</i></p>\n" +
    "<p>С уважением,<br/>команда X7 Invest</p>";
  app.save(s);
}, (app) => {
  // Откат намеренно не трогаем (текст шаблона не критичен для работы).
});
