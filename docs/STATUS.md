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
