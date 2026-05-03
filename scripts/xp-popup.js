// scripts/xp-popup.js

// 1. Создаем функцию СРАЗУ, чтобы другие скрипты могли её дергать без задержек
window.showInnaMalware = function() {
    const popup = document.getElementById('xpPopupContainer');
    if (popup) {
        popup.style.display = 'flex';
    } else {
        console.error("Ошибка: В HTML не найден блок #xpPopupContainer!");
    }
};

// 2. А кнопки закрытия настраиваем уже после загрузки страницы
document.addEventListener("DOMContentLoaded", () => {
    const popup = document.getElementById('xpPopupContainer');
    const closeBtn = document.getElementById('xpCloseBtn');
    const okBtn = document.getElementById('xpOkBtn');

    const closePopup = () => {
        if (popup) popup.style.display = 'none';
    };

    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (okBtn) okBtn.addEventListener('click', closePopup);
});