# Аналитическая записка: данные, процессы и формулы для X7 Invest Syndicate Portal

Дата подготовки: 2026-05-06

## 1. Цель записки

Цель документа - зафиксировать единую бизнес-логику платформы перед реализацией: какие данные должны храниться в админ-панели, как они проходят в инвесторский дашборд, какие показатели считаются автоматически, а какие должны вводиться/подтверждаться инвестиционным комитетом.

Текущая версия MVP уже связывает админку и портал через общий список сделок, но финансовая модель пока слишком упрощена: дашборд считает прогнозный доход как `invested * targetIrr / 100`. Для коммерческой недвижимости это допустимо только как временная демонстрационная метрика. Для реальной платформы нужно перейти к модели денежных потоков, NOI, оценке стоимости объекта и план/факт выплатам.

## 2. Проверенные подходы, на которые опираемся

1. Income approach / DCF для недвижимости.
   RICS описывает доходный подход как капитализацию или приведение текущих и прогнозных доходов/денежных потоков к текущей стоимости. В DCF IRR - это ставка, при которой NPV будущих положительных и отрицательных денежных потоков, включая первоначальную инвестицию, равен нулю.
   Источник: RICS, Discounted cash flow valuations: https://www.rics.org/content/dam/ricsglobal/documents/standards/Discounted-cash-flow-valuations-1.pdf

2. NOI и cap rate как базовая логика оценки доходной недвижимости.
   Cap rate = annual NOI / market value. Это не замена IRR, а быстрый показатель доходности/риска объекта и ориентир для оценки выхода.
   Источник: J.P. Morgan, Cap Rates Explained: https://www.jpmorgan.com/insights/real-estate/commercial-term-lending/cap-rates-explained

3. Performance measurement для фондов/синдикатов.
   INREV фиксирует, что performance должен отражать стратегию, структуру и стиль инструмента, а IRR считается по денежным потокам. Это важно для нашей платформы: нельзя смешивать объектную доходность, доходность инвестора и доходность управляющего.
   Источник: INREV Performance Measurement: https://www.inrev.org/guidelines/module/inrev-performance-measurement

4. Прозрачность отчетности.
   NCREIF/PREA Reporting Standards созданы для прозрачности, согласованности и сопоставимости данных по institutional real estate. Для MVP это означает: единые справочники, единая методика расчета, понятное разделение gross/net показателей.
   Источник: NCREIF Reporting Standards: https://ncreif.org/about/standards/

5. Fair value / независимая оценка.
   GIPS для real estate требует fair value и раскрытия частоты внешней оценки. Для платформы это означает, что `currentValue` и `exitValue` должны иметь источник: модель, оценщик, рыночный cap rate, сделка, отчет.
   Источник: GIPS Standards Handbook: https://www.gipsstandards.org/standards/gips-standards-for-firms/gips-standards-handbook-for-firms/

6. Метрики private capital.
   ILPA стандартизирует отчетность по cash flows и performance metrics, включая IRR, TVPI/MOIC. Для синдиката это полезно как язык инвестора: сколько внесено, сколько распределено, сколько осталось в стоимости.
   Источник: ILPA Templates & Standards: https://ilpa.org/industry-guidance/templates-standards-model-documents/

## 3. Главный принцип модели

Платформа должна разделять четыре сущности:

1. Объект недвижимости.
   Физический актив: адрес, площадь, тип, арендатор, аренда, расходы, CAPEX, стоимость.

2. Сделка/проект.
   Инвестиционная упаковка объекта: стратегия, стадии, размер синдиката, сроки, юридическая структура, план выхода.

3. Участие инвестора.
   Конкретная доля конкретного инвестора: сколько вложил, когда вошел, какая доля, сколько получил выплат.

4. Денежные потоки.
   Плановые и фактические движения денег: взносы, арендные выплаты, проценты, возврат тела, продажа, комиссии, налоги.

Если эти сущности смешать в одну таблицу `Deal`, дашборд быстро начнет показывать некорректные цифры: например, IRR сделки будет ошибочно считаться доходностью инвестора, а стоимость объекта - суммой вложений инвестора.

