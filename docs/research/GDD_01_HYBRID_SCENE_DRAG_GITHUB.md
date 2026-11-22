# GDD-01: FORMAT-002 C + SCENE-002 C + DRAG-001 C — GitHub research
Дата: 2026-11-22. Статус: TECH APPROVAL PENDING. Ничего не интегрировано.

## Утверждённые требования
- FORMAT-002 C: общая 2.5D сцена, 2D-плоскости с глубиной/параллаксом, 3D объекты, перспектива и камера.
- SCENE-002 C: пустая сцена или готовый шаблон; замена фона; добавление объектов; сохранение своего шаблона.
- DRAG-001 C: перетаскивание из библиотеки, автоматическая глубина, точные X/Y/Z, поворот, масштаб и порядок слоёв.
- Не менять существующие проекты/экспорт без миграции и тестов; GDD-02 запрещён до общей приёмки GDD-01.

## Фактическая база Lunex
- `integration/src/AssetLibrary.tsx`: 12 заготовок; вставка через `addLayer` по нажатию; ещё нет настоящего drag-to-canvas. 2D shape/text и 3D mesh создаются через существующие фабрики.
- `integration/apply.mjs`: адаптация существующего редактора MyMotionStudio; 3D canvas + 2D overlay, экспорт смешанных сцен, отдельные простой/профессиональный режимы.
- Существующие React/Zustand/Three/Konva позволяют начать без замены всего редактора. Но единая модель глубины, picking и экспортное соответствие пока требуют разработки.

## GitHub-кандидаты
1. **konvajs/konva + konvajs/react-konva** — https://github.com/konvajs/konva и https://github.com/konvajs/react-konva
   - MIT; активно развиваемые; 2D drag events, shapes, Transformer, layers.
   - Роль: 2D редактор, перемещение/масштабирование плоских объектов, фоновые слои.
   - Риск: отдельная Konva-сцена не знает 3D глубину и occlusion; нужна явная синхронизация. Версию react-konva необходимо закреплять под установленную версию React.
2. **pmndrs/react-three-fiber + pmndrs/drei** — https://github.com/pmndrs/react-three-fiber и https://github.com/pmndrs/drei
   - MIT; активные проекты; Drei предоставляет DragControls, TransformControls, PivotControls и камеры.
   - Роль: 3D picking, gizmo, camera, глубина, world-space planes.
   - Риск: миграция текущего Three renderer на React Three Fiber может затронуть таймлайн, WebGL, compositing и серверный экспорт; не оправдана только ради gizmo.
3. **clauderic/dnd-kit** — https://github.com/clauderic/dnd-kit
   - MIT; активная React drag-and-drop система для DOM.
   - Роль: перемещение карточки из asset library к drop target; keyboard accessibility.
   - Риск: DOM pointer coordinates надо преобразовать в canvas/world coordinates; drag на WebGL/Canvas и работа с camera raycast не предоставляются автоматически.
4. **Собственная адаптация существующего редактора** — не сторонний репозиторий; уже имеющиеся React, Zustand, Three, Konva.
   - Роль: unified scene schema, HTML pointer drag from library, 2D/3D coordinate projection, depth ordering, template JSON.
   - Риск: ответственность за математику, hit-testing, сериализацию и регрессионные тесты остаётся у Lunex.

## Предлагаемая модель (проектное предложение, ещё не утверждена)
- Единый объект `SceneObject`: id, kind (2d/3d), assetRef, transform (x,y,z, rotation, scale), depthMode (auto/manual), order, animation tracks. Переход от существующих типов только через обратимо совместимую миграцию.
- При drop 2D: экранная позиция -> координаты сцены, z выбирается по активной глубинной плоскости; для 3D: raycast из камеры на рабочую плоскость, z по точке пересечения. 2D-спрайты в 3D могут потребовать world-space плоскостей; простое наложение canvas не гарантирует корректное взаимное перекрытие.
- Параллакс привязывается к глубине и камере; камера влияет на превью и рендер одинаково.
- Шаблон хранит схему сцены + ссылки на ассеты + превью + версию формата, без копирования тяжёлых бинарных данных в каждый проект.
- Drag preview, snap/grid по выбору, undo/redo одной операцией, drop отменяется вне сцены.
- Тесты: 2D/3D/mixed drop, X/Y/Z, depth occlusion, parallax camera, шаблон save/reopen, обратная совместимость, WebM/MP4 frame parity.

## Варианты TECH-HYBRID-001 (отдельное утверждение)
- **A — рекомендовано: адаптировать текущий стек**. Existing React/Zustand/Three/Konva, собственный drag coordinator и схема глубины; без новых библиотек. Постепенно: schema+compatibility -> drag -> 2.5D planes/parallax -> templates -> E2E/render.
- **B — умеренный гибрид**. A + dnd-kit только для DOM-библиотеки и drag preview; 3D world placement и schema остаются собственными. Больше зависимостей, но удобнее взаимодействие.
- **C — перестройка 3D слоя**. React Three Fiber + Drei gizmos + dnd-kit, оставив Konva для 2D. Максимум готовых controls, но большой риск переделки и экспорта.

## Рекомендация
TECH-HYBRID-001 **A**: не ломать существующий рабочий редактор и экспорт. Зафиксировать контрольные E2E до начала миграции. Обязательно отдельное согласование владельца. Ничего не внедрять по этому исследованию без TECH APPROVAL.

Источники: https://github.com/konvajs/konva ; https://github.com/konvajs/react-konva ; https://github.com/pmndrs/react-three-fiber ; https://github.com/pmndrs/drei ; https://github.com/clauderic/dnd-kit .
