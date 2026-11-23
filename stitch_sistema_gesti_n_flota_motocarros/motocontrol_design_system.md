---
name: "MotoControl"
description: "Sistema de diseño operativo y financiero para la gestión de flotas de motocarros, diseñado para claridad inmediata en métricas, alertas y control diario."
---

## Overview

**MotoControl** es una plataforma de control operativo y financiero diseñada para dueños y administradores de flotas de motocarros. Su personalidad es **precisa, confiable y ágil**: prioriza la lectura instantánea de vencimientos (SOAT, Tecnomecánica), mantenimientos preventivos/correctivos, flujos de caja por cuenta y tarifas diarias sin ruido visual.

El estilo visual sigue una línea **Corporativa Moderna y Técnica** en modo claro, apoyada en capas tonales suaves, bordes de bajo contraste, tipografía geométrica legible y acentos semánticos estrictamente funcionales.

## Colors

La paleta parte de un verde petróleo profundo (`#005C55`) que transmite estabilidad operativa y control financiero, combinado con neutros fríos de alta legibilidad y un acento cálido terracota/ámbar para alertas preventivas. Los colores de estado (`success`, `warning`, `error`) se reservan exclusivamente para indicadores de vigencia, alertas y flujo de dinero (ingresos vs. egresos).

```yaml
colors:
  success: "#166534"
  on-success: "#FFFFFF"
  success-container: "#DCFCE7"
  on-success-container: "#14532D"
  warning: "#92400E"
  on-warning: "#FFFFFF"
  warning-container: "#FEF3C7"
  on-warning-container: "#78350F"
  light:
    primary: "#005C55"
    on-primary: "#FFFFFF"
    primary-container: "#0F766E"
    on-primary-container: "#A3FAEF"
    secondary: "#466460"
    on-secondary: "#FFFFFF"
    secondary-container: "#C5E6E1"
    on-secondary-container: "#173532"
    tertiary: "#7F4025"
    on-tertiary: "#FFFFFF"
    tertiary-container: "#9C573A"
    on-tertiary-container: "#FFE5DB"
    error: "#BA1A1A"
    on-error: "#FFFFFF"
    error-container: "#FFDAD6"
    on-error-container: "#93000A"
    background: "#F7FAF8"
    on-background: "#181C1C"
    surface: "#F7FAF8"
    surface-dim: "#D7DBD9"
    surface-bright: "#F7FAF8"
    surface-container-lowest: "#FFFFFF"
    surface-container-low: "#F1F4F3"
    surface-container: "#EBEFED"
    surface-container-high: "#E5E9E7"
    surface-container-highest: "#E0E3E1"
    on-surface: "#181C1C"
    surface-variant: "#D9E5E2"
    on-surface-variant: "#3E4947"
    outline: "#6E7977"
    outline-variant: "#BDC9C6"
    inverse-surface: "#2D3130"
    inverse-on-surface: "#EEF1F0"
    inverse-primary: "#80D5CB"
    shadow: "#000000"
    scrim: "#000000"
  dark:
    primary: "#80D5CB"
    on-primary: "#003733"
    primary-container: "#0F766E"
    on-primary-container: "#A3FAEF"
    secondary: "#ACCDC8"
    on-secondary: "#173532"
    secondary-container: "#304E4B"
    on-secondary-container: "#C8E9E4"
    tertiary: "#FFB598"
    on-tertiary: "#552007"
    tertiary-container: "#9C573A"
    on-tertiary-container: "#FFE5DB"
    error: "#FFB4AB"
    on-error: "#690005"
    error-container: "#93000A"
    on-error-container: "#FFDAD6"
    background: "#101414"
    on-background: "#E0E3E1"
    surface: "#101414"
    surface-dim: "#101414"
    surface-bright: "#363A39"
    surface-container-lowest: "#0B0F0E"
    surface-container-low: "#181C1C"
    surface-container: "#1C2020"
    surface-container-high: "#262B2A"
    surface-container-highest: "#313635"
    on-surface: "#E0E3E1"
    surface-variant: "#3E4947"
    on-surface-variant: "#BDC9C6"
    outline: "#889391"
    outline-variant: "#3E4947"
    inverse-surface: "#E0E3E1"
    inverse-on-surface: "#2D3130"
    inverse-primary: "#006A63"
    shadow: "#000000"
    scrim: "#000000"
```

## Typography

La jerarquía tipográfica combina **Red Hat Text** en títulos y encabezados para un carácter técnico limpio, **Radio Canada Big** para cuerpo, etiquetas y tablas de alta legibilidad, y **Fira Code** para placas de vehículos, cifras financieras y códigos de referencia (siempre con `tabular-nums`).

