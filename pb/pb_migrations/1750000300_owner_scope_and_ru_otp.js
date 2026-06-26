/// <reference path="../pb_data/types.d.ts" />

// Фаза 4: приватность по владельцу + русское OTP-письмо + фикс отправителя.
//
// Почему так:
// 1) Прежний режим «одна сущность» (миграция 1750000200) показывал любому вошедшему
//    ВСЕ сделки, из-за чего новый зарегистрированный аккаунт видел чужие/сид-данные.
//    Переходим на owner-scoping: каждый аккаунт видит только сделки, где он автор
//    (created_by). Ролевой логики нет — все равны, фронтенд менять не нужно (DealContext
//    грузит getFullList и доверяет правилам API).
// 2) OTP-письмо приходило на английском (дефолтный шаблон PocketBase) — задаём русский.
// 3) Письмо попадало в спам: при отправке через Gmail-релей адрес From обязан совпадать
//    с SMTP-аккаунтом Gmail, иначе ломается SPF/DKIM. Выравниваем senderAddress.
migrate((app) => {
  const OWNER = 'created_by = @request.auth.id';        // владелец сделки
  const OWNER_VIA_DEAL = 'deal.created_by = @request.auth.id'; // через связь на сделку
  const AUTHED = '@request.auth.id != ""';

  // --- deals: видит/правит/удаляет только автор; создавать может любой вошедший ---
  const deals = app.findCollectionByNameOrId("deals");
  deals.listRule = OWNER;
  deals.viewRule = OWNER;
  deals.createRule = AUTHED;
  deals.updateRule = OWNER;
  deals.deleteRule = OWNER;
  app.save(deals);

  // --- deal_investors: доступ через владельца родительской сделки ---
  const di = app.findCollectionByNameOrId("deal_investors");
  di.listRule = OWNER_VIA_DEAL;
  di.viewRule = OWNER_VIA_DEAL;
  di.createRule = OWNER_VIA_DEAL;
  di.updateRule = OWNER_VIA_DEAL;
  di.deleteRule = OWNER_VIA_DEAL;
  app.save(di);

  // --- status_history: аналогично, через владельца сделки ---
  const sh = app.findCollectionByNameOrId("status_history");
  sh.listRule = OWNER_VIA_DEAL;
  sh.viewRule = OWNER_VIA_DEAL;
  sh.createRule = OWNER_VIA_DEAL;
  sh.updateRule = OWNER_VIA_DEAL;
  sh.deleteRule = OWNER_VIA_DEAL;
  app.save(sh);

  // users: правила открытой саморегистрации из фазы 3 НЕ трогаем.

  // --- Русский шаблон OTP-письма (плейсхолдер {OTP}) ---
  const users = app.findCollectionByNameOrId("users");
  users.otp.emailTemplate.subject = "Код подтверждения — X7 Invest";
  users.otp.emailTemplate.body =
    "Здравствуйте!\n\n" +
    "Ваш код для входа в портал X7 Invest: {OTP}\n\n" +
    "Код действует 10 минут. Если вы не запрашивали вход, просто проигнорируйте это письмо.";
  app.save(users);

  // --- Отправитель письма: From обязан совпадать с Gmail-аккаунтом SMTP (антиспам) ---
  const s = app.settings();
  s.meta.appName = "X7 Invest Syndicate Portal";
  s.meta.senderName = "X7 Invest";
  s.meta.senderAddress = "syndycatelnvest@gmail.com"; // = SMTP-аккаунт Gmail
  app.save(s);
}, (app) => {
  // --- откат: возвращаем режим «одна сущность» (фаза 3) для коллекций сделок ---
  const AUTHED = '@request.auth.id != ""';

  const deals = app.findCollectionByNameOrId("deals");
  deals.listRule = AUTHED;
  deals.viewRule = AUTHED;
  deals.createRule = AUTHED;
  deals.updateRule = AUTHED;
  deals.deleteRule = AUTHED;
  app.save(deals);

  const di = app.findCollectionByNameOrId("deal_investors");
  di.listRule = AUTHED;
  di.viewRule = AUTHED;
  di.createRule = AUTHED;
  di.updateRule = AUTHED;
  di.deleteRule = AUTHED;
  app.save(di);

  const sh = app.findCollectionByNameOrId("status_history");
  sh.listRule = AUTHED;
  sh.viewRule = AUTHED;
  sh.createRule = AUTHED;
  sh.updateRule = AUTHED;
  sh.deleteRule = AUTHED;
  app.save(sh);

  // Шаблон письма и настройки отправителя в откате намеренно не трогаем.
});
