# Ghost Table Roller Template

This template allows you to create RPG-style random table rolls in your Ghost posts. When a user clicks the "Roll on Table" button, the script will randomly select an entry from your markdown table and display it.

## How to Use

### Option 1: Using the Custom Table Template

1. Create a new post in Ghost
2. In the post settings (gear icon), select "custom-table" as the template
3. Add your content to the post, including a markdown table with your random table entries
4. Publish the post

### Option 2: Using the Table Roller Partial in Any Template

You can include the table roller in any template or post by adding the partial:

```handlebars
{{> "table-roller"}}
```

You can also customize the button text and content selector:

```handlebars
{{> "table-roller" buttonText="Roll for Random Encounter" contentSelector=".my-custom-content-area"}}
```

## Table Format

The table roller will use the first markdown table it finds in your post content. The table should be formatted as follows:

```markdown
| Roll | Result | Description (Optional) |
|------|--------|------------------------|
| 1    | First result | Additional details about the first result |
| 2    | Second result | Additional details about the second result |
| 3    | Third result | Additional details about the third result |
| ...  | ... | ... |
```

The script will use the second column (Result) for the main random roll display. If your table only has one column, it will use that column.

If you include a third column (Description), it will be displayed underneath the main result in italics, providing additional context or details.

## HTML Links Support

The table roller fully supports HTML links in your table entries. For example:

```markdown
| d6 | Magic Item |
|----|-----------|
| 1  | [Potion of Healing](https://example.com/items/potion-of-healing) |
| 2  | [Scroll of Identify](https://example.com/items/scroll-of-identify) |
| 3  | [+1 Dagger](https://example.com/items/dagger-plus-one) |
```

When a result with a link is rolled, the link will be preserved in the result display and will be clickable. All links will automatically open in a new tab.

## Example

Here's an example of a random encounter table:

```markdown
| d20 | Wilderness Encounter | Details |
|-----|---------------------|---------|
| 1   | A lost traveler seeking directions | The traveler is actually a disguised noble fleeing assassins |
| 2   | 2d4 goblins arguing over a shiny trinket | The trinket is a magical amulet that grants invisibility once per day |
| 3   | An abandoned campsite with still-warm embers | Tracks lead north, and a torn journal page mentions "the eye" |
| 4   | A merchant's cart with a broken wheel | The merchant will reward helpers with a discount on rare goods |
| 5   | A circle of mushrooms with strange glowing spores | Anyone breathing the spores must save vs. poison or have vivid hallucinations |
| 6   | A wounded wolf licking its injuries | The wolf will lead characters to its trapped pack if healed |
| 7   | A small shrine to an unknown deity | Leaving an offering grants a minor blessing (+1 to next save) |
| 8   | 1d6 bandits hiding in ambush | They have a prisoner who knows a secret path to the dungeon |
| 9   | A talking raven with cryptic messages | The raven serves a powerful archfey who watches the party |
| 10  | A patch of poisonous plants | A careful search reveals rare alchemical ingredients worth 50gp |
| 11  | A hunter tracking rare game | The hunter has seen strange lights at the old tower recently |
| 12  | An old battlefield with scattered equipment | Ghosts appear here on moonless nights, reenacting their deaths |
| 13  | A mysterious fog that whispers secrets | The fog reveals a truth and a lie about each character's past |
| 14  | A wandering bard looking for inspiration | The bard knows rumors about all major locations in the region |
| 15  | A magical spring with restorative properties | Drinking grants temporary hit points, but attracts fey attention |
| 16  | 2d6 zombies shambling through the trees | They all wear the same strange amulet that prevents them from being turned |
| 17  | A sleeping ogre under a large tree | The ogre's bag contains a stolen relic from a nearby temple |
| 18  | A fairy ring - those who step inside must save or be charmed | Those charmed are compelled to leave a valuable possession behind |
| 19  | A griffon flying overhead, searching for prey | It's injured and might be captured or tamed with the right approach |
| 20  | A wizard's tower appears suddenly on the horizon | The tower only materializes once per month during the full moon |
```

## Technical Details

The table roller works by:
1. Finding the first markdown table in your post content
2. Extracting all rows except the header
3. When the button is clicked, randomly selecting one of the entries
4. Displaying the selected entry in the result area

The table itself remains visible in your post content, so readers can see all possible results.

## Customization

The table roller is designed to be modular and reusable:

- CSS styles are in `assets/css/rolltable.css`
- JavaScript functionality is in `assets/js/rolltable.js`
- The partial template is in `partials/table-roller.hbs`

You can customize these files to change the appearance and behavior of the table roller.
