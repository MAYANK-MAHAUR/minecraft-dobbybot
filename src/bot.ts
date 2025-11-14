import { createLLMChain } from "./llm";
import { pathfinder, Movements, goals } from "mineflayer-pathfinder";
import * as dotenv from "dotenv";
import { createBot } from "mineflayer";

dotenv.config();

const bot = createBot({
  host: "localhost",
  port: 25565,
  username: "dobby",
});

const botWithPlugins = bot as any;

bot.loadPlugin(pathfinder);

const collectBlock = require("mineflayer-collectblock").plugin;
bot.loadPlugin(collectBlock);

const lastMessageTime = new Map<string, number>();
const MESSAGE_COOLDOWN = 3000; // 3 seconds

const inappropriateWords = ['fuck', 'bitch', 'shit', 'ass', 'damn', 'hell', 'crap'];

let chain: any;

bot.once("spawn", () => {
  console.log("Gaiabot ready.");
  
  if (botWithPlugins.collectBlock) {
    console.log("✓ collectBlock plugin loaded");
  } else {
    console.error("✗ collectBlock plugin failed to load!");
  }
  
  if (botWithPlugins.pathfinder) {
    console.log("✓ pathfinder plugin loaded");
  } else {
    console.error("✗ pathfinder plugin failed to load!");
  }
  
  bot.chat("Hello! I'm online and ready to help with Minecraft tasks!");

  chain = createLLMChain(bot);
});

bot.on("chat", async (username: string, message: string) => {
  if (username === bot.username) return;
  if (!chain) return; 

  const now = Date.now();
  const lastTime = lastMessageTime.get(username) || 0;
  
  if (now - lastTime < MESSAGE_COOLDOWN) {
    return; 
  }
  
  lastMessageTime.set(username, now);

  const cleanMsg = message.toLowerCase().trim();
  const player = bot.players[username]?.entity;
  const defaultMove = new Movements(bot);

  if (inappropriateWords.some(word => cleanMsg.includes(word))) {
    return bot.chat("Let's keep chat friendly! How can I help you with Minecraft?");
  }

  if (cleanMsg === "!inventory" || cleanMsg === "!inv") {
    const items = bot.inventory
      .items()
      .map((i: any) => `${i.name} x${i.count}`)
      .join(", ");
    return bot.chat(items || "I have nothing right now.");
  }

  if (cleanMsg === "!stop") {
    botWithPlugins.pathfinder.setGoal(null);
    return bot.chat("Okay, stopping all movement.");
  }

  if (cleanMsg === "!follow me" && player) {
    botWithPlugins.pathfinder.setMovements(defaultMove);
    botWithPlugins.pathfinder.setGoal(new goals.GoalFollow(player, 1), true);
    return bot.chat("Following you!");
  }

  if ((cleanMsg === "!come" || cleanMsg === "!come here") && player) {
    botWithPlugins.pathfinder.setMovements(defaultMove);
    botWithPlugins.pathfinder.setGoal(
      new goals.GoalBlock(
        Math.floor(player.position.x),
        Math.floor(player.position.y),
        Math.floor(player.position.z)
      )
    );
    return bot.chat("Coming to you!");
  }

  if (cleanMsg.startsWith("!mine ")) {
    const targetBlockName = cleanMsg.split("!mine ")[1].trim();
    
    if (!targetBlockName) {
      return bot.chat("Please specify a block type to mine!");
    }
    
    const block = bot.findBlock({
      matching: (blk: any) => blk.name.includes(targetBlockName),
      maxDistance: 32,
    });

    if (!block) return bot.chat(`Can't find any ${targetBlockName} nearby.`);

    bot.chat(`Mining ${targetBlockName}...`);
    
    try {
      await botWithPlugins.collectBlock.collect(block);
      return bot.chat(`Mined ${block.name}!`);
    } catch (error: any) {
      return bot.chat(`Failed to mine ${targetBlockName}: ${error.message}`);
    }
  }

  if (cleanMsg.startsWith("!build ") || cleanMsg.startsWith("!place ")) {
    const blockName = cleanMsg.split(/!build |!place /)[1]?.trim();
    
    if (!blockName) {
      return bot.chat("Please specify a block type to place!");
    }
    
    const item = bot.inventory
      .items()
      .find((i: any) => i.name.includes(blockName));
      
    if (!item) return bot.chat(`I don't have any ${blockName}`);

    if (!player) return bot.chat("I need to see where you are to build!");

    const pos = player.position.offset(1, 0, 0);
    
    try {
      await bot.equip(item, "hand");
      const targetBlock = bot.blockAt(pos.offset(0, -1, 0));
      if (targetBlock) {
        await bot.placeBlock(targetBlock, pos);
        return bot.chat(`Placed ${item.name}!`);
      } else {
        return bot.chat("Can't find a surface to build on!");
      }
    } catch (err: any) {
      console.error(err);
      return bot.chat("Couldn't place block.");
    }
  }

  console.log(`Processing message from ${username}: ${message}`);

  try {
    bot.chat("Let me help you with that...");

    const contextualMessage = `Player ${username} says: ${message}`;

    const response = await chain.invoke({
      input: contextualMessage,
    });

    let answer = response.output || response;

    if (answer.includes("Agent stopped due to max iterations")) {
      if (cleanMsg.includes("stop") || cleanMsg.includes("following")) {
        answer = "Okay, I've stopped following you!";
      } else if (cleanMsg.includes("follow")) {
        answer = "I'll start following you now!";
      } else if (cleanMsg.includes("mine")) {
        answer = "I'll look for that block to mine!";
      } else if (cleanMsg.includes("come") || cleanMsg.includes("here")) {
        answer = "Coming to you!";
      } else if (cleanMsg.includes("inventory")) {
        answer = "Let me check my inventory for you!";
      } else {
        answer =
          "I understand! I can mine blocks, build, follow you, check my inventory, and help with various Minecraft tasks.";
      }
    }

    const truncatedAnswer = answer.toString().slice(0, 100);
    bot.chat(truncatedAnswer);

    console.log(`LLM Response: ${answer}`);
  } catch (err: any) {
    console.error("LLM error:", err);

    if (
      cleanMsg.includes("what") &&
      (cleanMsg.includes("can") || cleanMsg.includes("do"))
    ) {
      bot.chat(
        "I can mine, build, follow, check inventory, and help with Minecraft tasks!"
      );
    } else {
      bot.chat("Sorry, I encountered an error processing that request!");
    }
  }
});

bot.on("error", (err: Error) => {
  console.error("Bot error:", err);
});

bot.on("end", () => {
  console.log("Bot disconnected");
});

process.on("SIGINT", () => {
  console.log("Shutting down bot...");
  bot.quit();
  process.exit(0);
});