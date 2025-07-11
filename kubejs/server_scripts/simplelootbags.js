
// Try to load a config file for this mod
const configFilePath = "kubejs/config/simplelootbags.json";

let CONFIG;
try {
    CONFIG = JsonIO.load(configFilePath);
} catch (e) {
    // If we can't load a configuration file from disk, load a
    // default configuration
    CONFIG = {
        modEnabled: true,

        // How do we identify bosses?
        // I'd like to avoid identifying them by name (only)
        // sophisiticated backpacks adds this tag to mobs: "spawnedWithBackpack"
        // We could also use their starting hitpoints > 40 to treat them as a boss
        bossEntities: [
            "minecraft:creaking",
            "minecraft:ender_dragon",
            "minecraft:wither",
            "minecraft:elder_guardian",
            "minecraft:giant",
            "minecraft:warden",
        ],

        hostileEntities: [
            "minecraft:blaze",
            "minecraft:bogged",
            "minecraft:breeze",
            "minecraft:drowned",
            "minecraft:endermite",
            "minecraft:evoker",
            "minecraft:ghast",
            "minecraft:guardian",
            "minecraft:hoglin",
            "minecraft:husk",
            "minecraft:magma_cube",
            "minecraft:piglin_brute",
            "minecraft:pillager",
            "minecraft:ravager",
            "minecraft:shulker",
            "minecraft:silverfish",
            "minecraft:skeleton",
            "minecraft:slime",
            "minecraft:stray",
            "minecraft:vex",
            "minecraft:vindicator",
            "minecraft:witch",
            "minecraft:wither_skeleton",
            "minecraft:zoglin",
            "minecraft:zombie",
            "minecraft:zombie_villager",
            "minecraft:zombified_piglin",
        ],

        // Drop rates are the percentage chance to drop the associated loot box
        dropRates: {
            common: 5,
            uncommon: 2.5,
            rare: 1.3,
            epic: 0.6,
            legendary: 0.3,
            boss: 100,
        },

        // Loot pool weights are implied: dach item in the list is twice as rare as the one before it
        lootTable: {
            common_loot_bag: [
                {at_least: 1, at_most: 4, id: 'minecraft:string'},
                {at_least: 1, at_most: 3, id: 'minecraft:leather'},
                {at_least: 3, at_most: 9, id: 'minecraft:iron_nugget'},
                {at_least: 3, at_most: 9, id: 'minecraft:gold_nugget'},
                {at_least: 1, at_most: 9, id: 'minecraft:redstone'},
            ],
            uncommon_loot_bag: [
                {at_least: 2, at_most: 4, id: "minecraft:iron_ingot"},
                {at_least: 2, at_most: 4, id: "minecraft:gold_ingot"},
                {at_least: 1, at_most: 2, id: "create:andesite_alloy"},
                {at_least: 1, at_most: 2, id: "minecraft:diamond"},
                {at_least: 1, at_most: 1, id: "minecraft:golden_apple"},
            ],
            rare_loot_bag: [
                {at_least: 1, at_most: 9, id: "create:brass_nugget"},
                {at_least: 1, at_most: 1, id: "minecraft:golden_apple"},
                {at_least: 1, at_most: 3, id: "create:brass_ingot"},
                {at_least: 1, at_most: 4, id: "minecraft:ender_pearl"},
                {at_least: 1, at_most: 1, id: "minecraft:totem_of_undying"},
            ],
            epic_loot_bag: [
                {at_least: 2, at_most: 3, id: "minecraft:diamond"},
                {at_least: 1, at_most: 4, id: "minecraft:ender_pearl"},
                {at_least: 2, at_most: 2, id: "create:crushing_wheel"},
                {at_least: 1, at_most: 1, id: "create:blaze_cake"},
                {at_least: 1, at_most: 1, id: "create:blaze_burner"},
            ],
            // Primarily for non-craftable, or very hard to find resources
            legendary_loot_bag: [
                {at_least: 1, at_most: 3, id: "minecraft:ancient_debris"},
                {at_least: 1, at_most: 1, id: "minecraft:netherite_upgrade_smithing_template"},
                {at_least: 1, at_most: 1, id: "artifacts:"},
            ],
        }
    }
    console.log(`Unable to load ${configFilePath}, using default configuration`);
    JsonIO.write(configFilePath, CONFIG);
}

// helpers
const hostileMobs = new Set(CONFIG.hostileEntities);
const bossMobs = new Set(CONFIG.bossEntities);
function isBossMob(entity) {
    const mob = String(entity.type);
    const retval = entity.hasTag("spawnedWithBackpack") || entity.hasTag("bossMonster") || bossMobs.has(mob);
    //console.log(`isBossMob(${retval}): ${mob} -> ${Array.from(bossMobs)}`)
    return retval;
}
function isHostileMob(entity) {
    const mob = String(entity.type);
    const retval = hostileMobs.has(mob);
    //console.log(`isHostileMob(${retval}): ${mob} -> ${Array.from(hostileMobs)}`)
    return retval;
}

// Create crafting recipes to map between different lootbag rarities
// This creates a hoarding aspect to lootbox collection and keeps
// common lootbags relevant even when their rewards are not
ServerEvents.recipes(event => {
  function simplelootbags_add_recipe(input, output) {
    event.shapeless(Item.of(input, 9), [output]).id(input + '_decompress')
    event.shapeless(Item.of(output, 1), ['9x ' + input]).id(input + '_compress')
  }

  simplelootbags_add_recipe('simplelootbags:common_loot_bag', 'simplelootbags:uncommon_loot_bag')
  simplelootbags_add_recipe('simplelootbags:uncommon_loot_bag', 'simplelootbags:rare_loot_bag')
  simplelootbags_add_recipe('simplelootbags:rare_loot_bag', 'simplelootbags:epic_loot_bag')
  simplelootbags_add_recipe('simplelootbags:epic_loot_bag', 'simplelootbags:legendary_loot_bag')
})

