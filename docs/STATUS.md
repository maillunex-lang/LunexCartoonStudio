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

## Рубеж 05: штатная панель слоёв и смешанный экспорт (2026-11-22)
- В `integration/src/HybridOverlay2D.tsx` добавлена `HybridLayersPanel`: 2D-объекты видны в штатной вкладке Layers существующего редактора, доступны добавление/удаление; 3D-слои остаются в стандартном списке.
- В `integration/apply.mjs` добавлено внедрение панели и композиция Konva overlay canvas поверх Three canvas для каждого кадра штатного экспортера GIF/MediaRecorder. Воспроизводимый патч применён на VPS.
- На VPS: TypeScript PASS, upstream tests 89/89 PASS, Vite build PASS.
- Сохранение использует существующий `updateScene` и IndexedDB; **специальный браузерный тест save/reopen для смешанной сцены пока не выполнен**.
- Экспортный путь в коде подключён, но **фактический смешанный видеофайл ещё не создан и не проверен**. Не заявлять готовность экспорта MP4/WebM/GIF или длинного видео до end-to-end тестов.
- Слои пока представлены двумя секциями одной вкладки, а не единой сортируемой моделью; полноценные свойства, keyframes и межслойная глубина ещё в работе.
- GDD-01 IN PROGRESS, DEMO-001 C не выполнен, GDD-02 не начинать.

## Рубеж 06: браузерный E2E (2026-11-22)
- Chromium Playwright (VPS) успешно прошёл один end-to-end сценарий: открыть тестовый 3D-проект, добавить 2D-объект через UI, дождаться IndexedDB autosave (1 объект), перезагрузить страницу, убедиться в наличии восстановленного 2D-объекта/канваса (1), без JS pageerrors.
- Обнаружен и исправлен дублирующийся `HybridOverlay2D` после повторного применения integration/apply.mjs; патч теперь удаляет повторы. Проверка: ровно 1 overlay в EditorPage.
- Повторный расширенный E2E с попыткой WebM не завершился: браузерный скрипт завис на открытии IndexedDB и был остановлен по timeout. **Реальный смешанный видеофайл НЕ создан и НЕ проверен**. Требуется устранить зависание тестового сценария и выполнить end-to-end экспорт + декодирование.
- После исправления патча: TypeScript PASS, 89/89 unit tests PASS, Vite build PASS.
- ffmpeg как системная команда на VPS отсутствует; обнаружен вспомогательный ffmpeg в кэше Playwright, но это не production video pipeline.
- GDD-01 остаётся IN PROGRESS, DEMO-001 C не достигнут, GDD-02 не начинать.

## Рубеж 07: исправлен E2E, смешанный WebM подтверждён, long-render PoC начат
- Повторяемый Chromium Playwright E2E в `integration/e2e/mixed-export.cjs` прошёл: проект с зелёным 3D-кубом, оранжевый 2D-объект через UI, IndexedDB autosave 1/1, reload 1/1, экспорт WebM 37,365 байт, pageerrors 0.
- Декодирование VP8 WebM 853×480: 44 исходных кадра, проверены первый/средний/последний, оба слоя подтверждены пиксельными проверками. `integration/e2e/check_decoded_frames.py` PASS.
- Причина зависания предыдущего теста: неверное прямое обращение к IndexedDB; заменено на штатный Dexie API приложения с таймаутами.
- Длинный экспорт: `integration/long-render/manifest.mjs` и 4/4 тестов PASS (включая план 60 минут 30fps, 108000 кадров). **Это только планировщик сегментов, не рендер-воркер и не готовый экспорт длинного видео**.
- Детали и воспроизведение: `docs/research/GDD_01_MILESTONE_07.md`.
- GDD-01 IN PROGRESS; DEMO-001 C не принят; GDD-02 не начинать.

## GDD-01 рубеж 08: FFmpeg H.264 + серверный Chromium воркер, первый MP4 PASS
- VPS Lunex Ubuntu 26.04: системный FFmpeg 8.0.1, libx264 и ffprobe установлены и проверены.
- `integration/long-render/worker.mjs`: первый CLI PoC, Chromium Playwright управляет временем в Zustand, берёт 3D canvas + Konva 2D canvas, передаёт PNG кадры через stdin в FFmpeg libx264. Тестовая сцена создаётся в Dexie. Не считать готовым универсальным воркером.
- 640×360, 30fps, 1.000 секунды, 30/30 кадров, H.264 MP4, 18,360 байт: ffprobe PASS; FFmpeg декодировал 30 кадров; в первом, среднем и последнем есть зелёный 3D-куб и оранжевый 2D-объект.
- 1920×1080, 30fps, 0.200 секунды, 6/6 кадров, H.264 MP4, 19,557 байт: ffprobe PASS. Это проверка разрешения, не длительности.
- Оба MP4 пока лежат на VPS: `/tmp/lunex-server-test.mp4` и `/tmp/lunex-server-1080p-test.mp4`. Не утверждать, что они опубликованы для скачивания.
- Ограничения: нет очереди, API, изоляции задания, пользовательского импорта проектов, сегментного объединения, восстановления, прогресса в UI, контроля квот, 30-секундного и 5-минутного E2E. Вывод видео из демонстрационной сцены подтверждён, готовность DEMO-001 C ещё нет.
- GDD-01 IN PROGRESS, GDD-02 не начинать.
