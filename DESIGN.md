---
version: alpha
name: Meta-design-for-expense-tracker
description: Meta's retail design system adapted for expense tracking. Stark white canvas, black pill primary buttons, cobalt blue (#0064E0) for purchase/save actions, Optimistic VF typography (fallback: Montserrat), rounded-2xl (16px) cards, rounded-full (100px) pill buttons, flat surfaces with minimal elevation.

colors:
  primary: "#000000"
  primary-foreground: "#ffffff"
  secondary: "#0064E0"
  secondary-foreground: "#ffffff"
  canvas: "#ffffff"
  surface-soft: "#f1f4f7"
  ink: "#1c1e21"
  charcoal: "#444950"
  steel: "#5d6c7b"
  stone: "#8595a4"
  hairline: "#ced0d4"
  hairline-soft: "#dee3e9"
  success: "#31a24c"
  warning: "#f7b928"
  critical: "#e41e3f"

typography:
  fontFamily: "Montserrat, Helvetica, Arial, sans-serif"
  heading:
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: -0.14px
  caption:
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.33
  button:
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.43
    letterSpacing: -0.14px

components:
  button-primary:
    backgroundColor: "#000000"
    textColor: "#ffffff"
    rounded: 100px
    padding: "12px 28px"
  button-secondary:
    backgroundColor: "#0064E0"
    textColor: "#ffffff"
    rounded: 100px
    padding: "12px 28px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "#000000"
    border: "2px solid #000000"
    rounded: 100px
    padding: "10px 26px"
  card-default:
    backgroundColor: "#ffffff"
    rounded: 16px
    border: "1px solid #dee3e9"
    padding: 20px
  input:
    backgroundColor: "#ffffff"
    textColor: "#1c1e21"
    rounded: 12px
    border: "1px solid #ced0d4"
    height: 44px
  badge-success:
    backgroundColor: "#31a24c"
    textColor: "#ffffff"
    rounded: 100px
    padding: "4px 10px"
  badge-warning:
    backgroundColor: "#f7b928"
    textColor: "#000000"
    rounded: 100px
    padding: "4px 10px"
  badge-critical:
    backgroundColor: "#e41e3f"
    textColor: "#ffffff"
    rounded: 100px
    padding: "4px 10px"
