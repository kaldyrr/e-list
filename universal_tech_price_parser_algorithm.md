# Универсальный парсер цен на технику и комплектующие ПК

Документ описывает архитектуру и алгоритм универсального парсера цен для техники, смартфонов, ноутбуков, комплектующих ПК и периферии.

Цель парсера — не просто собрать цены из интернета, а получить **чистую рыночную цену по конкретному товару**, без мусора, фейковых карточек, аксессуаров, б/у предложений, неверных ревизий и сомнительных магазинов.

---

## 1. Главная идея

Парсер должен работать не от произвольной строки поиска, а от **нормализованной карточки товара**.

Плохой подход:

```text
"rtx 4070 super цена"
```

Хороший подход:

```json
{
  "category": "gpu",
  "brand": "NVIDIA",
  "chipset": "RTX 4070 Super",
  "vendor": null,
  "memory_gb": 12,
  "memory_type": "GDDR6X",
  "condition": "new",
  "region": "RU"
}
```

Или для iPhone:

```json
{
  "category": "smartphone",
  "brand": "Apple",
  "model": "iPhone 17 Pro Max",
  "storage_gb": 256,
  "color": "Cosmic Orange",
  "sim_type": null,
  "condition": "new",
  "region": "RU"
}
```

Парсер должен уметь:

1. Сгенерировать поисковые запросы.
2. Найти карточки товаров.
3. Извлечь цену, наличие и характеристики.
4. Нормализовать товар.
5. Сопоставить карточку с целевым товаром.
6. Отфильтровать мусор.
7. Убрать дубли.
8. Отсечь выбросы.
9. Посчитать рыночную цену.
10. Сохранить историю изменения цены.

---

## 2. Общая схема пайплайна

```text
Входной товар
   ↓
Нормализация запроса
   ↓
Генерация поисковых фраз
   ↓
Сбор URL из источников
   ↓
Загрузка страниц / API / фидов
   ↓
Извлечение данных
   ↓
Нормализация полей
   ↓
Product matching
   ↓
Фильтрация мусора
   ↓
Дедупликация
   ↓
Антифрод / антианомалии
   ↓
Расчёт цены
   ↓
Сохранение результата
   ↓
Отчёт / API / витрина
```

---

## 3. Категории товаров и обязательные признаки

Самая частая ошибка — сравнивать товары только по названию. Для комплектующих ПК это особенно опасно.

### 3.1 Смартфоны

Ключевые признаки:

```json
{
  "brand": "Apple",
  "model": "iPhone 17 Pro Max",
  "storage_gb": 256,
  "color": "Cosmic Orange",
  "sim_type": "eSIM / SIM+eSIM / Dual SIM",
  "condition": "new"
}
```

Что нельзя путать:

```text
iPhone 17 Pro Max 256 ≠ iPhone 17 Pro 256
iPhone 17 Pro Max 256 ≠ iPhone 17 Pro Max 512
eSIM ≠ nano-SIM + eSIM
новый ≠ восстановленный
```

### 3.2 Видеокарты

Ключевые признаки:

```json
{
  "brand_chip": "NVIDIA",
  "chipset": "RTX 4070 Super",
  "vendor": "MSI / ASUS / Palit / Gigabyte",
  "memory_gb": 12,
  "memory_type": "GDDR6X",
  "cooling": "2 fan / 3 fan",
  "condition": "new"
}
```

Нельзя путать:

```text
RTX 4070 ≠ RTX 4070 Super
RTX 4070 Super ≠ RTX 4070 Ti Super
RX 7600 ≠ RX 7600 XT
8GB ≠ 16GB
новая ≠ б/у
```

Для расчёта “средней цены RTX 4070 Super” vendor можно не фиксировать.

Для расчёта конкретной модели “MSI Gaming X Slim RTX 4070 Super” vendor и серия обязательны.

### 3.3 Процессоры

Ключевые признаки:

```json
{
  "brand": "AMD",
  "model": "Ryzen 7 7800X3D",
  "socket": "AM5",
  "box_type": "BOX / OEM",
  "condition": "new"
}
```

Нельзя путать:

