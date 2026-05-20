# Database Blueprint

Этот каталог содержит целевую SQL-схему и seed-данные для backend foundation:

- `database/schema.sql`
- `database/seed.sql`

Важно:

- текущая runtime-схема API остается в `apps/api/prisma/schema.prisma`
- `database/schema.sql` сейчас выступает как blueprint целевой модели данных
- перед заменой runtime-схемы нужно отдельно адаптировать `apps/api`, сиды и Prisma migrations

Назначение blueprint:

- согласовать структуру каталога, характеристик, магазинов и офферов
- подготовить основу для дальнейшей миграции backend на более полную модель данных
- вынести обсуждение схемы БД в отдельный reviewable слой без поломки текущего backend-core
