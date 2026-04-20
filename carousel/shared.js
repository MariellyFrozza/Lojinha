(function (factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
        return;
    }

    if (typeof window !== 'undefined') {
        window.carouselShared = factory();
    }
}(function () {
    const ITEMS_PER_PAGE = 6;

    function hasPromotionalPrice(item) {
        return typeof item.promotionalPrice === 'number';
    }

    function getEffectivePrice(item) {
        return hasPromotionalPrice(item) ? item.promotionalPrice : item.price;
    }

    function formatPriceForDisplay(item) {
        const effectivePrice = getEffectivePrice(item);
        if (effectivePrice === 0) {
            return hasPromotionalPrice(item) && item.price > 0
                ? `<span class="original-price">R$ ${item.price.toFixed(2)}</span><span class="promo-price free-price">Grátis!</span>`
                : '<span class="promo-price free-price">Grátis!</span>';
        }

        if (hasPromotionalPrice(item)) {
            return `<span class="original-price">R$ ${item.price.toFixed(2)}</span><span class="promo-price">R$ ${item.promotionalPrice.toFixed(2)}</span>`;
        }

        return `R$ ${item.price.toFixed(2)}`;
    }

    function getActiveItems(items, options = {}) {
        const includeReserved = Boolean(options.includeReserved);

        return items.filter(item => {
            if (item.hidden) {
                return false;
            }

            if (!includeReserved && item.reserved) {
                return false;
            }

            return true;
        });
    }

    function getTotalPages(totalItems, itemsPerPage = ITEMS_PER_PAGE) {
        return Math.max(1, Math.ceil(totalItems / itemsPerPage));
    }

    function getItemsForPage(items, page, itemsPerPage = ITEMS_PER_PAGE) {
        const normalizedPage = Number.isInteger(page) ? page : parseInt(page, 10);
        const safePage = Number.isFinite(normalizedPage) ? normalizedPage : 1;
        const totalPages = getTotalPages(items.length, itemsPerPage);
        const clampedPage = Math.min(Math.max(safePage, 1), totalPages);
        const start = (clampedPage - 1) * itemsPerPage;

        return items.slice(start, start + itemsPerPage);
    }

    function resolvePhotoPath(photo) {
        if (!photo || typeof photo !== 'string') {
            return '';
        }

        if (
            photo.startsWith('http://') ||
            photo.startsWith('https://') ||
            photo.startsWith('data:') ||
            photo.startsWith('/')
        ) {
            return photo;
        }

        return `../${photo}`;
    }

    return {
        ITEMS_PER_PAGE,
        formatPriceForDisplay,
        getActiveItems,
        getEffectivePrice,
        getItemsForPage,
        getTotalPages,
        hasPromotionalPrice,
        resolvePhotoPath
    };
}));
