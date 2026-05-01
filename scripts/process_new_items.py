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
    base = os.path.splitext(filename)[0]
    parts = base.split("-")
    
    # Find all numeric parts with their indices from the end
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
    
    name = " ".join(name_parts).replace("_", " ")
    name = " ".join(word.capitalize() for word in name.split())
    
    return name, price, photo_num

def main():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Get next ID
    max_id = max(item["id"] for item in data["items"])
    next_id = max_id + 1
    
    # Group files by product name
    files = sorted([f for f in NEW_DIR.iterdir() if f.is_file() and f.suffix.lower() in (".jpg", ".jpeg", ".png")])
    
    products = {}
    for f in files:
        name, price, photo_num = parse_filename(f.name)
        key = "-".join(os.path.splitext(f.name)[0].split("-")[:-2])  # name without price and num
        if key not in products:
            products[key] = {
                "name": name,
                "price": price,
                "files": []
            }
        products[key]["files"].append((f, photo_num))
    
    # Sort files by photo num for each product
    for key in products:
        products[key]["files"].sort(key=lambda x: x[1])
    
    # Descriptions
    descriptions = {
        "arranhador-gatos-grande-para-parede": "Arranhador grande para gatos, ideal para instalar na parede. Perfeito para gatos de todos os tamanhos brincarem e afiarem as unhas.",
        "baqueta-para-percussao-pouco-usada": "Baqueta para percussão pouco utilizada, em bom estado de conservação.",
        "caixa-de-som-para-computador-usb-philips-branca": "Caixa de som Philips branca para computador, conexão USB. Compacta e prática para uso no dia a dia.",
        "controle-remoto-universal-de-ar-condicionado": "Controle remoto universal compatível com diversos modelos de ar condicionado. Prático e fácil de configurar.",
        "kit-jogo-americano-6-lugares": "Kit com jogo americano para 6 lugares. Ideal para organizar e decorar a mesa de jantar.",
    }
    
    categories = {
        "arranhador-gatos-grande-para-parede": "Outros",
        "baqueta-para-percussao-pouco-usada": "Outros",
        "caixa-de-som-para-computador-usb-philips-branca": "Eletrônicos",
        "controle-remoto-universal-de-ar-condicionado": "Eletrônicos",
        "kit-jogo-americano-6-lugares": "Outros",
    }
    
    conditions = {
        "arranhador-gatos-grande-para-parede": "novo",
        "baqueta-para-percussao-pouco-usada": "usado",
        "caixa-de-som-para-computador-usb-philips-branca": "bom estado",
        "controle-remoto-universal-de-ar-condicionado": "bom estado",
        "kit-jogo-americano-6-lugares": "novo",
    }
    
    new_items = []
    for key, prod in products.items():
        photos = []
        for f, photo_num in prod["files"]:
            webp_name = os.path.splitext(f.name)[0] + ".webp"
            dst = IMAGES_DIR / webp_name
            print(f"Converting {f.name} -> {webp_name}")
            convert_to_webp(f, dst)
            photos.append(f"images/{webp_name}")
            # Remove original
            f.unlink()
        
        item = {
            "id": next_id,
            "name": prod["name"],
            "description": descriptions.get(key, ""),
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
    
    print(f"Added {len(new_items)} new items.")
    for item in new_items:
        print(f"  - ID {item['id']}: {item['name']} (R${item['price']})")

if __name__ == "__main__":
    main()