```text
Ryzen 7 7800X3D ≠ Ryzen 7 7700X
Intel i5-14600K ≠ i5-14600KF
BOX ≠ OEM
Tray ≠ BOX
```

### 3.4 Материнские платы

Ключевые признаки:

```json
{
  "brand": "MSI",
  "model": "B650 Tomahawk WiFi",
  "chipset": "B650",
  "socket": "AM5",
  "memory_type": "DDR5",
  "form_factor": "ATX",
  "wifi": true
}
```

Нельзя путать:

```text
B650 ≠ B650E
WiFi ≠ без WiFi
DDR4 ≠ DDR5
mATX ≠ ATX
```

### 3.5 Оперативная память

Ключевые признаки:

```json
{
  "brand": "Kingston",
  "series": "Fury Beast",
  "capacity_total_gb": 32,
  "modules": "2x16",
  "type": "DDR5",
  "frequency_mhz": 6000,
  "cl": 30,
  "rgb": false
}
```

Нельзя путать:

```text
1x32 ≠ 2x16
DDR4 ≠ DDR5
6000 CL30 ≠ 6000 CL36
RGB ≠ non-RGB, если ищем конкретную модель
```

### 3.6 SSD

Ключевые признаки:

```json
{
  "brand": "Samsung",
  "model": "990 Pro",
  "capacity_tb": 2,
  "interface": "PCIe 4.0",
  "form_factor": "M.2 2280",
  "heatsink": false
}
```

Нельзя путать:

```text
Samsung 990 Pro ≠ 990 Evo
1TB ≠ 2TB
с радиатором ≠ без радиатора
SATA ≠ NVMe
```

### 3.7 Блоки питания

Ключевые признаки:

```json
{
  "brand": "be quiet!",
  "model": "Pure Power 12 M",
  "wattage": 850,
  "certificate": "80+ Gold",
  "modular": true,
  "atx_3_0": true
}
```

Нельзя путать:

```text
750W ≠ 850W
Bronze ≠ Gold
ATX 2.x ≠ ATX 3.0/3.1
модульный ≠ немодульный
```

### 3.8 Мониторы

Ключевые признаки:

```json
{
  "brand": "LG",
  "model": "27GP850",
  "diagonal": 27,
  "resolution": "2560x1440",
  "refresh_rate": 165,
  "matrix": "IPS"
}
```

Нельзя путать:

```text
24" ≠ 27"
Full HD ≠ QHD
144Hz ≠ 165Hz
IPS ≠ VA
```

---

## 4. Источники данных

Источники нужно делить по качеству.

### 4.1 Федеральные ритейлеры

Примеры:

```text
DNS
М.Видео
Эльдорадо
Ситилинк
Мегафон
МТС
restore:
```

Плюсы:

```text
Высокое доверие
Понятная карточка
Хорошая структура
```

Минусы:

```text
Часто антибот
Цены могут быть выше рынка
Регион влияет на наличие
```

### 4.2 Специализированные магазины

```text
BigGeek
Нотик
Регард
ОнлайнТрейд
X-Com
OLDI
KNS
iPort
Hi Store
```

Плюсы:

```text
Ближе к рыночной цене
Часто хорошая детализация
```

Минусы:

```text
Разный уровень доверия
Иногда много серого импорта
```

### 4.3 Маркетплейсы

```text
Ozon
Wildberries
Яндекс Маркет
Мегамаркет
```

Плюсы:

```text
Много предложений
Можно получить нижнюю границу рынка
```

Минусы:

```text
Много дублей
Много мусора
Много карточек от неизвестных продавцов
Нужна фильтрация продавца
```

### 4.4 Агрегаторы

```text
E-Katalog
Price.ru
Яндекс Маркет
Helpix
```

Плюсы:

```text
Удобно для первичного сбора URL
Есть много магазинов
```

Минусы:

```text
Часто устаревшие цены
Нужно переходить в первоисточник
```

### 4.5 Что лучше не использовать в автосредней

```text
Avito
Юла
Telegram
Instagram
VK объявления
форумы
неизвестные лендинги без ИНН/реквизитов
```

