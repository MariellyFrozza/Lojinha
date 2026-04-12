document.addEventListener('DOMContentLoaded', () => {
    const itemsContainer = document.getElementById('items-container');
    const nameFilter = document.getElementById('name-filter');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const priceFilter = document.getElementById('price-filter');
    const imageModal = document.getElementById('image-modal');
    const imageModalPhoto = document.getElementById('image-modal-photo');
    const imageModalClose = document.getElementById('image-modal-close');
    const imageModalPrev = document.getElementById('image-modal-prev');
    const imageModalNext = document.getElementById('image-modal-next');

    let allItems = [];
    let whatsappNumber = '';
    let modalState = {
        item: null,
        currentIndex: 0,
        lastTrigger: null
    };

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            allItems = data.items;
            whatsappNumber = data.whatsappNumber;
            populateCategories(data.categories);
            filterItems();
        })
        .catch(error => {
            console.error('Erro ao carregar os dados:', error);
            itemsContainer.innerHTML = '<p>Não foi possível carregar os itens. Tente novamente mais tarde.</p>';
        });

    function populateCategories(categories) {
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    function hasPromotionalPrice(item) {
        return typeof item.promotionalPrice === 'number';
    }

    function getEffectivePrice(item) {
        return hasPromotionalPrice(item) ? item.promotionalPrice : item.price;
    }

    function formatPriceForMessage(item) {
        const effectivePrice = getEffectivePrice(item);
        if (effectivePrice === 0) {
            return 'Grátis!';
        }

        return `R$ ${effectivePrice.toFixed(2).replace('.', ',')}`;
    }

    function renderItems(items) {
        itemsContainer.innerHTML = '';
        if (items.length === 0) {
            itemsContainer.innerHTML = '<p>Nenhum item encontrado com os filtros selecionados.</p>';
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = `item-card${item.reserved ? ' reserved-item' : ''}`;
            card.dataset.id = item.id;
            const reservedBadge = item.reserved ? '<div class="reserved-badge">Reservado</div>' : '';

            let photoHtml = '';
            if (item.photos && item.photos.length > 0) {
                const images = item.photos.map((photo, index) => `
                    <img src="${photo}" alt="${item.name} - Foto ${index + 1}" class="item-photo ${index > 0 ? 'hidden' : ''}" data-index="${index}" onerror="this.onerror=null;this.src='images/placeholder.png';">
                `).join('');

                const navButtons = item.photos.length > 1 ? `
                    <button class="carousel-btn prev" data-direction="-1">❮</button>
                    <button class="carousel-btn next" data-direction="1">❯</button>
                ` : '';

                const dots = item.photos.length > 1 ? `
                    <div class="carousel-dots">
                        ${item.photos.map((_, index) => `<span class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>`).join('')}
                    </div>
                ` : '';

                photoHtml = `
                    <div class="image-container">
                        ${reservedBadge}
                        <div class="image-blur" style="background-image: url('${item.photos[0]}')"></div>
                        ${images}
                        <button class="image-open-btn" type="button" aria-label="Ampliar imagem do produto"></button>
                        ${navButtons}
                        ${dots}
                    </div>
                `;
            } else {
                photoHtml = `<div class="item-photo-placeholder">${reservedBadge}<span>Sem imagem</span></div>`;
            }

            // Converter "bom estado" para "bom-estado" para a classe CSS
            const conditionClass = item.condition === "bom estado" ? "bom-estado" : item.condition;
            const effectivePrice = getEffectivePrice(item);

            let priceHtml = `R$ ${item.price.toFixed(2)}`;
            if (effectivePrice === 0) {
                priceHtml = hasPromotionalPrice(item) && item.price > 0
                    ? `<span class="original-price">R$ ${item.price.toFixed(2)}</span><span class="promo-price free-price">Grátis!</span>`
                    : `<span class="promo-price free-price">Grátis!</span>`;
            } else if (hasPromotionalPrice(item)) {
                priceHtml = `<span class="original-price">R$ ${item.price.toFixed(2)}</span><span class="promo-price">R$ ${item.promotionalPrice.toFixed(2)}</span>`;
            }

            card.innerHTML = `
                ${photoHtml}
                <div class="item-info">
                    <h3>${item.name}</h3>
                    <p class="description">${item.description}</p>
                    <div class="item-details">
                        <span class="condition ${conditionClass}">${item.condition}</span>
                        <span class="category">${item.category}</span>
                    </div>
                    <div class="price">${priceHtml}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-whatsapp">💬 Tenho Interesse</button>
                    <button class="btn-copy">📋 Copiar Infos</button>
                </div>
            `;
            itemsContainer.appendChild(card);
        });
    }

    function getCurrentPhotoIndex(imageContainer) {
        const currentPhoto = imageContainer.querySelector('.item-photo:not(.hidden)');
        return currentPhoto ? parseInt(currentPhoto.dataset.index, 10) : 0;
    }

    function updateCarouselImage(imageContainer, nextIndex) {
        const photos = Array.from(imageContainer.querySelectorAll('.item-photo'));
        const dots = Array.from(imageContainer.querySelectorAll('.dot'));

        if (photos.length === 0) {
            return 0;
        }

        const normalizedIndex = (nextIndex + photos.length) % photos.length;

        photos.forEach((photo, index) => {
            photo.classList.toggle('hidden', index !== normalizedIndex);
        });

        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === normalizedIndex);
        });

        const activePhoto = photos[normalizedIndex];
        imageContainer.querySelector('.image-blur').style.backgroundImage = `url('${activePhoto.getAttribute('src')}')`;

        return normalizedIndex;
    }

    function moveCarousel(imageContainer, direction) {
        const currentIndex = getCurrentPhotoIndex(imageContainer);
        updateCarouselImage(imageContainer, currentIndex + direction);
    }

    function updateModalView() {
        const { item, currentIndex } = modalState;
        if (!item || !item.photos || item.photos.length === 0) {
            return;
        }

        const normalizedIndex = (currentIndex + item.photos.length) % item.photos.length;
        modalState.currentIndex = normalizedIndex;
        imageModalPhoto.src = item.photos[normalizedIndex];
        imageModalPhoto.alt = `${item.name} - Foto ${normalizedIndex + 1}`;

        const shouldShowNavigation = item.photos.length > 1;
        imageModalPrev.classList.toggle('hidden', !shouldShowNavigation);
        imageModalNext.classList.toggle('hidden', !shouldShowNavigation);
    }

    function openImageModal(item, startIndex, triggerElement) {
        if (!item || !item.photos || item.photos.length === 0) {
            return;
        }

        modalState = {
            item,
            currentIndex: startIndex,
            lastTrigger: triggerElement
        };

        updateModalView();
        imageModal.classList.remove('hidden');
        imageModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        imageModalClose.focus();
    }

    function closeImageModal() {
        imageModal.classList.add('hidden');
        imageModal.setAttribute('aria-hidden', 'true');
        imageModalPhoto.src = '';
        imageModalPhoto.alt = '';
        document.body.classList.remove('modal-open');

        if (modalState.lastTrigger) {
            modalState.lastTrigger.focus();
        }

        modalState = {
            item: null,
            currentIndex: 0,
            lastTrigger: null
        };
    }

    function moveModal(direction) {
        if (!modalState.item || !modalState.item.photos || modalState.item.photos.length <= 1) {
            return;
        }

        modalState.currentIndex += direction;
        updateModalView();
    }

    function filterItems() {
        const visibleItems = allItems.filter(item => !item.hidden);
        const nameQuery = nameFilter.value.toLowerCase();
        const categoryQuery = categoryFilter.value;
        const priceQuery = priceFilter.value;
        const hasActiveFilters = Boolean(nameQuery || categoryQuery || priceQuery);

        const matchesName = item => item.name.toLowerCase().includes(nameQuery);
        const matchesCategory = item => !categoryQuery || item.category === categoryQuery;
        const matchesPrice = item => {
            if (!priceQuery) {
                return true;
            }

            const price = getEffectivePrice(item);
            switch (priceQuery) {
                case '-50': return price <= 50;
                case '50-100': return price > 50 && price <= 100;
                case '100-300': return price > 100 && price <= 300;
                case '300+': return price > 300;
                default: return true;
            }
        };

        let availableItems = visibleItems.filter(item => !item.reserved);
        let reservedItems = hasActiveFilters ? [] : visibleItems.filter(item => item.reserved);

        if (nameQuery) {
            availableItems = availableItems.filter(matchesName);
        }

        availableItems = availableItems
            .filter(matchesCategory)
            .filter(matchesPrice);

        reservedItems = reservedItems
            .filter(matchesCategory)
            .filter(matchesPrice);

        const sortQuery = sortFilter.value || 'desc';
        const sortItemsByPrice = (a, b) => {
            const priceA = getEffectivePrice(a);
            const priceB = getEffectivePrice(b);

            if (sortQuery === 'asc') {
                return priceA - priceB;
            }

            return priceB - priceA;
        };

        availableItems.sort(sortItemsByPrice);
        reservedItems.sort(sortItemsByPrice);

        renderItems([...availableItems, ...reservedItems]);
    }

    itemsContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.item-card');
        if (!card) return;

        const itemId = parseInt(card.dataset.id);
        const item = allItems.find(i => i.id === itemId);

        if (e.target.classList.contains('btn-whatsapp')) {
            const message = encodeURIComponent(`Olá! Tenho interesse no item: ${item.name} (${formatPriceForMessage(item)}).`);
            window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
            return;
        }

        if (e.target.classList.contains('btn-copy')) {
            const effectivePrice = getEffectivePrice(item);
            const price = effectivePrice === 0
                ? 'Preço: Grátis!'
                : hasPromotionalPrice(item)
                    ? `Preço Promocional: R${item.promotionalPrice.toFixed(2)}`
                    : `Preço: R${item.price.toFixed(2)}`;
            const textToCopy = `Item: ${item.name}\nDescrição: ${item.description}\n${price}\nEstado: ${item.condition}`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                e.target.textContent = 'Copiado!';
                setTimeout(() => { e.target.textContent = 'Copiar Infos'; }, 2000);
            });
            return;
        }

        const carouselButton = e.target.closest('.carousel-btn');
        if (carouselButton) {
            const direction = parseInt(carouselButton.dataset.direction, 10);
            moveCarousel(carouselButton.closest('.image-container'), direction);
            return;
        }

        const dot = e.target.closest('.dot');
        if (dot) {
            const imageContainer = dot.closest('.image-container');
            const nextIndex = parseInt(dot.dataset.index, 10);
            updateCarouselImage(imageContainer, nextIndex);
            return;
        }

        const imageOpenButton = e.target.closest('.image-open-btn');
        if (imageOpenButton) {
            const imageContainer = imageOpenButton.closest('.image-container');
            openImageModal(item, getCurrentPhotoIndex(imageContainer), imageOpenButton);
        }
    });

    imageModalPrev.addEventListener('click', () => moveModal(-1));
    imageModalNext.addEventListener('click', () => moveModal(1));
    imageModalClose.addEventListener('click', closeImageModal);

    imageModal.addEventListener('click', (e) => {
        if (e.target.dataset.closeModal === 'true') {
            closeImageModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (imageModal.classList.contains('hidden')) {
            return;
        }

        if (e.key === 'Escape') {
            closeImageModal();
        }

        if (e.key === 'ArrowLeft') {
            moveModal(-1);
        }

        if (e.key === 'ArrowRight') {
            moveModal(1);
        }
    });

    [nameFilter, categoryFilter, sortFilter, priceFilter].forEach(el => {
        el.addEventListener('input', filterItems);
        el.addEventListener('change', filterItems);
    });
});
