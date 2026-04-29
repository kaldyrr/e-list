# e-list

Агрегатор товаров и цен по модели E-Katalog: категории, подбор по характеристикам, сравнение товаров, карточки моделей, предложения магазинов, отзывы и история цен.

## Цель проекта

Сделать каталог, в котором пользователь быстро находит подходящий товар, сравнивает характеристики и переходит к магазину с актуальной ценой.

Первый фокус проекта:

- быстрый каталог с фильтрами;
- карточка товара с характеристиками;
- сравнение товаров;
- предложения магазинов и цены;
- админка для наполнения категорий, товаров и характеристик.

## Рекомендуемый стек

Проект стартует как TypeScript-монорепа.

- Frontend: Next.js, React, TypeScript.
- UI: Tailwind CSS, shadcn/ui, lucide-react.
- Backend: NestJS, TypeScript.
- Database: PostgreSQL.
- ORM: Prisma.
- Cache/queues: Redis, BullMQ.
- Search: сначала PostgreSQL indexes/full-text search, позже Meilisearch или OpenSearch.
- Tests: Vitest/Jest, Playwright.
- Infrastructure: Docker Compose, GitHub Actions.

## Будущая структура

```text
apps/
  web/          # Next.js frontend
  api/          # NestJS backend
packages/
  ui/           # общие UI-компоненты, если понадобится
  shared/       # общие типы, схемы, константы
docs/
  WORKFLOW.md   # правила работы команды
```

## MVP

1. Главная страница и навигация по категориям.
2. Категории: процессоры, видеокарты, материнские платы.
3. Листинг товаров с фильтрами и сортировкой.
4. Карточка товара: фото, характеристики, предложения магазинов.
5. Сравнение товаров.
6. Избранное.
7. Админка для категорий, характеристик и товаров.
8. Базовый поиск.
9. E2E smoke-тесты главных пользовательских сценариев.

## Команда и зоны ответственности

- Backend developer: база данных, API, импорт цен, магазины, поиск, фильтры, авторизация.
- Fullstack 1: каталог, категории, фильтры, интеграция frontend с API.
- Fullstack 2: карточка товара, сравнение, избранное, история цен.
- Frontend 1: главная, layout, навигация, дизайн-система.
- Frontend 2: листинг, карточки товаров, фильтры, адаптив.
- QA tester: тест-план, регрессия, e2e, проверка адаптива, баг-репорты.

## Ветки

- `main` - стабильная ветка, только проверенный код.
- `develop` - интеграционная ветка текущего спринта.
- `feature/backend-core` - стартовая backend-ветка.
- `feature/frontend-shell` - стартовая frontend-ветка для layout и дизайн-системы.
- `feature/catalog` - категории, листинг, фильтры.
- `feature/product-page` - карточка товара.
- `feature/compare-favorites` - сравнение и избранное.
- `qa/e2e-smoke` - тест-план и e2e smoke-тесты.

Работа ведется через pull request в `develop`. В `main` попадает только стабильный релиз из `develop`.

## Быстрый старт для разработчика

```bash
git clone https://github.com/kaldyrr/e-list.git
cd e-list
git checkout develop
cp .env.example .env
pnpm install
pnpm db:up
```

Дальше разработчик берет свою задачу и создает ветку от `develop`:

```bash
git checkout develop
git pull
git checkout -b feature/task-name
```

Перед pull request:

```bash
git status
git add .
git commit -m "feat: short task description"
git push -u origin feature/task-name
```

После появления приложений:

```bash
pnpm dev:web
pnpm dev:api
```

## Правила качества

- Все новые фичи идут через PR.
- PR должен содержать краткое описание, скриншот для UI-изменений и список проверок.
- Нельзя мержить PR с падающими тестами или typecheck.
- Backend-изменения должны сопровождаться тестами API или сервисов.
- Frontend-изменения должны проверяться на desktop и mobile.
- QA заводит баги отдельными issue с шагами воспроизведения, ожидаемым и фактическим результатом.

Подробная инструкция для команды находится в [docs/WORKFLOW.md](docs/WORKFLOW.md).

## Парсинг и цены

Базовый алгоритм расчета рыночной цены описан в [universal_tech_price_parser_algorithm.md](universal_tech_price_parser_algorithm.md).

Production-правила ingestion-пайплайна: [docs/INGESTION_STRATEGY.md](docs/INGESTION_STRATEGY.md).
