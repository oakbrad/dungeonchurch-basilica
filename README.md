<p align="center">
    <img width="650" src="https://github.com/oakbrad/dungeonchurch/raw/main/logo-chrome.png"><br>
    <a href=https://github.com/oakbrad/dungeonchurch>
        <img src=https://img.shields.io/github/last-commit/oakbrad/dungeonchurch?label=dungeonchurch&color=gray&labelColor=ff2600&logoColor=ffffff&logo=docker></a>
    <a href=https://github.com/oakbrad/dungeonchurch-pyora>
        <img src=https://img.shields.io/github/last-commit/oakbrad/dungeonchurch-pyora?label=dungeonchurch-pyora&color=gray&labelColor=ff2600&logo=dungeonsanddragons></a>
    <a href=https://github.com/oakbrad/dungeonchurch-basilica>
        <img src=https://img.shields.io/github/last-commit/oakbrad/dungeonchurch-basilica?label=dungeonchurch-basilica&color=gray&labelColor=ff2600&logo=ghost></a>
    <a href=https://github.com/oakbrad/dungeonchurch-cogs>
        <img src=https://img.shields.io/github/last-commit/oakbrad/dungeonchurch-cogs?label=dungeonchurch-cogs&color=gray&labelColor=ff2600&logoColor=ffffff&logo=discord></a>
</p>

# Basilica
**Basilica** is a modified version of the [Casper](https://github.com/TryGhost/Casper/releases) theme for the [Dungeon Church](https://www.dungeon.church) RPG group website.

## Custom Templates
This theme contains custom templates & partials for RPG related content:
* `custom-map.hbs` - Create an interactive [LeafletJS](https://leafletjs.com) map from an image. Supports markers, shapes, overlays, custom icons, etc. See [readme](/README-map.md).
* `custom-timeline.hbs` - Create [TimelineJS3](https://github.com/NUKnightLab/TimelineJS3) timelines with a linked Google Sheet.
* `custom-table.hbs` - Creates an interactive dice roller for Markdown tables. See [readme](/README-table-roller.md)

## Custom Navigation
This theme includes a custom navigation partial that modifies the default Ghost navigation:
* `partials/navigation.hbs` - Provides membership-based access control for navigation items:
  * For "Lore Wiki" links: Members see direct links to lore.dungeon.church, while non-members see a locked version (🔒) linking to dungeon.church/pyora-wiki
  * All other navigation items work exactly as configured in the Ghost admin panel

#### [Casper Readme](README-casper.md)
