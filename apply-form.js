/* ==========================================================================
   OK Pivden — Application Form Logic
   Отправка формы заявки через Cloudflare Worker в Discord.
   Держим этот файл отдельно от scripts.js (jQuery/Swiper/AOS), чтобы не
   путать стороннюю минифицированную библиотеку с нашей собственной логикой.
   ========================================================================== */

// Замени на реальный адрес твоего Cloudflare Worker после деплоя
const AFU_WEBHOOK_PROXY_URL = "https://afu-webhook.xeraze-official.workers.dev";

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("applyForm");
    if (!form) return;

    const submitBtn = document.getElementById("applySubmitBtn");
    const submitLabel = document.getElementById("applySubmitLabel");
    const statusBox = document.getElementById("applyFormStatus");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!validateForm()) {
            showStatus("Будь ласка, заповніть усі обов'язкові поля.", true);
            return;
        }

        submitBtn.disabled = true;
        const originalLabel = submitLabel.textContent;
        submitLabel.textContent = "Надсилання...";
        hideStatus();

        const payload = buildDiscordPayload();

        try {
            const response = await fetch(AFU_WEBHOOK_PROXY_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                form.reset();
                form.style.display = "none";
                showStatus("Заявку успішно відправлено! Ми зв'яжемося з вами найближчим часом.", false);
            } else {
                submitLabel.textContent = originalLabel;
                submitBtn.disabled = false;
                showStatus("Не вдалося надіслати заявку. Спробуйте ще раз.", true);
            }
        } catch (error) {
            submitLabel.textContent = originalLabel;
            submitBtn.disabled = false;
            showStatus("Немає з'єднання з сервером. Перевірте інтернет.", true);
        }
    });

    function validateForm() {
        const name = document.getElementById("apply-name").value.trim();
        const discord = document.getElementById("apply-discord").value.trim();
        const age = document.getElementById("apply-age").value.trim();
        const subdivision = form.querySelector('input[name="subdivision"]:checked');

        return Boolean(name && discord && age && subdivision);
    }

    function buildDiscordPayload() {
        const name = document.getElementById("apply-name").value.trim();
        const discord = document.getElementById("apply-discord").value.trim();
        const age = document.getElementById("apply-age").value.trim();
        const comment = document.getElementById("apply-comment").value.trim() || "—";
        const subdivision = form.querySelector('input[name="subdivision"]:checked');
        const subdivisionValue = subdivision ? subdivision.value : "—";

        return {
            embeds: [{
                title: "Нова заявка — Оперативне Командування Південь",
                color: 0x444a38,
                fields: [
                    { name: "ПІБ", value: name, inline: true },
                    { name: "Discord", value: discord, inline: true },
                    { name: "Вік", value: age, inline: true },
                    { name: "Обраний підрозділ", value: subdivisionValue },
                    { name: "Коментар", value: comment }
                ],
                footer: { text: "ОК «Південь» — Анкета кандидата" },
                timestamp: new Date().toISOString()
            }]
        };
    }

    function showStatus(text, isError) {
        statusBox.textContent = text;
        statusBox.classList.add("show");
        statusBox.classList.toggle("error", Boolean(isError));
    }

    function hideStatus() {
        statusBox.classList.remove("show");
    }
});
