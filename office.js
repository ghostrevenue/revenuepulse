// AI Office - 2D Office Visualization - GATHER.TOWN STYLE EDITION
// All shared globals (API_BASE, currentView, selectedAgent) are declared in app.js
// office.js ONLY handles canvas rendering and office-specific logic

const PIXEL_SCALE = 4; // each "pixel" is 4x4 real pixels

const COLORS = {
  // Stardew Valley inspired warm palette
  floor_main: '#E8D4B8',
  floor_alt: '#D4A574',
  floor_accent: '#C49A6C',
  floor_carpet: '#B8865A',
  floor_dark: '#8B6914',

  // Walls - warm tan/cream like Stardew
  wall: '#E8DCC8',
  wall_top: '#F5EDE0',
  wall_shadow: '#9B8B75',
  wall_highlight: '#FFF8F0',
  wall_trim: '#C4A77D',

  // Accents - warm, saturated Stardew colors
  accent_teal: '#5B8C5B',
  accent_warm: '#FFB347',
  accent_coral: '#E77E5E',
  accent_sage: '#8FBC8F',
  accent_magenta: '#D4A5D4',
  accent_gold: '#FFD700',
  accent_cream: '#FFF8DC',

  // Department colors - warm, saturated
  dept_development: '#6B8CC4',
  dept_research: '#5B8C8B',
  dept_business: '#C49A6C',
  dept_coding: '#7B9ED9',
  dept_qa: '#8FBC8F',
  dept_general: '#E8D4B8',
  dept_owner: '#FFB347',
  dept_design: '#E8A87C',

  // Status - warm friendly colors
  status_idle: '#8FBC8F',
  status_working: '#6B8CC4',
  status_waiting: '#FFB347',
  status_error: '#E77E5E',

  // Skin tones - warm pixel art skin
  skin_light: '#FFE4C4',
  skin_medium: '#DEB887',
  skin_dark: '#A67B5B',
  skin_tan: '#D2A679',

  // Hair colors - warm browns and blacks
  hair_brown: '#6B4423',
  hair_black: '#2C2416',
  hair_blonde: '#D4A857',
  hair_red: '#A0522D',

  // Furniture - warm wood tones like Stardew
  desk_wood: '#B8865A',
  desk_dark: '#8B6914',
  desk_light: '#D4A574',
  monitor_screen: '#6B8CC4',
  monitor_glow: '#A5C4E8',

  // Plants! - rich sage green
  plant_leaf: '#5B8C5B',
  plant_leaf_dark: '#3D6B3D',
  plant_pot: '#B87333',

  // Light rays from windows
  light_ray: 'rgba(255, 248, 220, 0.15)',
  light_ray_edge: 'rgba(255, 248, 220, 0.05)',

  // Dust particles
  dust_mote: 'rgba(255, 248, 220, 0.6)',

  // UI - warm cozy panels
  panel_bg: 'rgba(232, 212, 184, 0.95)',
  panel_border: '#C4A77D',
  text: '#5D4E37',
  text_dim: '#8B7355',

  // Shadows
  shadow: 'rgba(60, 45, 30, 0.4)',
  shadow_soft: 'rgba(60, 45, 30, 0.2)',
};

const OFFICE_WIDTH = 1200;
const OFFICE_HEIGHT = 800;
const TILE_SIZE = 40;
const AGENT_SIZE = 50;
const WALL_THICKNESS = 12;
const DOOR_WIDTH = 50;

// ============================================================================
// PIXEL ART ASSETS - Loaded from /sprites and /backgrounds
// ============================================================================

let pixelArtAssets = {
  characters: null,
  furniture: null,
  background: null,
  assetsLoaded: false
};

function loadPixelArtAssets() {
  return new Promise((resolve) => {
    let loaded = 0;
    const total = 3;

    function checkDone() {
      loaded++;
      if (loaded >= total) {
        pixelArtAssets.assetsLoaded = true;
        console.log('Pixel art assets loaded successfully');
        resolve();
      }
    }

    // Load character sprite sheet (LPC format - 16x32 characters)
    pixelArtAssets.characters = new Image();
    pixelArtAssets.characters.onload = checkDone;
    pixelArtAssets.characters.onerror = () => {
      console.warn('Failed to load characters sprite sheet');
      checkDone();
    };
    pixelArtAssets.characters.src = '/sprites/lpc_all.png';

    // Load furniture tileset
    pixelArtAssets.furniture = new Image();
    pixelArtAssets.furniture.onload = checkDone;
    pixelArtAssets.furniture.onerror = () => {
      console.warn('Failed to load furniture tileset');
      checkDone();
    };
    pixelArtAssets.furniture.src = '/sprites/office_furniture.png';

    // Load background/tilemap
    pixelArtAssets.background = new Image();
    pixelArtAssets.background.onload = checkDone;
    pixelArtAssets.background.onerror = () => {
      console.warn('Failed to load background');
      checkDone();
    };
    pixelArtAssets.background.src = '/backgrounds/office_tilemap.png';
  });
}

// Sprite data: each sprite is a 2D array of color keys or null
// 8 wide x 12 tall for characters

const SPRITE_FRAMES = {
  idle: 0,
  walk1: 1,
  walk2: 2,
  walk3: 3
};

// ============================================================================
// STARDew VALLEY STYLE 16x16 CHARACTER SPRITES
// ============================================================================

// 16x16 Character sprite templates - proper pixel art style
// Each character has 4 directional sprites (down, up, left, right) x 3 frames (idle, walk1, walk2)

function createCharacterSpriteSheet16(agent, direction = 'down', frame = 0) {
  const sprites = {
    // Format: row 0-15, each row is array of 16 color keys or null
    // Character is 16x16 pixels with head (rows 0-5), body (rows 6-11), legs (rows 12-15)
  };

  const deptColor = COLORS[`dept_${agent.department}`] || COLORS.dept_general;
  const hairColor = getHairColor(agent);
  const skinColor = getSkinColor(agent);

  // Base sprite data - 16x16 grid
  const sprite = [];

  // Hair/Head area (rows 0-5)
  for (let y = 0; y < 6; y++) {
    sprite.push(new Array(16).fill(0));
  }

  // Body area (rows 6-12)
  for (let y = 6; y < 13; y++) {
    sprite.push(new Array(16).fill(0));
  }

  // Legs area (rows 13-15)
  for (let y = 13; y < 16; y++) {
    sprite.push(new Array(16).fill(0));
  }

  // Draw head (centered at x=4-11)
  // Hair top
  for (let x = 4; x <= 11; x++) {
    sprite[0][x] = hairColor;
    sprite[1][x] = hairColor;
  }
  // Face
  for (let y = 2; y <= 4; y++) {
    for (let x = 4; x <= 11; x++) {
      sprite[y][x] = skinColor;
    }
  }
  // Hair sides
  sprite[2][3] = hairColor;
  sprite[2][12] = hairColor;
  sprite[3][3] = hairColor;
  sprite[3][12] = hairColor;
  sprite[4][3] = hairColor;
  sprite[4][12] = hairColor;

  // Eyes based on direction
  if (direction === 'down') {
    sprite[3][5] = '#2C2416'; // left eye
    sprite[3][10] = '#2C2416'; // right eye
    sprite[3][6] = '#FFFFFF'; // highlight
    sprite[3][11] = '#FFFFFF'; // highlight
  } else if (direction === 'up') {
    // Back of head - show hair
    for (let x = 4; x <= 11; x++) {
      sprite[2][x] = hairColor;
      sprite[3][x] = hairColor;
    }
  } else if (direction === 'left') {
    sprite[3][5] = '#2C2416';
    sprite[3][6] = '#FFFFFF';
  } else if (direction === 'right') {
    sprite[3][10] = '#2C2416';
    sprite[3][9] = '#FFFFFF';
  }

  // Mouth
  sprite[4][7] = '#C49A6C';
  sprite[4][8] = '#C49A6C';

  // Body (rows 6-12) - wearing colored shirt
  for (let y = 6; y <= 12; y++) {
    for (let x = 3; x <= 12; x++) {
      // Arms
      if (x <= 4 || x >= 11) {
        sprite[y][x] = skinColor;
      } else {
        sprite[y][x] = deptColor;
      }
    }
  }

  // Legs with walk animation
  const legOffset = frame === 0 ? 0 : (frame === 1 ? -1 : 1);

  // Left leg
  sprite[13][5 + legOffset] = '#5D4E37';
  sprite[13][6 + legOffset] = '#5D4E37';
  sprite[14][5 + legOffset] = '#5D4E37';
  sprite[14][6 + legOffset] = '#5D4E37';
  sprite[15][5 + legOffset] = '#3D2E1F';
  sprite[15][6 + legOffset] = '#3D2E1F';

  // Right leg
  sprite[13][9 - legOffset] = '#5D4E37';
  sprite[13][10 - legOffset] = '#5D4E37';
  sprite[14][9 - legOffset] = '#5D4E37';
  sprite[14][10 - legOffset] = '#5D4E37';
  sprite[15][9 - legOffset] = '#3D2E1F';
  sprite[15][10 - legOffset] = '#3D2E1F';

  return sprite;
}

// Helper to get hair color based on agent name
function getHairColor(agent) {
  const colors = ['#6B4423', '#2C2416', '#D4A857', '#A0522D', '#4A3728'];
  return colors[agent.name.length % colors.length];
}

// Helper to get skin color
function getSkinColor(agent) {
  const colors = ['#FFE4C4', '#DEB887', '#A67B5B', '#D2A679'];
  return colors[agent.name.length % colors.length];
}

// ============================================================================
// SIMPLIFIED 8x12 SPRITES FOR COMPATIBILITY
// ============================================================================

// Character sprite template (8x12 pixels)
// Format: each row is an array of color indices
const BASE_CHARACTER = [
  // Row 0-1: Hair/Head top
  [0, 0, 'hair', 'hair', 'hair', 'hair', 0, 0],
  // Row 2-3: Face
  [0, 'hair', 'skin', 'skin', 'skin', 'skin', 'hair', 0],
  // Row 4: Eyes
  [0, 'hair', 'skin', 'eyes', 'skin', 'eyes', 'skin', 'hair'],
  // Row 5: Face lower
  [0, 'hair', 'skin', 'skin', 'skin', 'skin', 'skin', 'hair'],
  // Row 6: Mouth
  [0, 0, 'skin', 'skin', 'mouth', 'skin', 'skin', 0],
  // Row 7-8: Body start
  [0, 0, 'body', 'body', 'body', 'body', 0, 0],
  // Row 9-10: Body middle
  [0, 'body', 'body', 'body', 'body', 'body', 'body', 0],
  // Row 11: Legs
  [0, 'legs', 0, 'legs', 0, 'legs', 0, 0]
];