Их можно использовать отдельно как “вторичный рынок”, но не мешать с новыми товарами.

---

## 5. Модель данных

Минимальная таблица `products`:

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    canonical_name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    specs JSONB,
    created_at TIMESTAMP DEFAULT now()
);
```

Таблица `offers`:

```sql
CREATE TABLE offers (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id),
    source TEXT NOT NULL,
    source_type TEXT,
    seller_name TEXT,
    url TEXT NOT NULL,
    title TEXT,
    price NUMERIC,
    currency TEXT DEFAULT 'RUB',
    availability TEXT,
    condition TEXT,
    region TEXT,
    delivery_price NUMERIC,
    warranty TEXT,
    parsed_specs JSONB,
    confidence NUMERIC,
    is_suspicious BOOLEAN DEFAULT false,
    suspicious_reasons TEXT[],
    parsed_at TIMESTAMP DEFAULT now()
);
```

История цен:

```sql
CREATE TABLE price_history (
    id BIGSERIAL PRIMARY KEY,
    offer_id BIGINT REFERENCES offers(id),
    price NUMERIC,
    availability TEXT,
    parsed_at TIMESTAMP DEFAULT now()
);
```

Источники:

```sql
CREATE TABLE sources (
    id BIGSERIAL PRIMARY KEY,
    name TEXT,
    domain TEXT,
    source_type TEXT,
    trust_weight NUMERIC,
    parser_type TEXT,
    active BOOLEAN DEFAULT true
);
```

---

## 6. Нормализация текста

Все названия надо приводить к единому виду.

```python
import re
import unicodedata

def normalize_text(text: str) -> str:
    text = text.lower()
    text = text.replace("ё", "е")
    text = unicodedata.normalize("NFKC", text)
    text = text.replace("×", "x")
    text = text.replace("гб", "gb")
    text = text.replace("тб", "tb")
    text = text.replace("мгц", "mhz")
    text = text.replace("дюймов", '"')
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\w\s\-\+\./\"]", " ", text)
    return text.strip()
```

Нормализация памяти:

```python
def parse_capacity_gb(text: str):
    text = normalize_text(text)

    m = re.search(r"(\d+(?:\.\d+)?)\s*tb", text)
    if m:
        return int(float(m.group(1)) * 1024)

    m = re.search(r"(\d+)\s*gb", text)
    if m:
        return int(m.group(1))

    return None
```

Нормализация цены:

```python
def parse_price(text: str):
    text = text.replace("\xa0", " ")
    text = re.sub(r"[^\d]", "", text)

    if not text:
        return None

    price = int(text)

    if price < 100:
        return None

    return price
```

---

## 7. Генерация поисковых запросов

Для каждого товара генерируй несколько запросов.

### Пример: видеокарта

```python
def generate_gpu_queries(product):
    chipset = product["chipset"]
    memory = product.get("memory_gb")
    vendor = product.get("vendor")

    queries = []

    if vendor:
        queries.append(f'{vendor} {chipset} {memory}GB купить')
        queries.append(f'{vendor} {chipset} {memory} гб цена')
    else:
        queries.append(f'{chipset} {memory}GB купить')
        queries.append(f'{chipset} {memory} гб цена')
        queries.append(f'видеокарта {chipset} {memory}GB')

    return queries
```

### Пример: SSD

```python
def generate_ssd_queries(product):
    return [
        f'{product["brand"]} {product["model"]} {product["capacity_tb"]}TB купить',
        f'{product["brand"]} {product["model"]} {product["capacity_tb"]} ТБ цена',
        f'SSD {product["brand"]} {product["model"]} {product["capacity_tb"]}TB'
    ]