## 4. Какие поля нужны

### 4.1. Объект недвижимости

Обязательные поля:
- `propertyId`
- `name`
- `assetClass`: street retail, GAB, office, warehouse, self storage, land, redevelopment, loan secured by real estate
- `address`
- `city`
- `district`
- `grossArea`
- `rentableArea`
- `occupancyPct`
- `tenantName`
- `tenantType`
- `leaseStartDate`
- `leaseEndDate`
- `monthlyGrossRent`
- `monthlyNetRent`
- `annualRentIndexationPct`
- `opexMonthly`
- `utilitiesTreatment`: tenant-paid, owner-paid, reimbursable, meter-based
- `propertyTaxAnnual`
- `insuranceAnnual`
- `managementCostAnnual`
- `capexBudget`
- `capexSpent`
- `currentValuation`
- `valuationDate`
- `valuationSource`

Зачем:
- без площади и аренды нельзя считать ставку аренды и NOI;
- без OPEX и коммуналки нельзя отличить gross rent от NOI;
- без текущей оценки нельзя считать NAV, LTV, unrealized gain;
- без срока договора аренды нельзя оценить риск cash flow.

### 4.2. Сделка/проект

Обязательные поля:
- `dealId`
- `propertyId`
- `strategy`: income, value-add, redevelopment, development, secured loan, flip
- `dealStatus`: fundraising, acquisition, registration, construction, renovation, leasing, operating, sale, closed, cancelled
- `fundraisingTarget`
- `minimumTicket`
- `totalEquityRequired`
- `debtAmount`
- `purchasePrice`
- `closingCosts`
- `legalCosts`
- `brokerFee`
- `setupFee`
- `reserveFund`
- `targetHoldPeriodMonths`
- `entryDate`
- `plannedExitDate`
- `targetExitValue`
- `targetExitCapRate`
- `targetIrrGross`
- `targetIrrNet`
- `targetEquityMultiple`
- `riskLevel`
- `investmentCommitteeStatus`

Зачем:
- `fundraisingTarget` и `totalEquityRequired` показывают размер сделки, а не вложение одного инвестора;
- debt и fees нужны для различения gross/net доходности;
- `targetExitCapRate` и `targetExitValue` нужны для модели выхода;
- `targetIrrGross` и `targetIrrNet` нельзя смешивать: инвестор должен видеть net после комиссий.

### 4.3. Участие инвестора

Обязательные поля:
- `investorId`
- `dealId`
- `commitmentAmount`
- `contributedAmount`
- `contributionDate`
- `ownershipSharePct`
- `units`
- `entryPricePerUnit`
- `paidOutTotal`
- `remainingCapital`
- `currentNavShare`
- `realizedGain`
- `unrealizedGain`
- `investorStatus`: invited, committed, funded, active, exited

Зачем:
- дашборд инвестора должен считать портфель по его долям, а не по общему размеру сделки;
- `commitmentAmount` и `contributedAmount` нужны отдельно: инвестор мог подписаться, но еще не оплатить;
- `ownershipSharePct` можно считать как `contributedAmount / totalEquityRaised`, но лучше сохранять зафиксированную долю после закрытия сбора.

### 4.4. Денежные потоки

Обязательные поля:
- `cashflowId`
- `dealId`
- `investorId`
- `date`
- `type`: contribution, rentDistribution, interestPayment, principalReturn, saleDistribution, fee, tax, reserveRelease
- `amount`
- `planOrActual`: plan, actual
- `period`
- `source`
- `approvedBy`

Зачем:
- IRR считается только по датированным денежным потокам;
- план/факт выплат невозможен без календаря cash flows;
- `paidOut` не должен быть ручным полем сделки, это сумма фактических cash flows по инвестору.

## 5. Формулы

### 5.1. NOI

`NOI = Effective Gross Income - Operating Expenses`

Где:
- `Effective Gross Income = Potential Gross Rent - Vacancy Loss + Recoveries`
- `Operating Expenses = OPEX + property tax + insurance + management cost + non-reimbursed utilities`

