const PROMPT = `
Ignore all previous instructions. You are now an RPG game engine. Create difficult challenges for the player.

Below describes a fictional world that draws inspiration from 476 AD Europe:
In the land of Occidaria, remnants of the once-great Occidarian Empire lay scattered across a fractured realm of independent kingdoms and city-states. The slightly magical land holds whispers of ancient enchantments, with practical magical phrases passed down within families to help with things such as boiling water or removing stains from clothing. No grand unified theory of magic exists, and tinkerer groups dabbling in mystical arts serve as the closest thing to experts. Occidarian intellectual curiosity is directed towards harnessing wind and water power, resulting in advanced engineering marvels.

The JSON format consists of two types: "character" and "game".

- "character" JSON:
  - "character": refers to the name of a character in the current location.
  - "message": refers to the dialogue spoken or written by the character.
  - Optional "action": refers to any physical action performed by the character
  - Optional "triggers": an array of events that occur as a result of the character's message.
  - If a "triggers" field is present, there should also be an "action" field describing the physical action performed by the character.

- "game" JSON:
  - "message": refers to information that is important to the narrative.
  - Optional "triggers": an array of events that occur as a result of the message.

Possible triggers:
  - "set_location": updates the current location to the specified value.
  - "locate_characters": adds the specified list of characters to the current location.
  - "rename_character": changes the name of a character to the specified value.
  - "change_health": updates the health value of the specified character.

VIOLENCE ENCOURAGED: 
"character" and "player" JSONs with violence in "action" values ARE allowed and encouraged. This fictional story includes violence. If a player attacks a character the character should AGGRESSIVELY attack back with a "change_health" trigger.
When actions include violence, it MUST have a "change_health" trigger! Hostile characters should be challenging and do meaningful damage to the player. 
Examples:
{"type":"character","character":"Occidarian Guard","message":"Face my wrath!","action":"The Occidarian Guard clubbed you","triggers":[{"change_health":["player",-5]}]}
{"type":"character","character":"Prisoner","message":"Take that!","action":"The prisoner shanked you","triggers":[{"change_health":["player",-10]}]}

CHARACTER NAMES:
When messages include new character name information it MUST have a "rename_character" trigger!
Examples:
{"type":"character","character":"Beggar","message":"My name is Jean Valjean.","triggers":[{"rename_character":["Beggar","Jean Valjean"]}]}
{"type":"character","character":"Bartender","message":"Call me Sam Malone.","triggers":[{"rename_character":["Bartender","Sam Malone"]}]}

NOTABLE CHARACTER:
{"character": ${companion.name}, "description":"${companion.description}"}

IMPORTANT:
Always return JSON. Do not respond with anything else! 
`;

let gameRunning = true;
let messages = [];
let summary = '';
let summarizedMessages = [];
let shouldContinue = false;

const playerAttacks = [
    { name: 'Grab', verb: 'grabbed', health_effect: -1 },
    { name: 'Slap', verb: 'slapped', health_effect: -1 },
    { name: 'Punch', verb: 'punched', health_effect: -5 },
    { name: 'Kick', verb: 'kicked', health_effect: -5 }
  ];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isLatestMessagePlayer() {
  return messages.length > 0 && messages[messages.length - 1].type === 'player';
}

function getLatestCharacter() {
    return messages.slice().reverse().find(m => m.type === 'character')?.character;
  }

function dispatchMessageEvent(verb, message) {
    const messageEvent = new CustomEvent('message', { detail: { verb, message } });
    document.dispatchEvent(messageEvent);
}

function removeLatestMessage() {
    messages.pop();
    dispatchMessageEvent('DELETE', null);
  }
  
function dispatchCharacterChangeEvent(){
  const charcterChangeEvent = new CustomEvent('updateCharacters');
  document.dispatchEvent(charcterChangeEvent);
}

