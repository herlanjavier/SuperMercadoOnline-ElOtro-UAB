# API Endpoints

Base URL local:

```text
http://localhost:3000/api
```

Autenticación:

```http
Authorization: Bearer ACCESS_TOKEN
```

Respuesta exitosa:

```json
{ "ok": true, "data": {} }
```

Respuesta de error:

```json
{ "ok": false, "message": "Mensaje del error" }
```

## Health

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Verifica que el backend esté funcionando. |

## Auth

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/auth/register-customer` | Público | Registra cliente con rol fijo `customer`. |
| POST | `/auth/login` | Público | Inicia sesión y devuelve tokens, usuario y perfil. |
| POST | `/auth/logout` | Autenticado | Cierra sesión o permite al frontend borrar tokens. |
| GET | `/auth/me` | Autenticado | Devuelve usuario autenticado y perfil. |

Ejemplo login:

```json
{ "email": "usuario@email.com", "password": "Password123" }
```

## Users

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/users/sales-managers` | admin | Crea encargado de ventas. |
| GET | `/users` | admin | Lista usuarios. Query: `role`, `search`, `isActive`. |
| GET | `/users/:id` | admin o propio usuario | Detalle de usuario. |
| PATCH | `/users/:id` | admin o propio usuario | Actualiza perfil. |
| PATCH | `/users/:id/deactivate` | admin | Desactiva usuario. |

## Categories

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/categories` | admin, sales_manager, customer | Lista categorías activas. Query: `includeInactive=true`. |
| POST | `/categories` | admin | Crea categoría. |
| PATCH | `/categories/:id` | admin | Actualiza categoría. |
| DELETE | `/categories/:id` | admin | Desactiva categoría. |

## Products

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/products` | admin, sales_manager, customer | Lista catálogo. Query: `categoryId`, `search`, `onlyAvailable`, `lowStock`, `criticalStock`. |
| GET | `/products/:id` | admin, sales_manager, customer | Detalle de producto. |
| POST | `/products` | admin | Crea producto con `multipart/form-data` e imagen opcional. |
| PATCH | `/products/:id` | admin | Actualiza producto e imagen opcional. |
| DELETE | `/products/:id` | admin | Desactiva producto. |
| PATCH | `/products/:id/restore` | admin | Reactiva producto. |
| DELETE | `/products/:id/image` | admin | Elimina imagen de producto. |

## Suppliers

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/suppliers` | admin | Lista proveedores. Query: `search`, `includeInactive`. |
| GET | `/suppliers/:id` | admin | Detalle de proveedor con productos y últimas entradas. |
| POST | `/suppliers` | admin | Crea proveedor y asociaciones de productos. |
| PATCH | `/suppliers/:id` | admin | Actualiza proveedor. |
| DELETE | `/suppliers/:id` | admin | Desactiva proveedor. |
| PATCH | `/suppliers/:id/restore` | admin | Reactiva proveedor. |
| POST | `/suppliers/:id/products` | admin | Asocia productos. Body: `productIds`. |
| DELETE | `/suppliers/:id/products/:productId` | admin | Quita asociación. |

## Inventory

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/inventory/entries` | admin, sales_manager | Lista entradas. Query: `productId`, `supplierId`, `date`, `from`, `to`, `search`. |
| GET | `/inventory/entries/:id` | admin, sales_manager | Detalle de entrada. |
| POST | `/inventory/entries` | admin | Registra entrada de inventario. |
| GET | `/inventory/summary` | admin, sales_manager | Resumen de inventario. |
| GET | `/inventory/low-stock` | admin, sales_manager | Productos con stock bajo/crítico. |
| GET | `/inventory/notifications` | admin | Lista alertas de stock. |
| PATCH | `/inventory/notifications/:id/read` | admin | Marca alerta como leída. |
| PATCH | `/inventory/notifications/read-all` | admin | Marca todas como leídas. |

## Orders

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/orders` | customer | Crea pedido en `pending_payment`. |
| GET | `/orders/my` | customer | Lista pedidos propios. |
| GET | `/orders` | admin, sales_manager | Lista todos los pedidos. |
| GET | `/orders/:id` | admin, sales_manager o dueño | Detalle de pedido. |
| PATCH | `/orders/:id/cancel` | admin, sales_manager o dueño | Cancela pedidos permitidos. |
| PATCH | `/orders/:id/status` | admin, sales_manager | Cambia estado operativo. |
| PATCH | `/orders/:id/delivery-person` | admin, sales_manager | Registra datos del repartidor. |
| GET | `/orders/status-options` | Autenticado | Lista estados. |
| GET | `/orders/business-hours/current-status` | Autenticado | Estado actual de atención. |
| GET | `/orders/business-hours` | Autenticado | Lista horarios. |
| PATCH | `/orders/business-hours/:dayOfWeek` | admin | Actualiza horario. |

## Payments

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| PATCH | `/payments/orders/:orderId/confirm-qr` | admin, sales_manager | Confirma pago QR, descuenta stock y crea venta. |
| GET | `/payments/orders/:orderId/status` | admin, sales_manager o dueño | Consulta estado de pago. |

## Sales

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/sales` | admin, sales_manager | Lista ventas. Query: `from`, `to`, `customerId`, `soldBy`, `search`. |
| GET | `/sales/:id` | admin, sales_manager o dueño | Detalle de venta. |
| GET | `/sales/order/:orderId` | admin, sales_manager o dueño | Venta por pedido. |
| GET | `/sales/:id/receipt` | admin, sales_manager o dueño | Datos de recibo en JSON. |
| GET | `/sales/:id/receipt/pdf` | admin, sales_manager o dueño | Recibo en PDF. |

## Reports

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/reports/sales` | admin | Reporte de ventas JSON. Query: `date`, `from`, `to`, `month`, `customerId`, `soldBy`. |
| GET | `/reports/sales/pdf` | admin | Reporte de ventas PDF. |
| GET | `/reports/inventory` | admin | Reporte de inventario JSON. Query: `categoryId`, `stockStatus`, `includeInactive`, `from`, `to`, `month`. |
| GET | `/reports/inventory/pdf` | admin | Reporte de inventario PDF. |
| GET | `/reports/dashboard-summary` | admin | Resumen para dashboard. |
| GET | `/reports/top-products` | admin | Productos más vendidos. Query: `from`, `to`, `month`, `limit`. |
| GET | `/reports/sales-by-day` | admin | Ventas agrupadas por día. |
