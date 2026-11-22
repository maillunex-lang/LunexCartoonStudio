# GDD-01 / EDITOR-002 A — GitHub research и TECH APPROVAL (2026-11-22)

## Канон
EDITOR-001 B + EDITOR-002 A: два режима, переключатель сверху, единая сцена и данные. DEVICE-001 A: полноценный редактор только на ПК. Исследование не разрешает интеграцию; GDD-01 IN PROGRESS.

## Фактическая база
VPS upstream EditorPage.tsx: React useState, Zustand useEditorStore, Dexie db, EditorToolbar, LeftToolbar2D/3D, AssetLibrary, Canvas2D/3D + HybridOverlay2D, Timeline, RightPanels. В package.json уже есть zustand ^5.0.14, react-resizable-panels не заявлен, Radix не заявлен. Текущая компоновка содержит верхний EditorToolbar, центральный canvas, боковые панели и таймлайн.

## GitHub кандидаты (исследованы, НЕ внедрены)
1. **pmndrs/zustand** — https://github.com/pmndrs/zustand, MIT, активный React store; уже используется. Использовать отдельный UI-only state (simple/pro) и persist для пользовательского выбора. Не сохранять/не переписывать проектную модель ради переключателя. Риски: миграция сохранённых UI-настроек, случайное попадание режима в историю undo/redo. Источник: https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md.
2. **radix-ui/primitives** — https://github.com/radix-ui/primitives, MIT, доступный Toggle Group (keyboard navigation/ARIA). Кандидат для переключателя в toolbar, но добавляет зависимость и вес; текущие кнопки можно сделать доступными без него. Источники: https://github.com/radix-ui/primitives и https://www.radix-ui.com/primitives/docs/components/toggle-group.
3. **bvaughn/react-resizable-panels** — https://github.com/bvaughn/react-resizable-panels, MIT, React resizable layout; пригодится позднее для настраиваемых профессиональных панелей, но не обязателен для EDITOR-002. Риски: переработка текущего flex-layout, размеры/сохранение/вложенные скроллы. Источник: https://github.com/bvaughn/react-resizable-panels.

## Варианты отдельного технического утверждения
- **TECH-EDITOR-002 A (рекомендовано)**: без новых зависимостей. Адаптировать текущий EditorPage + EditorToolbar, UI-only Zustand state или локальный React state с отдельным localStorage preference; в простом режиме оставить canvas, библиотеку, выбор сцены, Play, базовые операции и Export; скрыть расширенный инспектор/панели, сократить таймлайн до простых действий. В профессиональном режиме сохранить существующий интерфейс. Переключение не вызывает setProject, не мутирует сцены, не создаёт историю undo. Отдельные E2E: mode toggle, save/reopen, no data loss, 2D/3D/mixed, export. Риск: необходимо аккуратно выбрать минимальные панели и избежать layout regression.
- **TECH-EDITOR-002 B**: A + Radix Toggle Group. Плюсы доступность и клавиатура; минусы новая зависимость и потенциальное увеличение бандла.
- **TECH-EDITOR-002 C**: B + react-resizable-panels с сохранением layouts. Плюсы настраиваемый профессиональный workspace; минусы больший объём изменений и регрессий, не требуется текущим решением.

## Рекомендация
**A**: опираться на существующие React/Zustand и UI. Никаких новых библиотек, отдельное хранение UI-предпочтения; одна модель сцены. Radix и resizable-panels отложить до отдельного согласования. Прежде чем писать код, получить явное утверждение TECH-EDITOR-002 A/B/C.

## Проверки после разрешения
1. Кнопка в верхнем toolbar, русские подписи и aria-label, работа с клавиатуры.
2. Простое представление: сцена, библиотека, базовое управление, воспроизведение, экспорт.
3. Профессиональное: текущие слои, свойства, keyframes, timeline.
4. Тест на сохранение/переключение/повторное открытие одного проекта, одинаковые scene/layers/keyframes до и после.
5. Проверка 2D, 3D и mixed, без регрессии серверного MP4.
6. Сборка/typecheck, Playwright E2E, публикация только после тестов.
