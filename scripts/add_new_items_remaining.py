import os
import json
import shutil

base_dir = '/Users/rogeriobayer/projects/Lojinha'
new_dir = os.path.join(base_dir, 'images', 'new')
images_dir = os.path.join(base_dir, 'images')
data_path = os.path.join(base_dir, 'data.json')

files = [f for f in os.listdir(new_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
files.sort()

item_map = {
    'medidor-para-aneis-aneleira': {
        'name': 'Medidor para Anéis (Aneleira)',
        'price': 0,
        'category': 'Outros',
        'condition': 'bom estado',
        'description': 'Aneleira medidora de dedos para descobrir o número do anel. Útil para compras de joias online ou em lojas.'
    },
    'mexedor-de-bolo-grande': {
        'name': 'Mexedor de Bolo Grande',
        'price': 3,
        'category': 'Outros',
        'condition': 'bom estado',
        'description': 'Mexedor grande para preparo de bolos, massas e cremes. Resistente e prático para o dia a dia.'
    },
    'rolo-de-velcro-preto-grande': {
        'name': 'Rolo de Velcro Preto Grande',
        'price': 5,
        'category': 'Outros',
        'condition': 'bom estado',
        'description': 'Rolo grande de fita velcro preta, ideal para organização de cabos, costura e fixação diversa.'
    },
    'cadeado-grande-pado': {
        'name': 'Cadeado Grande Pado',
        'price': 5,
        'category': 'Outros',
        'condition': 'bom estado',
        'description': 'Cadeado grande da marca Pado. Robusto e seguro para portões, armários e outros usos.'
    },
    'filtro-de-linha-intelbras': {
        'name': 'Filtro de Linha Intelbras',
        'price': 15,
        'category': 'Eletrônicos',
        'condition': 'bom estado',
        'description': 'Filtro de linha Intelbras com proteção contra surtos elétricos. Ideal para proteger aparelhos eletrônicos.'
    }
}

with open(data_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

max_id = max(item['id'] for item in data['items'])

for fname in files:
    name_no_ext = os.path.splitext(fname)[0]
    # remove trailing number
    parts = name_no_ext.rsplit('-', 1)
    if len(parts) == 2 and parts[1].isdigit():
        prefix = parts[0]
    else:
        prefix = name_no_ext

    if prefix not in item_map:
        print(f'Ignorando {fname}, prefixo {prefix} nao mapeado')
        continue

    info = item_map[prefix]
    max_id += 1
    src = os.path.join(new_dir, fname)
    dst = os.path.join(images_dir, fname)
    shutil.move(src, dst)

    item = {
        'id': max_id,
        'name': info['name'],
        'description': info['description'],
        'price': info['price'],
        'condition': info['condition'],
        'category': info['category'],
        'photos': ['images/' + fname]
    }
    data['items'].append(item)
    print(f'Adicionado id={max_id} nome={info["name"]}')

with open(data_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Concluido.')