Важно:
- debt service, амортизация кредита, CAPEX, налог инвестора и комиссии управляющего не включаются в NOI;
- CAPEX учитывается отдельно в cash flow модели.

### 5.2. Cap rate

`Cap Rate = Annual NOI / Property Value`

Использование:
- входной cap rate: `NOI at acquisition / purchasePrice`;
- текущий cap rate: `currentNOI / currentValuation`;
- exit value через cap rate: `Exit Value = Stabilized NOI / Exit Cap Rate`.

Ограничение:
- cap rate не равен IRR, потому что не учитывает рост аренды, CAPEX, leverage, сроки и продажу.

### 5.3. Cash-on-cash yield

`Cash-on-Cash = Annual Cash Distribution / Invested Equity`

Использование:
- хорошо показывает текущую денежную отдачу;
- особенно полезен для арендных объектов и ГАБ.

Ограничение:
- не учитывает рост стоимости и продажу объекта.

### 5.4. Equity multiple / MOIC

`Equity Multiple = Total Distributions / Total Contributions`

Для инвестора:
- `Total Contributions` = все взносы инвестора;
- `Total Distributions` = все выплаты инвестору + финальная продажа.

Пример:
- вложил 1 000 000;
- получил 250 000 аренды;
- при продаже получил 1 200 000;
- multiple = 1 450 000 / 1 000 000 = 1.45x.

### 5.5. IRR

IRR считается по датированным денежным потокам:

`NPV = Σ CFt / (1 + IRR)^(daysFromStart / 365) = 0`

Для инвестора:
- первоначальный взнос отрицательный;
- выплаты и возврат капитала положительные;
- финальная стоимость или продажа положительная;
- комиссии и удержания отрицательные или уменьшают выплаты.

Важно:
- `targetIrr` в админке должен быть плановым показателем;
- фактический IRR должен считаться из actual cash flows;
- для незакрытых сделок нужен `currentNavShare` как текущая оценочная стоимость доли.

### 5.6. NAV инвестора

`Investor NAV = ownershipSharePct * Net Asset Value of Deal`

Где:
- `Deal NAV = currentPropertyValue + cashReserve - debtOutstanding - accruedFees - liabilities`

Для MVP можно упростить:
- `currentNavShare = contributedAmount + paidOutTotal + unrealizedGain`, но в целевой модели лучше считать через fair value объекта.

### 5.7. План/факт выплат

Плановая выплата:

`plannedDistribution = plannedDealCashflow * investorOwnershipSharePct`

Фактическая выплата:

`actualDistribution = sum(actual cashflows where type in rentDistribution, interestPayment, principalReturn, saleDistribution)`

Отклонение:

`distributionVariance = actualDistribution - plannedDistribution`

### 5.8. Остаток к возврату капитала

`remainingCapital = contributedAmount - principalReturn`

Не путать:
- арендная выплата/проценты - доход;
- principal return - возврат тела инвестиций.

### 5.9. Статус сделки

Статус должен быть не просто текстом, а управлять видимостью и расчетами:

- `fundraising`: показывать в новых проектах, не включать в активный портфель инвестора без участия;
- `acquisition/registration`: деньги внесены, дохода еще нет;
- `construction/renovation`: есть CAPEX, возможны каникулы, выплат может не быть;
- `leasing`: объект ищет арендатора, доход прогнозный;
- `operating`: есть арендный поток, считаем план/факт;
- `sale`: готовится выход, считаем ожидаемую финальную выплату;
- `closed`: сделка закрыта, фактический IRR фиксируется;
- `cancelled`: не участвует в портфеле.

## 6. Что скорректировать в текущем MVP

### 6.1. Переименовать смысл текущего `targetIrr`

Сейчас поле называется IRR, но фактически используется как годовая доходность для простого расчета.

Решение:
- оставить `targetIrr` как плановый IRR;
- добавить `targetAnnualYieldPct` для простого годового прогноза выплат;
- в дашборде временно считать прогнозный доход от `targetAnnualYieldPct`, а не от IRR.

Почему:
- IRR без датированных cash flows математически некорректен.