// Agent type variations (8x12)
const AGENT_SPRITES = {
  developer: {
    body: 'dept_coding',
    legs: 'dept_coding',
    badge: null,
    glasses: true
  },
  senior_dev: {
    body: 'dept_coding',
    legs: '#3355aa',
    badge: 'badge_senior',
    glasses: true
  },
  qa: {
    body: 'dept_business',
    legs: 'dept_business',
    badge: 'badge_qa',
    glasses: false,
    clipboard: true
  },
  pm: {
    body: '#aa44aa',
    legs: '#8844888',
    badge: 'badge_pm',
    glasses: false,
    tie: true
  },
  dept_head: {
    body: '#6633aa',
    legs: '#442266',
    badge: 'badge_head',
    glasses: false,
    star: true
  }
};

// Furniture sprites
const DESK_SPRITE = [
  ['desk_dark', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_dark', 'desk_dark'],
  ['desk_dark', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_dark', 'desk_dark'],
  ['desk_dark', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_wood', 'desk_dark', 'desk_dark'],
  [0, 0, 0, 0, 0, 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 'desk_dark', 'monitor_screen', 'monitor_glow', 'monitor_glow', 'monitor_screen', 'desk_dark', 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 'desk_dark', 'monitor_screen', 'monitor_screen', 'monitor_screen', 'monitor_screen', 'desk_dark', 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const CHAIR_SPRITE = [
  [0, 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 0],
  [0, 'desk_dark', 'dept_general', 'dept_general', 'desk_dark', 0],
  [0, 'desk_dark', 'dept_general', 'dept_general', 'desk_dark', 0],
  ['desk_dark', 'desk_dark', 'dept_general', 'dept_general', 'desk_dark', 'desk_dark'],
  [0, 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 0],
  [0, 'desk_dark', 0, 0, 'desk_dark', 0],
  [0, 'desk_dark', 0, 0, 'desk_dark', 0],
  [0, 'desk_dark', 0, 0, 'desk_dark', 0]
];

// ============================================================================
// Sprite Drawing Helpers
// ============================================================================

function drawPixelSprite(ctx, sprite, x, y, scale, flipX = false) {
  if (!sprite) return;
  
  const height = sprite.length;
  const width = sprite[0].length;
  
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const colorKey = sprite[row][col];
      if (colorKey === 0 || colorKey === null || colorKey === undefined) continue;
      
      const color = COLORS[colorKey] || colorKey;
      ctx.fillStyle = color;
      
      const drawX = flipX ? (x + (width - 1 - col) * scale) : (x + col * scale);
      const drawY = y + row * scale;
      
      ctx.fillRect(Math.floor(drawX), Math.floor(drawY), scale, scale);
    }
  }
}

function buildCharacterSprite(agent, frame = 0) {
  const sprite = [];
  const deptColor = COLORS[`dept_${agent.department}`] || COLORS.dept_general;
  const hairColor = agent.name.length % 3 === 0 ? '#d4a857' : 
                     agent.name.length % 2 === 0 ? '#1a1a1a' : '#4a3728';
  const skinColor = 'skin_light';
  
  let agentType = 'developer';
  const role = (agent.role || '').toLowerCase();
  if (role.includes('senior') || role.includes('lead')) agentType = 'senior_dev';
  else if (role.includes('qa') || role.includes('test')) agentType = 'qa';
  else if (role.includes('pm') || role.includes('product') || role.includes('manager')) agentType = 'pm';
  else if (role.includes('head') || role.includes('director') || role.includes('chief')) agentType = 'dept_head';
  
  const typeConfig = AGENT_SPRITES[agentType];
  const bodyColor = typeConfig.body.includes('#') ? typeConfig.body : 
                    COLORS[typeConfig.body] || deptColor;
  const legsColor = typeConfig.legs.includes('#') ? typeConfig.legs : 
                    COLORS[typeConfig.legs] || deptColor;
  
  const bobOffset = frame === 0 ? 0 : -1;
  
  for (let row = 0; row < 12; row++) {
    const rowData = [];
    
    if (row === 0) {
      rowData.push(0, 0, hairColor, hairColor, hairColor, hairColor, 0, 0);
    } else if (row === 1) {
      rowData.push(0, hairColor, skinColor, skinColor, skinColor, skinColor, hairColor, 0);
    } else if (row === 2) {
      if (typeConfig.glasses) {
        rowData.push(0, hairColor, skinColor, '#222222', skinColor, '#222222', skinColor, hairColor);
      } else {
        rowData.push(0, hairColor, skinColor, skinColor, skinColor, skinColor, skinColor, hairColor);
      }
    } else if (row === 3) {
      if (typeConfig.glasses) {
        rowData.push(0, hairColor, 'dept_general', 'dept_general', 'dept_general', 'dept_general', hairColor, 0);
      } else {
        rowData.push(0, hairColor, skinColor, skinColor, skinColor, skinColor, skinColor, hairColor);
      }
    } else if (row === 4) {
      rowData.push(0, hairColor, skinColor, skinColor, skinColor, skinColor, skinColor, hairColor);
    } else if (row === 5) {
      rowData.push(0, 0, skinColor, skinColor, COLORS.accent_coral, skinColor, skinColor, 0);
    } else if (row === 6) {
      rowData.push(0, 0, bodyColor, bodyColor, bodyColor, bodyColor, 0, 0);
    } else if (row === 7) {
      if (typeConfig.badge) {
        rowData.push(0, bodyColor, bodyColor, typeConfig.badge, bodyColor, bodyColor, bodyColor, 0);
      } else {
        rowData.push(0, bodyColor, bodyColor, bodyColor, bodyColor, bodyColor, bodyColor, 0);
      }
    } else if (row === 8) {
      rowData.push(0, bodyColor, bodyColor, bodyColor, bodyColor, bodyColor, bodyColor, 0);
    } else if (row === 9) {
      rowData.push(0, legsColor, 0, legsColor, 0, legsColor, 0, 0);
    } else if (row === 10) {
      const offset1 = frame === 0 ? 0 : 1;
      const offset2 = frame === 0 ? 0 : -1;
      rowData.push(0, legsColor, 0, legsColor, 0, legsColor, 0, 0);
    } else {
      rowData.push(0, 'desk_dark', 0, 'desk_dark', 0, 'desk_dark', 0, 0);
    }
    
    sprite.push(rowData);
  }
  
  return sprite;
}

function drawAgentAvatar(agent, x, y, scale = PIXEL_SCALE) {
  if (!ctx) return;

  const spriteWidth = 16 * scale;  // LPC characters are 16 wide
  const spriteHeight = 32 * scale; // LPC characters are 32 tall

  const drawX = x - spriteWidth / 2;
  const drawY = y - spriteHeight;

  // Draw shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, spriteWidth / 3, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Use pixel art sprite if loaded, otherwise fallback to programmatic
  if (pixelArtAssets.assetsLoaded && pixelArtAssets.characters) {
    // LPC sprite sheet is 480x352, characters are 16x32
    // Each row has 15 characters (480/16=15 columns), height is 352/32=11 rows
    // Use agent name to deterministically select a character
    const charIndex = Math.abs(agent.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 15;
    const rowIndex = Math.abs(agent.name.charCodeAt(0) % 6); // Use first letter to vary row

    const srcX = charIndex * 16;
    const srcY = rowIndex * 32;

    // Flip X for variety based on name length
    if (agent.name.length % 2 === 0) {
      ctx.save();
      ctx.translate(drawX + spriteWidth, drawY);
      ctx.scale(-1, 1);
      ctx.drawImage(
        pixelArtAssets.characters,
        srcX, srcY, 16, 32,
        0, 0, 16, 32
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        pixelArtAssets.characters,
        srcX, srcY, 16, 32,
        drawX, drawY, spriteWidth, spriteHeight
      );
    }
  } else {
    // Fallback to programmatic sprites
    const frame = Date.now() % 1000 < 500 ? 0 : 1;
    const sprite = buildCharacterSprite(agent, frame);
    drawPixelSprite(ctx, sprite, drawX, drawY, scale);
  }

  // Status indicator
  const statusColor = COLORS[`status_${agent.status}`] || COLORS.status_idle;
  ctx.fillStyle = statusColor;
  ctx.fillRect(x - 4, drawY - 8, 8, 4);

  ctx.shadowColor = statusColor;
  ctx.shadowBlur = 8;
  ctx.fillRect(x - 4, drawY - 8, 8, 4);
  ctx.shadowBlur = 0;

  // Agent name
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(agent.name, x, drawY - 14);
  ctx.textAlign = 'left';
}

function drawPixelDesk(desk) {
  const scale = PIXEL_SCALE;
  drawPixelSprite(ctx, DESK_SPRITE, desk.x, desk.y - 8, scale);
}

function drawPixelChair(deskX, deskY) {
  const scale = PIXEL_SCALE;
  const chairX = deskX + 12;
  const chairY = deskY - 4;
  drawPixelSprite(ctx, CHAIR_SPRITE, chairX, chairY, scale);
}

let canvas, ctx;
let officeData = null;
let positions = null;
let lastUpdate = 0;
const UPDATE_INTERVAL = 100;
let animationId = null;
let officeLoaded = false;
let renderPending = false;
let canvasInitialized = false;

let carson = {
    x: 400,
    y: 400,
    targetX: 400,
    targetY: 400,
    speed: 5
};

let camera = {
    x: 0,
    y: 0
};

let keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

let eventListenersAdded = false;

const DEPARTMENT_COLORS = {
    research: '#0088ff',
    coding: '#ff8800',
    business: '#00ff88',
    owner: '#00fff2',
    general: '#888888'
};

const STATUS_COLORS = {
    idle: '#00ff88',
    working: '#0088ff',
    walking: '#ffcc00',
    waiting: '#ffcc00',
    error: '#ff4444'
};

// ============================================================================
// Initialization
// ============================================================================

function initOffice() {
    canvas = document.getElementById('officeCanvas');
    if (!canvas) {
        console.log('Office canvas not found, skipping initialization');
        return;
    }
    
    console.log('Office canvas found:', canvas);
    
    ctx = canvas.getContext('2d');
    canvas.width = OFFICE_WIDTH;
    canvas.height = OFFICE_HEIGHT;
    
    console.log('Canvas context:', ctx);
    console.log('Canvas size:', canvas.width, 'x', canvas.height);
    
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasHover);
    
    if (!eventListenersAdded) {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        document.addEventListener('mousemove', handleMouseMove);
        eventListenersAdded = true;
    }
    
    loadOfficeData().then(() => {
        // Load pixel art assets in parallel
        loadPixelArtAssets().then(() => {
            officeLoaded = true;
            canvasInitialized = true;
            renderLoop();
        });
    });
    
    console.log('Office initialized');
}

function ensureCanvasReady() {
    if (!canvasInitialized && currentView === 'office') {
        console.log('Reinitializing canvas for office view');
        loadOfficeData().then(() => {
            officeLoaded = true;
            canvasInitialized = true;
            renderOffice();
        });
    }
}

async function loadOfficeData() {
    try {
        const res = await fetch(`${API_BASE}/office`);
        officeData = await res.json();
        console.log('Office data loaded:', officeData);
    } catch (err) {
        console.error('Failed to load office:', err);
    }
}

async function loadPositions() {
    try {
        const res = await fetch(`${API_BASE}/office/positions`);
        positions = await res.json();
    } catch (err) {
        console.error('Failed to load positions:', err);
    }
}

// ============================================================================
// Render Loop
// ============================================================================

async function renderLoop() {
    const now = Date.now();
    
    if (now - lastUpdate > UPDATE_INTERVAL) {
        await loadPositions();
        updateOfficeStats();
        lastUpdate = now;
    }
    
    if (currentView === 'office' && officeLoaded) {
        renderOffice();
    }
    
    animationId = requestAnimationFrame(renderLoop);
}

async function updateOfficeStats() {
    if (!positions || !positions.agents) return;
    
    const activeAgents = positions.agents.filter(a => a.status === 'working' || a.status === 'idle').length;
    document.getElementById('statActiveAgents').textContent = activeAgents;
    
    try {
        const res = await fetch(`${API_BASE}/metrics`);
        const metrics = await res.json();
        document.getElementById('statTokens').textContent = metrics.tokens_used?.toLocaleString() || '0';
        document.getElementById('statApiCalls').textContent = metrics.api_calls?.toLocaleString() || '0';
        
        const taskRes = await fetch(`${API_BASE}/tasks`);
        const tasks = await taskRes.json();
        const completed = tasks.filter(t => t.status === 'done').length;
        document.getElementById('statTasksDone').textContent = completed;
        
        document.getElementById('statRevenue').textContent = '$' + (metrics.revenue || 0).toLocaleString();
        document.getElementById('statCosts').textContent = '$' + (metrics.total_cost || 0).toFixed(2);
        document.getElementById('statProfit').textContent = '$' + ((metrics.revenue || 0) - (metrics.total_cost || 0)).toFixed(2);
    } catch (err) {
        console.error('Failed to load metrics:', err);
    }
}

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

function renderOffice() {
    if (!ctx || !officeData) return;

    ctx.imageSmoothingEnabled = false;

    // Clear with base background
    ctx.fillStyle = COLORS.floor_main;
    ctx.fillRect(0, 0, OFFICE_WIDTH, OFFICE_HEIGHT);

    // NEW RENDER ORDER for Stardew Valley style:
    // 1. Draw corridors first (connecting paths between rooms)
    drawCorridors();

    // 2. Draw room floors with texture
    drawRoomFloors();

    // 3. Draw window light rays (before walls so they appear to come through windows)
    drawWindowLightRays();

    // 4. Draw room ambient lighting (glow effects)
    drawRoomLighting();

    // 5. Draw walls with door openings
    drawWalls();

    // 6. Draw windows
    drawWindows();

    // 7. Draw door frames
    drawDoorFrames();

    // 8. Draw decorations (plants, lamps, bookshelves, posters, etc.)
    drawDecorationsEnhanced();

    // 9. Draw desks
    drawDesks();

    // 10. Draw dust particles (ambient floating dust in light)
    drawDustParticles();

    // 11. Draw Carson
    drawCarson();

    // 12. Draw agents
    drawAgents();

    // 13. Draw stats overlay (canvas-drawn, top-right corner)
    drawStatsOverlay();

    // 14. Draw minimap with walls
    drawMinimapEnhanced();

    // 15. Draw selected agent info
    if (selectedAgent) {
        drawAgentInfo(selectedAgent);
    }
}

// ============================================================================
// FLOOR DRAWING - Different flooring per room type
// ============================================================================

function drawRoomFloors() {
    if (!officeData || !officeData.rooms) return;

    // Draw pixel art background if loaded (tiled)
    if (pixelArtAssets.assetsLoaded && pixelArtAssets.background) {
        const bg = pixelArtAssets.background;
        const bgW = bg.width;
        const bgH = bg.height;

        // Tile the background across the entire office
        for (let x = 0; x < OFFICE_WIDTH; x += bgW) {
            for (let y = 0; y < OFFICE_HEIGHT; y += bgH) {
                ctx.drawImage(bg, x, y);
            }
        }
        return; // Skip programmatic floor drawing when background is loaded
    }

    for (const room of officeData.rooms) {
        const floorColor = room.floor_color || room.color || COLORS.floor_alt;

        // Draw base floor color
        ctx.fillStyle = floorColor;
        ctx.fillRect(room.x, room.y, room.width, room.height);

        // Draw floor texture based on room type
        switch (room.type) {
            case 'department':
                drawCarpetFloor(room.x, room.y, room.width, room.height, floorColor, room.accent_color);
                break;
            case 'meeting':
                drawWoodFloor(room.x, room.y, room.width, room.height);
                break;
            case 'social':
                drawTileFloor(room.x, room.y, room.width, room.height);
                break;
            case 'utility':
                drawIndustrialFloor(room.x, room.y, room.width, room.height);
                break;
            case 'lobby':
                drawLobbyFloor(room.x, room.y, room.width, room.height);
                break;
            default:
                drawCarpetFloor(room.x, room.y, room.width, room.height, floorColor, room.accent_color);
        }
    }
}

function drawCarpetFloor(x, y, w, h, baseColor, accentColor) {
    const tileSize = 20;
    accentColor = accentColor || COLORS.accent_sage;

    // Draw carpet base with warm color
    ctx.fillStyle = baseColor || COLORS.floor_carpet;
    ctx.fillRect(x, y, w, h);

    // Draw carpet texture - subtle grid pattern
    ctx.globalAlpha = 0.08;
    for (let tx = x; tx < x + w; tx += tileSize) {
        for (let ty = y; ty < y + h; ty += tileSize) {
            ctx.fillStyle = COLORS.wall_shadow;
            ctx.fillRect(tx, ty, 1, tileSize);
            ctx.fillRect(tx, ty, tileSize, 1);
        }
    }
    ctx.globalAlpha = 1.0;

    // Add carpet fuzz/texture - Stardew style
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < (w * h) / 200; i++) {
        const dotX = x + Math.random() * w;
        const dotY = y + Math.random() * h;
        const colorChoice = Math.random();
        ctx.fillStyle = colorChoice < 0.5 ? accentColor : COLORS.wall_highlight;
        ctx.fillRect(Math.floor(dotX/2)*2, Math.floor(dotY/2)*2, 2, 2);
    }
    ctx.globalAlpha = 1.0;

    // Add subtle wear patterns - darker areas like in Stardew
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 5; i++) {
        const wearX = x + Math.random() * w;
        const wearY = y + Math.random() * h;
        const wearW = 20 + Math.random() * 40;
        const wearH = 20 + Math.random() * 40;
        ctx.fillStyle = COLORS.wall_shadow;
        ctx.beginPath();
        ctx.ellipse(wearX, wearY, wearW/2, wearH/2, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
}

function drawWoodFloor(x, y, w, h) {
    const plankHeight = 16;
    const plankGap = 2;

    // Draw wood planks - warm Stardew Valley palette with better variation
    for (let py = y; py < y + h; py += plankHeight + plankGap) {
        // More wood color variation like real wood
        const rowIndex = Math.floor((py - y) / (plankHeight + plankGap));
        const colorVariation = rowIndex % 4;
        let plankColor;
        switch (colorVariation) {
            case 0: plankColor = '#D4A574'; break;
            case 1: plankColor = '#C49A6C'; break;
            case 2: plankColor = '#B8865A'; break;
            default: plankColor = '#C9977A'; break;
        }
        ctx.fillStyle = plankColor;
        ctx.fillRect(x, py, w, plankHeight);

        // Wood grain lines - more natural, less uniform
        ctx.fillStyle = 'rgba(139, 115, 85, 0.25)';
        for (let gx = x + 5; gx < x + w; gx += 20 + (gx % 15)) {
            const grainHeight = plankHeight - 2;
            ctx.fillRect(gx, py + 1, 1, grainHeight);
            // Add slight variation to grain
            if (gx % 3 === 0) {
                ctx.fillRect(gx + 1, py + 3, 1, grainHeight - 4);
            }
        }

        // Add knot circles occasionally - Stardew style
        if (rowIndex % 7 === 0) {
            const knotX = x + 30 + (rowIndex * 23) % (w - 60);
            ctx.fillStyle = 'rgba(100, 75, 50, 0.3)';
            ctx.beginPath();
            ctx.ellipse(knotX, py + plankHeight/2, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            // Knot ring
            ctx.strokeStyle = 'rgba(80, 55, 35, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Highlight on top edge of plank
        ctx.fillStyle = 'rgba(255, 248, 240, 0.15)';
        ctx.fillRect(x, py, w, 1);
    }

    // Plank gaps - dark wood shadow with depth
    ctx.fillStyle = '#7A6348';
    for (let py = y + plankHeight; py < y + h; py += plankHeight + plankGap) {
        ctx.fillRect(x, py, w, plankGap);
    }

    // Add subtle overall warmth overlay
    ctx.fillStyle = 'rgba(255, 240, 220, 0.05)';
    ctx.fillRect(x, y, w, h);
}

function drawTileFloor(x, y, w, h) {
    const tileSize = 30;

    for (let tx = x; tx < x + w; tx += tileSize) {
        for (let ty = y; ty < y + h; ty += tileSize) {
            // Checkerboard pattern - warm cream/sage like Stardew
            const isLight = (((tx - x) / tileSize) + ((ty - y) / tileSize)) % 2 === 0;
            ctx.fillStyle = isLight ? '#E8DCC8' : '#C4B896';
            ctx.fillRect(tx, ty, tileSize, tileSize);

            // Tile border - warm shadow with depth
            ctx.fillStyle = 'rgba(139, 115, 85, 0.3)';
            ctx.fillRect(tx, ty, tileSize, 2);
            ctx.fillRect(tx, ty, 2, tileSize);

            // Highlight on top-left edge for depth
            ctx.fillStyle = 'rgba(255, 248, 240, 0.2)';
            ctx.fillRect(tx, ty, tileSize, 1);
            ctx.fillRect(tx, ty, 1, tileSize);

            // Subtle tile texture
            if (Math.random() > 0.7) {
                ctx.fillStyle = 'rgba(139, 115, 85, 0.05)';
                ctx.fillRect(tx + 5, ty + 5, tileSize - 10, tileSize - 10);
            }
        }
    }

    // Add subtle grout lines (darker gaps)
    ctx.fillStyle = '#9B8B75';
    for (let tx = x; tx < x + w; tx += tileSize) {
        for (let ty = y; ty < y + h; ty += tileSize) {
            // Grout at bottom and right edges
            ctx.fillRect(tx + tileSize - 2, ty, 2, tileSize);
            ctx.fillRect(tx, ty + tileSize - 2, tileSize, 2);
        }
    }
}

function drawIndustrialFloor(x, y, w, h) {
    // Server room - warm industrial floor with grid pattern
    ctx.fillStyle = '#696969';
    ctx.fillRect(x, y, w, h);
    
    // Metal grid pattern - warmer gray
    ctx.fillStyle = '#787878';
    const gridSize = 20;
    for (let gx = x; gx < x + w; gx += gridSize) {
        for (let gy = y; gy < y + h; gy += gridSize) {
            ctx.fillRect(gx, gy, gridSize - 2, gridSize - 2);
        }
    }
    
    // Warm orange safety stripes at edges
    ctx.fillStyle = '#CD853F';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x, y, w, 4);
    ctx.fillRect(x, y + h - 4, w, 4);
    ctx.globalAlpha = 1.0;
}

function drawLobbyFloor(x, y, w, h) {
    // Lobby has warm wood/honey checkerboard pattern - Stardew style
    const tileSize = 40;

    for (let tx = x; tx < x + w; tx += tileSize) {
        for (let ty = y; ty < y + h; ty += tileSize) {
            const isLight = (((tx - x) / tileSize) + ((ty - y) / tileSize)) % 2 === 0;
            ctx.fillStyle = isLight ? '#D4A574' : '#B8865A';
            ctx.fillRect(tx, ty, tileSize, tileSize);

            // Tile depth - darker edges
            ctx.fillStyle = 'rgba(139, 115, 85, 0.25)';
            ctx.fillRect(tx, ty, tileSize, 2);
            ctx.fillRect(tx, ty, 2, tileSize);

            // Highlight for 3D effect
            ctx.fillStyle = 'rgba(255, 248, 240, 0.15)';
            ctx.fillRect(tx + 2, ty + 2, tileSize - 4, 1);
            ctx.fillRect(tx + 2, ty + 2, 1, tileSize - 4);

            // Wood grain detail
            ctx.fillStyle = 'rgba(139, 115, 85, 0.1)';
            for (let gx = tx + 8; gx < tx + tileSize - 5; gx += 12) {
                ctx.fillRect(gx, ty + 5, 1, tileSize - 10);
            }
        }
    }
}

// ============================================================================
// CORRIDORS - Connecting paths between rooms
// ============================================================================

function drawCorridors() {
    if (!officeData || !officeData.corridors) return;

    for (const corr of officeData.corridors) {
        // Corridor floor - warm honey wood with variation
        ctx.fillStyle = COLORS.floor_alt;
        ctx.fillRect(corr.x, corr.y, corr.width, corr.height);

        // Wood plank lines
        ctx.fillStyle = 'rgba(139, 107, 20, 0.15)';
        if (corr.direction === 'vertical') {
            for (let py = corr.y; py < corr.y + corr.height; py += 16) {
                ctx.fillRect(corr.x, py, corr.width, 1);
            }
        } else {
            for (let px = corr.x; px < corr.x + corr.width; px += 16) {
                ctx.fillRect(px, corr.y, 1, corr.height);
            }
        }

        // Corridor border - warm wood shadow
        ctx.fillStyle = '#7A6348';
        ctx.fillRect(corr.x, corr.y, corr.width, 2);
        ctx.fillRect(corr.x, corr.y + corr.height - 2, corr.width, 2);
        if (corr.direction === 'vertical') {
            ctx.fillRect(corr.x, corr.y, 2, corr.height);
            ctx.fillRect(corr.x + corr.width - 2, corr.y, 2, corr.height);
        } else {
            ctx.fillRect(corr.x, corr.y, 2, corr.height);
            ctx.fillRect(corr.x + corr.width - 2, corr.y, 2, corr.height);
        }

        // Corridor lighting (warm subtle glow)
        const gradient = ctx.createRadialGradient(
            corr.x + corr.width/2, corr.y + corr.height/2, 0,
            corr.x + corr.width/2, corr.y + corr.height/2, Math.max(corr.width, corr.height)
        );
        gradient.addColorStop(0, 'rgba(255, 248, 220, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 248, 220, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(corr.x, corr.y, corr.width, corr.height);
    }
}

// ============================================================================
// ROOM LIGHTING - Ambient glow effects per room
// ============================================================================

function drawRoomLighting() {
    if (!officeData || !officeData.rooms) return;
    
    for (const room of officeData.rooms) {
        if (!room.glow_color) continue;
        
        // Room ambient glow - warm yellow-white
        const gradient = ctx.createRadialGradient(
            room.x + room.width/2, room.y + room.height/2, 0,
            room.x + room.width/2, room.y + room.height/2, Math.max(room.width, room.height) * 0.7
        );
        gradient.addColorStop(0, room.glow_color);
        gradient.addColorStop(1, 'rgba(255, 248, 220, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(room.x, room.y, room.width, room.height);
        
        // Add warm corner glows (Stardew Valley style ambient lighting)
        const cornerSize = Math.min(room.width, room.height) * 0.4;
        const corners = [
            { cx: room.x + 20, cy: room.y + 20 },           // top-left
            { cx: room.x + room.width - 20, cy: room.y + 20 },  // top-right
            { cx: room.x + 20, cy: room.y + room.height - 20 },   // bottom-left
            { cx: room.x + room.width - 20, cy: room.y + room.height - 20 } // bottom-right
        ];
        
        for (const corner of corners) {
            const cornerGrad = ctx.createRadialGradient(
                corner.cx, corner.cy, 0,
                corner.cx, corner.cy, cornerSize
            );
            cornerGrad.addColorStop(0, 'rgba(255, 244, 224, 0.15)');
            cornerGrad.addColorStop(1, 'rgba(255, 244, 224, 0)');
            ctx.fillStyle = cornerGrad;
            ctx.fillRect(room.x, room.y, room.width, room.height);
        }
    }
}

// ============================================================================
// WALLS - Proper wall segments with door openings
// ============================================================================

function drawWalls() {
    if (!officeData || !officeData.rooms) return;
    
    const wallThick = WALL_THICKNESS;
    
    for (const room of officeData.rooms) {
        const wallColor = room.wall_color || COLORS.wall;
        const accentColor = room.accent_color || COLORS.accent_teal;
        
        // Find doors that connect to this room
        const roomDoors = officeData.doors ? officeData.doors.filter(d => 
            d.room1 === room.id || d.room2 === room.id
        ) : [];
        
        // Determine which walls this room has (outer walls vs internal walls)
        const isOuter = room.x === 0 || room.y === 0 || 
                        room.x + room.width === OFFICE_WIDTH || 
                        room.y + room.height === OFFICE_HEIGHT;
        
        // Draw TOP wall
        if (room.y === 0 || !isAdjacentToRoom(room, 'top')) {
            drawWallSegment(room.x, room.y, room.width, wallThick, wallColor, accentColor, 'horizontal', roomDoors.filter(d => isDoorOnWall(room, d, 'top')), room, 'top');
        }
        
        // Draw BOTTOM wall
        if (room.y + room.height === OFFICE_HEIGHT || !isAdjacentToRoom(room, 'bottom')) {
            drawWallSegment(room.x, room.y + room.height - wallThick, room.width, wallThick, wallColor, accentColor, 'horizontal', roomDoors.filter(d => isDoorOnWall(room, d, 'bottom')), room, 'bottom');
        }
        
        // Draw LEFT wall
        if (room.x === 0 || !isAdjacentToRoom(room, 'left')) {
            drawWallSegment(room.x, room.y, wallThick, room.height, wallColor, accentColor, 'vertical', roomDoors.filter(d => isDoorOnWall(room, d, 'left')), room, 'left');
        }
        
        // Draw RIGHT wall
        if (room.x + room.width === OFFICE_WIDTH || !isAdjacentToRoom(room, 'right')) {
            drawWallSegment(room.x + room.width - wallThick, room.y, wallThick, room.height, wallColor, accentColor, 'vertical', roomDoors.filter(d => isDoorOnWall(room, d, 'right')), room, 'right');
        }
    }
}

function isAdjacentToRoom(room, side) {
    if (!officeData || !officeData.rooms) return false;
    
    for (const other of officeData.rooms) {
        if (other.id === room.id) continue;
        
        switch (side) {
            case 'top':
                if (other.y + other.height === room.y && 
                    other.x < room.x + room.width && other.x + other.width > room.x) {
                    return true;
                }
                break;
            case 'bottom':
                if (other.y === room.y + room.height && 
                    other.x < room.x + room.width && other.x + other.width > room.x) {
                    return true;
                }
                break;
            case 'left':
                if (other.x + other.width === room.x && 
                    other.y < room.y + room.height && other.y + other.height > room.y) {
                    return true;
                }
                break;
            case 'right':
                if (other.x === room.x + room.width && 
                    other.y < room.y + room.height && other.y + other.height > room.y) {
                    return true;
                }
                break;
        }
    }
    return false;
}

function isDoorOnWall(room, door, wallSide) {
    // Check if door is on the specified wall
    const doorCenterX = door.x + door.width / 2;
    const doorCenterY = door.y + door.height / 2;
    
    switch (wallSide) {
        case 'top':
            return Math.abs(doorCenterY - room.y) < 20 && 
                   doorCenterX > room.x && doorCenterX < room.x + room.width;
        case 'bottom':
            return Math.abs(doorCenterY - (room.y + room.height)) < 20 && 
                   doorCenterX > room.x && doorCenterX < room.x + room.width;
        case 'left':
            return Math.abs(doorCenterX - room.x) < 20 && 
                   doorCenterY > room.y && doorCenterY < room.y + room.height;
        case 'right':
            return Math.abs(doorCenterX - (room.x + room.width)) < 20 && 
                   doorCenterY > room.y && doorCenterY < room.y + room.height;
    }
    return false;
}

function drawWallSegment(x, y, w, h, wallColor, accentColor, orientation, doors, room, wallSide) {
    // Draw main wall
    ctx.fillStyle = wallColor;
    ctx.fillRect(x, y, w, h);
    
    // Wall highlight (top edge)
    ctx.fillStyle = COLORS.wall_highlight;
    if (orientation === 'horizontal') {
        ctx.fillRect(x, y, w, 3);
    } else {
        ctx.fillRect(x, y, 3, h);
    }
    
    // Wall shadow (bottom edge)
    ctx.fillStyle = COLORS.wall_shadow;
    if (orientation === 'horizontal') {
        ctx.fillRect(x, y + h - 3, w, 3);
    } else {
        ctx.fillRect(x + w - 3, y, 3, h);
    }
    
    // Draw doors in this wall segment
    for (const door of doors) {
        drawDoor(door, wallColor, accentColor, wallSide);
    }
    
    // Draw accent stripe along wall
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.4;
    if (orientation === 'horizontal') {
        ctx.fillRect(x, y + 3, w, 2);
    } else {
        ctx.fillRect(x + 3, y, 2, h);
    }
    ctx.globalAlpha = 1.0;
}

function drawDoor(door, wallColor, accentColor, wallSide) {
    const doorWidth = door.width || DOOR_WIDTH;
    const doorHeight = door.height || WALL_THICKNESS;
    
    // Door opening (warm dark brown)
    ctx.fillStyle = '#4a3a2a';
    
    if (wallSide === 'top' || wallSide === 'bottom') {
        ctx.fillRect(door.x, door.y, doorWidth, doorHeight);
    } else {
        ctx.fillRect(door.x, door.y, doorWidth, doorHeight);
    }
    
    // Door frame - warm wood
    ctx.fillStyle = COLORS.desk_wood;
    const frameThick = 3;
    if (wallSide === 'top' || wallSide === 'bottom') {
        // Top and bottom doors (horizontal)
        ctx.fillRect(door.x, door.y - frameThick, frameThick, doorHeight + frameThick * 2);
        ctx.fillRect(door.x + doorWidth - frameThick, door.y - frameThick, frameThick, doorHeight + frameThick * 2);
    } else {
        // Left and right doors (vertical)
        ctx.fillRect(door.x - frameThick, door.y, doorWidth + frameThick * 2, frameThick);
        ctx.fillRect(door.x - frameThick, door.y + doorHeight - frameThick, doorWidth + frameThick * 2, frameThick);
    }
    
    // Door handle - warm accent
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.9;
    if (wallSide === 'top' || wallSide === 'bottom') {
        ctx.fillRect(door.x + doorWidth - 10, door.y + doorHeight/2 - 2, 6, 4);
    } else {
        ctx.fillRect(door.x + doorWidth/2 - 2, door.y + doorHeight - 10, 4, 6);
    }
    ctx.globalAlpha = 1.0;
}

function drawDoorFrames() {
    // Additional door frame details
    if (!officeData || !officeData.doors) return;
    
    for (const door of officeData.doors) {
        // Find the wall side for this door
        let wallSide = 'top';
        const room1 = officeData.rooms.find(r => r.id === door.room1);
        const room2 = officeData.rooms.find(r => r.id === door.room2);
        
        if (room1 && room2) {
            // Determine orientation
            if (Math.abs(door.width - door.height) < 5) {
                // Square-ish, determine by room positions
                if (Math.abs(room1.y - room2.y) < Math.abs(room1.x - room2.x)) {
                    wallSide = room1.x < room2.x ? 'right' : 'left';
                } else {
                    wallSide = room1.y < room2.y ? 'bottom' : 'top';
                }
            } else if (door.width > door.height) {
                wallSide = 'horizontal';
            } else {
                wallSide = 'vertical';
            }
        }
        
        // Door glow (subtle indicator)
        ctx.fillStyle = 'rgba(78, 205, 196, 0.1)';
        ctx.fillRect(door.x - 5, door.y - 5, door.width + 10, door.height + 10);
    }
}

// ============================================================================
// WINDOWS - Window effects for rooms with windows
// ============================================================================

function drawWindows() {
    if (!officeData || !officeData.decorations) return;

    const windows = officeData.decorations.filter(d => d.type === 'window');

    for (const win of windows) {
        const w = win.width || 100;
        const h = win.height || 30;

        // Window frame - warm wood
        ctx.fillStyle = COLORS.desk_wood;
        ctx.fillRect(win.x - 4, win.y - 4, w + 8, h + 8);

        // Window glass (warm light blue with transparency)
        ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
        ctx.fillRect(win.x, win.y, w, h);

        // Window panes
        ctx.fillStyle = 'rgba(100, 150, 200, 0.5)';
        const paneW = w / 4;
        for (let px = win.x; px < win.x + w; px += paneW * 2) {
            ctx.fillRect(px + paneW - 1, win.y, 2, h);
        }
        ctx.fillRect(win.x, win.y + h/2 - 1, w, 2);

        // Window sill
        ctx.fillStyle = COLORS.desk_dark;
        ctx.fillRect(win.x - 6, win.y + h, w + 12, 6);

        // Light coming through window - warm glow
        const gradient = ctx.createRadialGradient(
            win.x + w/2, win.y + h, 0,
            win.x + w/2, win.y + h, 60
        );
        gradient.addColorStop(0, 'rgba(255, 248, 220, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 248, 220, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(win.x - 30, win.y, w + 60, h + 60);
    }
}

// ============================================================================
// WINDOW LIGHT RAYS - Stardew Valley style diagonal light beams
// ============================================================================

function drawWindowLightRays() {
    if (!officeData || !officeData.decorations) return;

    const windows = officeData.decorations.filter(d => d.type === 'window');
    const time = Date.now() / 1000;

    for (const win of windows) {
        const w = win.width || 100;
        const h = win.height || 30;

        // Light source position (bottom of window)
        const lightX = win.x + w / 2;
        const lightY = win.y + h;

        // Draw multiple diagonal light rays
        ctx.save();

        // Ray angle and spread
        const rayCount = 5;
        const rayWidth = 40;
        const rayLength = 200;

        for (let i = 0; i < rayCount; i++) {
            const offset = (i - rayCount / 2) * 15;
            const rayAngle = Math.PI / 4 + offset * 0.01; // ~45 degrees down

            // Animate rays subtly
            const wobble = Math.sin(time * 0.5 + i) * 2;

            // Calculate ray endpoints
            const startX = lightX + offset + wobble;
            const startY = lightY;
            const endX = startX + Math.cos(rayAngle) * rayLength;
            const endY = startY + Math.sin(rayAngle) * rayLength;

            // Create gradient for ray
            const rayGradient = ctx.createLinearGradient(startX, startY, endX, endY);
            rayGradient.addColorStop(0, 'rgba(255, 248, 220, 0.12)');
            rayGradient.addColorStop(0.5, 'rgba(255, 248, 220, 0.06)');
            rayGradient.addColorStop(1, 'rgba(255, 248, 220, 0)');

            // Draw ray as a trapezoid shape
            ctx.beginPath();
            ctx.moveTo(startX - rayWidth / 2, startY);
            ctx.lineTo(startX + rayWidth / 2, startY);
            ctx.lineTo(endX + rayWidth, endY);
            ctx.lineTo(endX - rayWidth, endY);
            ctx.closePath();

            ctx.fillStyle = rayGradient;
            ctx.fill();
        }

        ctx.restore();
    }
}

// ============================================================================
// DUST PARTICLES - Floating dust motes in light beams
// ============================================================================

// Dust particle system
const dustParticles = [];
const MAX_DUST_PARTICLES = 50;

function initDustParticles() {
    // Initialize dust particles
    for (let i = 0; i < MAX_DUST_PARTICLES; i++) {
        dustParticles.push({
            x: Math.random() * OFFICE_WIDTH,
            y: Math.random() * OFFICE_HEIGHT,
            size: Math.random() * 2 + 1,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.2 - 0.1,
            opacity: Math.random() * 0.5 + 0.2,
            phase: Math.random() * Math.PI * 2
        });
    }
}

function drawDustParticles() {
    if (!officeData || !officeData.decorations) return;

    const time = Date.now() / 1000;

    // Update and draw dust particles
    for (const particle of dustParticles) {
        // Update position
        particle.x += particle.speedX + Math.sin(time + particle.phase) * 0.2;
        particle.y += particle.speedY + Math.cos(time * 0.7 + particle.phase) * 0.1;

        // Wrap around screen
        if (particle.x < 0) particle.x = OFFICE_WIDTH;
        if (particle.x > OFFICE_WIDTH) particle.x = 0;
        if (particle.y < 0) particle.y = OFFICE_HEIGHT;
        if (particle.y > OFFICE_HEIGHT) particle.y = 0;

        // Check if particle is in a light beam (near a window)
        const windows = officeData.decorations.filter(d => d.type === 'window');
        let inLight = false;

        for (const win of windows) {
            const w = win.width || 100;
            const h = win.height || 30;
            const lightX = win.x + w / 2;
            const lightY = win.y + h;

            // Check if particle is in the light cone from this window
            const dx = particle.x - lightX;
            const dy = particle.y - lightY;
            if (dy > 0 && dy < 200 && Math.abs(dx) < dy * 0.8) {
                inLight = true;
                break;
            }
        }

        // Draw particle with varying brightness
        const brightness = inLight ? 0.8 : 0.3;
        const size = particle.size * (inLight ? 1.5 : 1);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 248, 220, ${particle.opacity * brightness})`;
        ctx.fill();
    }
}

// Initialize dust particles on load
initDustParticles();

// ============================================================================
// DECORATIONS - Enhanced with more variety
// ============================================================================

// Plant sprites
const PLANT_SPRITES = {
    small1: [
        [0, 0, 0, 'plant_leaf', 'plant_leaf', 0, 0, 0],
        [0, 0, 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 0, 0],
        [0, 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 0],
        [0, 0, 0, 'plant_pot', 'plant_pot', 0, 0, 0],
        [0, 0, 'plant_pot', 'plant_pot', 'plant_pot', 'plant_pot', 0, 0],
        [0, 0, 'plant_pot', 'plant_pot', 'plant_pot', 'plant_pot', 0, 0],
        [0, 0, 'plant_pot', 'plant_pot', 'plant_pot', 'plant_pot', 0, 0],
        [0, 0, 'plant_pot', 'plant_pot', 'plant_pot', 'plant_pot', 0, 0]
    ],
    small2: [
        [0, 0, 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 0, 0],
        [0, 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 0],
        [0, 'plant_leaf', 0, 'plant_leaf', 'plant_leaf', 0, 'plant_leaf', 0],
        [0, 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 0],
        [0, 0, 0, 'plant_pot', 'plant_pot', 0, 0, 0],
        [0, 0, 'plant_pot', 'plant_pot', 'plant_pot', 'plant_pot', 0, 0],
        [0, 0, 'plant_pot', 'plant_pot', 'plant_pot', 'plant_pot', 0, 0],
        [0, 0, 'plant_pot', 'plant_pot', 'plant_pot', 'plant_pot', 0, 0]
    ],
    tall: [
        [0, 0, 0, 0, 'plant_leaf', 0, 0, 0],
        [0, 0, 0, 'plant_leaf', 'plant_leaf', 'plant_leaf', 0, 0],
        [0, 0, 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 0],
        [0, 0, 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 0],
        [0, 0, 0, 'plant_leaf', 'plant_leaf', 'plant_leaf', 0, 0],
        [0, 0, 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 0],
        [0, 0, 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 0],
        [0, 0, 0, 'plant_pot', 'plant_pot', 0, 0, 0],
        [0, 0, 'plant_pot', 'plant_pot', 'plant_pot', 'plant_pot', 0, 0],
        [0, 0, 'plant_pot', 'plant_pot', 'plant_pot', 'plant_pot', 0, 0],
        [0, 0, 'plant_pot', 'plant_pot', 'plant_pot', 'plant_pot', 0, 0],
        [0, 0, 'plant_pot', 'plant_pot', 'plant_pot', 'plant_pot', 0, 0]
    ],
    desk: [
        [0, 'plant_leaf', 'plant_leaf', 0, 0, 0],
        ['plant_leaf', 'plant_leaf', 'plant_leaf', 'plant_leaf', 0, 0],
        [0, 'plant_leaf', 'plant_leaf', 0, 0, 0],
        [0, 0, 'plant_pot', 0, 0, 0],
        [0, 'plant_pot', 'plant_pot', 'plant_pot', 0, 0],
        [0, 'plant_pot', 'plant_pot', 'plant_pot', 0, 0]
    ]
};

// Floor lamp sprite
const FLOOR_LAMP_SPRITE = [
    [0, 0, 0, 0, 'accent_warm', 0, 0, 0],
    [0, 0, 0, 'accent_warm', 'accent_warm', 'accent_warm', 0, 0],
    [0, 0, 'accent_warm', 'accent_warm', 'accent_warm', 'accent_warm', 'accent_warm', 0],
    [0, 0, 0, 'accent_warm', 'accent_warm', 'accent_warm', 0, 0],
    [0, 0, 0, 0, 'desk_dark', 0, 0, 0],
    [0, 0, 0, 0, 'desk_dark', 0, 0, 0],
    [0, 0, 0, 0, 'desk_dark', 0, 0, 0],
    ['desk_dark', 'desk_dark', 0, 0, 'desk_dark', 0, 0, 'desk_dark'],
    ['desk_dark', 'desk_dark', 0, 0, 'desk_dark', 0, 0, 'desk_dark']
];

// Bookshelf sprite
const BOOKSHELF_SPRITE = [
    ['desk_dark', 'dept_development', 'dept_coding', 'dept_research', 'desk_dark', 'dept_business', 'dept_development', 'desk_dark'],
    ['desk_dark', 'accent_teal', 'accent_coral', 'accent_sage', 'desk_dark', 'accent_magenta', 'accent_warm', 'desk_dark'],
    ['desk_dark', 'dept_coding', 'dept_research', 'accent_teal', 'desk_dark', 'dept_development', 'accent_coral', 'desk_dark'],
    ['desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark']
];

// Whiteboard sprite
const WHITEBOARD_SPRITE = [
    ['#f5f5f5', '#f5f5f5', '#f5f5f5', '#f5f5f5', '#f5f5f5', '#f5f5f5', '#f5f5f5', '#f5f5f5', '#f5f5f5', '#f5f5f5'],
    ['#f5f5f5', '#e0e0e0', '#e8e8e8', '#f0f0f0', '#e0e0e0', '#e8e8e8', '#f0f0f0', '#e0e0e0', '#e8e8e8', '#f5f5f5'],
    ['#f5f5f5', 'accent_teal', 0, 'accent_coral', 0, 0, 'accent_sage', 0, 0, '#f5f5f5'],
    ['#f5f5f5', 0, 0, 0, 'accent_warm', 0, 0, 0, 0, '#f5f5f5'],
    ['#f5f5f5', 0, 0, 0, 0, 0, 0, 0, 0, '#f5f5f5'],
    ['#f5f5f5', '#f5f5f5', '#f5f5f5', '#f5f5f5', '#f5f5f5', '#f5f5f5', '#f5f5f5', '#f5f5f5', '#f5f5f5', '#f5f5f5']
];

// Server rack sprite
const SERVER_RACK_SPRITE = [
    ['desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark'],
    ['accent_teal', 'monitor_screen', 'accent_teal', 'monitor_screen', 'accent_teal', 'monitor_screen', 'accent_teal', 'monitor_screen'],
    ['accent_teal', 'monitor_screen', 'accent_teal', 'monitor_screen', 'accent_teal', 'monitor_screen', 'accent_teal', 'monitor_screen'],
    ['accent_teal', 'monitor_screen', 'accent_teal', 'monitor_screen', 'accent_teal', 'monitor_screen', 'accent_teal', 'monitor_screen'],
    ['desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark'],
    ['accent_coral', 'desk_dark', 'accent_coral', 'desk_dark', 'accent_coral', 'desk_dark', 'accent_coral', 'desk_dark'],
    ['accent_coral', 'desk_dark', 'accent_coral', 'desk_dark', 'accent_coral', 'desk_dark', 'accent_coral', 'desk_dark'],
    ['desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark']
];

// Coffee station sprite
const COFFEE_STATION_SPRITE = [
    ['desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark'],
    ['desk_dark', '#8B4513', '#8B4513', 'desk_dark', '#654321', 'desk_dark'],
    ['desk_dark', '#8B4513', '#8B4513', 'desk_dark', '#654321', 'desk_dark'],
    ['desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark'],
    ['accent_warm', 'accent_warm', 0, 'accent_warm', 'accent_warm', 0]
];

// Couch sprite
const COUCH_SPRITE = [
    ['desk_dark', 'dept_business', 'dept_business', 'dept_business', 'dept_business', 'desk_dark'],
    ['desk_dark', 'dept_business', 'dept_business', 'dept_business', 'dept_business', 'desk_dark'],
    ['desk_dark', 'dept_business', 'dept_business', 'dept_business', 'dept_business', 'desk_dark'],
    ['desk_dark', 'accent_warm', 'accent_warm', 'accent_warm', 'accent_warm', 'desk_dark'],
    ['desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark', 'desk_dark']
];

// Poster sprites
const POSTER_SPRITES = {
    team_poster: {
        bg: '#1a2a3a',
        text: 'TEAM',
        color: 'accent_teal'
    },
    code_poster: {
        bg: '#1a1a2a',
        text: 'CODE',
        color: 'dept_coding'
    },
    build_poster: {
        bg: '#1a2818',
        text: 'BUILD',
        color: 'accent_sage'
    },
    ship_poster: {
        bg: '#2a1a1a',
        text: 'SHIP',
        color: 'accent_coral'
    }
};

function drawDecorationsEnhanced() {
    if (!officeData || !officeData.decorations) return;
    
    for (const deco of officeData.decorations) {
        switch (deco.type) {
            case 'small1':
            case 'small2':
            case 'tall':
            case 'desk':
                drawPlantEnhanced(deco);
                break;
            case 'floor_lamp':
                drawFloorLamp(deco);
                break;
            case 'bookshelf':
                drawBookshelf(deco);
                break;
            case 'whiteboard':
                drawWhiteboard(deco);
                break;
            case 'server_rack':
                drawServerRack(deco);
                break;
            case 'coffee_station':
                drawCoffeeStation(deco);
                break;
            case 'couch':
                drawCouch(deco);
                break;
            case 'team_poster':
            case 'code_poster':
            case 'build_poster':
            case 'ship_poster':
                drawPoster(deco);
                break;
        }
    }
    
    // Draw ceiling lights
    drawCeilingLightsEnhanced();
}

function drawPlantEnhanced(plant) {
    const sprite = PLANT_SPRITES[plant.type];
    if (!sprite) return;

    const scale = plant.type === 'tall' ? 2 : 3;

    // Plant shadow - Stardew style
    ctx.fillStyle = 'rgba(60, 45, 30, 0.25)';
    ctx.beginPath();
    ctx.ellipse(plant.x + 12, plant.y + 2, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    drawPixelSprite(ctx, sprite, plant.x, plant.y - sprite.length * scale, scale);

    // Plant glow - warm sage
    ctx.shadowColor = COLORS.plant_leaf;
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(91, 140, 91, 0.2)';
    ctx.beginPath();
    ctx.arc(plant.x + 12, plant.y - 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawFloorLamp(lamp) {
    const sprite = FLOOR_LAMP_SPRITE;
    const scale = 3;

    // Lamp shadow
    ctx.fillStyle = 'rgba(60, 45, 30, 0.25)';
    ctx.beginPath();
    ctx.ellipse(lamp.x + 12, lamp.y + 2, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    drawPixelSprite(ctx, sprite, lamp.x, lamp.y - sprite.length * scale, scale);

    // Lamp glow effect - warm amber (Stardew Valley style)
    const gradient = ctx.createRadialGradient(
        lamp.x + 12, lamp.y - 20, 0,
        lamp.x + 12, lamp.y - 20, 60
    );
    gradient.addColorStop(0, 'rgba(255, 200, 100, 0.4)');
    gradient.addColorStop(0.5, 'rgba(255, 179, 71, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 179, 71, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(lamp.x - 30, lamp.y - 50, 90, 80);
}

function drawBookshelf(bookshelf) {
    const sprite = BOOKSHELF_SPRITE;
    const scale = 3;
    drawPixelSprite(ctx, sprite, bookshelf.x, bookshelf.y - sprite.length * scale, scale);
}

function drawWhiteboard(wb) {
    const sprite = WHITEBOARD_SPRITE;
    const scale = 3;
    drawPixelSprite(ctx, sprite, wb.x, wb.y - sprite.length * scale, scale);
    
    // Frame
    ctx.strokeStyle = COLORS.desk_dark;
    ctx.lineWidth = 2;
    ctx.strokeRect(wb.x - 2, wb.y - sprite.length * scale - 2, sprite[0].length * scale + 4, sprite.length * scale + 4);
}

function drawServerRack(rack) {
    const sprite = SERVER_RACK_SPRITE;
    const scale = 3;
    drawPixelSprite(ctx, sprite, rack.x, rack.y - sprite.length * scale, scale);
    
    // Server blink lights
    const blinkOn = Date.now() % 1000 < 500;
    if (blinkOn) {
        ctx.fillStyle = COLORS.status_working;
        ctx.fillRect(rack.x + 6, rack.y - sprite.length * scale + 4, 4, 4);
        ctx.fillRect(rack.x + 22, rack.y - sprite.length * scale + 4, 4, 4);
    }
}

function drawCoffeeStation(coffee) {
    const sprite = COFFEE_STATION_SPRITE;
    const scale = 3;
    drawPixelSprite(ctx, sprite, coffee.x, coffee.y - sprite.length * scale, scale);
    
    // Coffee aroma (subtle)
    ctx.fillStyle = 'rgba(139, 69, 19, 0.1)';
    ctx.beginPath();
    ctx.arc(coffee.x + 15, coffee.y - sprite.length * scale - 5, 15, 0, Math.PI * 2);
    ctx.fill();
}

function drawCouch(couch) {
    const sprite = COUCH_SPRITE;
    const scale = 3;
    drawPixelSprite(ctx, sprite, couch.x, couch.y - sprite.length * scale, scale);
}

function drawPoster(poster) {
    const config = POSTER_SPRITES[poster.type];
    if (!config) return;
    
    const w = 60;
    const h = 40;
    
    // Poster background
    ctx.fillStyle = config.bg;
    ctx.fillRect(poster.x - w/2, poster.y - h/2, w, h);
    
    // Poster border
    ctx.strokeStyle = COLORS[config.color] || config.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(poster.x - w/2, poster.y - h/2, w, h);
    
    // Poster text
    ctx.fillStyle = COLORS[config.color] || config.color;
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(config.text, poster.x, poster.y + 4);
    ctx.textAlign = 'left';
}

function drawCeilingLightsEnhanced() {
    // Draw warm glowing ceiling lights - Stardew Valley style
    const lights = [
        { x: 200, y: 100 },
        { x: 600, y: 100 },
        { x: 1000, y: 100 },
        { x: 200, y: 400 },
        { x: 600, y: 400 },
        { x: 1000, y: 400 },
        { x: 200, y: 700 },
        { x: 600, y: 700 },
        { x: 1000, y: 700 }
    ];
    
    for (const light of lights) {
        // Outer glow - warm pastel orange
        const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 60);
        gradient.addColorStop(0, 'rgba(255, 179, 71, 0.25)');
        gradient.addColorStop(0.5, 'rgba(255, 179, 71, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 179, 71, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(light.x, light.y, 60, 0, Math.PI * 2);
        ctx.fill();
        
        // Light fixture - warm glow
        ctx.fillStyle = COLORS.accent_warm;
        ctx.fillRect(light.x - 6, light.y - 3, 12, 6);
        ctx.fillStyle = '#FFF8DC';
        ctx.fillRect(light.x - 4, light.y - 1, 8, 2);
    }
}

// ============================================================================
// DESKS - Draw desks with pixel art
// ============================================================================

function drawDesks() {
    for (const desk of officeData.desks) {
        if (desk.type === 'table') {
            // Meeting table shadow - Stardew style
            ctx.fillStyle = 'rgba(60, 45, 30, 0.3)';
            ctx.beginPath();
            ctx.ellipse(desk.x + desk.width/2, desk.y + desk.height + 5, desk.width/2 - 10, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Meeting table - wood style
            ctx.fillStyle = COLORS.desk_wood;
            ctx.fillRect(desk.x, desk.y, desk.width, desk.height);

            // Wood grain
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let gx = desk.x + 10; gx < desk.x + desk.width; gx += 25) {
                ctx.fillRect(gx, desk.y, 1, desk.height);
            }

            // Table border
            ctx.strokeStyle = COLORS.accent_warm;
            ctx.lineWidth = 3;
            ctx.strokeRect(desk.x, desk.y, desk.width, desk.height);

            // Corner accents
            ctx.fillStyle = COLORS.accent_warm;
            const cs = 8;
            ctx.fillRect(desk.x, desk.y, cs, 3);
            ctx.fillRect(desk.x, desk.y, 3, cs);
            ctx.fillRect(desk.x + desk.width - cs, desk.y, cs, 3);
            ctx.fillRect(desk.x + desk.width - 3, desk.y, 3, cs);
            ctx.fillRect(desk.x, desk.y + desk.height - 3, cs, 3);
            ctx.fillRect(desk.x, desk.y + desk.height - cs, 3, cs);
            ctx.fillRect(desk.x + desk.width - cs, desk.y + desk.height - 3, cs, 3);
            ctx.fillRect(desk.x + desk.width - 3, desk.y + desk.height - cs, 3, cs);
        } else {
            // Regular desk shadow
            ctx.fillStyle = 'rgba(60, 45, 30, 0.25)';
            ctx.beginPath();
            ctx.ellipse(desk.x + 30, desk.y + 45, 25, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Regular desk - use pixel desk sprite
            drawPixelDesk(desk);

            // Draw chair nearby with shadow
            drawPixelChair(desk.x, desk.y);
        }
    }
}

// ============================================================================
// CARSON (Player Character)
// ============================================================================

function drawCarson() {
    updateCarsonMovement();
    
    const x = carson.x;
    const y = carson.y;
    const scale = PIXEL_SCALE;
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Character sprite for Carson
    const carsonSprite = [
        [0, 0, COLORS.accent_teal, COLORS.accent_teal, COLORS.accent_teal, COLORS.accent_teal, 0, 0],
        [0, COLORS.accent_teal, COLORS.skin_light, COLORS.skin_light, COLORS.skin_light, COLORS.skin_light, COLORS.accent_teal, 0],
        [0, COLORS.accent_teal, COLORS.skin_light, '#222222', COLORS.skin_light, '#222222', COLORS.skin_light, COLORS.accent_teal],
        [0, COLORS.accent_teal, COLORS.skin_light, COLORS.skin_light, COLORS.skin_light, COLORS.skin_light, COLORS.skin_light, COLORS.accent_teal],
        [0, 0, COLORS.skin_light, COLORS.skin_light, COLORS.accent_coral, COLORS.skin_light, COLORS.skin_light, 0],
        [0, 0, COLORS.accent_teal, COLORS.accent_teal, COLORS.accent_teal, COLORS.accent_teal, 0, 0],
        [0, COLORS.accent_teal, COLORS.accent_teal, COLORS.accent_teal, COLORS.accent_teal, COLORS.accent_teal, COLORS.accent_teal, 0],
        [0, COLORS.accent_teal, COLORS.accent_teal, COLORS.accent_teal, COLORS.accent_teal, COLORS.accent_teal, COLORS.accent_teal, 0],
        [0, 0, COLORS.dept_development, 0, COLORS.dept_development, 0, 0, 0],
        [0, COLORS.desk_dark, 0, COLORS.desk_dark, 0, COLORS.desk_dark, 0, 0],
        [0, COLORS.desk_dark, 0, COLORS.desk_dark, 0, COLORS.desk_dark, 0, 0]
    ];
    
    drawPixelSprite(ctx, carsonSprite, x - 16, y - 48, scale);
    
    // Name label
    ctx.fillStyle = COLORS.accent_teal;
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Carson', x, y - 52);
    ctx.textAlign = 'left';
}

function drawAgents() {
    if (!positions || !positions.agents) return;
    
    // Filter out Carson (the player) - they are rendered separately via drawCarson()
    const npcAgents = positions.agents.filter(agent => !agent.is_player);
    
    for (const agent of npcAgents) {
        drawAgent(agent);
    }
}

// ============================================================================
// STATS OVERLAY - Canvas-drawn metrics panel (top-right) - Stardew style
// ============================================================================

function drawStatsOverlay() {
    const x = OFFICE_WIDTH - 180;
    const y = 10;
    const w = 170;
    const h = 140;

    // Panel shadow
    ctx.fillStyle = 'rgba(60, 45, 30, 0.3)';
    ctx.fillRect(x + 3, y + 3, w, h);

    // Panel background - warm cream like Stardew UI
    ctx.fillStyle = 'rgba(232, 212, 184, 0.95)';
    ctx.fillRect(x, y, w, h);

    // Panel border - warm wood
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    // Inner border highlight
    ctx.strokeStyle = 'rgba(255, 248, 240, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

    // Header background - warm amber
    ctx.fillStyle = '#B8865A';
    ctx.fillRect(x, y, w, 26);

    // Header text
    ctx.fillStyle = '#FFF8F0';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText('📊 OFFICE METRICS', x + 10, y + 17);

    // Stats
    ctx.font = '10px "JetBrains Mono", monospace';

    const statsY = y + 45;
    const labelX = x + 10;
    const valueX = x + 95;

    // Helper for drawing stat rows
    const drawStat = (label, value, color, yOffset) => {
        ctx.fillStyle = '#5D4E37';
        ctx.fillText(label, labelX, statsY + yOffset);
        ctx.fillStyle = color;
        ctx.fillText(value, valueX, statsY + yOffset);
    };

    // Tokens
    drawStat('Tokens:', document.getElementById('statTokens')?.textContent || '0', COLORS.accent_teal, 0);

    // API Calls
    drawStat('API Calls:', document.getElementById('statApiCalls')?.textContent || '0', COLORS.accent_teal, 16);

    // Tasks Done
    drawStat('Tasks Done:', document.getElementById('statTasksDone')?.textContent || '0', COLORS.accent_sage, 32);

    // Active Agents
    drawStat('Active:', document.getElementById('statActiveAgents')?.textContent || '0', COLORS.accent_warm, 48);

    // Revenue
    drawStat('Revenue:', document.getElementById('statRevenue')?.textContent || '$0', COLORS.accent_sage, 64);

    // Costs
    drawStat('Costs:', document.getElementById('statCosts')?.textContent || '$0', COLORS.accent_coral, 80);

    // Profit
    const profitText = document.getElementById('statProfit')?.textContent || '$0';
    const profitColor = profitText.startsWith('-') ? COLORS.accent_coral : COLORS.accent_sage;
    drawStat('Profit:', profitText, profitColor, 96);
}

function drawAgent(agent) {
    const x = agent.position.x;
    const y = agent.position.y;
    
    drawAgentAvatar(agent, x, y, PIXEL_SCALE);
    
    // Level badge
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x + 12, y - 8, 16, 12);
    ctx.fillStyle = COLORS.accent_warm;
    ctx.font = 'bold 8px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Lv' + agent.level, x + 20, y + 2);
    ctx.textAlign = 'left';
}

// ============================================================================
// MINIMAP - Enhanced with walls - Stardew style
// ============================================================================

function drawMinimapEnhanced() {
    const mapX = OFFICE_WIDTH - 160;
    const mapY = 155; // Position below stats panel
    const mapW = 150;
    const mapH = 100;
    const scaleX = mapW / OFFICE_WIDTH;
    const scaleY = mapH / OFFICE_HEIGHT;

    // Shadow
    ctx.fillStyle = 'rgba(60, 45, 30, 0.3)';
    ctx.fillRect(mapX + 3, mapY + 3, mapW, mapH);

    // Background - warm cream
    ctx.fillStyle = 'rgba(232, 212, 184, 0.95)';
    ctx.fillRect(mapX, mapY, mapW, mapH);

    // Border - warm wood
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 3;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    // Draw corridors on minimap
    if (officeData && officeData.corridors) {
        ctx.fillStyle = 'rgba(196, 154, 108, 0.6)';
        for (const corr of officeData.corridors) {
            ctx.fillRect(
                mapX + corr.x * scaleX,
                mapY + corr.y * scaleY,
                corr.width * scaleX,
                corr.height * scaleY
            );
        }
    }

    // Draw rooms on minimap
    if (officeData && officeData.rooms) {
        for (const room of officeData.rooms) {
            const accentColor = room.accent_color || COLORS.accent_teal;
            ctx.fillStyle = 'rgba(184, 134, 90, 0.5)';
            ctx.fillRect(
                mapX + room.x * scaleX,
                mapY + room.y * scaleY,
                room.width * scaleX,
                room.height * scaleY
            );

            // Room border (wall)
            ctx.strokeStyle = accentColor;
            ctx.globalAlpha = 0.6;
            ctx.lineWidth = 1;
            ctx.strokeRect(
                mapX + room.x * scaleX,
                mapY + room.y * scaleY,
                room.width * scaleX,
                room.height * scaleY
            );
            ctx.globalAlpha = 1.0;
        }
    }

    // Draw walls on minimap (thicker walls)
    if (officeData && officeData.rooms) {
        ctx.fillStyle = 'rgba(139, 107, 20, 0.7)';
        for (const room of officeData.rooms) {
            const wallThick = WALL_THICKNESS * scaleX;
            // Top wall
            ctx.fillRect(mapX + room.x * scaleX, mapY + room.y * scaleY, room.width * scaleX, wallThick);
            // Bottom wall
            ctx.fillRect(mapX + room.x * scaleX, mapY + (room.y + room.height) * scaleY - wallThick, room.width * scaleX, wallThick);
            // Left wall
            ctx.fillRect(mapX + room.x * scaleX, mapY + room.y * scaleY, wallThick, room.height * scaleY);
            // Right wall
            ctx.fillRect(mapX + (room.x + room.width) * scaleX - wallThick, mapY + room.y * scaleY, wallThick, room.height * scaleY);
        }
    }

    // Agents on minimap
    if (positions && positions.agents) {
        for (const agent of positions.agents) {
            ctx.fillStyle = COLORS[`dept_${agent.department}`] || COLORS.dept_general;
            ctx.beginPath();
            ctx.arc(
                mapX + agent.position.x * scaleX,
                mapY + agent.position.y * scaleY,
                2.5, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    // Carson on minimap (larger, teal)
    ctx.fillStyle = COLORS.accent_teal;
    ctx.beginPath();
    ctx.arc(
        mapX + carson.x * scaleX,
        mapY + carson.y * scaleY,
        3.5, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = '#FFF8F0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#5D4E37';
    ctx.font = 'bold 8px "JetBrains Mono", monospace';
    ctx.fillText('MAP', mapX + 5, mapY + 12);
}

// ============================================================================
// AGENT INFO PANEL - Stardew style
// ============================================================================

function drawAgentInfo(agent) {
    const x = 10;
    const y = OFFICE_HEIGHT - 120;
    const w = 250;
    const h = 110;

    // Panel shadow
    ctx.fillStyle = 'rgba(60, 45, 30, 0.3)';
    ctx.fillRect(x + 3, y + 3, w, h);

    // Panel background - warm cream
    ctx.fillStyle = COLORS.panel_bg;
    ctx.fillRect(x, y, w, h);

    // Panel border - warm wood
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    // Header - department color
    const deptColor = COLORS[`dept_${agent.department}`] || COLORS.accent_teal;
    ctx.fillStyle = deptColor;
    ctx.fillRect(x, y, w, 30);

    // Header text
    ctx.fillStyle = '#FFF8F0';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(agent.name.toUpperCase(), x + 10, y + 20);

    // Close button
    ctx.fillStyle = '#FFF8F0';
    ctx.font = '16px "JetBrains Mono", monospace';
    ctx.fillText('×', x + w - 25, y + 22);

    // Info - warm text
    ctx.fillStyle = COLORS.text;
    ctx.font = '11px "JetBrains Mono", monospace';

    const infoY = y + 50;
    ctx.fillText(`Role: ${agent.role}`, x + 10, infoY);
    ctx.fillText(`Department: ${agent.department}`, x + 10, infoY + 18);
    ctx.fillText(`Status: ${agent.status}`, x + 10, infoY + 36);
    ctx.fillText(`Level: ${agent.level} | XP: ${agent.xp}`, x + 10, infoY + 54);
    ctx.fillText(`Room: ${agent.current_room}`, x + 10, infoY + 72);
}

// ============================================================================
// INTERACTION
// ============================================================================

let hoveredAgent = null;

function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log('Canvas click at:', x, y, '| positions:', positions ? 'loaded' : 'null');
    
    let clickedAgent = false;
    if (positions && positions.agents) {
        console.log('Agents in positions:', positions.agents.length);
        for (const agent of positions.agents) {
            const dx = agent.position.x - x;
            const dy = agent.position.y - y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            console.log('Agent:', agent.name, 'at', agent.position.x, agent.position.y, '| dist:', dist.toFixed(1), '| hit:', dist < AGENT_SIZE);
            if (dist < AGENT_SIZE) {
                console.log('HIT! Showing context menu for:', agent.name);
                selectedAgent = agent;
                clickedAgent = true;
                showAgentContextMenu(agent, e.clientX, e.clientY);
                return;
            }
        }
    }
    
    // Check if clicked close button on info panel
    if (selectedAgent) {
        const infoX = 10;
        const infoY = OFFICE_HEIGHT - 120;
        if (x >= infoX + 250 - 25 && x <= infoX + 250 && y >= infoY && y <= infoY + 30) {
            selectedAgent = null;
            return;
        }
    }
    
    // Clicked empty space - move Carson there
    if (!clickedAgent) {
        selectedAgent = null;
        carson.targetX = x;
        carson.targetY = y;
        console.log('Moving Carson to:', x, y);
    }
}

function handleCanvasHover(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    hoveredAgent = null;
    if (positions && positions.agents) {
        for (const agent of positions.agents) {
            const dx = agent.position.x - x;
            const dy = agent.position.y - y;
            if (Math.sqrt(dx*dx + dy*dy) < AGENT_SIZE) {
                hoveredAgent = agent;
                canvas.style.cursor = 'pointer';
                return;
            }
        }
    }
    canvas.style.cursor = 'default';
}

function handleKeyDown(e) {
    if (currentView !== 'office') return;
    
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keys[key] = true;
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keys[key] = false;
    }
}

function handleMouseMove(e) {
    // Track mouse for potential future use
}

function updateCarsonMovement() {
    if (keys.w) carson.targetY -= carson.speed;
    if (keys.s) carson.targetY += carson.speed;
    if (keys.a) carson.targetX -= carson.speed;
    if (keys.d) carson.targetX += carson.speed;
    
    carson.targetX = Math.max(20, Math.min(OFFICE_WIDTH - 20, carson.targetX));
    carson.targetY = Math.max(20, Math.min(OFFICE_HEIGHT - 20, carson.targetY));
    
    carson.x += (carson.targetX - carson.x) * 0.15;
    carson.y += (carson.targetY - carson.y) * 0.15;
    
    camera.x = carson.x - OFFICE_WIDTH / 2;
    camera.y = carson.y - OFFICE_HEIGHT / 2;
    
    camera.x = Math.max(0, Math.min(0, camera.x));
    camera.y = Math.max(0, Math.min(0, camera.y));
}

async function showAgentContextMenu(agent, clientX, clientY) {
    console.log('showAgentContextMenu called for:', agent.name, agent.id);
    
    // Remove any existing context menu
    const existingMenu = document.getElementById('agent-context-menu');
    if (existingMenu) existingMenu.remove();
    
    // Create context menu
    const menu = document.createElement('div');
    menu.id = 'agent-context-menu';
    menu.style.cssText = `
        position: fixed;
        left: ${clientX}px;
        top: ${clientY}px;
        background: rgba(40, 35, 60, 0.98);
        border: 2px solid #4ecdc4;
        border-radius: 8px;
        padding: 8px 0;
        z-index: 10000;
        min-width: 180px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        font-family: 'JetBrains Mono', monospace;
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 8px 16px;
        border-bottom: 1px solid rgba(78, 205, 196, 0.3);
        margin-bottom: 8px;
    `;
    header.innerHTML = `
        <div style="color: #4ecdc4; font-weight: bold; font-size: 12px;">${agent.name}</div>
        <div style="color: #b0b0c0; font-size: 10px;">${agent.role} • Level ${agent.level}</div>
    `;
    menu.appendChild(header);
    
    // Chat option
    const chatBtn = document.createElement('div');
    chatBtn.style.cssText = `
        padding: 10px 16px;
        cursor: pointer;
        color: #f5f5f5;
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    chatBtn.innerHTML = `<span style="font-size: 14px;">💬</span> Chat with Agent`;
    chatBtn.onmouseover = () => chatBtn.style.background = 'rgba(78, 205, 196, 0.2)';
    chatBtn.onmouseout = () => chatBtn.style.background = 'transparent';
    chatBtn.onclick = () => {
        console.log('Opening chat with agent:', agent.id);
        switchView('dashboard');
        setTimeout(() => {
            if (typeof window.openChatWithAgent === 'function') {
                console.log('Calling window.openChatWithAgent');
                window.openChatWithAgent(agent.id);
            } else {
                console.log('window.openChatWithAgent is NOT a function');
            }
        }, 100);
        menu.remove();
    };
    menu.appendChild(chatBtn);
    
    // Move to room option
    const moveBtn = document.createElement('div');
    moveBtn.style.cssText = `
        padding: 10px 16px;
        cursor: pointer;
        color: #f5f5f5;
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    moveBtn.innerHTML = `<span style="font-size: 14px;">📍</span> Move to Room`;
    moveBtn.onmouseover = () => moveBtn.style.background = 'rgba(78, 205, 196, 0.2)';
    moveBtn.onmouseout = () => moveBtn.style.background = 'transparent';
    moveBtn.onclick = () => {
        menu.remove();
        showRoomSelectMenu(agent, clientX, clientY);
    };
    menu.appendChild(moveBtn);
    
    // Close on click outside
    const closeHandler = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeHandler);
        }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
    
    document.body.appendChild(menu);
}

async function showRoomSelectMenu(agent, clientX, clientY) {
    // Remove any existing menu
    const existingMenu = document.getElementById('room-select-menu');
    if (existingMenu) existingMenu.remove();
    
    const menu = document.createElement('div');
    menu.id = 'room-select-menu';
    menu.style.cssText = `
        position: fixed;
        left: ${clientX}px;
        top: ${clientY}px;
        background: rgba(40, 35, 60, 0.98);
        border: 2px solid #4ecdc4;
        border-radius: 8px;
        padding: 8px 0;
        z-index: 10001;
        min-width: 160px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        font-family: 'JetBrains Mono', monospace;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `padding: 8px 16px; color: #4ecdc4; font-size: 11px; font-weight: bold; border-bottom: 1px solid rgba(78, 205, 196, 0.3); margin-bottom: 8px;`;
    header.textContent = 'Select Room';
    menu.appendChild(header);
    
    const rooms = ['lobby', 'research', 'coding', 'business', 'design', 'development', 'meeting', 'breakroom', 'server', 'executive'];
    rooms.forEach(roomId => {
        const room = officeData?.rooms?.find(r => r.id === roomId);
        if (!room) return;
        
        const roomBtn = document.createElement('div');
        roomBtn.style.cssText = `
            padding: 8px 16px;
            cursor: pointer;
            color: #f5f5f5;
            font-size: 11px;
        `;
        roomBtn.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${room.accent_color || '#4ecdc4'}; margin-right: 8px;"></span>${room.name}`;
        roomBtn.onmouseover = () => roomBtn.style.background = 'rgba(78, 205, 196, 0.2)';
        roomBtn.onmouseout = () => roomBtn.style.background = 'transparent';
        roomBtn.onclick = async () => {
            try {
                await fetch(`${API_BASE}/office/move/${agent.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        x: room.x + room.width/2,
                        y: room.y + room.height/2
                    })
                });
                console.log(`Moved ${agent.name} to ${room.name}`);
            } catch (err) {
                console.error('Failed to move agent:', err);
            }
            menu.remove();
        };
        menu.appendChild(roomBtn);
    });
    
    document.body.appendChild(menu);
}

// ============================================================================
// VIEW SWITCHING HELPERS
// ============================================================================

window.officeSetView = function(view) {
    console.log('office.js officeSetView called, view:', view);
    if (view === 'office') {
        ensureCanvasReady();
    }
};

window.officeForceRender = function() {
    console.log('office.js officeForceRender called, currentView:', currentView);
    if (currentView === 'office') {
        ensureCanvasReady();
        if (ctx && officeData) {
            renderOffice();
            console.log('Forced office render');
        }
    }
};

window.initOffice = initOffice;
window.loadPositions = loadPositions;