```

---

## 8. Сбор URL

Есть четыре нормальных способа.

### 8.1 Официальный API магазина

Лучший вариант, если доступен.

```text
+ быстро
+ стабильно
+ меньше банов
- редко есть публично
```

### 8.2 Фиды

Многие магазины и маркетплейсы имеют YML/XML-фиды.

```text
https://site.ru/yandex-market.xml
https://site.ru/feed.xml
```

Фиды часто лучше HTML-парсинга.

### 8.3 HTML-парсинг

Нужен для магазинов без API.

Инструменты:

```text
requests + BeautifulSoup
httpx
selectolax
Playwright
```

`requests` — для простых сайтов.  
`Playwright` — для JS-сайтов и антибота.

### 8.4 Поисковая выдача

Можно использовать:

```text
SerpAPI
DataForSEO
Zenserp
официальные Search API
```

Лучше не парсить Google/Yandex напрямую — быстро упираешься в капчу.

---

## 9. Извлечение данных со страницы

Надёжный порядок извлечения:

```text
1. JSON-LD schema.org/Product
2. OpenGraph/meta tags
3. встроенный __NEXT_DATA__ / window.__INITIAL_STATE__
4. DOM-селекторы
5. regex fallback
```

### 9.1 JSON-LD

```python
import json
from bs4 import BeautifulSoup

def extract_jsonld_products(html):
    soup = BeautifulSoup(html, "html.parser")
    products = []

    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "")
        except Exception:
            continue

        items = data if isinstance(data, list) else [data]

        for item in items:
            if item.get("@type") == "Product":
                products.append(item)

            if "@graph" in item:
                for graph_item in item["@graph"]:
                    if graph_item.get("@type") == "Product":
                        products.append(graph_item)

    return products
```

### 9.2 Универсальный extractor

```python
def extract_offer_from_jsonld(product_json):
    offer = product_json.get("offers", {})

    if isinstance(offer, list):
        offer = offer[0] if offer else {}

    return {
        "title": product_json.get("name"),
        "price": parse_price(str(offer.get("price", ""))),
        "currency": offer.get("priceCurrency"),
        "availability": offer.get("availability"),
        "brand": product_json.get("brand"),
        "sku": product_json.get("sku"),
    }
```

### 9.3 DOM fallback

Для каждого источника лучше хранить конфиг селекторов:

```json
{
  "source": "example_shop",
  "selectors": {
    "title": "h1",
    "price": ".product-price, [data-price]",
    "availability": ".availability, .stock-status"
  }
}
```

Код:

```python
def extract_by_selectors(soup, selectors):
    result = {}

    for field, selector in selectors.items():
        el = soup.select_one(selector)
        result[field] = el.get_text(" ", strip=True) if el else None

    return result
```

---

## 10. Product matching

Это сердце парсера.

Нужно определить: карточка действительно соответствует искомому товару или просто похожа.

### 10.1 Простая scoring-модель

```python
def match_score(target, offer):
    score = 0
    reasons = []

    title = normalize_text(offer.get("title", ""))

    if target.get("brand") and target["brand"].lower() in title:
        score += 10
        reasons.append("brand_match")

    if target.get("model") and normalize_text(target["model"]) in title:
        score += 35
        reasons.append("model_match")

    if target.get("storage_gb"):
        cap = parse_capacity_gb(title)
        if cap == target["storage_gb"]:
            score += 20
            reasons.append("storage_match")
        else:
            score -= 30
            reasons.append("storage_mismatch")

    if target.get("color"):
        color = normalize_text(target["color"])
        if color in title:
            score += 10
            reasons.append("color_match")

    return score, reasons
```

### 10.2 Порог прохождения

```python
if score >= 70:
    status = "exact"
elif score >= 50:
    status = "probable"
else:
    status = "reject"
```

Но для каждой категории должны быть свои правила.

---

## 11. Правила matching по категориям

### 11.1 GPU

```python
GPU_NEGATIVE_RULES = {
    "rtx 4070 super": [
        "rtx 4070 ti",
        "rtx 4070 ti super",
        "rtx 4070",
        "rtx 4060",
        "rtx 4080"
    ]
}
```

Важно: порядок проверки. Сначала проверяем длинные модели:

```text
4070 Ti Super
4070 Super
4070 Ti
4070
```

Иначе можно неправильно сматчить `4070 Ti Super` как `4070 Super`.

### 11.2 CPU

```python
def cpu_match(target_model, title):
    title = normalize_text(title)
    target = normalize_text(target_model)

    if target not in title:
        return False

    # K и KF нельзя путать
    if target.endswith("k") and f"{target}f" in title:
        return False

    if target.endswith("kf") and target[:-1] + " " in title:
        return False

    return True