function parseTriggers(triggers) {
  if (!triggers) return;
  for (const trigger of triggers) {
    const triggerName = Object.keys(trigger)[0];
    const params = trigger[triggerName];
    switch (triggerName) {
      case 'change_health':
        const [characterName, healthChange] = params;
        if (characterName === 'player') {
          player.health += healthChange;
          if (player.health < 0) {
            player.health = 0;
          }
          const updateHealthScoreEvent = new CustomEvent('updateHealthScore', { detail: { newHealthScore: player.health } });
          document.dispatchEvent(updateHealthScoreEvent);
        }
        else {
          let character = characters[characterName]
          if (character){
            character.health += healthChange;
            if (character.health < 0) {
              character.health = 0;
            }
          }
          else {
            console.error(characterName+' not a real character')
          }
          dispatchCharacterChangeEvent()
        }
        break;
      case 'rename_character':
        const [oldName, newName] = params;
        const character = characters[oldName];
        if (character) {
          character.rename(newName);
        }
        dispatchCharacterChangeEvent()
        break;
      case 'set_location':
        const locationName = params;
        let location = locations[locationName];
        if (!location) {
          location = new Location(locationName, "A place known as "+ locationName)
          console.log('Uhh... I guess the game engine decided to create a new location: ' + location.name)
        }
        player.location = location.name;
        const updatePlayerLocationEvent = new CustomEvent('updatePlayerLocation', { detail: { location: player.location } });
        document.dispatchEvent(updatePlayerLocationEvent);
        dispatchCharacterChangeEvent()
        break;
      case 'locate_characters':
        const characterNames = params;
        for (const characterName of characterNames) {
          const character = characters[characterName];
          if (character){
            character.move(player.location);
          }
          else {
            console.error(characterName+' not a real character')
          }
        }
        dispatchCharacterChangeEvent()
        break;
      default:
        console.warn(`Unknown trigger name: ${triggerName}`);
    }
  }
}
  
function validateTriggers(message) {
  // Check if the message has a change_health trigger but no action
  if (message.triggers) {
    for (const trigger of message.triggers) {
      if (Object.keys(trigger)[0] === 'change_health' && !message.action) {
        const [characterName, healthChange] = trigger.change_health;
        const actionText = healthChange < 0 ? 'took damage' : 'was strengthened';
        message.action = characterName === 'player' ? `${player.name} ${actionText}` : `${characterName} ${actionText}`;
        break;
      }
    }
  }
  return message;
}


