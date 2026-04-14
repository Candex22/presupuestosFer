# 🧾 Generador de Presupuestos — Servicios FB

Herramienta web para generar presupuestos profesionales en PDF, diseñada para **Servicios FB** (Electricidad residencial & Obra). No requiere backend ni instalación: funciona directamente en el navegador.

---

## 📁 Estructura del proyecto

```
├── index.html     # Estructura principal de la app
├── style.css      # Estilos (responsive, diseño de la UI)
├── script.js      # Lógica de items, cálculos y generación de PDF
└── fb.png         # Logo de la empresa (se incluye en el PDF)
```

---

## ✨ Funcionalidades

- **Alta de ítems dinámica** — Agregá y eliminá ítems con descripción, precio y cantidad; el total se calcula automáticamente.
- **Vista previa del PDF** — El PDF generado se muestra en un iframe dentro de la misma página antes de descargarlo.
- **Generación de PDF profesional** — Usando [jsPDF](https://github.com/parallax/jsPDF), se genera un documento A4 con:
  - Logo de la empresa
  - Número de presupuesto, fecha de emisión y fecha de validez
  - Tabla de ítems con descripción, precio unitario, cantidad y total por línea
  - Salto de página automático si los ítems no entran en una sola hoja
  - Sección de equipamiento / información adicional
  - Nota al pie personalizable
  - Barra de total destacada
  - Pie de página con firma en cada hoja
- **Descarga directa** — El PDF se descarga con nombre automático: `Presupuesto_NNNN_Cliente.pdf`.
- **Diseño responsive** — Funciona en escritorio y móvil.

---

## 🚀 Uso

1. Abrí `index.html` en cualquier navegador moderno (Chrome, Firefox, Edge).
2. Completá los datos del cliente y la configuración en el panel izquierdo.
3. Agregá los ítems del presupuesto en la tabla.
4. Hacé clic en **Generar PDF** para ver la vista previa.
5. Usá el botón **Descargar** para guardar el archivo.

> ⚠️ El archivo `fb.png` debe estar en la misma carpeta que `index.html` para que el logo aparezca en el PDF.

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|---|---|
| HTML5 / CSS3 | Estructura y estilos de la interfaz |
| JavaScript (vanilla) | Lógica de la app, manejo de ítems, cálculos |
| [jsPDF 2.5.1](https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js) | Generación del PDF en el cliente |
| Google Fonts (Inter, Barlow Condensed) | Tipografía |

---

## ⚙️ Personalización

Para adaptar la herramienta a otra empresa, modificá en `script.js` las siguientes líneas:

```js
// Nombre de la empresa en el PDF
doc.text("Servicios FB", 50, 30);
doc.text("Electricidad residencial & Obra", 50, 36);

// Texto del pie de página
doc.text('Gracias por confiar en nosotros', 18, FOOTER_Y + 8);
```

Y reemplazá `fb.png` con el logo correspondiente (PNG recomendado, fondo transparente).

---

## 📄 Licencia

Uso interno — Servicios FB.
