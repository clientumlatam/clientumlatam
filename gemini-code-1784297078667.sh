#!/bin/bash

echo "=== Buscando variables de entorno en el código ==="

# Buscar todas las ocurrencias de process.env.VARIABLE y extraer solo el nombre de la variable
grep -r -o -h "process\.env\.[A-Z0-9_]\+" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=dist \
  --exclude-dir=.next \
  --exclude-dir=logs \
  --exclude-dir=build \
  | sed 's/process.env.//' \
  | sort -u > env_list.tmp

# Generar el archivo .env.example estructurado
echo "# ========================================================" > .env.example
echo "# Clientum LATAM - Plantilla de Variables de Entorno" >> .env.example
echo "# Generado automáticamente el $(date '+%Y-%m-%d')" >> .env.example
echo "# ========================================================" >> .env.example
echo "" >> .env.example

echo "## Base de Datos" >> .env.example
if grep -q "DATABASE" env_list.tmp || grep -q "PG" env_list.tmp; then
  grep -E "DATABASE|PG" env_list.tmp | awk '{print $1"=your_value_here"}' >> .env.example
else
  echo "DATABASE_URL=your_value_here" >> .env.example
fi
echo "" >> .env.example

echo "## Autenticación y Sesión" >> .env.example
grep -E "AUTH|SECRET|TOKEN|JWT|SESSION" env_list.tmp | grep -v -E "DATABASE|PG" | awk '{print $1"=your_value_here"}' >> .env.example
echo "" >> .env.example

echo "## Proveedores de IA y LLMs" >> .env.example
grep -E "GEMINI|GROQ|OPENROUTER|AI|OPENAI" env_list.tmp | awk '{print $1"=your_value_here"}' >> .env.example
echo "" >> .env.example

echo "## Servicios de Terceros (Apify, Hunter, Maps, etc.)" >> .env.example
grep -E "APIFY|HUNTER|MAPS|GOOGLE|SMTP|EMAIL|GMAIL" env_list.tmp | grep -v -E "GEMINI|AI" | awk '{print $1"=your_value_here"}' >> .env.example
echo "" >> .env.example

echo "## Otras Variables Detectadas" >> .env.example
grep -v -E "DATABASE|PG|AUTH|SECRET|TOKEN|JWT|SESSION|GEMINI|GROQ|OPENROUTER|AI|OPENAI|APIFY|HUNTER|MAPS|GOOGLE|SMTP|EMAIL|GMAIL" env_list.tmp | awk '{print $1"=your_value_here"}' >> .env.example

# Limpieza
rm env_list.tmp

echo "=== ¡Listo! Archivo .env.example creado con éxito ==="