```yaml
typography:
  display-lg:
    fontFamily: "Red Hat Text"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 44px
    letterSpacing: -0.5px
  display-lg-mobile:
    fontFamily: "Red Hat Text"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 36px
    letterSpacing: -0.25px
  headline-lg:
    fontFamily: "Red Hat Text"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 36px
    letterSpacing: -0.25px
  headline-md:
    fontFamily: "Red Hat Text"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: 0px
  headline-sm:
    fontFamily: "Red Hat Text"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: 0px
  body-lg:
    fontFamily: "Radio Canada Big"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  body-md:
    fontFamily: "Radio Canada Big"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
  body-sm:
    fontFamily: "Radio Canada Big"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0.1px
  label-lg:
    fontFamily: "Radio Canada Big"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0.1px
  label-md:
    fontFamily: "Radio Canada Big"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.2px
  label-sm:
    fontFamily: "Radio Canada Big"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 14px
    letterSpacing: 0.3px
  mono-md:
    fontFamily: "Fira Code"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 18px
    letterSpacing: 0px
```

## Layout & Spacing

En escritorio (`>= 1024px`) la aplicación utiliza un **shell con barra lateral fija** (`256px`) y un área principal fluida con grilla de 12 columnas, márgenes de página de `24px` y separación uniforme de `16px` a `24px` entre tarjetas. En móvil (`< 768px`), la barra lateral se oculta tras un botón de menú superior y las grillas colapsan a una sola columna. Toda la escala de espaciado es múltiplo de `4px`.

```yaml
spacing:
  gutter-xs: 4px
  gutter-sm: 8px
  gutter-md: 16px
  gutter-lg: 24px
  gutter-xl: 32px
  section: 40px
  page-margin: 24px
```

## Elevation & Depth

La jerarquía visual se construye mediante **capas tonales y bordes de bajo contraste** (`outline-variant`), evitando sombras pesadas. El fondo general usa `surface` (`#F7FAF8`), las tarjetas principales elevan a `surface-container-lowest` (`#FFFFFF`) con borde fino `outline-variant`, y los bloques secundarios o encabezados de tabla usan `surface-container-low` (`#F1F4F3`).

## Shapes

Las esquinas son moderadamente redondeadas para equilibrar precisión técnica con cercanía operativa: `8px` (`DEFAULT`) en botones e inputs, `12px` (`md`) en tarjetas y paneles, y `9999px` (`full`) en etiquetas de estado y avatares.

```yaml
rounded:
  sm: 4px
  DEFAULT: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
```

## Motion & Micro-interaction

Las transiciones son rápidas y discretas: cambios de estado en botones, filtros y filas de tabla responden en `100ms` (`ease-out`), mientras que la apertura de cajones laterales o modales usa `220ms` con desaceleración suave. Se respetan `prefers-reduced-motion` y solo se animan `transform`, `opacity` y color.

```yaml
motion:
  state-change:
    duration: 100ms
    delay: 0ms
    timingFunction: ease-out
  surface-enter:
    duration: 220ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
  surface-exit:
    duration: 150ms
    delay: 0ms
    timingFunction: cubic-bezier(0.3, 0, 1, 1)
```

## Voice & Content Strategy

- **Tono de voz:** Directo, claro y operativo en español colombiano/latinoamericano. Sin tecnicismos innecesarios ni frases de relleno.
- **Capitalización:** Tipo oración (*Sentence case*) en títulos, botones y encabezados de tabla (`Próximos mantenimientos`, `Registrar gasto`).
- **Terminología:** Usar siempre *Motocarro* (no "tuk-tuk" ni "unidad"), *Conductor*, *SOAT*, *Tecnomecánica*, *Tarifa diaria*, *Preventivo* y *Correctivo*.
- **Acciones:** Verbos concretos con objeto (`Registrar movimiento`, `Filtrar fechas`, `Programar mantenimiento`).
- **Números y fechas:** Moneda en pesos colombianos (`$ 1.450.000`) con `tabular-nums`, fechas cortas (`22 nov 2026`) y placas en mayúsculas monoespaciadas (`MCT-402`).

## Components

Component implementations live as individual HTML sticker sheet files in
`components/`. Each file contains the canonical, styled HTML components with
`<!-- COMPONENT: name -->` comment markers. Read each file before use.

- **Alert** → `@components/alert.html`: `alert-info`
- **Badge** → `@components/badge.html`: `badge-numeric`, `badge-dot`
- **Button** → `@components/button.html`: `button-primary`, `button-icon`, `button-with-icon`
- **Card** → `@components/card.html`: `card-elevated`, `card-action`, `card-interactive`, `card-interactive-2`
- **Table** → `@components/table.html`: `table-standard`, `table-interactive`, `table-selectable`
