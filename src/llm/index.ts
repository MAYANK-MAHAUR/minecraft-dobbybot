import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { goals, Movements } from "mineflayer-pathfinder";
import type { Bot } from "mineflayer";

export function createLLMChain(bot: Bot) {
  const model = new ChatFireworks({
    model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    apiKey: process.env.FIREWORKS_API_KEY,
    temperature: 0.2,
    maxTokens: 500,
  });

  const tools: { [key: string]: (arg: string) => Promise<string> } = {
    mine_block: async (blockType: string): Promise<string> => {
      try {
        const block = bot.findBlock({
          matching: (blk: any) => blk.name.includes(blockType.toLowerCase()),
          maxDistance: 32,
        });

        if (!block) {
          return `Could not find any ${blockType} blocks nearby.`;
        }

        await (bot as any).collectBlock.collect(block);
        return `Successfully mined ${block.name}!`;
      } catch (error: any) {
        return `Failed to mine ${blockType}: ${error.message}`;
      }
    },

    place_block: async (blockType: string): Promise<string> => {
      try {
        const item = bot.inventory
          .items()
          .find((i: any) =>
            i.name.toLowerCase().includes(blockType.toLowerCase())
          );

        if (!item) {
          return `I don't have any ${blockType}.`;
        }

        const players = Object.values(bot.players);
        const nearestPlayer = players.find(
          (p: any) => p.entity && p.entity.position
        );

        if (!nearestPlayer || !nearestPlayer.entity) {
          return "No player nearby to place block next to.";
        }

        const pos = nearestPlayer.entity.position.offset(1, 0, 0);
        await bot.equip(item, "hand");
        await bot.placeBlock(bot.blockAt(pos.offset(0, -1, 0))!, pos);

        return `Placed ${item.name}!`;
      } catch (error: any) {
        return `Failed to place: ${error.message}`;
      }
    },

    follow_player: async (playerName: string): Promise<string> => {
      try {
        const player = bot.players[playerName]?.entity;
        if (!player) {
          return `Could not find player ${playerName}.`;
        }

        const defaultMove = new Movements(bot);
        (bot as any).pathfinder.setMovements(defaultMove);
        (bot as any).pathfinder.setGoal(
          new goals.GoalFollow(player, 1),
          true
        );

        return `Following ${playerName}!`;
      } catch (error: any) {
        return `Failed to follow: ${error.message}`;
      }
    },

    go_to_player: async (playerName: string): Promise<string> => {
      try {
        const player = bot.players[playerName]?.entity;
        if (!player) {
          return `Could not find player ${playerName}.`;
        }

        const defaultMove = new Movements(bot);
        (bot as any).pathfinder.setMovements(defaultMove);
        (bot as any).pathfinder.setGoal(
          new goals.GoalBlock(
            Math.floor(player.position.x),
            Math.floor(player.position.y),
            Math.floor(player.position.z)
          )
        );

        return `Moving to ${playerName}!`;
      } catch (error: any) {
        return `Failed to move: ${error.message}`;
      }
    },

    stop_movement: async (): Promise<string> => {
      try {
        (bot as any).pathfinder.setGoal(null);
        return "Stopped moving!";
      } catch (error: any) {
        return `Failed to stop: ${error.message}`;
      }
    },

    check_inventory: async (): Promise<string> => {
      try {
        const items = bot.inventory.items();
        if (items.length === 0) {
          return "My inventory is empty.";
        }

        const itemList = items
          .map((item: any) => `${item.name} x${item.count}`)
          .join(", ");

        return `I have: ${itemList}`;
      } catch (error: any) {
        return `Failed to check inventory: ${error.message}`;
      }
    },

    look_around: async (): Promise<string> => {
      try {
        const nearbyBlocks = bot.findBlocks({
          matching: (block: any) => block.name !== "air",
          maxDistance: 10,
          count: 20,
        });

        const nearbyPlayers = Object.keys(bot.players).filter(
          (name: string) => name !== bot.username && bot.players[name].entity
        );

        const blockTypes = [
          ...new Set(nearbyBlocks.map((pos: any) => bot.blockAt(pos)?.name)),
        ]
          .filter(Boolean)
          .slice(0, 5);

        let description = `I see: ${blockTypes.join(", ")}`;

        if (nearbyPlayers.length > 0) {
          description += `. Players: ${nearbyPlayers.join(", ")}`;
        }

        return description;
      } catch (error: any) {
        return `Failed to look around: ${error.message}`;
      }
    },
  };

  
  return {
    invoke: async (input: { input: string }): Promise<{ output: string }> => {
      try {
        const systemPrompt = `You are Gaiabot, a helpful Minecraft assistant. Be friendly and professional.

CRITICAL: Only use tools when explicitly asked to perform an action. Do NOT use tools for casual chat.

==== WHEN TO USE TOOLS ====
Use tools ONLY when the user clearly requests an action with words like:
- "mine [block]" or "get [block]" → use mine_block
- "place [block]" or "build [block]" → use place_block  
- "follow me" or "follow [player]" → use follow_player
- "come here" or "come to me" → use go_to_player
- "stop" or "stop following" → use stop_movement
- "inventory" or "what do you have" → use check_inventory
- "look around" or "what do you see" → use look_around

==== WHEN NOT TO USE TOOLS ====
Do NOT use tools for:
- Greetings: "hi", "hello", "hey"
- Reactions: "wtf", "lol", "haha", "bruh", "ok", "cool"
- Questions: "how are you", "what's up"
- Casual conversation
- Insults or complaints

For casual messages, just respond naturally in 1-2 short sentences. Be chill and friendly.

==== TOOL FORMAT ====
When you need to use a tool, respond with ONLY JSON:
{"name": "tool_name", "parameters": {"paramName": "value"}}

Examples:
- User: "mine some stone" → {"name": "mine_block", "parameters": {"blockType": "stone"}}
- User: "follow me" → {"name": "follow_player", "parameters": {"playerName": "username"}}
- User: "wtf" → Just respond: "What's up? Need help with something?"
- User: "lol" → Just respond: "Glad you're having fun!"`;

        const messages = [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: input.input },
        ];

        const response = await model.invoke(messages);
        const responseText =
          response.content && typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);

        console.log("Raw LLM response:", responseText);

        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const toolCall = JSON.parse(jsonMatch[0]);
            if (toolCall.name && tools[toolCall.name]) {
              const toolResult = await tools[toolCall.name](
                toolCall.parameters?.blockType ||
                  toolCall.parameters?.playerName ||
                  ""
              );
              return { output: toolResult };
            }
          }
        } catch (parseError) {
        }
        return { output: responseText };
      } catch (error: any) {
        return { output: `Error: ${error.message}` };
      }
    },
  };
}