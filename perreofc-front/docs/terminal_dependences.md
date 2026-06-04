<!--
Project documentation for the frontend area: terminal dependences.
It records setup, architecture or feature notes for app development.
-->

# Dependencias para arrancar el proyecto

Este proyecto es una app **Expo / React Native** y usa **npm** porque el repositorio trae `package-lock.json`.

## 1. Instalar Node.js

En Windows, abre PowerShell y comprueba si ya tienes Node y npm:

```powershell
node -v
npm -v
```

Si esos comandos no existen, instala Node.js LTS:

```powershell
winget install OpenJS.NodeJS.LTS
```

Cierra y vuelve a abrir la terminal despues de instalarlo. Se recomienda usar Node.js LTS.

## 2. Entrar en la carpeta del proyecto

```powershell
cd "C:\Users\veram\Desktop\TFG\TFG-PERREOFC-FRONT"
```

## 3. Instalar las dependencias del proyecto

Como existe `package-lock.json`, usa `npm ci` para instalar exactamente las versiones bloqueadas:

```powershell
npm ci
```

Si `npm ci` fallase por algun problema con el lockfile, prueba:

```powershell
npm install
```

## 4. Arrancar Expo

```powershell
npm run start
```

Tambien puedes usar directamente:

```powershell
npx expo start
```

Despues de arrancar, Expo mostrara un QR y varias opciones en la terminal.

## 5. Ejecutar la app

Para abrirla en navegador:

```powershell
npm run web
```

Para abrirla en Android:

```powershell
npm run android
```

Necesitas tener instalado **Android Studio** con un emulador configurado, o usar la app **Expo Go** en un movil Android y escanear el QR que muestra Expo.

Para iOS:

```powershell
npm run ios
```

Este comando solo funciona en macOS con Xcode instalado. En Windows no se puede ejecutar el simulador de iOS.

## 6. Comando habitual para trabajar

Normalmente, cada vez que abras el proyecto:

```powershell
cd "C:\Users\veram\Desktop\TFG\TFG-PERREOFC-FRONT"
npm run start
```

## 7. Posible aviso sobre fuentes

En `app.json` se referencian estas fuentes locales:

```text
assets/fonts/BebasNeue-Regular.ttf
assets/fonts/Inter-Regular.ttf
assets/fonts/Inter-Medium.ttf
assets/fonts/Inter-SemiBold.ttf
assets/fonts/Inter-Bold.ttf
```

Ahora mismo en `assets/fonts` solo aparece `SpaceMono-Regular.ttf`. Si Expo falla diciendo que no encuentra esas fuentes, hay que anadir esos archivos `.ttf` a `assets/fonts` o cambiar la configuracion de fuentes en `app.json`.
