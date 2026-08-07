# Arquitectura de IA y credenciales

## Objetivo

Las herramientas eligen proveedor, modelo y una referencia de credencial. Los secretos se administran fuera de la configuración funcional y nunca se guardan dentro del código fuente, los workspaces ni `runtime/`.

## Límites

- `src/platform/ai/` contiene contratos, registro de proveedores, cliente común y adaptadores reutilizables por aplicaciones web.
- `src/<herramienta>/` conserva prompts, validaciones y tareas propias del dominio.
- `api/ai/` recibe solicitudes comunes y selecciona la capacidad autorizada y el adaptador del proveedor.
- `local_tools/<herramienta>/` contiene ejecutables locales independientes; no aloja módulos React compartidos.
- `runtime/<herramienta>/` contiene sesiones técnicas, caché, resultados y logs ignorados por Git. No es un almacén permanente de secretos.

## Identidad de credenciales

Una credencial se identifica al menos por:

```text
ownerId + toolId + provider + credentialId
```

La configuración de una herramienta sólo conserva una referencia no secreta:

```json
{
  "provider": "openai",
  "credentialRef": {
    "id": "novel-studio:openai",
    "toolId": "novel-studio",
    "provider": "openai",
    "scope": "session"
  },
  "model": "modelo-seleccionado"
}
```

## Implementación actual

OpenAI usa un almacén en memoria limitado a la pestaña. La clave:

- no se escribe en `preferences.json`;
- no se incluye en los respaldos ZIP;
- no se guarda en `localStorage`, `sessionStorage` ni `runtime/`;
- se envía únicamente al endpoint común mediante el encabezado `Authorization`;
- debe introducirse nuevamente después de cerrar o recargar la pestaña.

Ollama se ejecuta directamente contra el servicio del mismo dispositivo y su adaptador reutilizable restringe las direcciones a loopback.

## Evolución multiusuario

La interfaz de credenciales debe conservarse y reemplazar el almacén en memoria por un adaptador de servidor. La sesión autenticada identifica al usuario, pero no contiene el secreto. El servidor resuelve `credentialId`, verifica que pertenece al usuario y descifra la clave sólo al invocar el proveedor.

La implementación futura debe incluir cifrado en reposo, rotación, revocación, auditoría sin secretos y autorización por herramienta. Las respuestas de estado sólo exponen si la credencial está configurada y su etiqueta; nunca devuelven la clave.

## Servicio local opcional

Sólo debe crearse `local_tools/ai_gateway/` cuando una herramienta independiente necesite compartir recursos del dispositivo con la aplicación web. Ese servicio deberá usar el almacén seguro del sistema operativo, restringir orígenes, autenticarse incluso en loopback y escribir sus archivos operativos bajo `runtime/ai_gateway/`.
