# Security Notes

- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` en el frontend.
- En React solo usar variables públicas como `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
- El backend usa `SUPABASE_SERVICE_ROLE_KEY` para operaciones internas protegidas.
- `.env` no debe subirse a GitHub y está incluido en `.gitignore`.
- Los clientes nunca pueden cambiar su rol.
- Los clientes no pueden confirmar pagos QR.
- Los clientes no pueden acceder a reportes administrativos.
- Productos, proveedores, inventario y reportes están protegidos por roles.
- Las imágenes de productos pueden ser públicas para visualización, pero la subida está protegida para `admin`.
- Las pruebas automatizadas no deben usar la base de datos real de producción.
