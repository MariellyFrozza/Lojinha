document.addEventListener('DOMContentLoaded', () => {
    const excludedCarouselItemIds = new Set([110]);
    const searchParams = new URLSearchParams(window.location.search);
    if (!searchParams.has('page')) {
        window.location.replace(`${window.location.pathname}?page=1`);
        return;
    }

    const itemsContainer = document.getElementById('carousel-items');

    if (!window.carouselShared) {
        itemsContainer.innerHTML = '<p>Não foi possível carregar os utilitários do carousel.</p>';
        return;
    }

    const {
        formatPriceForDisplay,
        getActiveItems,
        getEffectivePrice,
        getItemsForPage,
        getTotalPages,
        ITEMS_PER_PAGE,
        resolvePhotoPath
    } = window.carouselShared;

    const pageParam = searchParams.get('page');
    const requestedPage = parseInt(pageParam, 10);

    fetch('../data.json')
        .then(response => response.json())
        .then(async data => {
            const activeItems = getActiveItems(data.items)
                .filter(item => !excludedCarouselItemIds.has(item.id))
                .slice()
                .sort((itemA, itemB) => getEffectivePrice(itemB) - getEffectivePrice(itemA));
            const totalPages = getTotalPages(activeItems.length, ITEMS_PER_PAGE);
            const page = Number.isFinite(requestedPage) ? requestedPage : 1;
            const currentPage = Math.min(Math.max(page, 1), totalPages);
            const paginatedItems = getItemsForPage(activeItems, currentPage, ITEMS_PER_PAGE);

            renderItems(paginatedItems, formatPriceForDisplay, resolvePhotoPath);
            await waitForCarouselImages(itemsContainer);
            document.body.setAttribute('data-render-ready', 'true');
        })
        .catch(error => {
            console.error('Erro ao carregar os itens para o carousel:', error);
            itemsContainer.innerHTML = '<p>Não foi possível carregar os itens.</p>';
            document.body.setAttribute('data-render-ready', 'true');
        });

    function waitForCarouselImages(container) {
        const images = Array.from(container.querySelectorAll('.carousel-photo'));
        if (images.length === 0) {
            return Promise.resolve();
        }

        return Promise.all(images.map(image => {
            if (image.complete) {
                return Promise.resolve();
            }

            return new Promise(resolve => {
                image.addEventListener('load', resolve, { once: true });
                image.addEventListener('error', resolve, { once: true });
            });
        }));
    }

    function renderItems(items, formatPrice, resolvePhoto) {
        itemsContainer.innerHTML = '';

        if (items.length === 0) {
            itemsContainer.innerHTML = '<p>Nenhum item ativo encontrado para o carousel.</p>';
            return;
        }

        items.forEach(item => {
            const card = document.createElement('article');
            card.className = 'carousel-item';

            const firstPhoto = item.photos && item.photos.length > 0 ? resolvePhoto(item.photos[0]) : '';
            const photoHtml = firstPhoto
                ? `<img class="carousel-photo" src="${firstPhoto}" alt="${item.name}" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'), {className: 'carousel-no-photo', textContent: 'Sem imagem'}));">`
                : '<div class="carousel-no-photo">Sem imagem</div>';

            const safeDescription = item.description.length > 110
                ? `${item.description.slice(0, 107)}...`
                : item.description;

            card.innerHTML = `
                ${photoHtml}
                <div class="carousel-content">
                    <h2 class="carousel-name">${item.name}</h2>
                    <p class="carousel-description">${safeDescription}</p>
                    <div class="carousel-meta">
                        <span>${item.condition}</span>
                        <span>${item.category}</span>
                    </div>
                    <div class="carousel-price">${formatPrice(item)}</div>
                </div>
            `;

            itemsContainer.appendChild(card);
        });
    }
});
