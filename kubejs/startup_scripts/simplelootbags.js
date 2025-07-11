StartupEvents.registry('item', event => {
    // Create the new loot bag items for this mod
    event.create('simplelootbags:common_loot_bag').texture('simplelootbags:item/commonlootbag').maxStackSize(9)
    event.create('simplelootbags:uncommon_loot_bag').texture('simplelootbags:item/uncommonlootbag').maxStackSize(9)
    event.create('simplelootbags:rare_loot_bag').texture('simplelootbags:item/rarelootbag').maxStackSize(9)
    event.create('simplelootbags:epic_loot_bag').texture('simplelootbags:item/epiclootbag').maxStackSize(9)
    event.create('simplelootbags:legendary_loot_bag').texture('simplelootbags:item/legendarylootbag').maxStackSize(1).glow(true)
})
