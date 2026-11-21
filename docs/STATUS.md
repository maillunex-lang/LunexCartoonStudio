# Статус Lunex Cartoon Studio v2

- GDD-01: функции утверждены (8/8), DEMO-001 C остаётся обязательным.
- TECH-001: вариант A утверждён, MyMotionStudio + адаптация смешанных сцен.
- Upstream проверен на VPS: commit 161414bc8e7ed45f5fc3e7a278d1759e243e33f4; typecheck PASS, 89/89 upstream tests PASS, build PASS.
- Первый собственный PoC: `poc/src/hybrid-scene.mjs`, JSON mixed 2D/3D contract; 5/5 тестов PASS на VPS.
- Риски: npm engine warning, несовпадение package-lock version, крупный JS bundle, отсутствие браузерного mixed scene и длинного экспорта, неполный security/license audit.
- Реальная интеграция редактора и браузерная демонстрация: **ещё не завершены**.
- Полноценный конструктор и экспорт длинных мультфильмов: **не реализованы**.
- Текущий этап: GDD-01 IN PROGRESS, 0/10 этапов принято владельцем. GDD-02 не начинать.
- Отчёт: docs/research/GDD_01_POC_01.md.

## Технический рубеж 02 (2026-11-22)
- Создан браузерный прототип `poc/hybrid-browser` с Konva (2D фон) и Three.js (3D персонаж) в одном viewport, Play/Pause, JSON download/upload.
- Vite production build: PASS, 66 modules, JS ~706 kB / gzip ~186 kB; предупреждение о крупном чанке.
- Контрактные тесты: 5/5 PASS.
- HTTP smoke: localhost:4179 вернул 200; Chromium headless загрузил HTML. **Визуальная корректность WebGL и интерактивность не подтверждены**: snap Chromium сообщил предупреждение software WebGL.
- Это отдельный PoC, а не интеграция в MyMotionStudio. UI редактора, реальные GLB/2D ассеты, keyframes, автосохранение, версии, серверный экспорт длинного видео ещё не реализованы.
- Публичный сайт не развёрнут, существующие сервисы VPS не изменены.

## Технический рубеж 03: таймлайн в browser PoC
- Добавлены 10-секундный keyframe timeline, seek/scrub, Play/Pause, добавление/замена ключевых кадров позиции Y и поворота, интерполяция, localStorage autosave, JSON export/import с анимацией.
- Реализация: `poc/hybrid-browser/src/main.js` и `index.html`.
- Проверки на VPS: Vite production build PASS (66 modules, JS ~708 kB), schema unit tests 5/5 PASS.
- **Не подтверждены** полноценные browser interaction tests и экспорт видео; сохранение пока localStorage, не проектная облачная система. В MyMotionStudio изменения пока не перенесены.
- GDD-01 IN PROGRESS; DEMO-001 C не достигнут, GDD-02 не начинать.

## Рубеж 04: интеграционный срез MyMotionStudio (2026-11-22)
- Реализован воспроизводимый адаптер `integration/apply.mjs` для upstream commit `161414bc8e7ed45f5fc3e7a278d1759e243e33f4`.
- `integration/src/HybridOverlay2D.tsx`: 2D Konva overlay поверх 3D R3F viewport в существующем EditorPage. Добавление 2D-спрайта через кнопку, анимация X через `currentTime` существующего таймлайна, сохранение `scene.lunex2d` через `updateScene` существующего Zustand/IndexedDB autosave и JSON проекта.
- На VPS патч применён к изолированной копии MyMotionStudio; typecheck PASS, upstream tests 89/89 PASS, production build PASS, HTTP 200.
- Ограничения: браузерный визуальный и интерактивный тест не проведён; 2D-слои не встроены в штатный инспектор/редактор keyframes; нет полноценной глубинной сортировки, drag/drop и mixed-video compositing. Сохранение на уровне проекта интегрировано в существующий механизм, но round-trip смешанной сцены через UI ещё не протестирован.
- **Экспорт длинного видео не реализован**. GDD-01 IN PROGRESS, DEMO-001 C не достигнут. GDD-02 не начинать.