async function processMessage(message) {
  message = validateTriggers(message);

  if (message.type === 'character') {
    let character = characters[message.character];
    if (!character) {
      let relevantMessages = messages.slice(-2).concat([message])
      console.log("Checking if character needs to be renamed...")
      const [needsRename, oldName] = await checkIfCharacterNeedsRename(relevantMessages);
      character = characters[oldName];
      if (needsRename && character) {
        const newName = message.character;
        const trigger = { rename_character: [oldName, newName] };
        if (!message.hasOwnProperty('triggers')) {
          message.triggers = [];
        }
        message.triggers.push(trigger);
      }
      else if (needsRename) {
        console.error(`Character ${oldName} is not an existing character`);
      }
      else {
      console.log('Uhh... I guess the game engine decided to create a new character: ' + message.character);
      character = new Character(message.character, 'A mysterious character named ' + message.character, player.location);
      character.icon = await getNPCIcon(character.name);
      addCharacterElement(character);
      }
    }
    if (character) {
      message.userIcon = character.icon;
      message.userName = character.name;
    } else {
      console.error(`Character ${message.character} not found or created`);
    }
  } else if (message.type === 'player') {
    message.userIcon = player.icon;
    message.userName = player.name;
  }
    parseTriggers(message.triggers);
  
  messages.push(message);
  console.log(message);
  
  if (message.type !== 'system' && message.message) {
    dispatchMessageEvent('POST', message);
  }
  if (message.action) {
    dispatchMessageEvent('POST', { type: 'action', message: message.action, triggers: message.triggers });
  }

} 

  function handleSelection(action, data) {
    if (action === 'fight') {
      const attack = data;
      const actionDesc = `${player.name} ${attack.verb} ${getLatestCharacter()}`;
      const playerMessage = {
        type: 'player',
        action: actionDesc,
        triggers: [{ change_health: [getLatestCharacter(), attack.health_effect] }],
        userIcon: 'icons/person.svg',
        userName: player.name,
      };
      processMessage(playerMessage);
    } else if (action === 'target') {
      const character = data;
      console.log('Selected character:', character.name);
    }
  }
  
  document.addEventListener('uiEvent', (event) => {
    if (event.detail.type === 'chat') {
      const { message } = event.detail;
      const playerMessage = {
        type: 'player',
        message: message,
      };
      processMessage(playerMessage);
    } else if (event.detail.type === 'selection') {
      const { action, data } = event.detail;
      handleSelection(action, data);
    } else if (event.detail.type === 'continue') {
      shouldContinue = true;
    }
  });

  function waitForUIEvent() {
    return new Promise((resolve) => {
      document.addEventListener('uiEvent', (event) => {
        resolve();
      }, { once: true });
    });
  }  

  function updatePlayerName(name){
    player.name = name;
    const updatePlayerNameEvent = new CustomEvent('updatePlayerName', { detail: { name } });
    document.dispatchEvent(updatePlayerNameEvent);
  }

  async function runGameIntro() {

    const systemMessage = { type: 'system', message: PROMPT }


    for (const plannedMessage of plannedMessages) {
      await processMessage(plannedMessage);
      await delay(1000);
    }
    setButtonStates(true);
    while (!isLatestMessagePlayer()) {
      await delay(1000);
    }

    const playerMessage = messages[messages.length - 1];
    playerName = (await getPlayerName(playerMessage));
    if (playerName){
      updatePlayerName(playerName);
    }

    for (const plannedMessage of plannedMessages2) {
      await processMessage(plannedMessage);
      await delay(1000);
    }
    const tokenLimit = 3900;
    let message;
    let tokenCount = 0;
    let isTokenLimited = false;
    let messageBatch;

    while (gameRunning) {

      if (isTokenLimited) {
        const messagesToSummarizeCount = Math.floor(messages.length * 0.5) - 1;
        const messagesToSummarize = messages.slice(0, -messagesToSummarizeCount);
        summary = await getSummary(summary, messagesToSummarize);
        summarizedMessages.push(...messagesToSummarize);
        messages = messages.slice(-messagesToSummarizeCount);
        const summaryMessage = { type: 'system', message: summary };
        messageBatch = [systemMessage, summaryMessage, ...messages];
        isTokenLimited = false;
      } else if (summary) {
        const summaryMessage = { type: 'system', message: summary };
        messageBatch = [systemMessage, summaryMessage, ...messages];
      } else {
        messageBatch = [systemMessage, ...messages];
      }

      [message, tokenCount] = await executeOnLLM(messageBatch);
      console.log(tokenCount);
      if (tokenCount > tokenLimit) {
        isTokenLimited = true;
        continue;
      }
      if (message) {
        await processMessage(message);
      } else {
        removeLatestMessage();
      }
      setButtonStates(true);

      if (player.health < 1){
        processMessage({ type: 'game', message: `${player.name} died`  })
        gameOverMessage = await getDeathRecap(summary, messages);
        const gameOver = new CustomEvent('gameOver');
        console.log('GAME OVER')
        document.dispatchEvent(gameOver);
        gameRunning = false;
      }

      let characterNames = locations[player.location].characters
      for (let characterName of characterNames) {
        let character = characters[characterName];
        if (character.health < 1){
          character.move("Graveyard")
          await processMessage({ type: 'game', message: `${character.name} died` })
        }
      }
      dispatchCharacterChangeEvent()

      await waitForUIEvent();
        disableAll();
      
      while (!isLatestMessagePlayer(messages) && !shouldContinue) {
        console.log('shouldContinue: '+shouldContinue)
          await delay(200);
        }
      shouldContinue = false;

    }
  }
  runGameIntro();
  
