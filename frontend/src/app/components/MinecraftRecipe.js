import React from "react";
import ReactDOM from "react-dom";

const woodPlanks = {
  oak: "/assets/img/minecraft/wood_type/Oak_Planks.png",
  spruce: "/assets/img/minecraft/wood_type/Spruce_Planks.png",
  birch: "/assets/img/minecraft/wood_type/Birch_Planks.png",
  jungle: "/assets/img/minecraft/wood_type/Jungle_Planks.png",
  acacia: "/assets/img/minecraft/wood_type/Acacia_Planks.png",
  dark_oak: "/assets/img/minecraft/wood_type/Dark_Oak_Planks.png",
  mangrove: "/assets/img/minecraft/wood_type/Mangrove_Planks.png",
  bamboo: "/assets/img/minecraft/wood_type/Bamboo_Planks.png",
  cherry: "/assets/img/minecraft/wood_type/Cherry_Planks.png",
  pale_oak: "/assets/img/minecraft/wood_type/Pale_Oak_Planks.png",
  crimson: "/assets/img/minecraft/wood_type/Crimson_Planks.png",
  warped: "/assets/img/minecraft/wood_type/Warped_Planks.png",
  poplar: "/assets/img/minecraft/wood_type/Poplar_Planks.webp"
};

const woodSlabs = {
  oak_slab: "/assets/img/minecraft/wood_type/Oak_Slab.png",
  spruce_slab: "/assets/img/minecraft/wood_type/Spruce_Slab.png",
  birch_slab: "/assets/img/minecraft/wood_type/Birch_Slab.png",
  jungle_slab: "/assets/img/minecraft/wood_type/Jungle_Slab.png",
  acacia_slab: "/assets/img/minecraft/wood_type/Acacia_Slab.png",
  dark_oak_slab: "/assets/img/minecraft/wood_type/Dark_Oak_Slab.png",
  mangrove_slab: "/assets/img/minecraft/wood_type/Mangrove_Slab.png",
  bamboo_slab: "/assets/img/minecraft/wood_type/Bamboo_Slab.png",
  cherry_slab: "/assets/img/minecraft/wood_type/Cherry_Slab.png",
  pale_oak_slab: "/assets/img/minecraft/wood_type/Pale_Oak_Slab.png",
  crimson_slab: "/assets/img/minecraft/wood_type/Crimson_Slab.png",
  warped_slab: "/assets/img/minecraft/wood_type/Warped_Slab.png",
  poplar_slab: "/assets/img/minecraft/wood_type/Poplar_Slab.webp"
};

const woodLogs = {
  oak_log: "/assets/img/minecraft/wood_type/Oak_Log.png",
  stripped_oak_log: "/assets/img/minecraft/wood_type/Stripped_Oak_Log.png",
  spruce_log: "/assets/img/minecraft/wood_type/Spruce_Log.png",
  stripped_spruce_log: "/assets/img/minecraft/wood_type/Stripped_Spruce_Log.png",
  birch_log: "/assets/img/minecraft/wood_type/Birch_Log.png",
  stripped_birch_log: "/assets/img/minecraft/wood_type/Stripped_Birch_Log.png",
  jungle_log: "/assets/img/minecraft/wood_type/Jungle_Log.png",
  stripped_jungle_log: "/assets/img/minecraft/wood_type/Stripped_Jungle_Log.png",
  acacia_log: "/assets/img/minecraft/wood_type/Acacia_Log.png",
  stripped_acacia_log: "/assets/img/minecraft/wood_type/Stripped_Acacia_Log.png",
  dark_oak_log: "/assets/img/minecraft/wood_type/Dark_Oak_Log.png",
  stripped_dark_oak_log: "/assets/img/minecraft/wood_type/Stripped_Dark_Oak_Log.png",
  mangrove_log: "/assets/img/minecraft/wood_type/Mangrove_Log.png",
  stripped_mangrove_log: "/assets/img/minecraft/wood_type/Stripped_Mangrove_Log.png",
  cherry_log: "/assets/img/minecraft/wood_type/Cherry_Log.png",
  stripped_cherry_log: "/assets/img/minecraft/wood_type/Stripped_Cherry_Log.png",
  pale_oak_log: "/assets/img/minecraft/wood_type/Pale_Oak_Log.png",
  stripped_pale_oak_log: "/assets/img/minecraft/wood_type/Stripped_Pale_Oak_Log.png",
  crimson_stem: "/assets/img/minecraft/wood_type/Crimson_Stem.gif",
  stripped_crimson_stem: "/assets/img/minecraft/wood_type/Stripped_Crimson_Stem.png",
  warped_stem: "/assets/img/minecraft/wood_type/Warped_Stem.gif",
  stripped_warped_stem: "/assets/img/minecraft/wood_type/Stripped_Warped_Stem.png",
  poplar_log: "/assets/img/minecraft/wood_type/Poplar_Log.webp",
  stripped_poplar_log: "/assets/img/minecraft/wood_type/Stripped_Poplar_Log.webp"
};

const stoneVariants = {
  stone_variant: "/assets/img/minecraft/stone_type/Cobblestone.png",
  cobblestone: "/assets/img/minecraft/stone_type/Cobblestone.png",
  stone: "/assets/img/minecraft/stone_type/Stone.png",
  smooth_stone: "/assets/img/minecraft/stone_type/Smooth_Stone.png",
  cobbled_deepslate: "/assets/img/minecraft/stone_type/Cobbled_Deepslate.png",
  blackstone: "/assets/img/minecraft/stone_type/Blackstone.webp"
};

const boatItems = {
  oak_boat: "/assets/img/minecraft/entity_type/Oak_Boat.webp",
  spruce_boat: "/assets/img/minecraft/entity_type/Spruce_Boat.webp",
  birch_boat: "/assets/img/minecraft/entity_type/Birch_Boat.webp",
  jungle_boat: "/assets/img/minecraft/entity_type/Jungle_Boat.webp",
  acacia_boat: "/assets/img/minecraft/entity_type/Acacia_Boat.webp",
  dark_oak_boat: "/assets/img/minecraft/entity_type/Dark_Oak_Boat.webp",
  mangrove_boat: "/assets/img/minecraft/entity_type/Mangrove_Boat.webp",
  bamboo_raft: "/assets/img/minecraft/entity_type/Bamboo_Raft.png",
  cherry_boat: "/assets/img/minecraft/entity_type/Cherry_Boat.webp",
  pale_oak_boat: "/assets/img/minecraft/entity_type/Pale_Oak_Boat.webp"
};

