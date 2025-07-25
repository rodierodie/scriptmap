/**
 * UI Module v2.0 - Управление пользовательским интерфейсом с поддержкой вкладок
 * Обновлено: убрана логика управления темами (вынесена в ThemeManager)
 * ИЗМЕНЕНО: Темная тема по умолчанию
 */

// ThemeManager будет создаваться динамически для избежания конфликтов импорта
export class UIModule {
    constructor(state, events) {
        this.state = state;
        this.events = events;
        this.version = '2.0';
        
        // Найти элементы UI
        this.elements = {
            infoBtn: null,
            instructions: null,
            addNoteBtn: null
        };
        
        // Создать менеджер тем динамически
        this.themeManager = this.createThemeManager(state, events);
        
        this.init();
    }

    /**
     * Создать менеджер тем
     * @param {Object} state - Состояние приложения
     * @param {Object} events - Система событий
     * @returns {Object} - Менеджер тем
     */
    createThemeManager(state, events) {
        // Простой менеджер тем встроенный в UI модуль
        return {
            currentTheme: 'dark', // ИЗМЕНЕНО: темная тема по умолчанию
            
            init() {
                this.loadThemeFromStorage();
                this.applyTheme(this.currentTheme);
            },
            
            loadThemeFromStorage() {
                try {
                    const savedTheme = localStorage.getItem('notes-app-theme');
                    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
                        this.currentTheme = savedTheme;
                    } else {
                        // ИЗМЕНЕНО: если нет сохраненной темы, используем темную по умолчанию
                        this.currentTheme = 'dark';
                    }
                } catch (error) {
                    console.warn('Could not load theme from localStorage:', error);
                    this.currentTheme = 'dark'; // ИЗМЕНЕНО: fallback на темную тему
                }
            },
            
            setTheme(theme) {
                if (!['light', 'dark'].includes(theme)) return;
                
                this.currentTheme = theme;
                this.applyTheme(theme);
                this.saveThemeToStorage(theme);
                
                events.emit('theme:changed', theme);
            },
            
            toggleTheme() {
                const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
                this.setTheme(newTheme);
            },
            
            applyTheme(theme) {
                document.body.removeAttribute('data-theme');
                if (theme !== 'light') {
                    document.body.setAttribute('data-theme', theme);
                }
            },
            
            saveThemeToStorage(theme) {
                try {
                    localStorage.setItem('notes-app-theme', theme);
                } catch (error) {
                    console.warn('Could not save theme to localStorage:', error);
                }
            },
            
            getCurrentTheme() {
                return this.currentTheme;
            },
            
            createThemeToggle(container) {
                const toggle = document.createElement('button');
                toggle.className = 'theme-toggle btn btn-sm';
                toggle.style.cssText = `
                    margin-left: var(--spacing-sm);
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-medium);
                    color: var(--text-secondary);
                    font-size: var(--font-lg);
                    min-width: 40px;
                    height: 36px;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: var(--transition-all);
                `;
                
                const updateToggle = () => {
                    toggle.innerHTML = this.currentTheme === 'light' ? '🌙' : '☀️';
                    toggle.title = `Переключить на ${this.currentTheme === 'light' ? 'темную' : 'светлую'} тему`;
                };
                
                toggle.addEventListener('click', () => {
                    this.toggleTheme();
                });
                
                toggle.addEventListener('mouseenter', () => {
                    toggle.style.background = 'var(--color-primary-light)';
                    toggle.style.borderColor = 'var(--color-primary)';
                    toggle.style.color = 'var(--color-primary)';
                });
                
                toggle.addEventListener('mouseleave', () => {
                    toggle.style.background = 'var(--bg-secondary)';
                    toggle.style.borderColor = 'var(--border-medium)';
                    toggle.style.color = 'var(--text-secondary)';
                });
                
                // Обновлять при изменении темы
                events.on('theme:changed', updateToggle);
                
                updateToggle();
                container.appendChild(toggle);
                
                return toggle;
            },
            
            getStats() {
                return {
                    currentTheme: this.currentTheme,
                    availableThemes: 2
                };
            },
            
            destroy() {
                // Cleanup если нужно
            }
        };
    }

    /**
     * Инициализация модуля
     */
    init() {
        this.createUIElements();
        this.validateElements();
        this.setupEventListeners();
        this.setupStateWatchers();
        this.setupKeyboardShortcuts();
        
        // Инициализировать менеджер тем
        this.themeManager.init();
        
        console.log('🎛️ UI module v2.0 initialized');
    }

    /**
     * Создать элементы UI
     */
    createUIElements() {
        // Создать кнопку информации (теперь в левом нижнем углу)
        this.elements.infoBtn = document.createElement('button');
        this.elements.infoBtn.className = 'info-btn';
        this.elements.infoBtn.title = 'Показать/скрыть инструкции';
        this.elements.infoBtn.innerHTML = 'ℹ';
        document.body.appendChild(this.elements.infoBtn);

        // Создать панель инструкций (теперь внизу слева)
        this.elements.instructions = document.createElement('div');
        this.elements.instructions.className = 'instructions hidden';
        this.elements.instructions.innerHTML = `
            <strong>🎯 Система ролей v2.0:</strong> Ctrl+1 = Основное дерево • Ctrl+2,3,4 = Роли • Ctrl+T = новая роль<br>
            <strong>🔗 Связи:</strong> Ctrl+C = создать связь между блоками • Наведите на линию для удаления<br>
            <strong>📝 Блоки:</strong> Пробел + мышь = перемещение холста • Двойной клик = новый блок • "Открыть" для редактирования<br>
            <strong>⌨️ Горячие клавиши:</strong> Ctrl+E = экспорт • Ctrl+R = статистика • ? = показать/скрыть помощь<br>
            <strong>🎨 Тема:</strong> Кнопка в заголовке или Ctrl+Shift+T = переключить тему
        `;
        document.body.appendChild(this.elements.instructions);

        // Создать кнопку добавления
        this.elements.addNoteBtn = document.createElement('button');
        this.elements.addNoteBtn.className = 'add-note-btn';
        this.elements.addNoteBtn.id = 'addBtn';
        this.elements.addNoteBtn.title = 'Добавить элемент';
        this.elements.addNoteBtn.innerHTML = '+';
        document.body.appendChild(this.elements.addNoteBtn);
    }

    /**
     * Проверка наличия необходимых элементов
     */
    validateElements() {
        const missing = Object.entries(this.elements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);
            
        if (missing.length > 0) {
            console.warn(`⚠️ UI elements could not be created: ${missing.join(', ')}`);
        }
    }

    /**
     * Настройка слушателей событий
     */
    setupEventListeners() {
        // Кнопка информации
        if (this.elements.infoBtn) {
            this.elements.infoBtn.addEventListener('click', () => {
                this.toggleInstructions();
            });
        }

        // Кнопка добавления с контекстным поведением
        if (this.elements.addNoteBtn) {
            this.elements.addNoteBtn.addEventListener('click', () => {
                this.handleAddRequest();
            });
        }

        // Клик по инструкциям для их скрытия
        if (this.elements.instructions) {
            this.elements.instructions.addEventListener('click', () => {
                this.hideInstructions();
            });
        }

        // Клик вне инструкций для их скрытия
        document.addEventListener('click', (e) => {
            if (this.state.get('ui.instructionsVisible') && 
                this.elements.instructions &&
                this.elements.infoBtn &&
                !this.elements.instructions.contains(e.target) &&
                !this.elements.infoBtn.contains(e.target)) {
                this.hideInstructions();
            }
        });

        // События от системы вкладок
        this.events.on('tab:context-changed', (context) => {
            this.handleTabContextChange(context);
        });

        // События уведомлений от других модулей
        this.events.on('ui:show-notification', (data) => {
            this.showNotification(data.message, data.type, data.duration);
        });

        // События запросов на добавление из других модулей
        this.events.on('ui:add-reference-request', () => {
            // Запрос на открытие палитры для ролей
            this.events.emit('palette:open-request');
        });
    }

    /**
     * Обработка смены контекста вкладки
     * @param {Object} context - Контекст вкладки
     */
    handleTabContextChange(context) {
        this.updateAddButton(context);
        this.updateInstructions(context);
    }

    /**
     * Обновить кнопку добавления в зависимости от контекста
     * @param {Object} context - Контекст вкладки
     */
    updateAddButton(context) {
        if (!this.elements.addNoteBtn) return;

        if (context.isMainTree) {
            // В основном дереве - создание блоков
            this.elements.addNoteBtn.title = 'Создать новый блок (Ctrl+N)';
            this.elements.addNoteBtn.classList.remove('palette-mode');
        } else {
            // В ролях - добавление ссылок через палитру
            this.elements.addNoteBtn.title = `Добавить блок в роль "${context.role?.name || 'роль'}"`;
            this.elements.addNoteBtn.classList.add('palette-mode');
        }
    }

    /**
     * Обновить инструкции в зависимости от контекста
     * @param {Object} context - Контекст вкладки
     */
    updateInstructions(context) {
        if (!this.elements.instructions) return;

        let instructionsHTML;
        
        if (context.isMainTree) {
            instructionsHTML = `
                <strong>🌳 Основное дерево:</strong> Создание и редактирование всех блоков<br>
                <strong>🔗 Связи:</strong> Ctrl+C = создать связь между блоками • Наведите на линию для удаления<br>
                <strong>📝 Блоки:</strong> Пробел + мышь = перемещение • Двойной клик = новый блок • + = создать блок<br>
                <strong>⌨️ Роли:</strong> Ctrl+2,3,4 = переключение ролей • Ctrl+T = новая роль<br>
                <strong>🎨 Тема:</strong> Кнопка в заголовке или Ctrl+Shift+T = переключить тему
            `;
        } else {
            instructionsHTML = `
                <strong>👤 Роль "${context.role?.name || 'роль'}":</strong> Компоновка блоков для конкретных пользователей<br>
                <strong>🎨 Палитра:</strong> + = открыть палитру блоков • Выберите блоки из основного дерева<br>
                <strong>🔗 Ссылки:</strong> Связи между блоками видны во всех ролях<br>
                <strong>⌨️ Навигация:</strong> Ctrl+1 = основное дерево • Ctrl+T = новая роль<br>
                <strong>🎨 Тема:</strong> Кнопка в заголовке или Ctrl+Shift+T = переключить тему
            `;
        }
        
        this.elements.instructions.innerHTML = instructionsHTML;
    }

    /**
     * Обработка запроса на добавление
     */
    handleAddRequest() {
        this.events.emit('ui:add-request');
    }

    /**
     * Настройка отслеживания изменений состояния
     */
    setupStateWatchers() {
        // Отслеживание видимости инструкций
        this.state.watch('ui.instructionsVisible', (visible) => {
            this.updateInstructionsVisibility(visible);
        });

        // Отслеживание активной вкладки для обновления UI
        this.state.watch('ui.activeTab', (newTab) => {
            this.updateUIForTab(newTab);
        });

        // Отслеживание изменений блоков для счетчиков
        this.state.watch('blocks', () => this.updateNotesCount());
    }

    /**
     * Обновить UI для активной вкладки
     * @param {string} tabId - ID активной вкладки
     */
    updateUIForTab(tabId) {
        const isMainTree = tabId === 'main';
        
        // Обновить состояние кнопки добавления
        if (this.elements.addNoteBtn) {
            if (isMainTree) {
                this.elements.addNoteBtn.classList.remove('palette-mode');
                this.elements.addNoteBtn.title = 'Создать новый блок';
            } else {
                this.elements.addNoteBtn.classList.add('palette-mode');
                const role = this.state.get(`roles.${tabId}`);
                this.elements.addNoteBtn.title = `Добавить в роль "${role?.name || 'роль'}"`;
            }
        }
    }

    /**
     * Настройка горячих клавиш
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Не обрабатывать если открыто модальное окно
            if (document.querySelector('.modal-overlay, .role-modal-overlay.visible')) {
                return;
            }

            // Игнорировать если фокус в textarea или input
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

            switch (e.key) {
                case '?':
                    e.preventDefault();
                    this.toggleInstructions();
                    break;
                    
                case 'n':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.handleAddRequest();
                    }
                    break;
                    
                case 'h':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.centerCanvas();
                    }
                    break;
                    
                case 'Escape':
                    if (this.state.get('ui.instructionsVisible')) {
                        this.hideInstructions();
                    }
                    break;

                case 's':
                    if (e.ctrlKey && e.shiftKey) {
                        e.preventDefault();
                        this.showConnectionsStats();
                    }
                    break;

                case 't':
                    if (e.ctrlKey && e.shiftKey) {
                        e.preventDefault();
                        this.themeManager.toggleTheme();
                    }
                    break;
            }
        });
    }

    /**
     * Переключить видимость инструкций
     */
    toggleInstructions() {
        const currentlyVisible = this.state.get('ui.instructionsVisible');
        this.state.set('ui.instructionsVisible', !currentlyVisible);
        
        this.events.emit('ui:instructions-toggled', !currentlyVisible);
    }

    /**
     * Показать инструкции
     */
    showInstructions() {
        this.state.set('ui.instructionsVisible', true);
        this.events.emit('ui:instructions-shown');
    }

    /**
     * Скрыть инструкции
     */
    hideInstructions() {
        this.state.set('ui.instructionsVisible', false);
        this.events.emit('ui:instructions-hidden');
    }

    /**
     * Обновить видимость инструкций в DOM
     * @param {boolean} visible - Видимость
     */
    updateInstructionsVisibility(visible) {
        if (!this.elements.instructions || !this.elements.infoBtn) return;

        if (visible) {
            this.elements.instructions.classList.remove('hidden');
            this.elements.infoBtn.classList.add('hidden');
            this.elements.infoBtn.setAttribute('aria-expanded', 'true');
        } else {
            this.elements.instructions.classList.add('hidden');
            this.elements.infoBtn.classList.remove('hidden');
            this.elements.infoBtn.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * Центрировать холст
     */
    centerCanvas() {
        this.events.emit('canvas:center-request');
    }

    /**
     * Показать статистику связей
     */
    showConnectionsStats() {
        // Получить статистику от модуля связей
        this.events.emit('connections:stats-request');
        
        // Если модуль связей не отвечает, показать общую статистику
        setTimeout(() => {
            const blocks = this.state.get('blocks');
            const roles = this.state.get('roles');
            const connections = this.state.get('connections');
            
            const totalReferences = Object.values(roles).reduce(
                (sum, role) => sum + (role.references?.length || 0), 0
            );
            
            const message = [
                `📊 Статистика Notes App v2.0:`,
                ``,
                `🧱 Блоки: ${blocks.length}`,
                `👥 Роли: ${Object.keys(roles).length}`,
                `📎 Ссылки: ${totalReferences}`,
                `🔗 Связи: ${connections.length}`,
                `🎨 Тема: ${this.themeManager.getCurrentTheme()}`,
                ``,
                `💡 Ctrl+R = полная статистика приложения`
            ].join('\n');
            
            alert(message);
        }, 100);
    }

    /**
     * Показать уведомление
     * @param {string} message - Текст уведомления
     * @param {string} type - Тип уведомления ('info', 'success', 'warning', 'error')
     * @param {number} duration - Длительность показа в мс
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Удалить существующие уведомления того же типа
        document.querySelectorAll(`.notification-${type}`).forEach(notification => {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Добавить иконку в зависимости от типа
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        notification.innerHTML = `${icons[type] || ''} ${message}`;
        
        document.body.appendChild(notification);
        
        // Автоматическое удаление
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
        
        this.events.emit('ui:notification-shown', { message, type, duration });
    }

    /**
     * Показать диалог подтверждения
     * @param {string} message - Сообщение
     * @param {function} onConfirm - Callback при подтверждении
     * @param {function} onCancel - Callback при отмене
     */
    showConfirmDialog(message, onConfirm, onCancel) {
        const result = confirm(message);
        if (result && onConfirm) {
            onConfirm();
        } else if (!result && onCancel) {
            onCancel();
        }
        
        this.events.emit('ui:confirm-dialog-shown', { message, result });
        return result;
    }

    /**
     * Обновить счетчик заметок/блоков
     * @param {number} count - Количество блоков (опционально)
     */
    updateNotesCount(count = null) {
        if (count === null) {
            count = this.state.get('blocks').length;
        }

        // Обновить title страницы
        const activeTab = this.state.get('ui.activeTab');
        let titleSuffix = '';
        
        if (activeTab === 'main') {
            titleSuffix = count > 0 ? ` (${count} блоков)` : '';
        } else {
            const role = this.state.get(`roles.${activeTab}`);
            const referencesCount = role?.references?.length || 0;
            titleSuffix = ` - ${role?.name || 'Роль'} (${referencesCount} ссылок)`;
        }
        
        document.title = `Notes App v2.0${titleSuffix}`;
        
        this.events.emit('ui:notes-count-updated', count);
    }

    /**
     * Показать статистику приложения v2.0
     */
    showStats() {
        const blocks = this.state.get('blocks');
        const roles = this.state.get('roles');
        const connections = this.state.get('connections');
        
        const totalReferences = Object.values(roles).reduce(
            (sum, role) => sum + (role.references?.length || 0), 0
        );
        
        const totalCharacters = blocks.reduce((sum, block) => sum + (block.content?.length || 0), 0);
        const totalWords = blocks.reduce((sum, block) => {
            return sum + (block.content?.trim().split(/\s+/).filter(word => word.length > 0).length || 0);
        }, 0);
        
        const customRoles = Object.values(roles).filter(role => !role.isDefault).length;
        
        const stats = [
            `📊 Статистика Notes App v2.0:`,
            ``,
            `🧱 Блоки: ${blocks.length}`,
            `👥 Роли: ${Object.keys(roles).length} (${customRoles} пользовательских)`,
            `📎 Ссылки: ${totalReferences}`,
            `🔗 Связи: ${connections.length}`,
            ``,
            `📊 Содержимое:`,
            `• Символов: ${totalCharacters}`,
            `• Слов: ${totalWords}`,
            `• Средняя длина блока: ${blocks.length > 0 ? Math.round(totalCharacters / blocks.length) : 0} символов`,
            ``,
            `🎨 Тема: ${this.themeManager.getCurrentTheme()}`,
            ``,
            `⌨️ Горячие клавиши:`,
            `• Ctrl+E = экспорт данных`,
            `• Ctrl+T = новая роль`,
            `• Ctrl+Shift+T = переключить тему`,
            `• Ctrl+1,2,3,4 = переключение вкладок`
        ].join('\n');
        
        alert(stats);
        
        this.events.emit('ui:stats-shown', { 
            blocks: blocks.length, 
            roles: Object.keys(roles).length,
            customRoles,
            references: totalReferences,
            connections: connections.length,
            characters: totalCharacters, 
            words: totalWords,
            theme: this.themeManager.getCurrentTheme()
        });
    }

    /**
     * Создать переключатель темы в контейнере
     * @param {HTMLElement} container - Контейнер для переключателя
     * @returns {HTMLElement} - Созданный переключатель
     */
    createThemeToggle(container) {
        return this.themeManager.createThemeToggle(container);
    }

    /**
     * Создать индикатор загрузки для миграции
     * @param {string} message - Сообщение о процессе
     */
    showMigrationIndicator(message = 'Обновление данных...') {
        let overlay = document.getElementById('migrationOverlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'migration-overlay';
            overlay.id = 'migrationOverlay';
            overlay.innerHTML = `
                <div class="migration-modal">
                    <div class="migration-icon">🔄</div>
                    <div class="migration-title">${message}</div>
                    <div class="migration-subtitle">Выполняется миграция к версии 2.0</div>
                    <div class="migration-progress">
                        <div class="migration-progress-bar"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        
        overlay.style.display = 'flex';
    }

    /**
     * Скрыть индикатор загрузки миграции
     */
    hideMigrationIndicator() {
        const overlay = document.getElementById('migrationOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    /**
     * Получить состояние UI v2.0
     * @returns {Object} - Объект с состоянием UI
     */
    getUIState() {
        return {
            version: this.version,
            instructionsVisible: this.state.get('ui.instructionsVisible'),
            theme: this.themeManager.getCurrentTheme(),
            activeTab: this.state.get('ui.activeTab'),
            paletteOpen: this.state.get('ui.paletteOpen')
        };
    }

    /**
     * Получить статистику модуля
     * @returns {Object} - Статистика UI модуля
     */
    getStats() {
        return {
            version: this.version,
            elementsCreated: Object.keys(this.elements).length,
            notificationsShown: 0, // Можно добавить счетчик
            themeStats: this.themeManager.getStats(),
            instructionsToggled: 0 // Можно добавить счетчик
        };
    }

    /**
     * Уничтожение модуля
     */
    destroy() {
        // Удалить менеджер тем
        if (this.themeManager) {
            this.themeManager.destroy();
        }
        
        // Удалить созданные элементы
        Object.values(this.elements).forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        console.log('🗑️ UI module v2.0 destroyed');
    }
}