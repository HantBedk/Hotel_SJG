#!/bin/bash
set -euo pipefail
cd /var/www/hotel_sjg
git checkout main
git pull origin main

cp config/env.vps.example .env

python3 << 'PYEOF'
import secrets, base64, re
from pathlib import Path
p = Path('.env')
text = p.read_text()
text = re.sub(r'^APP_KEY=.*', f'APP_KEY=base64:{base64.b64encode(secrets.token_bytes(32)).decode()}', text, flags=re.M)
text = re.sub(r'^DB_PASSWORD=.*', f'DB_PASSWORD={secrets.token_urlsafe(24)}', text, flags=re.M)
text = re.sub(r'^REVERB_APP_SECRET=.*', f'REVERB_APP_SECRET={secrets.token_hex(32)}', text, flags=re.M)
text = re.sub(r'^HTTP_PORT=.*', 'HTTP_PORT=9084', text, flags=re.M)
p.write_text(text)
PYEOF

mkdir -p /var/backups/hotel
chmod +x scripts/deploy.sh
bash scripts/deploy.sh