const buttonItems = {
  oak_button: "/assets/img/minecraft/redstone/Oak_Button.png",
  spruce_button: "/assets/img/minecraft/redstone/Spruce_Button.png",
  birch_button: "/assets/img/minecraft/redstone/Birch_Button.png",
  jungle_button: "/assets/img/minecraft/redstone/Jungle_Button.png",
  acacia_button: "/assets/img/minecraft/redstone/Acacia_Button.png",
  dark_oak_button: "/assets/img/minecraft/redstone/Dark_Oak_Button.png",
  mangrove_button: "/assets/img/minecraft/redstone/Mangrove_Button.png",
  bamboo_button: "/assets/img/minecraft/redstone/Bamboo_Button.png",
  cherry_button: "/assets/img/minecraft/redstone/Cherry_Button.png",
  pale_oak_button: "/assets/img/minecraft/redstone/Pale_Oak_Button.png",
  crimson_button: "/assets/img/minecraft/redstone/Crimson_Button.png",
  warped_button: "/assets/img/minecraft/redstone/Warped_Button.png",
  poplar_button: "/assets/img/minecraft/redstone/Poplar_Button.webp",
  stone_button: "/assets/img/minecraft/redstone/Stone_Button.webp"
};

const buttonRecipePairs = [
  { input: "oak", output: "oak_button" },
  { input: "spruce", output: "spruce_button" },
  { input: "birch", output: "birch_button" },
  { input: "jungle", output: "jungle_button" },
  { input: "acacia", output: "acacia_button" },
  { input: "dark_oak", output: "dark_oak_button" },
  { input: "mangrove", output: "mangrove_button" },
  { input: "bamboo", output: "bamboo_button" },
  { input: "cherry", output: "cherry_button" },
  { input: "pale_oak", output: "pale_oak_button" },
  { input: "crimson", output: "crimson_button" },
  { input: "warped", output: "warped_button" },
  { input: "poplar", output: "poplar_button" },
  { input: "stone", output: "stone_button" }
];

const arrowItems = ["arrow", "spectral_arrow", "tipped_arrow"];

const genericItems = {
  stick: "/assets/img/minecraft/item/Stick.png",
  arrow: "/assets/img/minecraft/item/Arrow.png",
  spectral_arrow: "/assets/img/minecraft/item/Spectral_Arrow.png",
  tipped_arrow: "/assets/img/minecraft/item/tipped_arrow.png",
  redstone: "/assets/img/minecraft/item/Redstone.png",
  shield: "/assets/img/minecraft/item/Shield.png",
  iron_ingot: "/assets/img/minecraft/item/Iron_Ingot.png",
  copper_ingot: "/assets/img/minecraft/item/Copper_Ingot.webp",
  diamond: "/assets/img/minecraft/item/Diamond.png",
  iron_pickaxe: "/assets/img/minecraft/item/Iron_Pickaxe.webp",
  diamond_pickaxe: "/assets/img/minecraft/item/Diamond_Pickaxe.webp",
  echo_shard: "/assets/img/minecraft/item/Echo_Shard.webp",
  leather: "/assets/img/minecraft/item/Leather.webp",
  breeze_rod: "/assets/img/minecraft/item/Breeze_Rod.webp",
  heavy_core: "/assets/img/minecraft/item/Heavy_Core.webp",
  blaze_rod: "/assets/img/minecraft/item/Blaze_Rod.png",
  blaze_powder: "/assets/img/minecraft/item/Blaze_Powder.png",
  ender_pearl: "/assets/img/minecraft/item/Ender_Pearl.png",
  eye_of_ender: "/assets/img/minecraft/item/Eye_of_Ender.png",
  mace_item: "/assets/img/minecraft/item/Mace.webp",
  wooden_shovel: "/assets/img/minecraft/item/Wooden_Shovel.png",
  cobblestone: "/assets/img/minecraft/stone_type/Cobblestone.png",
  smooth_stone: "/assets/img/minecraft/stone_type/Smooth_Stone.png",
  glowstone: "/assets/img/minecraft/stone_type/Glowstone.png",
  obsidian: "/assets/img/minecraft/Obsidian.png",
  crying_obsidian: "/assets/img/minecraft/Crying_Obsidian.png",
  block_of_iron: "/assets/img/minecraft/Block_of_Iron.png",
  block_of_netherite: "/assets/img/minecraft/Block_of_Netherite.png",
  tinted_glass: "/assets/img/minecraft/Tinted_Glass.png",
  crafting_table: "/assets/img/minecraft/entity_block_type/Crafting_Table.png",
  furnace: "/assets/img/minecraft/entity_block_type/Furnace.png",
  blast_furnace: "/assets/img/minecraft/entity_block_type/Blast_Furnace.png",
  anvil: "/assets/img/minecraft/entity_block_type/Anvil.webp",
  enchanting_table: "/assets/img/minecraft/entity_block_type/enchanting_table.png",
  ender_chest: "/assets/img/minecraft/entity_block_type/Ender_Chest.png",
  respawn_anchor: "/assets/img/minecraft/entity_block_type/Respawn_Anchor.webp",
  end_crystal: "/assets/img/minecraft/entity_type/End_Crystal.webp",
  gold_ingot: "/assets/img/minecraft/item/Gold_Ingot.webp",
  netherite_ingot: "/assets/img/minecraft/item/Netherite_Ingot.webp",
  nether_star: "/assets/img/minecraft/item/Nether_Star.webp",
  glass: "/assets/img/minecraft/Glass.png",
  book: "/assets/img/minecraft/item/Book.webp",
  emerald: "/assets/img/minecraft/item/Emerald.png",
  coal: "/assets/img/minecraft/item/Coal.png",
  amethyst_shard: "/assets/img/minecraft/item/Amethyst_Shard.png",
  flint: "/assets/img/minecraft/item/Flint.webp",
  gravel: "/assets/img/minecraft/Gravel.png",
  totem_of_undying: "/assets/img/minecraft/item/Totem_of_Undying.webp",
  stone: "/assets/img/minecraft/stone_type/Stone.png",
  end_stone: "/assets/img/minecraft/stone_type/End_Stone.png",
  bricks: "/assets/img/minecraft/stone_type/Bricks.png",
  oak_log: "/assets/img/minecraft/wood_type/Oak_Log.png",
  crimson_slab: "/assets/img/minecraft/wood_type/Crimson_Slab.png",
  wooden_spear: "/assets/img/minecraft/item/ItemSprite_wooden-spear.png",
  wooden_pickaxe: "/assets/img/minecraft/item/wooden_pickaxe.webp",
  stone_pickaxe: "/assets/img/minecraft/item/Stone_Pickaxe.png",
  stone_spear: "/assets/img/minecraft/item/ItemSprite_stone-spear.png",
  iron_spear: "/assets/img/minecraft/item/ItemSprite_iron-spear.webp",
  copper_spear: "/assets/img/minecraft/item/ItemSprite_copper-spear.png",
  golden_spear: "/assets/img/minecraft/item/ItemSprite_golden-spear.png",
  diamond_spear: "/assets/img/minecraft/item/ItemSprite_diamond-spear.png",
  netherite_spear: "/assets/img/minecraft/item/ItemSprite_netherite-spear.png",
  bucket: "/assets/img/minecraft/item/Bucket.png",
  bowl: "/assets/img/minecraft/item/Bowl.png",
  flower_pot: "/assets/img/minecraft/Flower_Pot.png",
  glass_bottle: "/assets/img/minecraft/item/Glass_Bottle.png",
  brick: "/assets/img/minecraft/stone_type/Brick.webp"
};