// Select randomly from an ordered array where each element is half as likely to be selected
// as its predecessor
function weightedRandomSelect(weighted_array) {

    // Step 0: Validate the array
    if (weighted_array.length === 0) {
        return null;
    }

    // Step 1: Calculate weights automatically
    // Each element in the array is weighed half as much as the element before it
    const weights = [];
    let totalWeight = 0;
    for (let i = 0; i < weighted_array.length; i++) {
        const weight = Math.pow(0.5, i);
        weights.push(weight);
        totalWeight += weight;
    }

    // Step 2: Generate a random number between 0 and totalWeight
    const randomNum = Math.random() * totalWeight;

    // Step 3: Select an entry based on the random number
    let cumulativeWeight = 0;
    for (let i = 0; i < weights.length; i++) {
        cumulativeWeight += weights[i];
        if (randomNum < cumulativeWeight) {
            return weighted_array[i];
        }
    }

    // Default is to return the first element if the math fails
    return weighted_array[0];
}

// Generate a number between two values (inclusive) to represent the quantity
// of items generated
function quantity(min_quantity, max_quantity) {
    if (min_quantity == max_quantity) {
        return min_quantity;
    }
    return min_quantity + Math.floor(Math.random() * Math.abs(max_quantity - min_quantity));
}

// Get all items that start with a given (mod-)prefix
function getItemsByPrefix(prefix) {
  const items = [];
  // Iterate through all registered items
  Item.getList().forEach(item => {
      if (item.id.startsWith(prefix)) {
        items.push(item.id);
      }
  });
  return items;
}

// Get a random quantity of a loot_table item
function getWeightedRandomItem(loot_table) {

  const item = weightedRandomSelect(loot_table);
  if (item) {
    if (!item.id.endsWith(':')) {
      return Item.of(item.id, quantity(item.at_least, item.at_most));
    }

    // The loot table includes a mod-prefix, randomly select an item from that modpack
    const all_matching_items = getItemsByPrefix(item.id);
    const randomIndex = Math.floor(Math.random() * all_matching_items.length);
    return Item.of(all_matching_items[randomIndex], quantity(item.at_least, item.at_most));
  }
  console.log("Cannot select from: " + loot_table)
}

ItemEvents.firstRightClicked('simplelootbags:common_loot_bag', event => {
    event.item.count--;
    event.player.give(getWeightedRandomItem(CONFIG.lootTable.common_loot_bag));
})

ItemEvents.firstRightClicked('simplelootbags:uncommon_loot_bag', event => {
    event.item.count--;
    event.player.give(getWeightedRandomItem(CONFIG.lootTable.uncommon_loot_bag));
})

ItemEvents.firstRightClicked('simplelootbags:rare_loot_bag', event => {
    event.item.count--;
    event.player.give(getWeightedRandomItem(CONFIG.lootTable.rare_loot_bag));
})

ItemEvents.firstRightClicked('simplelootbags:epic_loot_bag', event => {
    event.item.count--;
    event.player.give(getWeightedRandomItem(CONFIG.lootTable.epic_loot_bag));
})

ItemEvents.firstRightClicked('simplelootbags:legendary_loot_bag', event => {
    event.item.count--;
    event.player.give(getWeightedRandomItem(CONFIG.lootTable.legendary_loot_bag));
})

// Function to determine lootbag drop
function getLootbagDrop() {

    if (!CONFIG.modEnabled) {
        // Lootbag dropping is disabled
        return null;
    }

    // Generate a random number to honor the configured drop rates
    // Scale to 0-100 for percentage checks
    let random = Math.random() * 100;

    if (random < CONFIG.dropRates.legendary) {
        return Item.of('simplelootbags:legendary_loot_bag');
    }
    if (random < CONFIG.dropRates.epic) {
        return Item.of('simplelootbags:epic_loot_bag');
    }
    if (random < CONFIG.dropRates.rare) {
        return Item.of('simplelootbags:rare_loot_bag');
    }
    if (random < CONFIG.dropRates.uncommon) {
        return Item.of('simplelootbags:uncommon_loot_bag');
    }
    if (random < CONFIG.dropRates.common) {
        return Item.of('simplelootbags:common_loot_bag');
    }

     // No bag is dropped when roll is too high
    return null;
}

// Modify the drops of creatures to include lootbags
// Only drop loot when the mod is enabled
if (CONFIG.modEnabled) {
    // Move the config check outside of the event handler to be less disruptive
    EntityEvents.drops(event => {
        const entity = event.entity;

        // Drop a legendary loot bag on boss kill
        if (isBossMob(entity)) {
            let random = Math.random() * 100;
            if (random <= CONFIG.dropRates.boss) {
                const drop = Item.of('simplelootbags:legendary_loot_bag', 1);
                console.log(`BOSS: "${entity.type}" is dropping: "${drop}"`);
                event.addDrop(drop);
            }
            return;
        }

        // Drop rarities based lootbags
        if (isHostileMob(entity)) {
            let drop = getLootbagDrop();
            if (drop) {
                console.log(`HOSTILE: "${entity.type}" is dropping: "${drop}"`)
                event.addDrop(drop);
            }
            return;
        }
    });
}

console.log('SimpleLootBags: Loaded')
