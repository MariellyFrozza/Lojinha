## Lojinha
Disponível em https://mariellyfrozza.github.io/Lojinha/

## Carousel para redes sociais
- Rota: `/carousel` (arquivo em `carousel/index.html`)
- Cada página mostra 6 itens ativos, sem botões.

Para gerar todas as imagens PNG com Chrome headless:

```bash
node scripts/generate-carousel-images.js
```

As imagens são salvas em `carousel/output` como `carousel-01.png`, `carousel-02.png`, etc.
