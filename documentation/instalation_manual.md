# Manual de Instalación — PerreoFC

> Este manual explica cada paso como si fuera la primera vez que instalas algo en este ordenador.
> No se salta nada. Lee todo antes de ejecutar cualquier comando.

---

## ¿Cuál es tu caso? Elige una ruta antes de continuar

Existen dos formas de instalar este proyecto. Elige la que se aplica a ti:

---

### 🔑 RUTA A — Tengo las credenciales (evaluación o demo)

Alguien te ha dado acceso al proyecto para que lo pruebes. Vas a recibir o ya has recibido:

| Qué | Para qué sirve |
|---|---|
| URL del repositorio de Git | Para descargar el código |
| Archivo `.env` ya relleno | Contiene todas las claves y configuraciones |
| Archivo `n8n-data.zip` | Contiene los workflows del chatbot ya configurados |

**Si te falta alguno de los tres, pídelo antes de continuar.**

Esta es la ruta más rápida. Solo necesitas instalar **Git** y **Docker Desktop**. El resto (Node.js, bases de datos, etc.) corre dentro de Docker automáticamente.

**Pasos a seguir:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

---

### ⚙️ RUTA B — Instalo desde cero (sin credenciales)

Quieres crear tu propia instancia del proyecto con tus propias cuentas. Necesitarás crear y configurar:

- Un proyecto en Supabase (base de datos)
- Una cuenta de Gmail con contraseña de aplicación (correo)
- Una cuenta de Expo (frontend móvil)

Esta ruta requiere más pasos y algo más de tiempo.

**Pasos a seguir:** 1 → 2 → 3 → (Apéndice B.1 en lugar del paso 4) → 5 → 6 → 7 → 8 → 9

---

## Índice

**Pasos comunes (ambas rutas):**