```

### 11.3 RAM

Для RAM нельзя ориентироваться только на общий объём.

```python
def ram_match(target, title):
    title = normalize_text(title)

    required = [
        str(target["capacity_total_gb"]),
        target["type"].lower(),
        str(target["frequency_mhz"])
    ]

    for r in required:
        if r not in title:
            return False

    if target.get("modules") == "2x16":
        if not re.search(r"2\s*x\s*16", title):
            return False

    if target.get("cl"):
        if f"cl{target['cl']}" not in title.replace(" ", ""):
            return False

    return True
```

### 11.4 SSD

```python
def ssd_match(target, title):
    title = normalize_text(title)

    if normalize_text(target["brand"]) not in title:
        return False

    if normalize_text(target["model"]) not in title:
        return False

    cap_gb = parse_capacity_gb(title)
    if cap_gb != target["capacity_tb"] * 1024:
        return False

    if target.get("heatsink") is False:
        if "heatsink" in title or "радиатор" in title:
            return False

    return True
```

---

## 12. Фильтрация мусора

### 12.1 Общие стоп-слова

```python
BAD_WORDS = [
    "б/у",
    "бу",
    "used",
    "refurbished",
    "восстановленный",
    "уценка",
    "витринный",
    "после ремонта",
    "донор",
    "запчасть",
    "муляж",
    "копия",
    "реплика",
    "чехол",
    "стекло",
    "кабель",
    "адаптер",
    "защитная пленка",
    "макет"
]
```

### 12.2 Проверка

```python
def has_bad_words(title, description=""):
    text = normalize_text(title + " " + description)
    return [w for w in BAD_WORDS if w in text]
```

### 12.3 Наличие

Нормализуй availability:

```python
AVAILABILITY_MAP = {
    "в наличии": "in_stock",
    "есть в наличии": "in_stock",
    "купить": "in_stock",
    "в корзину": "in_stock",
    "под заказ": "preorder",
    "предзаказ": "preorder",
    "нет в наличии": "out_of_stock",
    "ожидается": "out_of_stock"
}
```

```python
def normalize_availability(text):
    text = normalize_text(text or "")

    for key, value in AVAILABILITY_MAP.items():
        if key in text:
            return value

    return "unknown"
```

Для расчёта цены:

```text
in_stock — брать
unknown — брать с пониженным confidence
preorder — не брать в основную среднюю
out_of_stock — не брать
```

---

## 13. Дедупликация

Дубли появляются часто:

```text
Один товар на разных URL
Один маркетплейс-продавец в нескольких карточках
Один магазин через агрегатор и напрямую
```

### 13.1 Ключ дубля

```python
def offer_fingerprint(offer):
    parts = [
        normalize_text(offer.get("source", "")),
        normalize_text(offer.get("seller_name", "")),
        normalize_text(offer.get("title", "")),
        str(offer.get("price", "")),
    ]

    return "|".join(parts)
```

### 13.2 Более умная дедупликация

Для одного и того же магазина:

```text
same source
same canonical product
same price
similar title > 90%
```

Оставляй одну карточку — самую свежую и с лучшей доступностью.

---

## 14. Оценка доверия к офферу

Каждой карточке давай `confidence`.

```python
SOURCE_WEIGHTS = {
    "large_retail": 1.00,
    "known_specialist": 0.85,
    "marketplace": 0.75,
    "small_shop": 0.60,
    "aggregator": 0.50,
    "classified": 0.20,
    "social": 0.00
}
```

```python
def calculate_confidence(offer):
    confidence = 0

    confidence += SOURCE_WEIGHTS.get(offer["source_type"], 0.5) * 40

    if offer.get("price"):
        confidence += 15

    if offer.get("availability") == "in_stock":
        confidence += 15

    if offer.get("match_status") == "exact":
        confidence += 25
    elif offer.get("match_status") == "probable":
        confidence += 10

    if offer.get("seller_name"):
        confidence += 5

    if offer.get("is_suspicious"):
        confidence -= 40

    return max(0, min(100, confidence))