const itemDescriptions = {
  // Planks (Name only)
  oak: { title: { vi: "Ván gỗ sồi", en: "Oak Planks" } },
  spruce: { title: { vi: "Ván gỗ vân sam", en: "Spruce Planks" } },
  birch: { title: { vi: "Ván gỗ bạch dương", en: "Birch Planks" } },
  jungle: { title: { vi: "Ván gỗ rừng nhiệt đới", en: "Jungle Planks" } },
  acacia: { title: { vi: "Ván gỗ keo", en: "Acacia Planks" } },
  dark_oak: { title: { vi: "Ván gỗ sồi sẫm", en: "Dark Oak Planks" } },
  mangrove: { title: { vi: "Ván gỗ đước", en: "Mangrove Planks" } },
  bamboo: { title: { vi: "Ván tre", en: "Bamboo Planks" } },
  cherry: { title: { vi: "Ván gỗ anh đào", en: "Cherry Planks" } },
  pale_oak: { title: { vi: "Ván gỗ sồi nhạt", en: "Pale Oak Planks" } },
  crimson: { title: { vi: "Ván gỗ đỏ tươi", en: "Crimson Planks" } },

  warped: { title: { vi: "Ván Gỗ Kì Dị", en: "Warped Planks" } },
  poplar: { title: { vi: "Ván Gỗ Poplar", en: "Poplar Planks" } },

  // Slabs (Name only)
  oak_slab: { title: { vi: "Phiến Gỗ Sồi", en: "Oak Slab" } },
  spruce_slab: { title: { vi: "Phiến Gỗ Vân Sam", en: "Spruce Slab" } },
  birch_slab: { title: { vi: "Phiến Gỗ Bạch Dương", en: "Birch Slab" } },
  jungle_slab: { title: { vi: "Phiến Gỗ Rừng", en: "Jungle Slab" } },
  acacia_slab: { title: { vi: "Phiến Gỗ Keo", en: "Acacia Slab" } },
  dark_oak_slab: { title: { vi: "Phiến Gỗ Sồi Sẫm", en: "Dark Oak Slab" } },
  mangrove_slab: { title: { vi: "Phiến Gỗ Đước", en: "Mangrove Slab" } },
  bamboo_slab: { title: { vi: "Phiến Tre", en: "Bamboo Slab" } },
  cherry_slab: { title: { vi: "Phiến Gỗ Anh Đào", en: "Cherry Slab" } },
  pale_oak_slab: { title: { vi: "Phiến Gỗ Sồi Nhạt", en: "Pale Oak Slab" } },
  crimson_slab: { title: { vi: "Phiến Gỗ Đỏ Tươi", en: "Crimson Slab" } },
  warped_slab: { title: { vi: "Phiến Gỗ Kì Dị", en: "Warped Slab" } },
  poplar_slab: { title: { vi: "Phiến Gỗ Poplar", en: "Poplar Slab" } },

  // Logs (Name only)
  oak_log: { title: { vi: "Thân Cây Sồi", en: "Oak Log" } },
  spruce_log: { title: { vi: "Thân Cây Vân Sam", en: "Spruce Log" } },
  birch_log: { title: { vi: "Thân Cây Bạch Dương", en: "Birch Log" } },
  jungle_log: { title: { vi: "Thân Cây Rừng", en: "Jungle Log" } },
  acacia_log: { title: { vi: "Thân Cây Keo", en: "Acacia Log" } },
  dark_oak_log: { title: { vi: "Thân Cây Sồi Sẫm", en: "Dark Oak Log" } },
  mangrove_log: { title: { vi: "Thân Cây Đước", en: "Mangrove Log" } },
  cherry_log: { title: { vi: "Thân Cây Anh Đào", en: "Cherry Log" } },
  pale_oak_log: { title: { vi: "Thân Cây Sồi Nhạt", en: "Pale Oak Log" } },
  crimson_stem: { title: { vi: "Thân Nấm Đỏ Tươi", en: "Crimson Stem" } },
  warped_stem: { title: { vi: "Thân Nấm Kì Dị", en: "Warped Stem" } },
  poplar_log: { title: { vi: "Thân Cây Poplar", en: "Poplar Log" } },
  stripped_oak_log: { title: { vi: "Thân Cây Sồi Bóc Vỏ", en: "Stripped Oak Log" } },
  stripped_spruce_log: { title: { vi: "Thân Cây Vân Sam Bóc Vỏ", en: "Stripped Spruce Log" } },
  stripped_birch_log: { title: { vi: "Thân Cây Bạch Dương Bóc Vỏ", en: "Stripped Birch Log" } },
  stripped_jungle_log: { title: { vi: "Thân Cây Rừng Bóc Vỏ", en: "Stripped Jungle Log" } },
  stripped_acacia_log: { title: { vi: "Thân Cây Keo Bóc Vỏ", en: "Stripped Acacia Log" } },
  stripped_dark_oak_log: { title: { vi: "Thân Cây Sồi Sẫm Bóc Vỏ", en: "Stripped Dark Oak Log" } },
  stripped_mangrove_log: { title: { vi: "Thân Cây Đước Bóc Vỏ", en: "Stripped Mangrove Log" } },
  stripped_cherry_log: { title: { vi: "Thân Cây Anh Đào Bóc Vỏ", en: "Stripped Cherry Log" } },
  stripped_pale_oak_log: { title: { vi: "Thân Cây Sồi Nhạt Bóc Vỏ", en: "Stripped Pale Oak Log" } },
  stripped_crimson_stem: { title: { vi: "Thân Nấm Đỏ Tươi Bóc Vỏ", en: "Stripped Crimson Stem" } },
  stripped_warped_stem: { title: { vi: "Thân Nấm Kì Dị Bóc Vỏ", en: "Stripped Warped Stem" } },
  stripped_poplar_log: { title: { vi: "Thân Cây Poplar Bóc Vỏ", en: "Stripped Poplar Log" } },

  // Boats (Name only)
  oak_boat: { title: { vi: "Thuyền gỗ sồi", en: "Oak Boat" } },
  spruce_boat: { title: { vi: "Thuyền gỗ vân sam", en: "Spruce Boat" } },
  birch_boat: { title: { vi: "Thuyền gỗ bạch dương", en: "Birch Boat" } },
  jungle_boat: { title: { vi: "Thuyền gỗ rừng", en: "Jungle Boat" } },
  acacia_boat: { title: { vi: "Thuyền gỗ keo", en: "Acacia Boat" } },
  dark_oak_boat: { title: { vi: "Thuyền gỗ sồi sẫm", en: "Dark Oak Boat" } },
  mangrove_boat: { title: { vi: "Thuyền gỗ đước", en: "Mangrove Boat" } },
  bamboo_raft: { title: { vi: "Bè tre", en: "Bamboo Raft" } },
  cherry_boat: { title: { vi: "Thuyền gỗ anh đào", en: "Cherry Boat" } },
  pale_oak_boat: { title: { vi: "Thuyền gỗ sồi nhạt", en: "Pale Oak Boat" } },

  // Items
  stick: { title: { vi: "Gậy", en: "Stick" } },
  arrow: { title: { vi: "Mũi tên", en: "Arrow" } },
  tipped_arrow: { title: { vi: "Mũi tên tẩm thuốc", en: "Tipped Arrow" } },
  redstone: { title: { vi: "Bụi Đá đỏ", en: "Redstone Dust" } },
  shield: { title: { vi: "Khiên", en: "Shield" } },
  iron_ingot: { title: { vi: "Phôi Sắt", en: "Iron Ingot" } },
  copper_ingot: { title: { vi: "Phôi Đồng", en: "Copper Ingot" } },
  leather: { title: { vi: "Da Thuộc", en: "Leather" } },
  breeze_rod: { title: { vi: "Thanh Gió Bão", en: "Breeze Rod" } },
  blaze_rod: { title: { vi: "Thanh Lửa", en: "Blaze Rod" } },
  blaze_powder: { title: { vi: "Bột Lửa", en: "Blaze Powder" } },
  ender_pearl: { title: { vi: "Ngọc Ender", en: "Ender Pearl" } },

  // Special Tool/Weapon attributes
  wooden_shovel: {
    title: { vi: "Xẻng Gỗ", en: "Wooden Shovel" },
    lines: [
      { text: { vi: "Khi cầm ở tay chính:", en: "When in Main Hand:" }, color: "gray" },
      { text: { vi: "+2 Sát thương Cận chiến", en: "+2 Attack Damage" }, color: "green" },
      { text: { vi: "1.0 Tốc độ Đánh", en: "1.0 Attack Speed" }, color: "green" }
    ]
  },
  mace_item: {
    title: { vi: "Chùy Kiêu Hãnh", en: "Mace" },
    titleColor: "magenta",
    lines: [
      { text: { vi: "Khi cầm ở tay chính:", en: "When in Main Hand:" }, color: "gray" },
      { text: { vi: "6 Sát thương Cận chiến", en: "6 Attack Damage" }, color: "green" },
      { text: { vi: "0.6 Tốc độ Đánh", en: "0.6 Attack Speed" }, color: "green" }
    ]
  },
  spectral_arrow: {
    title: { vi: "Mũi tên quang phổ", en: "Spectral Arrow" },
    lines: [
      { text: { vi: "Hiệu ứng Phát sáng (0:10)", en: "Glowing Effect (0:10)" }, color: "blue" }
    ]
  },

  // Rare/Uncommon Items with matching Rarity Name Colors
  diamond: { title: { vi: "Kim Cương", en: "Diamond" }, titleColor: "aqua" },
  echo_shard: { title: { vi: "Mảnh Vỡ Vang Vọng", en: "Echo Shard" }, titleColor: "aqua" },
  heavy_core: { title: { vi: "Lõi Nặng", en: "Heavy Core" }, titleColor: "magenta" },
  netherite_ingot: { title: { vi: "Phôi Netherite", en: "Netherite Ingot" }, titleColor: "aqua" },
  nether_star: { title: { vi: "Sao Nether", en: "Nether Star" }, titleColor: "yellow" },
  block_of_netherite: { title: { vi: "Khối Netherite", en: "Block of Netherite" }, titleColor: "aqua" },
  eye_of_ender: { title: { vi: "Mắt Ender", en: "Eye of Ender" }, titleColor: "yellow" },
  totem_of_undying: { title: { vi: "Lá Bùa Trường Sinh", en: "Totem of Undying" }, titleColor: "yellow" },

  end_crystal: { title: { vi: "Tinh Thể End", en: "End Crystal" }, titleColor: "magenta" },
  respawn_anchor: { title: { vi: "Neo Hồi Sinh", en: "Respawn Anchor" }, titleColor: "magenta" },
  wooden_pickaxe: { title: { vi: "Cúp Gỗ", en: "Wooden Pickaxe" } },
  stone_pickaxe: { title: { vi: "Cúp Đá", en: "Stone Pickaxe" } },
  iron_pickaxe: { title: { vi: "Cúp Sắt", en: "Iron Pickaxe" } },
  diamond_pickaxe: { title: { vi: "Cúp Kim Cương", en: "Diamond Pickaxe" } },

  // Spears
  wooden_spear: {
    title: { vi: "Thương Gỗ", en: "Wooden Spear" },
    lines: [
      { text: { vi: "Khi cầm ở tay chính:", en: "When in Main Hand:" }, color: "gray" },
      { text: { vi: "2 Sát thương Cận chiến", en: "2 Attack Damage" }, color: "green" },
      { text: { vi: "0.87 Tốc độ Đánh", en: "0.87 Attack Speed" }, color: "green" }
    ]
  },
  stone_spear: {
    title: { vi: "Thương Đá", en: "Stone Spear" },
    lines: [
      { text: { vi: "Khi cầm ở tay chính:", en: "When in Main Hand:" }, color: "gray" },
      { text: { vi: "3 Sát thương Cận chiến", en: "3 Attack Damage" }, color: "green" },
      { text: { vi: "0.87 Tốc độ Đánh", en: "0.87 Attack Speed" }, color: "green" }
    ]
  },
  iron_spear: {
    title: { vi: "Thương Sắt", en: "Iron Spear" },
    lines: [
      { text: { vi: "Khi cầm ở tay chính:", en: "When in Main Hand:" }, color: "gray" },
      { text: { vi: "4 Sát thương Cận chiến", en: "4 Attack Damage" }, color: "green" },
      { text: { vi: "0.87 Tốc độ Đánh", en: "0.87 Attack Speed" }, color: "green" }
    ]
  },
  copper_spear: {
    title: { vi: "Thương Đồng", en: "Copper Spear" },
    titleColor: "yellow",
    lines: [
      { text: { vi: "Khi cầm ở tay chính:", en: "When in Main Hand:" }, color: "gray" },
      { text: { vi: "3.5 Sát thương Cận chiến", en: "3.5 Attack Damage" }, color: "green" },
      { text: { vi: "0.87 Tốc độ Đánh", en: "0.87 Attack Speed" }, color: "green" }
    ]
  },
  golden_spear: {
    title: { vi: "Thương Vàng", en: "Golden Spear" },
    titleColor: "aqua",
    lines: [
      { text: { vi: "Khi cầm ở tay chính:", en: "When in Main Hand:" }, color: "gray" },
      { text: { vi: "2 Sát thương Cận chiến", en: "2 Attack Damage" }, color: "green" },
      { text: { vi: "0.87 Tốc độ Đánh", en: "0.87 Attack Speed" }, color: "green" }
    ]
  },
  diamond_spear: {
    title: { vi: "Thương Kim Cương", en: "Diamond Spear" },
    titleColor: "aqua",
    lines: [
      { text: { vi: "Khi cầm ở tay chính:", en: "When in Main Hand:" }, color: "gray" },
      { text: { vi: "4.5 Sát thương Cận chiến", en: "4.5 Attack Damage" }, color: "green" },
      { text: { vi: "0.87 Tốc độ Đánh", en: "0.87 Attack Speed" }, color: "green" }
    ]
  },
  netherite_spear: {
    title: { vi: "Thương Netherite", en: "Netherite Spear" },
    titleColor: "aqua",
    lines: [
      { text: { vi: "Khi cầm ở tay chính:", en: "When in Main Hand:" }, color: "gray" },
      { text: { vi: "5 Sát thương Cận chiến", en: "5 Attack Damage" }, color: "green" },
      { text: { vi: "0.87 Tốc độ Đánh", en: "0.87 Attack Speed" }, color: "green" }
    ]
  },

  // Blocks (Name only)
  cobblestone: { title: { vi: "Đá Cuội", en: "Cobblestone" } },
  cobbled_deepslate: { title: { vi: "Đá Sâu Cuội", en: "Cobbled Deepslate" } },
  blackstone: { title: { vi: "Đá Đen", en: "Blackstone" } },
  smooth_stone: { title: { vi: "Đá Mịn", en: "Smooth Stone" } },
  glowstone: { title: { vi: "Đá Phát Sáng", en: "Glowstone" } },
  obsidian: { title: { vi: "Hắc Diện Thạch", en: "Obsidian" } },
  crying_obsidian: { title: { vi: "Hắc Diện Thạch Khóc", en: "Crying Obsidian" } },
  block_of_iron: { title: { vi: "Khối Sắt", en: "Block of Iron" } },
  tinted_glass: { title: { vi: "Kính Râm", en: "Tinted Glass" } },
  crafting_table: { title: { vi: "Bàn Chế Tạo", en: "Crafting Table" } },
  furnace: { title: { vi: "Lò Nung", en: "Furnace" } },
  blast_furnace: { title: { vi: "Lò Luyện Kim", en: "Blast Furnace" } },
  anvil: { title: { vi: "Đe Sắt", en: "Anvil" } },
  ender_chest: { title: { vi: "Rương Ender", en: "Ender Chest" } },
  gold_ingot: { title: { vi: "Phôi Vàng", en: "Gold Ingot" } },
  glass: { title: { vi: "Thủy Tinh", en: "Glass" } },
  book: { title: { vi: "Sách", en: "Book" } },
  emerald: { title: { vi: "Lục Bảo", en: "Emerald" }, titleColor: "green" },
  coal: { title: { vi: "Than Đá", en: "Coal" } },
  amethyst_shard: { title: { vi: "Mảnh Thạch Anh Tím", en: "Amethyst Shard" } },
  gravel: { title: { vi: "Sỏi", en: "Gravel" } },
  stone: { title: { vi: "Đá", en: "Stone" } },
  end_stone: { title: { vi: "Đá End", en: "End Stone" } },
  bricks: { title: { vi: "Gạch", en: "Bricks" } },
  flint: { title: { vi: "Đá Lửa", en: "Flint" } },
  enchanting_table: { title: { vi: "Bàn Phù Phép", en: "Enchanting Table" } },
  bucket: { title: { vi: "Xô", en: "Bucket" } },
  bowl: { title: { vi: "Bát Gỗ", en: "Bowl" } },
  flower_pot: { title: { vi: "Chậu Hoa", en: "Flower Pot" } },
  glass_bottle: { title: { vi: "Chai Thủy Tinh", en: "Glass Bottle" } },
  brick: { title: { vi: "Gạch", en: "Brick" } },
  oak_button: { title: { vi: "Nút Gỗ Sồi", en: "Oak Button" } },
  spruce_button: { title: { vi: "Nút Gỗ Vân Sam", en: "Spruce Button" } },
  birch_button: { title: { vi: "Nút Gỗ Bạch Dương", en: "Birch Button" } },
  jungle_button: { title: { vi: "Nút Gỗ Rừng", en: "Jungle Button" } },
  acacia_button: { title: { vi: "Nút Gỗ Keo", en: "Acacia Button" } },
  dark_oak_button: { title: { vi: "Nút Gỗ Sồi Sẫm", en: "Dark Oak Button" } },
  mangrove_button: { title: { vi: "Nút Gỗ Đước", en: "Mangrove Button" } },
  bamboo_button: { title: { vi: "Nút Tre", en: "Bamboo Button" } },
  cherry_button: { title: { vi: "Nút Gỗ Anh Đào", en: "Cherry Button" } },
  pale_oak_button: { title: { vi: "Nút Gỗ Sồi Nhạt", en: "Pale Oak Button" } },
  crimson_button: { title: { vi: "Nút Gỗ Đỏ Tươi", en: "Crimson Button" } },
  warped_button: { title: { vi: "Nút Gỗ Kì Dị", en: "Warped Button" } },
  poplar_button: { title: { vi: "Nút Gỗ Poplar", en: "Poplar Button" } },
  stone_button: { title: { vi: "Nút Đá", en: "Stone Button" } }
};

