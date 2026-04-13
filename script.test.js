const test = require('node:test');
const assert = require('node:assert/strict');

const { buildWhatsappMessage } = require('./script.js');

test('buildWhatsappMessage keeps normal items unchanged', () => {
    const message = buildWhatsappMessage({
        name: 'Caneca Azul',
        price: 12
    });

    assert.equal(message, 'Olá! Tenho interesse no item: Caneca Azul (R$ 12,00).');
});

test('buildWhatsappMessage prefixes reserved items with RESERVADO', () => {
    const message = buildWhatsappMessage({
        name: 'Água Desmineralizada Cockpit 1L Lacrada',
        price: 0,
        reserved: true
    });

    assert.equal(message, 'Olá! Tenho interesse no item: RESERVADO Água Desmineralizada Cockpit 1L Lacrada (Grátis!).');
});