```

В основную среднюю брать, например:

```python
offer.confidence >= 65
```

---

## 15. Антианомалии по цене

После первичной очистки считаем медиану и выкидываем выбросы.

```python
import statistics

def remove_price_outliers(offers):
    prices = [o["price"] for o in offers if o.get("price")]

    if len(prices) < 5:
        return offers

    median = statistics.median(prices)

    clean = []
    for o in offers:
        price = o["price"]

        if price < median * 0.65:
            o["is_suspicious"] = True
            o.setdefault("suspicious_reasons", []).append("too_cheap")
            continue

        if price > median * 1.8:
            o["is_suspicious"] = True
            o.setdefault("suspicious_reasons", []).append("too_expensive")
            continue

        clean.append(o)

    return clean
```

Для дорогой техники лучше не выкидывать автоматически, а помечать.

Например, iPhone у крупного ритейлера может быть на 30–40% дороже серого рынка. Это не фейк, а другой сегмент.

---

## 16. Сегментация рынка

Очень важно: не мешай разные рынки.

### Для iPhone

```text
eSIM only
SIM + eSIM
официальный/крупный ритейл
серый импорт
маркетплейсы
```

### Для GPU

```text
базовые версии
премиум-версии
3 вентилятора
2 вентилятора
white edition
OC edition
```

### Для CPU

```text
BOX
OEM/TRAY
серый импорт
официальная гарантия
```

### Для SSD

```text
с радиатором
без радиатора
OEM
retail
```

Финальный отчёт должен быть не один:

```text
RTX 4070 Super средняя цена — 68 000 ₽
```

А лучше:

```text
RTX 4070 Super, все новые: 68 000 ₽
Базовые модели: 64 000–67 000 ₽
Премиум OC: 70 000–76 000 ₽
```

---

## 17. Расчёт рыночной цены

Лучшие метрики:

```text
median — основная
trimmed mean — средняя без крайних 10–20%
p25 / p75 — типичный диапазон
min_trusted — минимальная проверенная
max_trusted — верхняя граница у доверенных
```

Пример:

```python
def percentile(values, p):
    values = sorted(values)
    k = (len(values) - 1) * p / 100
    f = int(k)
    c = min(f + 1, len(values) - 1)

    if f == c:
        return values[int(k)]

    return values[f] + (values[c] - values[f]) * (k - f)
```

```python
def calculate_market_price(offers):
    prices = sorted([o["price"] for o in offers if o["confidence"] >= 65])

    if not prices:
        return None

    median = statistics.median(prices)
    p25 = percentile(prices, 25)
    p75 = percentile(prices, 75)

    trimmed = prices
    if len(prices) >= 10:
        cut = max(1, int(len(prices) * 0.1))
        trimmed = prices[cut:-cut]

    avg = round(sum(prices) / len(prices))
    trimmed_avg = round(sum(trimmed) / len(trimmed))

    return {
        "count": len(prices),
        "min": min(prices),
        "max": max(prices),
        "median": round(median),
        "average": avg,
        "trimmed_average": trimmed_avg,
        "p25": round(p25),
        "p75": round(p75)
    }
```

На витрине:

```text
Рыночная цена: median
Типичный диапазон: p25–p75
Самая низкая проверенная: min_trusted
```

---

## 18. Архитектура проекта

```text
price-parser/
  app/
    main.py
    config.py

    sources/
      dns.py
      citilink.py
      mvideo.py
      ozon.py
      wildberries.py
      yandex_market.py
      generic.py

    extractors/
      jsonld.py
      microdata.py
      next_data.py
      dom.py

    matching/
      base.py
      smartphone.py
      gpu.py
      cpu.py
      motherboard.py
      ram.py
      ssd.py
      monitor.py
      psu.py

    normalization/
      text.py
      price.py
      specs.py
      availability.py

    scoring/
      confidence.py
      outliers.py

    storage/
      models.py
      db.py

    jobs/
      crawl_product.py
      update_prices.py

    api/
      routes.py

  tests/
    test_gpu_matching.py
    test_cpu_matching.py
    test_price_parser.py

  docker-compose.yml
  pyproject.toml