export const getItemImgPath = (itemId) => {
  if (!itemId) return null;
  if (woodPlanks[itemId]) return woodPlanks[itemId];
  if (woodSlabs[itemId]) return woodSlabs[itemId];
  if (woodLogs[itemId]) return woodLogs[itemId];
  if (stoneVariants[itemId]) return stoneVariants[itemId];
  if (boatItems[itemId]) return boatItems[itemId];
  if (buttonItems[itemId]) return buttonItems[itemId];
  if (genericItems[itemId]) return genericItems[itemId];
  return null;
};

export const formatItemName = (itemId) => {
  if (!itemId) return "";
  return itemId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const CraftingArrow = () => (
  <svg width="22" height="15" viewBox="0 0 22 15" fill="none" style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}>
    <path d="M 0 5 H 12 V 0 H 14 V 2 H 16 V 4 H 18 V 6 H 20 V 7 H 22 V 8 H 20 V 9 H 18 V 11 H 16 V 13 H 14 V 15 H 12 V 10 H 0 Z" fill="#a1a1a1" />
  </svg>
);

const FurnaceFlame = ({ progress = 1 }) => {
  const h = 14;
  const clipY = Math.round(h * (1 - progress));
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}>
      <defs>
        <clipPath id={`flame-clip-${clipY}`}>
          <rect x="0" y={clipY} width="14" height={h - clipY} />
        </clipPath>
      </defs>
      <g clipPath={`url(#flame-clip-${clipY})`}>
        <rect x="6" y="0" width="1" height="1" fill="#c85410" />
        <rect x="7" y="0" width="1" height="1" fill="#9c4010" />
        <rect x="5" y="1" width="1" height="1" fill="#c85410" />
        <rect x="6" y="1" width="1" height="1" fill="#f0bc00" />
        <rect x="7" y="1" width="1" height="1" fill="#c85410" />
        <rect x="4" y="2" width="1" height="1" fill="#9c4010" />
        <rect x="5" y="2" width="1" height="1" fill="#f0bc00" />
        <rect x="6" y="2" width="1" height="1" fill="#f0bc00" />
        <rect x="7" y="2" width="1" height="1" fill="#f0bc00" />
        <rect x="8" y="2" width="1" height="1" fill="#9c4010" />
        <rect x="3" y="3" width="1" height="1" fill="#c85410" />
        <rect x="4" y="3" width="1" height="1" fill="#f0bc00" />
        <rect x="5" y="3" width="1" height="1" fill="#f8d800" />
        <rect x="6" y="3" width="1" height="1" fill="#f8d800" />
        <rect x="7" y="3" width="1" height="1" fill="#f8d800" />
        <rect x="8" y="3" width="1" height="1" fill="#f0bc00" />
        <rect x="9" y="3" width="1" height="1" fill="#c85410" />
        <rect x="10" y="3" width="1" height="1" fill="#9c4010" />
        <rect x="2" y="4" width="1" height="1" fill="#c85410" />
        <rect x="3" y="4" width="1" height="1" fill="#f0bc00" />
        <rect x="4" y="4" width="1" height="1" fill="#f8d800" />
        <rect x="5" y="4" width="1" height="1" fill="#fcfc00" />
        <rect x="6" y="4" width="1" height="1" fill="#fcfc00" />
        <rect x="7" y="4" width="1" height="1" fill="#f8d800" />
        <rect x="8" y="4" width="1" height="1" fill="#f8d800" />
        <rect x="9" y="4" width="1" height="1" fill="#f0bc00" />
        <rect x="10" y="4" width="1" height="1" fill="#c85410" />
        <rect x="11" y="4" width="1" height="1" fill="#9c4010" />
        <rect x="2" y="5" width="1" height="1" fill="#c85410" />
        <rect x="3" y="5" width="1" height="1" fill="#f0bc00" />
        <rect x="4" y="5" width="1" height="1" fill="#f8d800" />
        <rect x="5" y="5" width="1" height="1" fill="#fcfc00" />
        <rect x="6" y="5" width="1" height="1" fill="#fcfc00" />
        <rect x="7" y="5" width="1" height="1" fill="#fcfc00" />
        <rect x="8" y="5" width="1" height="1" fill="#f8d800" />
        <rect x="9" y="5" width="1" height="1" fill="#f0bc00" />
        <rect x="10" y="5" width="1" height="1" fill="#c85410" />
        <rect x="11" y="5" width="1" height="1" fill="#9c4010" />
        <rect x="1" y="6" width="1" height="1" fill="#9c4010" />
        <rect x="2" y="6" width="1" height="1" fill="#c85410" />
        <rect x="3" y="6" width="1" height="1" fill="#f0bc00" />
        <rect x="4" y="6" width="1" height="1" fill="#f8d800" />
        <rect x="5" y="6" width="1" height="1" fill="#fcfc00" />
        <rect x="6" y="6" width="1" height="1" fill="#fcfc54" />
        <rect x="7" y="6" width="1" height="1" fill="#fcfc54" />
        <rect x="8" y="6" width="1" height="1" fill="#fcfc00" />
        <rect x="9" y="6" width="1" height="1" fill="#f0bc00" />
        <rect x="10" y="6" width="1" height="1" fill="#c85410" />
        <rect x="11" y="6" width="1" height="1" fill="#9c4010" />
        <rect x="1" y="7" width="1" height="1" fill="#9c4010" />
        <rect x="2" y="7" width="1" height="1" fill="#c85410" />
        <rect x="3" y="7" width="1" height="1" fill="#f0bc00" />
        <rect x="4" y="7" width="1" height="1" fill="#f8d800" />
        <rect x="5" y="7" width="1" height="1" fill="#fcfc00" />
        <rect x="6" y="7" width="1" height="1" fill="#fcfc54" />
        <rect x="7" y="7" width="1" height="1" fill="#fcfc54" />
        <rect x="8" y="7" width="1" height="1" fill="#fcfc00" />
        <rect x="9" y="7" width="1" height="1" fill="#f8d800" />
        <rect x="10" y="7" width="1" height="1" fill="#c85410" />
        <rect x="11" y="7" width="1" height="1" fill="#9c4010" />
        <rect x="1" y="8" width="1" height="1" fill="#9c4010" />
        <rect x="2" y="8" width="1" height="1" fill="#c85410" />
        <rect x="3" y="8" width="1" height="1" fill="#f0bc00" />
        <rect x="4" y="8" width="1" height="1" fill="#f8d800" />
        <rect x="5" y="8" width="1" height="1" fill="#fcfc00" />
        <rect x="6" y="8" width="1" height="1" fill="#fcfc54" />
        <rect x="7" y="8" width="1" height="1" fill="#fcfc00" />
        <rect x="8" y="8" width="1" height="1" fill="#f8d800" />
        <rect x="9" y="8" width="1" height="1" fill="#f0bc00" />
        <rect x="10" y="8" width="1" height="1" fill="#c85410" />
        <rect x="1" y="9" width="1" height="1" fill="#9c4010" />
        <rect x="2" y="9" width="1" height="1" fill="#c85410" />
        <rect x="3" y="9" width="1" height="1" fill="#f0bc00" />
        <rect x="4" y="9" width="1" height="1" fill="#f8d800" />
        <rect x="5" y="9" width="1" height="1" fill="#fcfc00" />
        <rect x="6" y="9" width="1" height="1" fill="#fcfc00" />
        <rect x="7" y="9" width="1" height="1" fill="#f8d800" />
        <rect x="8" y="9" width="1" height="1" fill="#f0bc00" />
        <rect x="9" y="9" width="1" height="1" fill="#c85410" />
        <rect x="10" y="9" width="1" height="1" fill="#9c4010" />
        <rect x="2" y="10" width="1" height="1" fill="#9c4010" />
        <rect x="3" y="10" width="1" height="1" fill="#c85410" />
        <rect x="4" y="10" width="1" height="1" fill="#f0bc00" />
        <rect x="5" y="10" width="1" height="1" fill="#f8d800" />
        <rect x="6" y="10" width="1" height="1" fill="#f8d800" />
        <rect x="7" y="10" width="1" height="1" fill="#f0bc00" />
        <rect x="8" y="10" width="1" height="1" fill="#c85410" />
        <rect x="9" y="10" width="1" height="1" fill="#9c4010" />
        <rect x="3" y="11" width="1" height="1" fill="#9c4010" />
        <rect x="4" y="11" width="1" height="1" fill="#c85410" />
        <rect x="5" y="11" width="1" height="1" fill="#f0bc00" />
        <rect x="6" y="11" width="1" height="1" fill="#f0bc00" />
        <rect x="7" y="11" width="1" height="1" fill="#c85410" />
        <rect x="8" y="11" width="1" height="1" fill="#9c4010" />
        <rect x="4" y="12" width="1" height="1" fill="#9c4010" />
        <rect x="5" y="12" width="1" height="1" fill="#c85410" />
        <rect x="6" y="12" width="1" height="1" fill="#c85410" />
        <rect x="7" y="12" width="1" height="1" fill="#9c4010" />
        <rect x="5" y="13" width="1" height="1" fill="#9c4010" />
        <rect x="6" y="13" width="1" height="1" fill="#9c4010" />
      </g>
    </svg>
  );
};

