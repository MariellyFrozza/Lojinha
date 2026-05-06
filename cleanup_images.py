#!/usr/bin/env python3
import json
import os

# Load data.json
with open('data.json', 'r') as f:
    data = json.load(f)

# Extract all referenced photos
referenced = set()
for item in data.get('items', []):
    for photo in item.get('photos', []):
        # Normalize path: remove "images/" prefix if present
        filename = photo.replace('images/', '').replace('images\\', '')
        referenced.add(filename)

# List files in images/
images_dir = 'images'
all_files = [f for f in os.listdir(images_dir) if os.path.isfile(os.path.join(images_dir, f))]

# Find files not referenced
# Also ignore .DS_Store and other non-image files if desired, but user asked for photos.
# Let's consider image files: webp, jpg, jpeg, png
to_remove = []
for f in all_files:
    if f.lower().endswith(('.webp', '.jpg', '.jpeg', '.png')) and f not in referenced:
        to_remove.append(f)

if not to_remove:
    print("Nenhuma foto para remover.")
else:
    print(f"Removendo {len(to_remove)} fotos não referenciadas:")
    for f in to_remove:
        path = os.path.join(images_dir, f)
        os.remove(path)
        print(f"  - {f}")
    print("Concluído.")
