function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatNumber(num, decimals) {
    decimals = decimals || 2;
    return Number(num).toFixed(decimals);
}

function formatCurrency(amount) {
    return 'RD$ ' + Number(amount).toLocaleString('es-DO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatPercent(value) {
    return Number(value).toFixed(3) + '%';
}

function formatWeight(kg) {
    return Number(kg).toFixed(2) + ' kg';
}
