#!/usr/bin/env python3
import json
import os
import re
import subprocess
from pathlib import Path

BASE_DIR = Path("/Users/rogeriobayer/projects/Lojinha")
NEW_DIR = BASE_DIR / "images" / "new"
IMAGES_DIR = BASE_DIR / "images"
DATA_FILE = BASE_DIR / "data.json"

def convert_to_webp(src: Path, dst: Path):
    cmd = ["cwebp", "-q", "85", str(src), "-o", str(dst)]
    subprocess.run(cmd, check=True, capture_output=True)

def parse_filename(filename: str):
    """Parse filename like 'cesto-de-roupas-5-1.jpg' -> ('cesto de roupas', 5, 1)"""
    base = os.path.splitext(filename)[0]
    parts = base.split("-")
    
    # Find all numeric parts from the end
    numeric_indices = []
    for i in range(len(parts) - 1, -1, -1):
        if parts[i].isdigit():
            numeric_indices.append(i)
            if len(numeric_indices) == 2:
                break
    
    if len(numeric_indices) >= 2:
        # Last number is photo num, second-to-last is price
        photo_idx = numeric_indices[0]
        price_idx = numeric_indices[1]
        photo_num = int(parts[photo_idx])
        price = int(parts[price_idx])
        name_parts = parts[:price_idx]
    elif len(numeric_indices) == 1:
        # Only one number: it's the price, photo is 0
        price_idx = numeric_indices[0]
        price = int(parts[price_idx])
        photo_num = 0
        name_parts = parts[:price_idx]
    else:
        raise ValueError(f"No numeric price found in filename: {filename}")
    
    # Capitalize each word
    name = " ".join(name_parts)
    name = " ".join(word.capitalize() for word in name.split())
    
    return name, price, photo_num

def main():
    # Load existing data
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Get next ID
    max_id = max(item["id"] for item in data["items"])
    next_id = max_id + 1
    
    # Get all image files in new/ sorted
    files = sorted([
        f for f in NEW_DIR.iterdir()
        if f.is_file() and f.suffix.lower() in (".jpg", ".jpeg", ".png")
    ])
    
    if not files:
        print("Nenhum arquivo encontrado em images/new/")
        return
    
    # Group files by product key (everything before price-photonum)
    products = {}
    for f in files:
        name, price, photo_num = parse_filename(f.name)
        # Use the first part of name as a key (remove trailing duplications from name parts)
        base = os.path.splitext(f.name)[0]
        # Remove the last two numeric parts to get product key
        parts = base.split("-")
        numeric_count = sum(1 for p in parts if p.isdigit())
        if numeric_count >= 2:
            # Remove last two numeric parts
            trimmed = parts[:-2]
        elif numeric_count == 1:
            trimmed = parts[:-1]
        else:
            trimmed = parts
        key = "-".join(trimmed)
        
        if key not in products:
            products[key] = {
                "name": name,
                "price": price,
                "files": []
            }
        products[key]["files"].append((f, photo_num))
    
    # Sort files by photo number for each product
    for key in products:
        products[key]["files"].sort(key=lambda x: x[1])
    
    # Hardcoded descriptions, categories and conditions for these items
    descriptions = {
        "cesto-de-roupas": "Cesto de roupas, ideal para organizar o quarto ou banheiro. Prático e funcional para o dia a dia.",
        "ducha-banheiro-inox-docol-com-ducha": "Ducha de banheiro em aço inox da marca Docol com chuveirinho. Acabamento moderno e resistente.",
        "escorredor-de-louca-inox": "Escorredor de louça em aço inox, resistente e prático para secar pratos, copos e talheres.",
        "guia-para-animal-pequeno-porta": "Guia para animal pequeno com porta, ideal para passeios seguros com pets de pequeno porte.",
        "potinho-mel-artesanal-pooh": "Potinho de mel artesanal decorado com o tema Ursinho Pooh. Ótimo para presentear ou decorar.",
    }
    
    categories = {
        "cesto-de-roupas": "Outros",
        "ducha-banheiro-inox-docol-com-ducha": "Outros",
        "escorredor-de-louca-inox": "Outros",
        "guia-para-animal-pequeno-porta": "Outros",
        "potinho-mel-artesanal-pooh": "Outros",
    }
    
    conditions = {
        "cesto-de-roupas": "bom estado",
        "ducha-banheiro-inox-docol-com-ducha": "bom estado",
        "escorredor-de-louca-inox": "bom estado",
        "guia-para-animal-pequeno-porta": "bom estado",
        "potinho-mel-artesanal-pooh": "bom estado",
    }
    
    new_items = []
    for key, prod in products.items():
        photos = []
        for f, photo_num in prod["files"]:
            webp_name = os.path.splitext(f.name)[0] + ".webp"
            dst = IMAGES_DIR / webp_name
            print(f"Convertendo {f.name} -> {webp_name}")
            convert_to_webp(f, dst)
            photos.append(f"images/{webp_name}")
            # Remove original
            f.unlink()
        
        item = {
            "id": next_id,
            "name": prod["name"],
            "description": descriptions.get(key, prod["name"]),
            "price": prod["price"],
            "condition": conditions.get(key, "bom estado"),
            "category": categories.get(key, "Outros"),
            "photos": photos
        }
        new_items.append(item)
        next_id += 1
    
    data["items"].extend(new_items)
    
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\nAdicionados {len(new_items)} novos itens:")
    for item in new_items:
        photos_count = len(item["photos"])
        print(f"  - ID {item['id']}: {item['name']} (R${item['price']}) - {photos_count} foto(s)")

if __name__ == "__main__":
    main()
