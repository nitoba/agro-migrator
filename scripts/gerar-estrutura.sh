#!/bin/bash

# Nome do arquivo que conterá a estrutura do projeto
OUTPUT_FILE="estrutura_projeto.txt"

# Função para carregar os itens do .gitignore
load_gitignore() {
    local gitignore_file="$1"
    if [ -f "$gitignore_file" ]; then
        while IFS= read -r line || [[ -n "$line" ]]; do
            # Ignora linhas vazias ou comentários
            if [[ -n "$line" && "$line" != \#* ]]; then
                IGNORED_ITEMS+=("$line")
            fi
        done < "$gitignore_file"
    fi
}

# Função para verificar se um item deve ser ignorado
should_ignore() {
    local item=$1
    local base_item=$(basename "$item")
    
    # Ignora pastas padrão
    if [[ "$base_item" == "node_modules" || "$base_item" == "dist" || "$base_item" == ".git" ]]; then
        return 0
    fi

    # Ignora itens do .gitignore
    for ignore_pattern in "${IGNORED_ITEMS[@]}"; do
        if [[ "$item" == *"$ignore_pattern"* ]]; then
            return 0
        fi
    done

    return 1
}

# Função para gerar a estrutura do diretório
generate_structure() {
    local folder=$1
    local indent=$2

    # Itera pelos itens no diretório
    for item in "$folder"/* "$folder"/.[!.]* "$folder"/..?*; do
        # Verifica se o item deve ser ignorado
        if should_ignore "$item"; then
            continue
        fi

        if [ -d "$item" ]; then
            # Se for diretório, adiciona com indentação e recursivamente lista os conteúdos
            echo "${indent}/$(basename "$item")" >> "$OUTPUT_FILE"
            generate_structure "$item" "  $indent"
        elif [ -f "$item" ]; then
            # Se for arquivo, adiciona com indentação
            echo "${indent}$(basename "$item")" >> "$OUTPUT_FILE"
        fi
    done
}

# Caminho do diretório inicial (atual por padrão)
TARGET_FOLDER="${1:-.}"

# Limpa ou cria o arquivo de saída
> "$OUTPUT_FILE"

# Array para armazenar itens ignorados
IGNORED_ITEMS=()

# Carrega o .gitignore se existir na raiz
load_gitignore "$TARGET_FOLDER/.gitignore"

# Adiciona o nome do diretório raiz
echo "/$(basename "$TARGET_FOLDER")" >> "$OUTPUT_FILE"

# Gera a estrutura do diretório
generate_structure "$TARGET_FOLDER" "  "

echo "Estrutura gerada com sucesso em: $OUTPUT_FILE"
