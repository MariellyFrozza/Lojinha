import os
import json
import re
import shutil

base_dir = '/Users/rogeriobayer/projects/Lojinha'
new_dir = os.path.join(base_dir, 'images', 'new')
images_dir = os.path.join(base_dir, 'images')
data_path = os.path.join(base_dir, 'data.json')

files = [f for f in os.listdir(new_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
files.sort()

# Agrupar por prefixo (removendo sufixo numerico e extensao)
groups = {}
for f in files:
    # extrair prefixo: tudo antes do ultimo hifen-numero ou antes da extensao
    name_no_ext = os.path.splitext(f)[0]
    # tentar remover sufixo como -1, -2, -3 no final
    m = re.match(r'^(.*)-(\d+)$', name_no_ext)
    if m:
        prefix = m.group(1)
    else:
        prefix = name_no_ext
    # tambem remover trailing hifen se houver
    prefix = prefix.rstrip('-')
    if prefix not in groups:
        groups[prefix] = []
    groups[prefix].append(f)

# Ordenar fotos dentro de cada grupo
for prefix in groups:
    groups[prefix].sort()

# Mapear prefixo -> item
# Vamos inferir nome, preco, categoria, descricao
item_map = {
    'porta-chave-veado-0': {
        'name': 'Porta Chave Veado',
        'price': 0,
        'category': 'Decoração',
        'condition': 'bom estado',
        'description': 'Porta-chaves decorativo em formato de veado, ideal para organizar e decorar a entrada de casa.'
    },
    'medidor-para-aneis-aneleira-0': {
        'name': 'Medidor para Anéis (Aneleira)',
        'price': 0,
        'category': 'Outros',
        'condition': 'bom estado',
        'description': 'Aneleira medidora de dedos para descobrir o número do anel. Útil para compras de joias online ou em lojas.'
    },
    'mexedor-de-bolo-grande-3': {
        'name': 'Mexedor de Bolo Grande',
        'price': 3,
        'category': 'Outros',
        'condition': 'bom estado',
        'description': 'Mexedor grande para preparo de bolos, massas e cremes. Resistente e prático para o dia a dia.'
    },
    'kit-pratos-duralex-3-fundos-3-rasos-2-sobremesa-15': {
        'name': 'Kit Pratos Duralex 3 Fundos 3 Rasos 2 Sobremesa',
        'price': 15,
        'category': 'Outros',
        'condition': 'bom estado',
        'description': 'Kit com 8 pratos Duralex: 3 fundos, 3 rasos e 2 de sobremesa. Resistentes e ideais para o dia a dia.'
    },
    'prato-raso-para-servir-melanina-0': {
        'name': 'Prato Raso para Servir Melanina',
        'price': 0,
        'category': 'Outros',
        'condition': 'bom estado',
        'description': 'Prato raso grande em melanina, ideal para servir. Resistente e prático para uso diário.'
    },
    'ducha-em-inox-com-chuveirinho-docol-20': {
        'name': 'Ducha em Inox com Chuveirinho Docol',
        'price': 20,
        'category': 'Outros',
        'condition': 'bom estado',
        'description': 'Ducha em aço inox com chuveirinho da marca Docol. Acabamento moderno e durabilidade para o banheiro.'
    },
    'rolo-de-velcro-preto-grande-5': {
        'name': 'Rolo de Velcro Preto Grande',
        'price': 5,
        'category': 'Outros',
        'condition': 'bom estado',
        'description': 'Rolo grande de fita velcro preta, ideal para organização de cabos, costura e fixação diversa.'
    },
    'cadeado-pequeno-pado-stam': {
        'name': 'Cadeado Pequeno Pado Stam',
        'price': 0,
        'category': 'Outros',
        'condition': 'bom estado',
        'description': 'Cadeado pequeno da marca Pado modelo Stam. Compacto e resistente para uso em malas, armários e lockers.'
    },
    'cadeado-grande-pado-5': {
        'name': 'Cadeado Grande Pado',
        'price': 5,
        'category': 'Outros',
        'condition': 'bom estado',
        'description': 'Cadeado grande da marca Pado. Robusto e seguro para portões, armários e outros usos.'
    },
    'filtro-de-linha-intelbras-15': {
        'name': 'Filtro de Linha Intelbras',
        'price': 15,
        'category': 'Eletrônicos',
        'condition': 'bom estado',
        'description': 'Filtro de linha Intelbras com proteção contra surtos elétricos. Ideal para proteger aparelhos eletrônicos.'
    }
}

# Carregar data.json
with open(data_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

max_id = max(item['id'] for item in data['items'])
new_items = []

for prefix, info in item_map.items():
    if prefix not in groups:
        print(f'Aviso: prefixo {prefix} nao encontrado em images/new/')
        continue
    max_id += 1
    photos = []
    for fname in groups[prefix]:
        src = os.path.join(new_dir, fname)
        dst = os.path.join(images_dir, fname)
        shutil.move(src, dst)
        photos.append('images/' + fname)
    item = {
        'id': max_id,
        'name': info['name'],
        'description': info['description'],
        'price': info['price'],
        'condition': info['condition'],
        'category': info['category'],
        'photos': photos
    }
    new_items.append(item)
    print(f'Adicionado id={max_id} nome={info["name"]}')

# Inserir novos itens antes do fechamento do array
data['items'].extend(new_items)

with open(data_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Concluido.')
