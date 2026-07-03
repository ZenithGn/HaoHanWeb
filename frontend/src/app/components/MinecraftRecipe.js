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
  crimson: "/assets/img/minecraft/wood_type/Crimson_Planks.png"
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

const genericItems = {
  stick: "/assets/img/minecraft/item/Stick.png",
  arrow: "/assets/img/minecraft/item/Arrow.png",
  spectral_arrow: "/assets/img/minecraft/item/Spectral_Arrow.png",
  redstone: "/assets/img/minecraft/item/Redstone.png",
  shield: "/assets/img/minecraft/item/Shield.png",
  iron_ingot: "/assets/img/minecraft/item/Iron_Ingot.png",
  copper_ingot: "/assets/img/minecraft/item/Copper_Ingot.webp",
  diamond: "/assets/img/minecraft/item/Diamond.png",
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
  ender_chest: "/assets/img/minecraft/entity_block_type/Ender_Chest.png",
  gold_ingot: "/assets/img/minecraft/item/Gold_Ingot.webp",
  netherite_ingot: "/assets/img/minecraft/item/Netherite_Ingot.webp",
  glass: "/assets/img/minecraft/Glass.png",
  book: "/assets/img/minecraft/item/Book.webp",
  emerald: "/assets/img/minecraft/item/Emerald.png",
  coal: "/assets/img/minecraft/item/Coal.png",
  amethyst_shard: "/assets/img/minecraft/item/Amethyst_Shard.png",
  gravel: "/assets/img/minecraft/Gravel.png",
  totem_of_undying: "/assets/img/minecraft/item/Totem_of_Undying.webp",
  wooden_spear: "/assets/img/minecraft/item/ItemSprite_wooden-spear.png",
  stone_spear: "/assets/img/minecraft/item/ItemSprite_stone-spear.png",
  iron_spear: "/assets/img/minecraft/item/ItemSprite_iron-spear.webp",
  copper_spear: "/assets/img/minecraft/item/ItemSprite_copper-spear.png",
  golden_spear: "/assets/img/minecraft/item/ItemSprite_golden-spear.png",
  diamond_spear: "/assets/img/recipe/spear/diamond_spear.png",
  netherite_spear: "/assets/img/minecraft/item/ItemSprite_netherite-spear.png",
  bucket: "/assets/img/minecraft/Bucket.png"
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
  block_of_netherite: { title: { vi: "Khối Netherite", en: "Block of Netherite" }, titleColor: "aqua" },
  eye_of_ender: { title: { vi: "Mắt Ender", en: "Eye of Ender" }, titleColor: "yellow" },
  totem_of_undying: { title: { vi: "Lá Bùa Trường Sinh", en: "Totem of Undying" }, titleColor: "yellow" },

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
  bucket: { title: { vi: "Xô", en: "Bucket" } }
};

export const getItemImgPath = (itemId) => {
  if (!itemId) return null;
  if (woodPlanks[itemId]) return woodPlanks[itemId];
  if (boatItems[itemId]) return boatItems[itemId];
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

export default function MinecraftRecipe({ recipe, isVi, size = 'small' }) {
  if (!recipe) return null;

  const sizes = { small: 32, medium: 40, large: 56 };
  const slotSize = sizes[size] || 32;
  const scale = slotSize / 16;

  const containerStyle = {
    "--mc-scale": scale,
    "--mc-slot-size": `${slotSize}px`,
  };

  const [hoveredRaw, setHoveredRaw] = React.useState(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [cycleIndex, setCycleIndex] = React.useState(0);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => {
      setCycleIndex(prev => prev + 1);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = (e, rawId, isOutput) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    setHoveredRaw({ id: rawId, isOutput });
  };

  const handleMouseLeave = () => {
    setHoveredRaw(null);
  };

  const plankKeys = Object.keys(woodPlanks);
  const boatKeys = Object.keys(boatItems);
  const isBoatRecipe = boatKeys.includes(recipe.output) && recipe.output !== "bamboo_raft";

  const getDisplayedItemId = (itemId, isOutputSlot) => {
    if (!itemId) return null;

    if (isBoatRecipe) {
      const woodTypes = ["oak", "spruce", "birch", "jungle", "acacia", "dark_oak", "mangrove", "cherry", "pale_oak"];
      const activeWood = woodTypes[cycleIndex % woodTypes.length];

      if (woodPlanks[itemId]) {
        return activeWood;
      }
      if (isOutputSlot && boatKeys.includes(itemId)) {
        return `${activeWood}_boat`;
      }
    } else {
      if (woodPlanks[itemId]) {
        const activePlank = plankKeys[cycleIndex % plankKeys.length];
        return activePlank;
      }
    }

    return itemId;
  };

  const renderSlot = (rawId, isOutput = false) => {
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
          <div className="mc-recipe-arrow">
            <CraftingArrow />
          </div>
          {renderSlot(recipe.output, false)}
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
      <div className="mc-recipe-arrow">
        <CraftingArrow />
      </div>
      {renderSlot(recipe.output, true)}
      {renderTooltipPortal()}
    </div>
  );
}
