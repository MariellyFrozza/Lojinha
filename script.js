document.addEventListener('DOMContentLoaded', () => {
    const itemsContainer = document.getElementById('items-container');
    const nameFilter = document.getElementById('name-filter');
    const categoryFilter = document.getElementById('category-filter');
    const conditionFilter = document.getElementById('condition-filter');
    const priceFilter = document.getElementById('price-filter');

    let allItems = [];
    let whatsappNumber = '';

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            allItems = data.items;
            whatsappNumber = data.whatsappNumber;
            populateCategories(data.categories);
            renderItems(allItems);
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

    function renderItems(items) {
        itemsContainer.innerHTML = '';
        if (items.length === 0) {
            itemsContainer.innerHTML = '<p>Nenhum item encontrado com os filtros selecionados.</p>';
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.dataset.id = item.id;

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
                        <div class="image-blur" style="background-image: url('${item.photos[0]}')"></div>
                        ${images}
                        ${navButtons}
                        ${dots}
                    </div>
                `;
            } else {
                photoHtml = '<div class="item-photo-placeholder"><span>Sem imagem</span></div>';
            }

            // Converter "bom estado" para "bom-estado" para a classe CSS
            const conditionClass = item.condition === "bom estado" ? "bom-estado" : item.condition;

            const priceHtml = item.promotionalPrice
                ? `<span class="original-price">R$ ${item.price.toFixed(2)}</span><span class="promo-price">R$ ${item.promotionalPrice.toFixed(2)}</span>`
                : `R$ ${item.price.toFixed(2)}`;

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

    function filterItems() {
        let filteredItems = [...allItems];

        // Name filter
        const nameQuery = nameFilter.value.toLowerCase();
        if (nameQuery) {
            filteredItems = filteredItems.filter(item => item.name.toLowerCase().includes(nameQuery));
        }

        // Category filter
        const categoryQuery = categoryFilter.value;
        if (categoryQuery) {
            filteredItems = filteredItems.filter(item => item.category === categoryQuery);
        }

        // Condition filter
        const conditionQuery = conditionFilter.value;
        if (conditionQuery) {
            filteredItems = filteredItems.filter(item => item.condition === conditionQuery);
        }

        // Price filter
        const priceQuery = priceFilter.value;
        if (priceQuery) {
            filteredItems = filteredItems.filter(item => {
                const price = item.promotionalPrice || item.price;
                switch (priceQuery) {
                    case '-50': return price <= 50;
                    case '50-100': return price > 50 && price <= 100;
                    case '100-300': return price > 100 && price <= 300;
                    case '300+': return price > 300;
                    default: return true;
                }
            });
        }

        renderItems(filteredItems);
    }

    itemsContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.item-card');
        if (!card) return;

        const itemId = parseInt(card.dataset.id);
        const item = allItems.find(i => i.id === itemId);

        if (e.target.classList.contains('btn-whatsapp')) {
            const message = encodeURIComponent(`Olá! Tenho interesse no item: ${item.name}.`);
            window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
        }

        if (e.target.classList.contains('btn-copy')) {
            const price = item.promotionalPrice ? `Preço Promocional: R${item.promotionalPrice.toFixed(2)}` : `Preço: R${item.price.toFixed(2)}`;
            const textToCopy = `Item: ${item.name}\nDescrição: ${item.description}\n${price}\nEstado: ${item.condition}`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                e.target.textContent = 'Copiado!';
                setTimeout(() => { e.target.textContent = 'Copiar Infos'; }, 2000);
            });
        }

        if (e.target.classList.contains('carousel-btn')) {
            const direction = parseInt(e.target.dataset.direction);
            const imageContainer = e.target.closest('.image-container');
            const photos = Array.from(imageContainer.querySelectorAll('.item-photo'));
            const dots = Array.from(imageContainer.querySelectorAll('.dot'));
            const currentPhoto = imageContainer.querySelector('.item-photo:not(.hidden)');
            let currentIndex = parseInt(currentPhoto.dataset.index);

            let nextIndex = currentIndex + direction;

            if (nextIndex >= photos.length) {
                nextIndex = 0;
            }
            if (nextIndex < 0) {
                nextIndex = photos.length - 1;
            }

            currentPhoto.classList.add('hidden');
            photos[nextIndex].classList.remove('hidden');
            dots[currentIndex].classList.remove('active');
            dots[nextIndex].classList.add('active');

            const newPhotoUrl = photos[nextIndex].src;
            imageContainer.querySelector('.image-blur').style.backgroundImage = `url('${newPhotoUrl}')`;
        }

        if (e.target.classList.contains('dot')) {
            const imageContainer = e.target.closest('.image-container');
            const photos = Array.from(imageContainer.querySelectorAll('.item-photo'));
            const dots = Array.from(imageContainer.querySelectorAll('.dot'));
            const currentPhoto = imageContainer.querySelector('.item-photo:not(.hidden)');
            let currentIndex = parseInt(currentPhoto.dataset.index);
            const nextIndex = parseInt(e.target.dataset.index);

            if (currentIndex !== nextIndex) {
                currentPhoto.classList.add('hidden');
                photos[nextIndex].classList.remove('hidden');
                dots[currentIndex].classList.remove('active');
                dots[nextIndex].classList.add('active');

                const newPhotoUrl = photos[nextIndex].src;
                imageContainer.querySelector('.image-blur').style.backgroundImage = `url('${newPhotoUrl}')`;
            }
        }
    });

    [nameFilter, categoryFilter, conditionFilter, priceFilter].forEach(el => {
        el.addEventListener('input', filterItems);
        el.addEventListener('change', filterItems);
    });
});
