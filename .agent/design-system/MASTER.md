# Shopee Sales Tracker - UI/UX Design System

_Manually generated using UI/UX Pro Max Reasoning_

## 1. High-Level Strategy

- **Category**: SaaS Analytics Dashboard
- **Core Pattern**: Data-Dense Dashboard (Rule #19) + Feature-Rich Showcase (Rule #3)
- **Target Style**: Soft UI Evolution (Style #20)
  - _Keywords_: Better contrast, modern aesthetics, subtle depth, accessibility-focused.
- **Reasoning**:
  - Analytics dashboards require high readability and clear hierarchy.
  - "Soft UI Evolution" provides depth without clutter, making long usage comfortable.
  - "Soft shadows" and "rounded corners" create a premium, modern feel.

## 2. Visual Foundation

### Colors

- **Primary (Brand)**: `#EE4D2D` (Shopee Orange) - _Action, Highlight, CTA_
- **Secondary (Trust/Info)**: `#0EA5E9` (Sky Blue-500) - _Information, Charts_
- **Success (Profit)**: `#22C55E` (Green-500) - _Positive Trends, Profit_
- **Warning**: `#F59E0B` (Amber-500) - _Alerts, Low Stock_
- **Danger**: `#EF4444` (Red-500) - _Negative Trends, Loss_
- **Background**: `#F8FAFC` (Slate-50) - _App Background (Soft Contrast)_
- **Surface**: `#FFFFFF` (White) - _Cards, Modals, Sidebar_
- **Text Primary**: `#0F172A` (Slate-900) - _Headings, Key Data_
- **Text Secondary**: `#64748B` (Slate-500) - _Labels, Descriptions_

### Typography

- **Font Family**: **"Plus Jakarta Sans"** (Google Font)
  - _Why_: Geometric but friendly, highly readable at small sizes (perfect for data), modern tech feel.
- **Weights**:
  - Regular (400): Body text
  - Medium (500): Navigation, Table Headers, Buttons
  - Bold (700): Key Metrics (KPIs), Page Titles

### Shapes & Depth

- **Border Radius**:
  - Cards/Containers: `12px` (`rounded-xl`)
  - Buttons/Inputs: `8px` (`rounded-lg`)
  - Tags/Badges: `9999px` (`rounded-full`)
- **Shadows (Soft UI)**:
  - Card Base: `0 2px 10px rgba(0, 0, 0, 0.03)`
  - Hover/Lift: `0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.01)`
- **Transitions**: `all 200ms cubic-bezier(0.4, 0, 0.2, 1)`

## 3. Component Rules

### Cards (Dashboard Widgets)

- Background: White
- Padding: `p-6` (Generous spacing)
- Border: `border border-slate-100` (Subtle definition)
- Shadow: Base soft shadow
- Hover Effect: Translate Y `-2px` + Increased Shadow (Rule: "Card hover lift 200ms")

### Buttons

- **Primary**: `bg-[#EE4D2D] hover:bg-[#D73D1D] text-white shadow-lg shadow-orange-500/30`
- **Secondary/Ghost**: `bg-slate-100 text-slate-700 hover:bg-slate-200`
- **Icon Buttons**: `p-2 rounded-full hover:bg-slate-100 transition-colors`

### Tables (Data Density)

- Header: `bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500`
- Rows: `border-b border-slate-100 hover:bg-slate-50/50 transition-colors`
- Cells: `py-3 px-4 text-sm`

### Inputs

- Background: `bg-white`
- Border: `border-slate-200`
- Focus: `ring-2 ring-orange-500/20 border-orange-500 transition-all`

## 4. Implementation Checklist

- [ ] Install 'Plus Jakarta Sans' via Google Fonts
- [ ] Configure `tailwind.config.ts` with new colors and font
- [ ] Create `Card` component wrapper
- [ ] Update `Sidebar` active states to use Brand Color + Soft Background
- [ ] Apply "Data-Dense" layout to Analytics (Bento Grid style)
