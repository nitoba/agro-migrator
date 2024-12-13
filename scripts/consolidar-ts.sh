#!/bin/bash

# Nome do arquivo consolidado
OUTPUT_FILE="conteudo_arquivos_ts.txt"

# Limpa ou cria o arquivo de saída
> "$OUTPUT_FILE"

# Função para processar arquivos .ts
process_files() {
    local folder=$1
    shift
    local ignore_dirs=("$@")

    # Constrói a string de exclusões para o comando find
    local ignore_args=()
    for ignore in "${ignore_dirs[@]}"; do
        ignore_args+=(-path "$folder/$ignore" -prune -o)
    done

    # Procura arquivos .ts ignorando os diretórios especificados
    find "$folder" "${ignore_args[@]}" -type f -name "*.ts" -print | while read -r file; do
        echo "nome: $(basename "$file")" >> "$OUTPUT_FILE"
        cat "$file" >> "$OUTPUT_FILE"
        echo -e "\n---\n" >> "$OUTPUT_FILE"
    done
}

# Caminho da pasta alvo (atual por padrão)
TARGET_FOLDER="${1:-.}"

# Lista de diretórios a serem ignorados (opcional)
shift
IGNORE_DIRS=("$@")

# Processa os arquivos
process_files "$TARGET_FOLDER" "${IGNORE_DIRS[@]}"

echo "Consolidação concluída. Verifique o arquivo: $OUTPUT_FILE"