```

---

## 19. Минимальный интерфейс источника

```python
from abc import ABC, abstractmethod

class SourceParser(ABC):
    name: str
    domain: str
    source_type: str

    @abstractmethod
    async def search(self, query: str) -> list[str]:
        pass

    @abstractmethod
    async def parse_offer(self, url: str) -> dict:
        pass
```

Пример generic-парсера:

```python
class GenericParser(SourceParser):
    name = "generic"
    source_type = "unknown"

    async def search(self, query: str) -> list[str]:
        return []

    async def parse_offer(self, url: str) -> dict:
        html = await fetch(url)
        products = extract_jsonld_products(html)

        if products:
            return extract_offer_from_jsonld(products[0])

        soup = BeautifulSoup(html, "html.parser")
        return extract_by_selectors(soup, DEFAULT_SELECTORS)
```

---

## 20. Очереди и расписание

Для продакшена лучше так:

```text
FastAPI — API
PostgreSQL — база
Redis — очередь/кэш
Celery / Dramatiq / RQ — фоновые задачи
Playwright workers — тяжёлый браузерный парсинг
Prometheus/Grafana — мониторинг
```

Периодичность:

```text
популярные товары — каждые 1–3 часа
обычные товары — 1–2 раза в день
редкие товары — раз в 2–3 дня
```

---

## 21. Антибан и устойчивость

Нельзя просто долбить магазины.

Нужно:

```text
rate limit на домен
рандомная задержка
кэш HTML
ретраи с backoff
уважать robots.txt
не обходить капчи агрессивно
использовать официальные API и фиды где возможно
```

Пример:

```python
DOMAIN_LIMITS = {
    "dns-shop.ru": {"rps": 0.2},
    "citilink.ru": {"rps": 0.2},
    "wildberries.ru": {"rps": 1.0},
    "ozon.ru": {"rps": 0.2}
}
```

```python
import asyncio
import random

async def polite_delay(domain):
    base_delay = 1 / DOMAIN_LIMITS.get(domain, {"rps": 0.5})["rps"]
    jitter = random.uniform(0.5, 2.0)
    await asyncio.sleep(base_delay + jitter)
```

---

## 22. Что делать с маркетплейсами

Для маркетплейсов обязательно сохранять продавца.

```json
{
  "marketplace": "Ozon",
  "seller_name": "ООО Ромашка",
  "seller_rating": 4.8,
  "reviews_count": 1200,
  "price": 65990,
  "delivery_price": 0
}
```

Фильтр продавца:

```python
def marketplace_seller_ok(offer):
    if offer.get("seller_rating") and offer["seller_rating"] < 4.5:
        return False

    if offer.get("reviews_count") and offer["reviews_count"] < 50:
        return False

    if not offer.get("seller_name"):
        return False

    return True
