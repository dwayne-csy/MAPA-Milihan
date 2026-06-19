// Unit display helpers
export const getUnitLabel = (unit) => {
    const unitMap = {
        'kg': 'KG',
        'tray': 'Tray',
        'sack': 'Sack',
        'pc': 'Piece',
        'L': 'Liter'
    };
    return unitMap[unit] || unit;
};

export const getUnitFullLabel = (unit) => {
    const unitMap = {
        'kg': 'Kilogram',
        'tray': 'Tray',
        'sack': 'Sack',
        'pc': 'Piece',
        'L': 'Liter'
    };
    return unitMap[unit] || unit;
};

export const getPricePerUnit = (price, unit) => {
    const label = getUnitLabel(unit);
    return `₱${Number(price).toFixed(2)} / ${label}`;
};

export const getQuantityDisplay = (quantity, unit) => {
    const label = getUnitLabel(unit);
    return `${quantity} ${label}`;
};

export const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'Out of Stock', color: '#c62828', bg: '#ffebee', icon: '❌' };
    if (quantity < 10) return { label: 'Low Stock', color: '#e65100', bg: '#fff3e0', icon: '⚠️' };
    if (quantity < 50) return { label: 'Medium Stock', color: '#f57f17', bg: '#fff8e1', icon: '📦' };
    return { label: 'In Stock', color: '#2E7D32', bg: '#e8f5e9', icon: '✅' };
};