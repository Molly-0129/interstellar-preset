const panelId = 'interstellar-preset-panel';
const presetUrl = new URL('./presets/interstellar.json', import.meta.url);

function mountPanel() {
    const container = document.getElementById('extensions_settings');
    if (!container || document.getElementById(panelId)) {
        return;
    }

    const panel = document.createElement('details');
    panel.id = panelId;
    panel.className = 'extension_container';

    const heading = document.createElement('summary');
    heading.textContent = '✦ 星间';

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'menu_button';
    addButton.textContent = '添加并选用';

    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.textContent = '适用于聊天补全预设。';

    addButton.addEventListener('click', async () => {
        addButton.disabled = true;
        status.textContent = '正在读取预设…';

        try {
            const response = await fetch(presetUrl);
            if (!response.ok) {
                throw new Error(`Could not load the bundled preset (HTTP ${response.status})`);
            }

            const preset = await response.json();
            if (typeof preset?.name !== 'string' || !preset.name.trim()
                || !Array.isArray(preset.prompts) || !Array.isArray(preset.prompt_order)) {
                throw new Error('Invalid bundled chat completion preset');
            }

            const context = SillyTavern.getContext();
            if (context.mainApi !== 'openai') {
                status.textContent = '请先在酒馆的 API 设置中切换到「聊天补全」。';
                return;
            }

            const manager = context.getPresetManager('openai');
            const { preset_names: presetNames } = manager.getPresetList();
            if (Object.keys(presetNames).some(name => name.toLowerCase() === preset.name.toLowerCase())) {
                status.textContent = `${preset.name} 已存在，可在聊天补全预设列表中选用。`;
                return;
            }

            // The standard save path also selects the new preset in the host UI.
            await manager.savePreset(preset.name, preset);
            status.textContent = `已添加并选用 ${preset.name}。`;
        } catch (error) {
            console.error('[Interstellar] Preset import failed', error);
            status.textContent = '添加失败。请重新加载酒馆后重试，或使用 JSON 手动导入。';
        } finally {
            addButton.disabled = false;
        }
    });

    panel.append(heading, addButton, status);
    container.append(panel);
}

mountPanel();
if (!document.getElementById(panelId)) {
    const { eventSource, event_types: eventTypes } = SillyTavern.getContext();
    eventSource.once(eventTypes.APP_INITIALIZED, mountPanel);
}