1. [Instalar Git](#1-instalar-git)
2. [Instalar Docker Desktop](#2-instalar-docker-desktop)
3. [Descargar el proyecto](#3-descargar-el-proyecto)

**Solo Ruta A:**

4. [Poner el archivo `.env` recibido](#4-ruta-a--poner-el-archivo-env-recibido)

**Solo Ruta B:**

→ Ver [Apéndice B.1 — Crear credenciales desde cero](#apéndice-b1--crear-credenciales-desde-cero)

**Pasos comunes (ambas rutas, continúan aquí):**

5. [Ajustar la IP local en el `.env`](#5-ajustar-la-ip-local-en-el-env)
6. [Poner los datos de n8n](#6-poner-los-datos-de-n8n)
7. [Arrancar el sistema](#7-arrancar-el-sistema)
8. [Verificar que todo funciona](#8-verificar-que-todo-funciona)
9. [Abrir la app en el móvil](#9-abrir-la-app-en-el-móvil)
10. [Parar el sistema](#10-parar-el-sistema)

**Apéndices:**

- [Apéndice B.1 — Crear credenciales desde cero (Ruta B)](#apéndice-b1--crear-credenciales-desde-cero)
- [Apéndice B.2 — Aplicar el esquema SQL en Supabase](#apéndice-b2--aplicar-el-esquema-sql-en-supabase)

---

## 1. Instalar Git

Git es el programa que descarga el código del proyecto desde internet.

### 1.1 — Cómo abrir PowerShell

PowerShell es la consola de comandos de Windows. Así se abre:

1. Pulsa la tecla **Windows** (el logo de Windows en el teclado, normalmente abajo a la izquierda).
2. Escribe `powershell`.
3. Haz clic en **Windows PowerShell** en los resultados.

[FOTO — Menú de inicio con "powershell" escrito y el resultado "Windows PowerShell" resaltado]

Se abre una ventana azul o negra con texto blanco. Eso es PowerShell. Aquí es donde vas a escribir los comandos de este manual.

[FOTO — Ventana de PowerShell recién abierta]

---

### 1.2 — Comprobar si Git ya está instalado

Escribe este comando exactamente como aparece y pulsa **Enter**:

```
git --version
```

**Salida esperada si Git está instalado:**
```
git version 2.47.0.windows.2
```
(el número puede variar, lo importante es que aparezca `git version`)

**Salida si Git NO está instalado:**
```
'git' is not recognized as an internal or external command
```
o se abre una ventana de la Microsoft Store ofreciendo instalar algo — ciérrala.

- Si ves `git version x.x.x` → Git ya está. **Pasa al paso 2.**
- Si ves el error → **Sigue con el paso 1.3.**

---

### 1.3 — Instalar Git

1. Abre el navegador (Chrome, Edge, Firefox).
2. Ve a: **https://git-scm.com/download/win**
3. La descarga empieza sola. Si no, haz clic en el enlace "Click here to download".

[FOTO — Página de descarga de Git con el botón de descarga]

4. Cuando termine, abre el archivo descargado. Se llama algo como `Git-2.47.0-64-bit.exe`.

[FOTO — Archivo descargado en la barra de descargas del navegador]

5. Aparece el instalador de Git. Pulsa **Next** en todas las pantallas sin cambiar nada.

[FOTO — Primera pantalla del instalador de Git con el botón Next]

6. Cuando aparezca el botón **Install**, púlsalo y espera.
7. Al terminar, pulsa **Finish**.

---

### 1.4 — Verificar la instalación

**Importante:** cierra PowerShell (la X de la ventana) y vuelve a abrirlo. Los programas recién instalados no se reconocen en ventanas ya abiertas.

Abre PowerShell de nuevo (Windows → "powershell" → Enter) y escribe:

```
git --version
```

**Salida esperada:**
```
git version 2.47.0.windows.2
```

**Error: sigue sin reconocer `git`**
→ Reinicia el ordenador entero. Después vuelve a abrir PowerShell e inténtalo de nuevo.

---

## 2. Instalar Docker Desktop

Docker Desktop arranca todos los servicios del sistema (base de datos, backend, la app, etc.) con un solo comando. Es el programa más importante.

### 2.1 — Comprobar si Docker ya está instalado

Abre PowerShell y escribe:

```
docker --version
```

**Salida esperada si Docker está instalado:**
```
Docker version 27.3.1, build ce12230
```

**Salida si Docker NO está instalado:**
```
'docker' is not recognized as an internal or external command
```

- Si ves `Docker version x.x.x` → **ve al paso 2.2** para comprobar que está en marcha.
- Si ves el error → **ve al paso 2.3** para instalarlo.

---

### 2.2 — Comprobar que Docker Desktop está en marcha

Aunque esté instalado, Docker Desktop tiene que estar **abierto y corriendo**.

Mira la **barra del sistema**: la esquina inferior derecha del escritorio, junto al reloj. Si no ves los iconos, haz clic en la flechita `^` para expandirlos.

[FOTO — Barra del sistema con la flecha ^ señalada y el icono de Docker visible]

Busca el icono de Docker (una ballena con contenedores encima).

[FOTO — Icono de Docker en la barra del sistema]

- Si el icono está y al pasar el ratón dice **"Docker Desktop is running"** → perfecto, **pasa al paso 3**.
- Si el icono dice **"Docker Desktop is starting"** → espera 1-2 minutos hasta que cambie a "running".
- Si el icono no aparece → abre Docker Desktop desde el menú de inicio (Windows → "Docker Desktop" → Enter) y espera.

---

### 2.3 — Instalar Docker Desktop

**Requisitos mínimos:**
- Windows 10 versión 1903 o superior, o Windows 11.
- Al menos 4 GB de RAM.
- Procesador con virtualización (la mayoría de ordenadores modernos la tienen).

**Instalación:**

1. Abre el navegador y ve a: **https://www.docker.com/products/docker-desktop**
2. Haz clic en el botón **"Download for Windows"**.

[FOTO — Página de Docker Desktop con el botón de descarga]

3. Abre el archivo descargado: `Docker Desktop Installer.exe`.
4. El instalador pregunta sobre WSL2. Deja marcada la casilla **"Use WSL2 instead of Hyper-V"** y pulsa **Ok**.

[FOTO — Pantalla del instalador de Docker con la casilla de WSL2 marcada]

5. Espera. La instalación tarda varios minutos.
6. Cuando termine, haz clic en **Close and restart** si te lo pide, o **Close** si no.
7. Si reinició, Windows arranca de nuevo y Docker Desktop se abre solo al iniciar. Si no se abre, búscalo en el menú de inicio.
8. La primera vez aparece un tutorial o un acuerdo de términos. Acéptalo y ciérralo.
9. Espera a que en la barra del sistema aparezca el icono de Docker y diga "Docker Desktop is running".

[FOTO — Docker Desktop abierto mostrando "Docker Desktop is running" en la pantalla principal]

---

### 2.4 — Verificar la instalación

Cierra PowerShell y ábrelo de nuevo. Escribe:

```
docker --version
```

**Salida esperada:**
```
Docker version 27.3.1, build ce12230
```

Escribe también:

```
docker compose version
```

**Salida esperada:**
```
Docker Compose version v2.29.7
```

**Error: "WSL2 kernel update required" o "WSL 2 installation is incomplete"**
Docker muestra un enlace en la propia pantalla de error. Haz clic en él, descarga el actualizador, ejecútalo, y vuelve a abrir Docker Desktop.

[FOTO — Pantalla de error de WSL2 con el enlace de actualización señalado]

**Error: "Hardware assisted virtualization and data execution protection must be enabled"**
La virtualización está desactivada en la BIOS. Necesitas activarla:
1. Reinicia el ordenador.
2. Mientras arranca, pulsa repetidamente **F2**, **F10**, **F12** o **Supr** (varía por fabricante — aparece en pantalla durante un segundo al arrancar).
3. Busca una opción llamada "Intel Virtualization Technology", "Intel VT-x" o "AMD-V".
4. Cámbiala a **Enabled**.
5. Guarda y sal (normalmente F10). Windows arranca y Docker debería funcionar.

**Error: Docker se instala pero al abrirlo dice "Docker Engine stopped"**
Haz clic derecho en el icono de Docker en la barra del sistema → **Restart Docker**. Espera 2 minutos.

---

## 3. Descargar el proyecto

### 3.1 — Abrir PowerShell y situarse en la carpeta correcta

Abre PowerShell (Windows → "powershell" → Enter).

Decide dónde guardar el proyecto. Lo más sencillo es dentro de **Documentos**. Escribe:

```
cd $HOME\Documents
```

**Salida esperada:** el prompt cambia para mostrar la ruta. Ejemplo:
```
PS C:\Users\TuNombre\Documents>
```

> Si prefieres el Escritorio: `cd $HOME\Desktop`

---

### 3.2 — Descargar el código

Escribe el siguiente comando sustituyendo la URL por la que te han dado:

```
git clone <URL_DEL_REPOSITORIO>
```

Ejemplo real:
```
git clone https://github.com/usuario/TFG-PERREOFC.git
```

**Salida esperada:**
```
Cloning into 'TFG-PERREOFC'...
remote: Enumerating objects: 1532, done.
remote: Counting objects: 100% (1532/1532), done.
remote: Compressing objects: 100% (812/812), done.
Receiving objects: 100% (1532/1532), 4.23 MiB | 2.10 MiB/s, done.
Resolving deltas: 100% (634/634), done.
```

**Error: `fatal: repository 'https://...' not found`**
La URL es incorrecta. Pídela de nuevo.

**Error: `fatal: Authentication failed`**
El repositorio es privado y necesitas autenticarte. Introduce tu usuario y contraseña de GitHub cuando te los pida, o configura una clave SSH:
```
ssh-keygen -t ed25519 -C "tu@email.com"
```
Pulsa Enter en todas las preguntas. Luego:
```
cat $HOME\.ssh\id_ed25519.pub
```
**Salida esperada:** una línea larga que empieza por `ssh-ed25519 AAAA...`

Copia esa línea. Ve a **GitHub.com** → tu avatar (arriba a la derecha) → **Settings** → **SSH and GPG keys** → **New SSH key** → pega y guarda. Vuelve a intentar el `git clone`.

---

### 3.3 — Entrar en la carpeta del proyecto

```
cd TFG-PERREOFC
```

**Salida esperada:** el prompt cambia:
```
PS C:\Users\TuNombre\Documents\TFG-PERREOFC>
```

Verifica que estás en el sitio correcto:

```
ls
```

**Salida esperada** (debes ver estos elementos en la lista):
```
    Directory: C:\Users\TuNombre\Documents\TFG-PERREOFC

Mode    Name
----    ----
d----   documentation
d----   n8n-local
d----   perreofc-back
d----   perreofc-front
d----   TFG-PERREOFC-SCRAPEO
-a---   .env.example
-a---   .gitignore
-a---   docker-compose.dev.yml
```

**Error: no ves `docker-compose.dev.yml` en la lista**
No estás en la carpeta correcta. Escribe `ls` para ver qué hay y navega hasta `TFG-PERREOFC`.

---

## 4. (RUTA A) Poner el archivo `.env` recibido

> **Esta sección es solo para la Ruta A** (tienes las credenciales ya preparadas).
> Si estás en la **Ruta B**, ve al [Apéndice B.1](#apéndice-b1--crear-credenciales-desde-cero) ahora.

El archivo `.env` contiene todas las contraseñas y configuraciones. Te lo habrá dado la persona que te entrega el proyecto.

### 4.1 — Copiar el `.env` en la carpeta del proyecto

El archivo `.env` debe quedar dentro de `TFG-PERREOFC`, al mismo nivel que `docker-compose.dev.yml`.

**Con el Explorador de archivos:**

1. Abre el Explorador de archivos: tecla **Windows + E**.

[FOTO — Explorador de archivos de Windows abierto]

2. Navega hasta `TFG-PERREOFC` (Documentos → TFG-PERREOFC).
3. En otra ventana del Explorador (pulsa **Ctrl+N** para abrir una segunda ventana), navega hasta donde tienes el `.env` recibido (probablemente Descargas).
4. Arrastra el archivo `.env` desde Descargas hasta la carpeta `TFG-PERREOFC`.

[FOTO — Dos ventanas del Explorador lado a lado, arrastrando .env de una a otra]

**Con PowerShell** (si el `.env` está en Descargas):

```
Copy-Item "$HOME\Downloads\.env" -Destination "."
```

**Salida esperada:** ninguna (el silencio significa éxito en PowerShell).

---

### 4.2 — Verificar que el `.env` está en su sitio

```
Get-Content .env | Select-Object -First 5
```

**Salida esperada:**
```
# ═══════════════════════════════════════════════════════════════
# PERREOFC — configuración del entorno
# ═══════════════════════════════════════════════════════════════

SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
```

**Error: `Get-Content : Cannot find path '.env'`**
El archivo no está en la carpeta correcta. Vuelve al paso 4.1.

**Error: el archivo aparece completamente vacío**
El `.env` que recibiste está vacío. Pide uno nuevo.

> Después de este paso, **continúa con el paso 5**.

---

## 5. Ajustar la IP local en el `.env`

La app del móvil necesita saber la dirección de red de tu ordenador para conectarse. Esta dirección es diferente en cada red WiFi, así que tienes que actualizarla tú.

### 5.1 — Averiguar tu IP local

Abre PowerShell y escribe:

```
ipconfig
```

**Salida esperada** (verás mucho texto, busca tu adaptador WiFi o Ethernet):
```
Adaptador de red inalámbrica Wi-Fi:

   Sufijo DNS específico para la conexión. . :
   Vínculo: dirección IPv6 local. . . . . . : fe80::...
   Dirección IPv4. . . . . . . . . . . . . . : 192.168.1.50
   Máscara de subred . . . . . . . . . . . . : 255.255.255.0
   Puerta de enlace predeterminada . . . . . : 192.168.1.1
```

[FOTO — Salida del comando ipconfig con la línea "Dirección IPv4" señalada]

La IP que necesitas es la que aparece en **"Dirección IPv4"** bajo tu adaptador WiFi (o Ethernet si usas cable). En el ejemplo sería `192.168.1.50`.

**¿Cuál elegir si aparecen varias IPs?**
- Usa la que empiece por `192.168.` o `10.` bajo el adaptador que usas para conectarte a internet.
- Ignora las que empiecen por `169.254.` (no funcionan, son automáticas de error).
- Ignora las que empiecen por `172.17.` o `172.18.` (son internas de Docker).

---

### 5.2 — Editar el `.env`

Abre el `.env` con el Bloc de notas:

1. Abre el Explorador de archivos: **Windows + E**.
2. Navega hasta `TFG-PERREOFC`.
3. Si no ves el archivo `.env`, activa los archivos ocultos: en el Explorador haz clic en **"Ver"** (Windows 10) o **"Ver" → "Mostrar"** (Windows 11) y marca **"Elementos ocultos"**.

[FOTO — Opción "Mostrar elementos ocultos" en el menú Ver del Explorador de Windows]

4. Haz clic derecho sobre `.env` → **Abrir con** → **Bloc de notas**.

[FOTO — Menú contextual del .env con "Abrir con → Bloc de notas" señalado]

5. Dentro del archivo, busca estas dos líneas (están cerca del final):

```
EXPO_PUBLIC_API_URL=http://<TU_IP_LAN>:3000/api/v1
LAN_IP=<TU_IP_LAN>
```

6. Cámbia `<TU_IP_LAN>` por tu IP real. Por ejemplo, si tu IP es `192.168.1.50`:

```
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000/api/v1
LAN_IP=192.168.1.50
```

7. Guarda el archivo: **Ctrl+S**.
8. Cierra el Bloc de notas.

**Error: "No tienes permiso para guardar en esta ubicación"**
El archivo está siendo bloqueado por Windows. Cierra el Bloc de notas, haz clic derecho sobre el `.env` → Propiedades → desmarca "Solo lectura" → Aceptar. Vuelve a abrirlo y guardarlo.

---

## 6. Poner los datos de n8n

n8n es el motor de automatización y chatbot. Sus workflows se guardan en una carpeta local que **no viene incluida en el repositorio** — tienes que añadirla antes de arrancar Docker.

> **Ruta A:** habrás recibido un archivo `n8n-data.zip`.
> **Ruta B:** no tienes este archivo. Pasa directamente al paso 7 — n8n arrancará vacío y configurarás los workflows manualmente después (ver paso 8.5).

### 6.1 — Descomprimir el ZIP

1. Localiza el archivo `n8n-data.zip` (probablemente en Descargas).
2. Haz **clic derecho** sobre el ZIP.
3. Haz clic en **"Extraer todo..."**.

[FOTO — Menú contextual del ZIP con "Extraer todo..." señalado]

4. En la ventana que aparece, deja la ruta por defecto y haz clic en **Extraer**.

[FOTO — Ventana "Extraer archivos comprimidos" con el botón Extraer señalado]

5. Se crea una carpeta. Ábrela. Debe contener una carpeta llamada `data` con esta estructura:

```
data/
├── n8n/
└── postgres/
```

[FOTO — Explorador de archivos mostrando la carpeta data con las subcarpetas n8n y postgres]

**Error: dentro del ZIP no hay carpeta `data` o la estructura es diferente**
El archivo no es el correcto. Pide el ZIP de n8n de nuevo.

---

### 6.2 — Mover la carpeta `data` al proyecto

La carpeta `data` tiene que quedar aquí:

```
TFG-PERREOFC/
└── n8n-local/
    └── data/        ← aquí
        ├── n8n/
        └── postgres/
```

**Con el Explorador de archivos:**

1. Abre el Explorador (Windows + E).
2. En una ventana navega hasta donde extrajiste el ZIP y abre la carpeta `data`.
3. Abre otra ventana del Explorador (Ctrl+N) y navega hasta `TFG-PERREOFC` → `n8n-local`.
4. Arrastra la carpeta `data` desde la primera ventana hasta `n8n-local` en la segunda.

[FOTO — Dos ventanas del Explorador: a la izquierda la carpeta data extraída, a la derecha n8n-local, con una flecha indicando el arrastre]

**Con PowerShell** (si el ZIP se extrajo en Descargas):

```
Move-Item -Path "$HOME\Downloads\n8n-data\data" -Destination "n8n-local\data"
```

Ajusta la ruta según el nombre de la carpeta donde se extrajo el ZIP.

**Salida esperada:** ninguna (silencio = éxito).

---

### 6.3 — Verificar que está en su sitio

```
ls n8n-local\data
```

**Salida esperada:**
```
    Directory: C:\Users\TuNombre\Documents\TFG-PERREOFC\n8n-local\data

Mode    Name
----    ----
d----   n8n
d----   postgres
```

**Error: `Cannot find path 'n8n-local\data'` o lista vacía**
La carpeta no está en el sitio correcto. Vuelve al paso 6.2.

---

## 7. Arrancar el sistema

Un solo comando arranca los 6 servicios del sistema.

### 7.1 — Confirmar que Docker Desktop está en marcha

Antes de continuar, mira la barra del sistema (esquina inferior derecha). El icono de Docker debe decir **"Docker Desktop is running"**.

[FOTO — Icono de Docker en la barra del sistema con el tooltip "Docker Desktop is running"]

Si no está en marcha, ábrelo desde el menú de inicio y espera hasta que diga "running".

---

### 7.2 — Abrir PowerShell en la carpeta del proyecto

Abre PowerShell (Windows → "powershell" → Enter) y escribe:

```
cd $HOME\Documents\TFG-PERREOFC
```

**Salida esperada:**
```
PS C:\Users\TuNombre\Documents\TFG-PERREOFC>
```

Comprueba que `docker-compose.dev.yml` está ahí:

```
ls docker-compose.dev.yml
```

**Salida esperada:**
```
-a---   docker-compose.dev.yml
```

**Error: `ls : Cannot find path 'docker-compose.dev.yml'`**
No estás en la carpeta correcta. Repite el `cd` con la ruta correcta. Si guardaste el proyecto en otro sitio, ajusta la ruta.

---

### 7.3 — Ejecutar el arranque

```
docker compose -f docker-compose.dev.yml up --build
```

**No cierres esta ventana de PowerShell.** El sistema corre mientras esta ventana está abierta.

**La primera vez tarda entre 5 y 20 minutos.** Docker descarga las imágenes base (Node.js, PostgreSQL, n8n, Playwright) e instala dependencias. Verás mucho texto desfilando.

**Salida esperada durante el arranque** (aparece de forma progresiva):

```
[+] Building 142.3s (47/47) FINISHED
[+] Running 6/6
 ✔ Container perreofc-dev-postgres-1   Started
 ✔ Container perreofc-dev-n8n-1        Started
 ✔ Container perreofc-dev-n8n-chat-1   Started
 ✔ Container perreofc-dev-scraper-1    Started
 ✔ Container perreofc-dev-backend-1    Started
 ✔ Container perreofc-dev-frontend-1   Started
```

Después verás los logs de los servicios mezclados. Busca estas líneas clave:

```
postgres     | database system is ready to accept connections
n8n          | Editor is now accessible via: http://localhost:5678
n8n-chat     | Server listening on port 3002
scraper      | Server listening on port 3001
backend      | Server listening on port 3000
frontend     | › Metro waiting on exp://192.168.x.x:8081
```

Cuando aparezca la línea de `frontend` con `exp://...` → **el sistema está completamente levantado**.

[FOTO — PowerShell mostrando los logs de arranque con las líneas de "listening on port" de cada servicio]

---

**Error: `'docker' is not recognized` o `docker: command not found`**
Docker Desktop no está instalado o no está en marcha. Vuelve al [paso 2](#2-instalar-docker-desktop).

**Error: `error during connect: ... pipe/docker_engine`**
Docker Desktop está instalado pero no está arrancado. Ábrelo desde el menú de inicio y espera a que diga "running". Luego vuelve a ejecutar el comando.

**Error: `Cannot find or load the Docker Compose file`**
No estás en la carpeta `TFG-PERREOFC`. Ejecuta `ls` y verifica que ves `docker-compose.dev.yml`. Si no, ejecuta `cd $HOME\Documents\TFG-PERREOFC` y vuelve a intentarlo.

**Error: `bind: address already in use` / `port is already allocated`**
Otro programa ocupa el mismo puerto. Para identificarlo (ejemplo con el puerto 3000):
```
netstat -ano | findstr :3000
```
**Salida esperada:**
```
  TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345
```
El número al final (12345) es el ID del proceso. Para cerrarlo:
```
Stop-Process -Id 12345 -Force
```
Vuelve a intentar `docker compose up --build`.

**Error: un servicio aparece como `Exit 1` inmediatamente**
Hay un error en la configuración. Abre **una segunda ventana de PowerShell** (no cierres la que tiene los logs) y escribe:
```
cd $HOME\Documents\TFG-PERREOFC
docker compose -f docker-compose.dev.yml logs backend
```
Sustituye `backend` por el nombre del servicio que falla. El error al final de los logs te dice exactamente qué está mal. La causa más frecuente es un `.env` con algún campo vacío o incorrecto.

**Error: `no space left on device`**
Docker se quedó sin espacio. Limpia lo que no uses:
```
docker system prune -a
```
Cuando pregunte `Are you sure you want to continue? [y/N]`, escribe `y` y Enter.
**Salida esperada:**
```
Deleted Images: ...
Total reclaimed space: X.XGB
```
Luego vuelve a intentar `docker compose up --build`.

---

### 7.4 — Arranques posteriores (a partir de la segunda vez)

Una vez construido, arrancar es mucho más rápido:

```
docker compose -f docker-compose.dev.yml up -d
```

El `-d` hace que corra en segundo plano (no ocupa la ventana de PowerShell).

**Salida esperada:**
```
[+] Running 6/6
 ✔ Container perreofc-dev-postgres-1   Running
 ✔ Container perreofc-dev-n8n-1        Started
 ✔ Container perreofc-dev-n8n-chat-1   Started
 ✔ Container perreofc-dev-scraper-1    Started
 ✔ Container perreofc-dev-backend-1    Started
 ✔ Container perreofc-dev-frontend-1   Started
```

Para ver los logs cuando corre en segundo plano:

```
docker compose -f docker-compose.dev.yml logs -f
```

Pulsa **Ctrl+C** para dejar de ver los logs (los servicios siguen corriendo).

---

## 8. Verificar que todo funciona

Con el sistema arrancado, comprueba cada servicio.

### 8.1 — Estado general de los contenedores

Abre una nueva ventana de PowerShell (sin cerrar la que tiene el sistema) y escribe:

```
cd $HOME\Documents\TFG-PERREOFC
docker compose -f docker-compose.dev.yml ps
```

**Salida esperada:**
```
NAME                           STATUS           PORTS
perreofc-dev-postgres-1        Up (healthy)     5432/tcp
perreofc-dev-n8n-1             Up               0.0.0.0:5678->5678/tcp
perreofc-dev-n8n-chat-1        Up               0.0.0.0:3002->3002/tcp
perreofc-dev-scraper-1         Up               0.0.0.0:3001->3001/tcp
perreofc-dev-backend-1         Up               0.0.0.0:3000->3000/tcp
perreofc-dev-frontend-1        Up               0.0.0.0:8081->8081/tcp
```

Todos deben decir **Up**. PostgreSQL además debe decir **(healthy)**.

**Si alguno dice `Exit` o `Restarting`:**
```
docker compose -f docker-compose.dev.yml logs <nombre-del-servicio>
```
Ejemplo: `docker compose -f docker-compose.dev.yml logs scraper`

---

### 8.2 — Backend API

Abre el navegador y ve a:

```
http://localhost:3000/api/v1/health
```

**Salida esperada en el navegador:**
```json
{"status":"ok"}
```

[FOTO — Navegador mostrando la respuesta JSON del health check del backend]

**Error: "No se puede acceder a este sitio" o "ERR_CONNECTION_REFUSED"**
El backend no está corriendo. Revisa su estado: `docker compose -f docker-compose.dev.yml logs backend`

---

### 8.3 — Scraper

Abre en el navegador:

```
http://localhost:3001/health
```

**Salida esperada:**
```json
{"status":"ok"}
```

---

### 8.4 — Chat server

Abre en el navegador:

```
http://localhost:3002/health
```

**Salida esperada:**
```json
{"status":"ok"}
```

---

### 8.5 — n8n (workflows y chatbot)

Abre en el navegador:

```
http://localhost:5678
```

**Salida esperada:** pantalla de inicio de sesión de n8n.

[FOTO — Pantalla de login de n8n con los campos de usuario y contraseña]

Introduce las credenciales que hay en el `.env`:
- **Usuario:** el valor de `N8N_BASIC_AUTH_USER`
- **Contraseña:** el valor de `N8N_BASIC_AUTH_PASSWORD`

**Salida esperada tras iniciar sesión:** el panel principal de n8n con los workflows ya configurados y activos.

[FOTO — Panel de n8n mostrando la lista de workflows con el interruptor "Active" en verde]

---

**Error: n8n abre pero está vacío (sin workflows)**

Los datos de n8n no se cargaron. Para solucionarlo:

```
docker compose -f docker-compose.dev.yml down
```

Vuelve al [paso 6](#6-poner-los-datos-de-n8n), verifica que `n8n-local\data\` tiene `n8n` y `postgres` dentro, y vuelve a ejecutar `docker compose up -d`.

**Si después de ese proceso n8n sigue vacío**, importa los workflows manualmente:

1. En n8n, haz clic en el botón **"+"** arriba a la izquierda para crear un workflow.
2. Dentro del workflow, haz clic en los tres puntos `...` (arriba a la derecha) → **Import from file**.
3. Selecciona el archivo `.json` del workflow.
4. Repite para cada workflow.
5. En cada workflow, activa el interruptor **Active** (arriba a la derecha del editor).

[FOTO — Botón Import from file dentro del editor de un workflow de n8n]

**Error: n8n da errores de base de datos al arrancar**

La carpeta `postgres` del ZIP puede tener conflictos con la instalación actual. Solución (esto borra los datos de n8n — tendrás que importar los workflows manualmente):

```
docker compose -f docker-compose.dev.yml down
Remove-Item -Recurse -Force n8n-local\data\postgres
docker compose -f docker-compose.dev.yml up -d
```

---

### Resumen de accesos del sistema

| Servicio | URL |
|---|---|
| Backend API | http://localhost:3000 |
| Scraper | http://localhost:3001 |
| Chat server | http://localhost:3002 |
| n8n (automatización) | http://localhost:5678 |
| App web (navegador) | http://localhost:8081 |

---

## 9. Abrir la app en el móvil

La app está diseñada para móvil. El teléfono y el ordenador deben estar en la **misma red WiFi**.

### 9.1 — Instalar Expo Go en el móvil

- **Android:** abre la Play Store, busca **"Expo Go"** e instala la app de Expo Inc.
- **iPhone:** abre la App Store, busca **"Expo Go"** e instala la app de Expo Inc.

[FOTO — Expo Go en la Play Store o App Store]

---

### 9.2 — Obtener la URL o el QR de la app

En PowerShell, escribe:

```
docker compose -f docker-compose.dev.yml logs frontend
```

**Salida esperada** (busca estas líneas):
```
frontend  | › Metro waiting on exp://192.168.1.50:8081
frontend  | › Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

También puede aparecer un QR en ASCII (una cuadrícula de caracteres `█`).

[FOTO — Terminal mostrando el QR en ASCII y la URL exp:// del frontend]

---

### 9.3 — Abrir la app

**En Android:**
1. Abre Expo Go.
2. Pulsa **"Scan QR code"**.
3. Apunta al QR de la terminal.

O sin QR: en Expo Go, pulsa el icono de búsqueda y escribe la URL `exp://192.168.x.x:8081` (con tu IP).

**En iPhone:**
1. Abre la app **Cámara** (la cámara del sistema, no Expo Go).
2. Apunta al QR.
3. Toca la notificación que aparece en la parte superior.
4. Se abre Expo Go con la app.

**Salida esperada:** la app PerreoFC carga en el móvil.

[FOTO — App PerreoFC abriendo en el móvil con la pantalla de inicio]

---

**Error: la app no carga o da error de red**

1. Comprueba que el móvil está en el **mismo WiFi** que el ordenador.
2. Tu IP puede haber cambiado. Repite el [paso 5](#5-ajustar-la-ip-local-en-el-env) para actualizarla y luego reinicia el frontend:
   ```
   docker compose -f docker-compose.dev.yml restart frontend
   ```
   Espera 1 minuto y vuelve a escanear el QR.

**Error: "Something went wrong" / pantalla roja en el móvil**
Agita el teléfono → pulsa **Reload** en el menú que aparece. Si persiste:
```
docker compose -f docker-compose.dev.yml logs -f frontend
```
El error concreto aparecerá al final de los logs.

**Error: el QR no aparece en los logs**
El frontend todavía está arrancando. Espera 2-3 minutos y vuelve a ejecutar el comando de logs.

**Alternativa sin móvil — versión web:**
Abre directamente en el navegador del ordenador: `http://localhost:8081`

---

## 10. Parar el sistema

Cuando termines, para los servicios para liberar recursos:

```
cd $HOME\Documents\TFG-PERREOFC
docker compose -f docker-compose.dev.yml down
```

**Salida esperada:**
```
[+] Running 7/7
 ✔ Container perreofc-dev-frontend-1   Removed
 ✔ Container perreofc-dev-backend-1    Removed
 ✔ Container perreofc-dev-scraper-1    Removed
 ✔ Container perreofc-dev-n8n-chat-1   Removed
 ✔ Container perreofc-dev-n8n-1        Removed
 ✔ Container perreofc-dev-postgres-1   Removed
 ✔ Network perreofc-dev_perreofc       Removed
```

> Los datos no se pierden. La base de datos principal (Supabase) está en la nube. Los datos de n8n están guardados en `n8n-local\data\` en tu disco.

**Para volver a arrancar:**

```
docker compose -f docker-compose.dev.yml up -d
```

**Salida esperada:**
```
[+] Running 6/6
 ✔ Container perreofc-dev-postgres-1   Healthy
 ✔ Container perreofc-dev-n8n-1        Started
 ...
```

---

## Apéndice B.1 — Crear credenciales desde cero

> **Solo para la Ruta B.** Si tienes el `.env` ya preparado (Ruta A), ignora esta sección.

Necesitas crear cuentas en tres servicios: **Supabase** (base de datos), **Gmail** (correo) y **Expo** (frontend móvil). Después rellenas el `.env` con los valores obtenidos.

---

### B.1.1 — Crear una copia del `.env` de ejemplo

En PowerShell, dentro de la carpeta del proyecto:

```
Copy-Item .env.example .env
```

**Salida esperada:** ninguna (silencio = éxito).

Abre el `.env` creado con el Bloc de notas para editarlo:
1. Explorador de archivos → `TFG-PERREOFC` → clic derecho sobre `.env` → Abrir con → Bloc de notas.
2. Deja el archivo abierto mientras completas los pasos siguientes.

---

### B.1.2 — Crear proyecto en Supabase (base de datos)

1. Abre el navegador y ve a: **https://supabase.com**
2. Haz clic en **"Start your project"** o **"Sign up"**.
3. Regístrate con tu email de Google o con usuario y contraseña.
4. Una vez dentro del panel, haz clic en **"New project"**.

[FOTO — Panel de Supabase con el botón "New project" señalado]

5. Rellena los campos:
   - **Name:** pon cualquier nombre (ejemplo: `perreofc`)
   - **Database Password:** elige una contraseña segura. **Guárdala**, la necesitarás.
   - **Region:** elige **West EU (Ireland)** o similar.
6. Haz clic en **"Create new project"**.
7. Espera 1-2 minutos. Verás una pantalla de carga.

[FOTO — Pantalla de carga "Setting up project" de Supabase]

8. Cuando termine, ve a **Project Settings** (icono de engranaje en el menú lateral izquierdo) → **API**.

[FOTO — Panel de Supabase con Settings → API abierto mostrando las tres claves]

9. Copia estos tres valores y pégalos en el `.env`:

| Campo en Supabase | Variable en `.env` |
|---|---|
| Project URL | `SUPABASE_URL` |
| anon / public | `SUPABASE_ANON_KEY` |
| service_role | `SUPABASE_SERVICE_KEY` |

Ejemplo de cómo quedan en el `.env`:
```
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Error: el proyecto de Supabase tarda más de 5 minutos en crearse**
Refresca la página. Si sigue en carga, cierra y vuelve a entrar en supabase.com — el proyecto probablemente ya se creó.

---

### B.1.3 — Configurar Gmail para envío de correos

La app envía emails de verificación. Para eso necesitas una cuenta Gmail con una "contraseña de aplicación".

1. Inicia sesión en tu cuenta de Gmail en **https://mail.google.com**.
2. Haz clic en el círculo con tu foto (arriba a la derecha) → **"Gestionar tu cuenta de Google"**.
3. En la pantalla de tu cuenta, haz clic en **"Seguridad"** en el menú lateral.
4. Activa la **"Verificación en dos pasos"** si no la tienes activa (es un requisito de Google).

[FOTO — Pantalla de Seguridad de Google con "Verificación en dos pasos" activada]

5. Una vez activa la verificación en dos pasos, busca en la misma página de Seguridad la opción **"Contraseñas de aplicaciones"**. Si no la ves, búscala en el buscador de la página de tu cuenta de Google.

[FOTO — Sección "Contraseñas de aplicaciones" en la página de Seguridad de Google]

6. Haz clic en **"Contraseñas de aplicaciones"**.
7. En el menú desplegable **"Seleccionar aplicación"** elige **"Correo"** y en **"Seleccionar dispositivo"** elige **"Otro (nombre personalizado)"** → escribe `PerreoFC`.
8. Haz clic en **Generar**.

[FOTO — Resultado de generar la contraseña de aplicación: un código de 16 caracteres en cuadros amarillos]

9. Aparece una contraseña de **16 caracteres** (ejemplo: `abcd efgh ijkl mnop`). **Cópiala ahora**, no se vuelve a mostrar.
10. Pégala en el `.env`:

```
GMAIL_USER=tu.cuenta@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

> Escribe la contraseña sin espacios aunque se muestre con espacios en pantalla.

**Error: no encuentro "Contraseñas de aplicaciones"**
Esta opción solo aparece si la verificación en dos pasos está activa. Actívala y vuelve a buscarla.

---

### B.1.4 — Crear cuenta de Expo (frontend móvil)

1. Ve a: **https://expo.dev**
2. Haz clic en **"Sign up"** (esquina superior derecha).
3. Regístrate con tu email.
4. Una vez dentro, haz clic en tu avatar (arriba a la derecha) → **"Account Settings"**.
5. En el menú lateral, haz clic en **"Access Tokens"**.
6. Haz clic en **"Create token"**.
7. Ponle un nombre (ejemplo: `perreofc-dev`) y haz clic en **Create**.

[FOTO — Página de Access Tokens de Expo con el token recién creado]

8. Copia el token y pégalo en el `.env`:

```
EXPO_TOKEN=tu_token_aqui
```

---

### B.1.5 — Rellenar el resto del `.env`

Los campos restantes del `.env` puedes dejarlos con sus valores por defecto o cambiarlos:

```env
# Puerto del backend (deja 3000 si no tienes conflictos)
API_PORT=3000

# ID del equipo en la RFFM (no cambiar)
OWN_TEAM_ID=24141910

# n8n — elige contraseñas propias
POSTGRES_PASSWORD=elige_una_contraseña
N8N_ENCRYPTION_KEY=genera_una_cadena_larga_aleatoria_aqui
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=elige_una_contraseña

# (el resto de variables déjalas como están)
```

Para generar una cadena aleatoria para `N8N_ENCRYPTION_KEY`, abre PowerShell y escribe:

```
[System.Web.Security.Membership]::GeneratePassword(32, 0)
```

**Salida esperada:** una cadena de 32 caracteres aleatorios. Cópiala al `.env`.

Guarda el `.env` con **Ctrl+S**.

Ahora **vuelve al paso 5** del manual principal para ajustar la IP.

---

## Apéndice B.2 — Aplicar el esquema SQL en Supabase

> **Solo para la Ruta B.** Si usas el `.env` compartido (Ruta A), la base de datos ya tiene todo creado. Ignora esta sección.

Con el proyecto de Supabase creado en el paso B.1.2, la base de datos está vacía. Necesitas ejecutar 39 scripts SQL que crean las tablas.

1. Abre el navegador y ve a: **https://supabase.com/dashboard**
2. Haz clic en tu proyecto.
3. En el menú lateral izquierdo, haz clic en **"SQL Editor"**.

[FOTO — Panel de Supabase con "SQL Editor" señalado en el menú lateral]

4. Los scripts están en la carpeta `perreofc-back/docs/sql/` del proyecto. Ejecútalos en orden numérico: `001_initial_schema.sql`, `002_...`, hasta `039_...`.

Para cada script:
1. Abre el archivo con el Bloc de notas o VS Code.
2. Selecciona todo (`Ctrl+A`) y copia (`Ctrl+C`).
3. Pega en el SQL Editor de Supabase (`Ctrl+V`).
4. Haz clic en el botón **"Run"** o pulsa **Ctrl+Enter**.

**Salida esperada:**
```
Success. No rows returned
```

[FOTO — SQL Editor de Supabase con el mensaje "Success. No rows returned" en verde]

**Si aparece texto en rojo con `already exists`:** ese objeto ya se creó antes. Es inofensivo, continúa con el siguiente script.

**Si aparece un error real en rojo:** anota el mensaje y revisa que estás ejecutando los scripts en orden. Un script que depende de otro que no se ejecutó dará error.

5. Cuando termines los 39 scripts, verifica en **Table Editor** (menú lateral) que aparecen las tablas: `teams`, `users`, `matches`, `bets`, `news`, etc.

[FOTO — Table Editor de Supabase mostrando la lista de tablas creadas]

Una vez aplicado el esquema, **vuelve al paso 5** del manual principal.
