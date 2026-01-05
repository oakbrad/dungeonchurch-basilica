# Ghost Table Roller Template

Create RPG-style random table rolls in Ghost posts. Clicking "Roll on Table" randomly selects and displays an entry with 3D dice animation.

## Quick Start

1. Create a new post in Ghost
2. In post settings, select **custom-table** as the template
3. Add either a markdown table OR a 5etools JSON reference (see below)
4. Publish

## Table Sources

### Option A: Markdown Table

Add a markdown table directly in your post content:

```markdown
| d6 | Result | Description (Optional) |
|----|--------|------------------------|
| 1  | First result | Additional details |
| 2  | Second result | More details |
```

- Column 1: Roll number (ignored for selection)
- Column 2: Main result (displayed on roll)
- Column 3: Optional description (shown in italics)

### Option B: 5etools JSON Table

Reference a table from the homebrew JSON by adding a hidden div:

```html
<div data-5e-table="Books of Pyora" style="display:none;"></div>
```

The table will be fetched from the JSON and rendered as HTML. Available tables:
- Books of Pyora
- Dungeon Dome Concessions
- Pyoran Potions
- Pyoran Species
- Pyoran Substances
- Durandian Draughts

5etools formatting (`{@link}`, `{@item}`, `{@creature}`, etc.) is automatically converted to clickable links.

## Using the Partial

Include the table roller in any template:

```handlebars
{{> "table-roller"}}
```

With custom options:

```handlebars
{{> "table-roller" buttonText="Roll for Encounter" contentSelector=".my-content"}}
```

## Files

- `assets/css/rolltable.css` - Styles
- `assets/js/rolltable.js` - JavaScript (markdown parsing + JSON fetching)
- `partials/table-roller.hbs` - UI partial