const FurnaceFlameGrid = ({ progress = 1 }) => {
  return (
    <div className="mc-recipe-furnace-flame-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img
        src="/assets/img/recipe/Grid_layout_Fire_(in-active).png"
        alt="fire inactive"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          objectFit: 'contain'
        }}
      />
      <img
        src="/assets/img/recipe/Grid_layout_Fire_(active).png"
        alt="fire active"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          objectFit: 'contain',
          clipPath: `inset(${(1 - progress) * 100}% 0% 0% 0%)`
        }}
      />
    </div>
  );
};

const FurnaceArrowGrid = ({ progress = 1 }) => {
  return (
    <div className="mc-recipe-furnace-arrow-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img
        src="/assets/img/recipe/Grid_layout_Furnace_Progress_(in-active).png"
        alt="furnace arrow inactive"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          objectFit: 'contain'
        }}
      />
      <img
        src="/assets/img/recipe/Grid_layout_Furnace_Progress_(in-active).png"
        alt="furnace arrow active"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          objectFit: 'contain',
          filter: 'brightness(1.8) contrast(1.2)',
          clipPath: `inset(0% ${(1 - progress) * 100}% 0% 0%)`
        }}
      />
    </div>
  );
};

export default function MinecraftRecipe({ recipe, isVi, size = 'small' }) {
  const [hoveredRaw, setHoveredRaw] = React.useState(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [cycleIndex, setCycleIndex] = React.useState(0);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
    }, 0);
    const timer = setInterval(() => {
      setCycleIndex(prev => prev + 1);
    }, 120);
    return () => clearInterval(timer);
  }, []);

  if (!recipe) return null;

  const sizes = { small: 32, medium: 40, large: 56 };
  const slotSize = sizes[size] || 32;
  const scale = slotSize / 16;

  const containerStyle = {
    "--mc-scale": scale,
    "--mc-slot-size": `${slotSize}px`,
  };

  const handleMouseMove = (e, rawId, isOutput) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    setHoveredRaw({ id: rawId, isOutput });
  };

  const handleMouseLeave = () => {
    setHoveredRaw(null);
  };

  const plankKeys = Object.keys(woodPlanks);
  const slabKeys = Object.keys(woodSlabs);
  const logKeys = Object.keys(woodLogs);
  const stoneVariantKeys = Object.keys(stoneVariants).filter((key) => key !== "stone_variant");
  const boatKeys = Object.keys(boatItems);
  const buttonKeys = Object.keys(buttonItems);
  const isBoatRecipe = boatKeys.includes(recipe.output);
  const isButtonRecipe = buttonKeys.includes(recipe.output);
  const isSpearRecipe = typeof recipe.output === "string" && recipe.output.endsWith("_spear");

  const getDisplayedItemId = (itemId, isOutputSlot) => {
    if (!itemId) return null;

    if (isSpearRecipe && arrowItems.includes(itemId)) {
      const ci = Math.floor(cycleIndex / 12);
      return arrowItems[ci % arrowItems.length];
    }

    if (isBoatRecipe) {
      const ci = Math.floor(cycleIndex / 12);
      const woodTypes = ["oak", "spruce", "birch", "jungle", "acacia", "dark_oak", "mangrove", "bamboo", "cherry", "pale_oak"];
      const activeWood = woodTypes[ci % woodTypes.length];

      if (woodPlanks[itemId]) {
        return activeWood;
      }
      if (isOutputSlot && boatKeys.includes(itemId)) {
        if (activeWood === "bamboo") {
          return "bamboo_raft";
        }
        return `${activeWood}_boat`;
      }
    } else if (isButtonRecipe) {
      const ci = Math.floor(cycleIndex / 12);
      const activePair = buttonRecipePairs[ci % buttonRecipePairs.length];
      if (woodPlanks[itemId] || itemId === "stone") {
        return activePair.input;
      }
      if (isOutputSlot && buttonItems[itemId]) {
        return activePair.output;
      }
    } else {
      const ci = Math.floor(cycleIndex / 12);
      if (woodPlanks[itemId]) {
        return plankKeys[ci % plankKeys.length];
      }
      if (woodSlabs[itemId]) {
        return slabKeys[ci % slabKeys.length];
      }
      if (woodLogs[itemId]) {
        return logKeys[ci % logKeys.length];
      }
      if (buttonItems[itemId]) {
        return buttonKeys[ci % buttonKeys.length];
      }
      if (itemId === "stone_variant") {
        return stoneVariantKeys[ci % stoneVariantKeys.length];
      }
    }

    return itemId;
  };

  const renderSlot = (rawId, isOutput = false, count = 1) => {
    if (!rawId) {
      return <div className={`mc-recipe-slot ${isOutput ? 'mc-recipe-slot--output' : ''}`} />;
    }
    const displayedId = getDisplayedItemId(rawId, isOutput);
    const imgPath = getItemImgPath(displayedId);

    return (
      <div
        className={`mc-recipe-slot ${isOutput ? 'mc-recipe-slot--output' : ''}`}
        title=""
        onMouseMove={(e) => handleMouseMove(e, rawId, isOutput)}
        onMouseLeave={handleMouseLeave}
      >
        {imgPath ? <img src={imgPath} alt={displayedId} /> : <span className="mc-recipe-placeholder">?</span>}
        {count > 1 && <span className="mc-recipe-slot-count">{count}</span>}
      </div>
    );
  };

  const renderTooltipPortal = () => {
    if (!hoveredRaw || !isMounted) return null;
    const activeId = getDisplayedItemId(hoveredRaw.id, hoveredRaw.isOutput);
    if (!activeId) return null;

    const desc = itemDescriptions[activeId];
    const defaultTitle = formatItemName(activeId);

    const isNearTop = mousePos.y < 120;
    const tooltipStyle = {
      position: "fixed",
      left: `${mousePos.x + 12}px`,
      top: `${mousePos.y}px`,
      transform: isNearTop ? "translateY(20px)" : "translateY(-100%)",
      zIndex: 99999,
      pointerEvents: "none",
      "--mc-scale": scale
    };

    const tooltipEl = (
      <div className="mc-tooltip-fixed" style={tooltipStyle}>
        <div className={`mc-tooltip-title mc-tooltip-text--${desc?.titleColor || 'white'}`}>
          {desc ? (isVi ? desc.title.vi : desc.title.en) : defaultTitle}
        </div>
        {desc && desc.lines && desc.lines.map((line, lIdx) => {
          const isIndented = line.color === "green";
          return (
            <div
              key={lIdx}
              className={`mc-tooltip-line mc-tooltip-text--${line.color || 'gray'} ${isIndented ? 'mc-tooltip-line--indented' : ''}`}
            >
              {isVi ? line.text.vi : line.text.en}
            </div>
          );
        })}
      </div>
    );

    return ReactDOM.createPortal(tooltipEl, document.body);
  };

  if (recipe.type === "smithing") {
    return (
      <div className="mc-recipe-gui mc-recipe-gui--smithing" style={containerStyle}>
        <div className="mc-recipe-smithing-body">
          {renderSlot(recipe.template, false)}
          {renderSlot(recipe.base, false)}
          {renderSlot(recipe.addition, false)}
          <div className="mc-recipe-arrow" style={{ width: "calc(var(--mc-scale) * 22px)", height: "calc(var(--mc-scale) * 18px)" }}>
            <img
              src="/assets/img/recipe/Grid_layout_Furnace_Progress_(in-active).png"
              alt="arrow"
              style={{
                width: '100%',
                height: '100%',
                imageRendering: 'pixelated',
                objectFit: 'contain'
              }}
            />
          </div>
          {renderSlot(recipe.output, false)}
        </div>
        {renderTooltipPortal()}
      </div>
    );
  }

  if (recipe.type === "blasting") {
    const flameCycleDuration = 24;
    const flameFrame = cycleIndex % flameCycleDuration;
    const flameProgress = flameFrame < (flameCycleDuration / 2)
      ? 1 - (flameFrame / (flameCycleDuration / 2))
      : (flameFrame - flameCycleDuration / 2) / (flameCycleDuration / 2);

    const arrowCycleDuration = 40;
    const arrowProgress = (cycleIndex % arrowCycleDuration) / arrowCycleDuration;

    return (
      <div className="mc-recipe-gui mc-recipe-gui--furnace" style={containerStyle}>
        <div className="mc-recipe-furnace-body">
          <div className="mc-recipe-furnace-left">
            {renderSlot(recipe.input, false, recipe.inputCount)}
            <div className="mc-recipe-furnace-flame">
              <FurnaceFlameGrid progress={flameProgress} />
            </div>
          </div>
          <div className="mc-recipe-furnace-right">
            <div className="mc-recipe-arrow" style={{ width: "calc(var(--mc-scale) * 22px)", height: "calc(var(--mc-scale) * 18px)" }}>
              <FurnaceArrowGrid progress={arrowProgress} />
            </div>
            {renderSlot(recipe.output, true, recipe.outputCount)}
          </div>
        </div>
        {renderTooltipPortal()}
      </div>
    );
  }

  if (recipe.type === "smelting") {
    const flameCycleDuration = 24;
    const flameFrame = cycleIndex % flameCycleDuration;
    const flameProgress = flameFrame < (flameCycleDuration / 2)
      ? 1 - (flameFrame / (flameCycleDuration / 2))
      : (flameFrame - flameCycleDuration / 2) / (flameCycleDuration / 2);

    const arrowCycleDuration = 40;
    const arrowProgress = (cycleIndex % arrowCycleDuration) / arrowCycleDuration;

    return (
      <div className="mc-recipe-gui mc-recipe-gui--furnace" style={containerStyle}>
        <div className="mc-recipe-furnace-body">
          <div className="mc-recipe-furnace-left">
            {renderSlot(recipe.input, false, recipe.inputCount)}
            <div className="mc-recipe-furnace-flame">
              <FurnaceFlameGrid progress={flameProgress} />
            </div>
            {renderSlot(null, false)}
          </div>
          <div className="mc-recipe-furnace-right">
            <div className="mc-recipe-arrow" style={{ width: "calc(var(--mc-scale) * 22px)", height: "calc(var(--mc-scale) * 18px)" }}>
              <FurnaceArrowGrid progress={arrowProgress} />
            </div>
            {renderSlot(recipe.output, true, recipe.outputCount)}
          </div>
        </div>
        {renderTooltipPortal()}
      </div>
    );
  }

  return (
    <div className="mc-recipe-gui" style={containerStyle}>
      <div className="mc-recipe-grid">
        {recipe.grid.map((itemId, idx) => (
          <React.Fragment key={idx}>
            {renderSlot(itemId, false)}
          </React.Fragment>
        ))}
      </div>
      <div className="mc-recipe-arrow" style={{ width: "calc(var(--mc-scale) * 22px)", height: "calc(var(--mc-scale) * 18px)" }}>
        <img
          src="/assets/img/recipe/Grid_layout_Furnace_Progress_(in-active).png"
          alt="arrow"
          style={{
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated',
            objectFit: 'contain'
          }}
        />
      </div>
      {renderSlot(recipe.output, true, recipe.outputCount)}
      {renderTooltipPortal()}
    </div>
  );
}
