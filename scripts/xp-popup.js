// scripts/xp-popup.js

// Глобальная функция для окна с критиком (InnaMalware)
// Теперь ты можешь вызвать window.showInnaMalware() из любого другого скрипта
window.showInnaMalware = function() {
    const popup = document.getElementById('xpPopupContainer');
    if (popup) {
        popup.style.display = 'flex';
    } else {
        console.error("Ошибка: В HTML не найден блок #xpPopupContainer!");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // ЛОГИКА ДЛЯ ОКНА С КРИТИКОМ (InnaMalware)
    // ==========================================
    const malwarePopup = document.getElementById('xpPopupContainer');
    const malwareCloseBtn = document.getElementById('xpCloseBtn');
    const malwareOkBtn = document.getElementById('xpOkBtn');

    const closeMalwarePopup = () => {
        if (malwarePopup) malwarePopup.style.display = 'none';
    };

    if (malwareCloseBtn) malwareCloseBtn.addEventListener('click', closeMalwarePopup);
    if (malwareOkBtn) malwareOkBtn.addEventListener('click', closeMalwarePopup);


    // ==========================================
    // ЛОГИКА ДЛЯ ПРИВЕТСТВЕННОГО ОКНА (Welcome)
    // ==========================================
    const welcomePopup = document.getElementById('xpWelcomePopupContainer');
    const welcomeCloseBtn = document.getElementById('xpWelcomeCloseBtn');
    const welcomeOkBtn = document.getElementById('xpWelcomeOkBtn');

    const closeWelcomePopup = () => {
        if (welcomePopup) welcomePopup.style.display = 'none';
    };

    // Вешаем слушатели. Окно закроется ТОЛЬКО при клике на эти кнопки.
    if (welcomeCloseBtn) welcomeCloseBtn.addEventListener('click', closeWelcomePopup);
    if (welcomeOkBtn) welcomeOkBtn.addEventListener('click', closeWelcomePopup);

    // *Примечание: само окно Welcome теперь показывается из скрипта загрузчика (THREE.js loadingManager), 
    // поэтому здесь мы его не вызываем, а только даем возможность закрыть.
});