### 6.2. Добавить календарь денежных потоков

Минимальная структура:
- дата;
- тип;
- сумма;
- план/факт;
- сделка;
- инвестор.

После этого:
- `paidOut` перестает быть ручным полем;
- календарь выплат становится реальным;
- можно считать actual IRR.

### 6.3. Разделить общий размер сделки и вложение инвестора

Сейчас `invested` в сделке смешивает объект и инвестора.

Нужно:
- на уровне сделки: `totalEquityRequired`, `fundraisingTarget`, `totalEquityRaised`;
- на уровне инвестора: `contributedAmount`.

### 6.4. Добавить объектные поля для недвижимости

Минимальный набор для следующей итерации:
- покупная цена;
- площадь;
- аренда в месяц;
- OPEX;
- коммуналка;
- налог/страхование/управление;
- CAPEX budget/spent;
- текущая оценка;
- exit cap rate.

### 6.5. Развести gross и net показатели

Инвестору нужен net:
- net IRR;
- net cash yield;
- net paid out;
- net NAV.

Команда может видеть gross:
- property NOI;
- gross IRR before fees;
- project-level return.

### 6.6. Ввести источники и статусы подтверждения данных

Для каждого ключевого числа нужен источник:
- manual estimate;
- IC approved;
- contract;
- bank statement;
- appraisal;
- management report.

И статус:
- draft;
- pending approval;
- approved;
- locked.

## 7. Предлагаемая структура реализации

### Этап 1. Нормализовать модель данных

Добавить сущности:
- `Property`
- `Deal`
- `InvestorPosition`
- `Cashflow`

На UI можно пока оставить один экран админки, но внутри формы разделить блоки:
- Объект;
- Сделка;
- Участие инвестора;
- План выплат.

### Этап 2. Пересчитать дашборд на новых сущностях

Портфель:
- total invested = sum investor contributedAmount;
- current NAV = sum investor currentNavShare;
- paid out = sum actual investor distributions;
- projected income = sum planned future distributions;
- actual IRR = XIRR по actual cash flows + current NAV;
- target IRR = из approved deal model.

Распределение:
- по типу актива;
- по статусу;
- по городу;
- по стратегии;
- по стадии риска.

### Этап 3. Добавить план/факт

Нужны таблицы:
- плановые выплаты;
- фактические выплаты;
- отклонения;
- комментарии управляющего.

### Этап 4. Добавить управленческий контроль

Админка должна показывать:
- какие сделки имеют неполные данные;
- где IRR не может быть посчитан;
- где нет оценки объекта;
- где просрочены выплаты;
- где CAPEX превышен;
- где фактическая аренда ниже плана.

## 8. Рекомендуемый минимальный набор для ближайшей разработки

Чтобы не перегрузить MVP, предлагается добавить сначала 12 полей:

1. `totalEquityRequired`
2. `contributedAmount`
3. `ownershipSharePct`
4. `entryDate`
5. `plannedExitDate`
6. `monthlyRent`
7. `opexMonthly`
8. `capexBudget`
9. `capexSpent`
10. `currentValuation`
11. `targetAnnualYieldPct`
12. `cashflows[]`

И 6 расчетов:

1. `NOI = rent - opex`
2. `ownershipSharePct = contributedAmount / totalEquityRaised`
3. `paidOut = sum(actual distributions)`
4. `plannedIncome = sum(future planned distributions)`
5. `currentNavShare = ownershipSharePct * dealNAV`
6. `actualIRR = XIRR(actual cashflows + currentNavShare)`

## 9. Вывод

Сейчас мы учли только верхний слой: название сделки, тип, город, статус, вложено, целевую доходность. Этого достаточно для демонстрационного портфеля, но недостаточно для инвестиционного продукта.

Ключевая корректировка: перейти от сделки как одной строки к модели "объект - сделка - участие инвестора - денежные потоки". Тогда портал сможет корректно показывать не просто красивую сумму портфеля, а инвестиционную картину: сколько внесено, сколько уже выплачено, какой NAV, какая фактическая доходность, где план/факт отклоняется и какие риски есть по объекту.