```

Но для новых товаров отзывов может не быть, поэтому лучше не выкидывать сразу, а снижать confidence.

---

## 23. Региональность

В РФ цена и наличие зависят от города.

Нужно хранить:

```json
{
  "region": "Москва",
  "city": "Москва",
  "delivery_available": true,
  "pickup_available": true
}
```

Для парсера лучше выбрать базовый регион:

```text
Москва
Санкт-Петербург
Россия / доставка по РФ
```

И не смешивать:

```text
Цена в Москве
Цена во Владивостоке
Цена с доставкой из Китая
Цена “только самовывоз”
```

---

## 24. Гарантия и происхождение

Для дорогой техники полезно выделять:

```text
официальная гарантия РФ
гарантия магазина
параллельный импорт
eSIM-only
EU/US/CN версия
OEM
BOX
```

Это не всегда надо для средней цены, но это важно для объяснения разницы.

---

## 25. Пример итогового отчёта

```json
{
  "product": "Apple iPhone 17 Pro Max 256GB Cosmic Orange",
  "region": "RU",
  "parsed_at": "2026-04-29T12:00:00+03:00",
  "offers_total": 42,
  "offers_clean": 17,
  "market_price": {
    "median": 119990,
    "average": 123798,
    "trimmed_average": 121400,
    "p25": 108000,
    "p75": 141999,
    "min_trusted": 103990,
    "max_trusted": 149999
  },
  "segments": {
    "esim": {
      "median": 108500,
      "count": 7
    },
    "sim_esim": {
      "median": 124415,
      "count": 6
    },
    "large_retail": {
      "median": 145999,
      "count": 4
    }
  },
  "sources": [
    {
      "source": "BigGeek",
      "price": 115990,
      "url": "...",
      "confidence": 86
    }
  ]
}
```

---

## 26. MVP: что сделать первым

Не пытайся сразу парсить весь интернет.

### Этап 1

Сделай 5–7 источников:

```text
DNS
Ситилинк
М.Видео
BigGeek
Регард
Ozon
Wildberries
```

Категории:

```text
GPU
CPU
SSD
iPhone
```

Метрики:

```text
median
average
p25/p75
min trusted
```

### Этап 2

Добавь:

```text
материнские платы
RAM
мониторы
PSU
ноутбуки
```

### Этап 3

Добавь:

```text
историю цен
алерты
API
личный кабинет
графики
сравнение регионов
```

---

## 27. Минимальный рабочий алгоритм в псевдокоде

```python
async def parse_market_price(target_product):
    queries = generate_queries(target_product)

    urls = set()

    for source in active_sources:
        for query in queries:
            found_urls = await source.search(query)
            urls.update(found_urls)

    raw_offers = []

    for url in urls:
        source = detect_source(url)
        offer = await source.parse_offer(url)
        offer["url"] = url
        raw_offers.append(offer)

    normalized_offers = []

    for offer in raw_offers:
        offer = normalize_offer(offer)
        score, reasons = match_product(target_product, offer)

        offer["match_score"] = score
        offer["match_reasons"] = reasons

        if score < 70:
            continue

        bad_words = has_bad_words(offer["title"])

        if bad_words:
            offer["is_suspicious"] = True
            offer["suspicious_reasons"] = bad_words
            continue

        if offer["availability"] in ["out_of_stock", "preorder"]:
            continue

        normalized_offers.append(offer)

    deduped = deduplicate_offers(normalized_offers)

    for offer in deduped:
        offer["confidence"] = calculate_confidence(offer)

    trusted = [o for o in deduped if o["confidence"] >= 65]

    clean = remove_price_outliers(trusted)

    result = calculate_market_price(clean)

    save_result(target_product, clean, result)

    return result
```

---

## 28. Главные ошибки, которых надо избегать

```text
1. Считать среднюю по грязной выдаче.
2. Смешивать новые и б/у товары.
3. Смешивать eSIM и SIM+eSIM.
4. Смешивать OEM и BOX.
5. Смешивать RTX 4070, 4070 Super и 4070 Ti Super.
6. Брать карточки “нет в наличии”.
7. Верить только названию товара.
8. Не хранить историю цен.
9. Не хранить URL источника.
10. Не показывать пользователю причины фильтрации.
```

---

## 29. Лучший формат результата для пользователя

```text
Товар: RTX 4070 Super 12GB
Регион: РФ / Москва
Дата: 29.04.2026

Проверено предложений: 58
Прошло фильтр: 21

Медиана: 67 990 ₽
Средняя очищенная: 68 420 ₽
Типичный диапазон: 64 990–71 990 ₽
Минимальная проверенная: 61 990 ₽

Сегменты:
- базовые модели: 63 000–67 000 ₽
- премиум OC: 70 000–77 000 ₽

Исключено:
- 12 карточек аксессуаров
- 7 б/у
- 5 нет в наличии
- 8 неверная модель
- 5 подозрительно низкая цена
```

---

## 30. Самый важный принцип

**Парсер цен — это не парсер HTML. Это система нормализации и сопоставления товаров.**

HTML-парсинг — только способ достать сырьё.

Качество результата определяют:

```text
нормализация
matching
фильтрация
дедупликация
оценка доверия
сегментация
история цен
```

Для техники и комплектующих ПК без этого средняя цена почти всегда будет неправильной.
