# Minecraft Dobby Bot

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![Minecraft](https://img.shields.io/badge/minecraft-1.16%2B-green.svg)](https://www.minecraft.net/)

An autonomous Minecraft bot with natural language understanding and command execution capabilities. Built for automated resource gathering, player interaction, and task execution in Minecraft servers.

## Overview

Minecraft Dobby Bot is an intelligent agent that operates within Minecraft environments, capable of understanding natural language queries and executing commands. The bot provides both conversational interaction through natural language processing and direct command execution for immediate control.

## Features

### Natural Language Interaction

The bot understands conversational queries and responds with appropriate actions:

| Query | Function Call | Description |
|-------|---------------|-------------|
| "What can you do?" | `respond_to_question()` | Lists all available capabilities |
| "Mine some iron ore" | `mine_block("iron")` | Locates and mines iron ore blocks |
| "Follow me around" | `follow_player("username")` | Initiates player following behavior |
| "Stop following me" | `stop_movement()` | Terminates all movement activities |
| "Come to me" | `go_to_player("username")` | Navigates to player's current location |
| "What's in your inventory?" | `check_inventory()` | Returns complete inventory listing |
| "Place some stone blocks" | `place_block("stone")` | Places stone blocks from inventory |
| "Look around and tell me what you see" | `look_around()` | Describes surrounding environment |

### Direct Command Interface

Quick commands provide immediate bot control without natural language processing:

| Command | Behavior |
|---------|----------|
| `!follow` / `!follow me` | Bot follows your player character |
| `!stop` | Halts all bot movement and activities |
| `!come` / `!come here` | Bot navigates to your current position |
| `!inventory` / `!inv` | Displays bot's current inventory |
| `!mine <block>` | Mines nearest block of specified type |
| `!build <block>` | Places specified block type adjacent to player |

## Getting Started

### Prerequisites

- Node.js v14.0.0 or higher
- pnpm package manager
- Minecraft Java Edition 1.16+
- Access to a Minecraft server (local or remote)
- LLM API access (OpenAI, Anthropic, or compatible)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MAYANK-MAHAUR/minecraft-dobbybot.git
cd minecraft-dobbybot
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```env
# Get your API key from: https://fireworks.ai/
FIREWORKS_API_KEY=""
MINECRAFT_HOST="localhost"
MINECRAFT_PORT=25565
BOT_USERNAME="DOBBY"
```

5. Start the bot:
```bash
pnpm ts-node src/bot.ts
```

## Usage

### Natural Language Mode

Interact with the bot through Minecraft chat using natural language:

```
Player: Mine some diamond ore
Bot: [Searching for diamond ore...]
Bot: [Mining diamond ore]

Player: What's in your inventory?
Bot: Inventory: 3x diamond ore, 12x cobblestone, 1x iron pickaxe

Player: Follow me around
Bot: [Now following Player]
```

### Command Mode

Use direct commands for immediate control:

```
!follow
Bot: Now following you.

!mine diamond_ore
Bot: Mining diamond_ore...

!inventory
Bot: [Diamond Ore x3] [Cobblestone x12] [Iron Pickaxe x1]

!stop
Bot: Stopped all activities.
```

### Block Specification

When using mining or building commands, specify blocks using Minecraft's naming convention:

```
!mine iron_ore
!mine diamond_ore
!mine coal_ore
!build stone
!build oak_planks
!build cobblestone
```

## Configuration

### Connection Settings

Edit `config.json` to modify connection parameters:

```json
{
  "host": "your.server.com",
  "port": 25565,
  "username": "DobbyBot",
  "auth": "offline",
  "version": "1.16.5",
  "autoReconnect": true,
  "reconnectDelay": 5000
}
```

### Bot Behavior Settings

Additional configuration options:

```json
{
  "chatPrefix": "!",
  "followDistance": 3,
  "miningRange": 32,
  "responseDelay": 500,
  "naturalLanguageEnabled": true
}
```

## Project Structure

```
minecraft-dobbybot/
├── src/
│   └── llm/              # Language model integration
│       ├── index.ts      # LLM module entry point
│       └── bot.ts        # Bot implementation with LLM
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
├── README.md             # Project documentation
├── package.json          # Project dependencies
├── pnpm-lock.yaml        # Lock file for pnpm
└── tsconfig.json         # TypeScript configuration
```

## API Reference

### Core Functions

#### `mine_block(blockType)`
Locates and mines the nearest block of specified type.
- **Parameters**: `blockType` (string) - Minecraft block identifier
- **Returns**: Promise<boolean>

#### `follow_player(username)`
Initiates player following behavior with automatic pathfinding.
- **Parameters**: `username` (string) - Target player username
- **Returns**: void

#### `go_to_player(username)`
Navigates to specified player's current coordinates.
- **Parameters**: `username` (string) - Target player username
- **Returns**: Promise<boolean>

#### `stop_movement()`
Immediately halts all bot movement and cancels active tasks.
- **Returns**: void

#### `check_inventory()`
Retrieves current inventory state with item counts.
- **Returns**: Object - Inventory contents

#### `place_block(blockType)`
Places specified block type from inventory at target location.
- **Parameters**: `blockType` (string) - Block to place
- **Returns**: Promise<boolean>

#### `look_around()`
Scans environment and returns descriptions of nearby entities and blocks.
- **Returns**: Object - Environmental data

For complete API documentation, see [docs/API.md](docs/API.md).

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/feature-name`)
3. Implement changes with appropriate tests
4. Commit with descriptive messages (`git commit -m 'Add feature description'`)
5. Push to your fork (`git push origin feature/feature-name`)
6. Submit a Pull Request

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed contribution guidelines and code standards.

## Troubleshooting

### Connection Issues

**Problem**: Bot cannot connect to server
- Verify server is running and accessible
- Check `config.json` host and port settings
- For online-mode servers, set `"auth": "microsoft"` and provide valid credentials

### Command Execution

**Problem**: Commands not responding
- Ensure command prefix matches configuration (default: `!`)
- Verify bot has required permissions on server
- Check bot is not already executing another task

### Mining Operations

**Problem**: Bot cannot find specified blocks
- Confirm block type uses correct Minecraft identifier (e.g., `iron_ore` not `iron`)
- Ensure blocks exist within configured mining range (default: 32 blocks)
- Verify bot has appropriate tools for block type

For additional support, consult [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) or open an issue.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Maintainer

**Mayank Mahaur**
- GitHub: [@MAYANK-MAHAUR](https://github.com/MAYANK-MAHAUR)

**Shery**
- GitHub: [@shery8595](https://github.com/shery8595)

 **Repository Link**
- Repository: [minecraft-dobbybot](https://github.com/MAYANK-MAHAUR/minecraft-dobbybot)

## Acknowledgments

- [Mineflayer](https://github.com/PrismarineJS/mineflayer) - Minecraft bot framework
- [Prismarine](https://github.com/PrismarineJS) - Minecraft protocol implementation
- All project contributors
