let OPENAI_API_KEY = ""
//turn off PROMPT_FOR_OPENAI_API_KEY in auth.js if prefer to set OpenAI API Token directly
const OPENAI_MODEL = "gpt-3.5-turbo-1106"

function fixMissingBrace(str) {
  if (!str.includes('{')) {
    str = '{' + str;
  }

  if (!str.includes('}')) {
    str += '}';
  }

  return str;
}

function firstValidJSON(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    try {
      const json_obj = JSON.parse(line);
      return json_obj;
    } catch (err) {
      if (!(err instanceof SyntaxError)) {
        throw err;
      }
    }
  }
  return null;
}

function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

async function repairJSON(content) {
  let repairedContent = fixMissingBrace(content);

  if (isValidJSON(repairedContent)) {
    return JSON.parse(repairedContent);
  }

  return firstValidJSON(repairedContent);
}

async function executeOnLLM(messages) {
  const llmMessages = messages.map(convertToLLMMessage);
  return await _executeOnLLM(llmMessages);
}

async function _executeOnLLM(llmMessages, retries = 3) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: llmMessages,
      temperature: 0.7,
    }),
  });

  if (response.status !== 200) {
    console.error('API request error:', (await response.json()).error);
    return [null, null];
  }

  const result = await response.json();
  const content = result.choices[0].message.content.trim();
  const total_tokens = result.usage.total_tokens;
  const repairedContent = await repairJSON(content);

  if (repairedContent !== null) {
    return [repairedContent, total_tokens];
  }

  console.error('Invalid JSON:', content);

  if (retries - 1 > 0) {
    return _executeOnLLM(llmMessages, retries - 1);
  }

  console.error('Max retries reached');
  return [null, null];
}


async function getPlayerName(playerMessage) {
  try {
    const messages = [
      { role: 'system', content: `Return a player's name in JSON format: { "player_name": "Example Name" }. Always return JSON. If the player does not give you a name respond with { "player_name": "Mysterious Traveler" }.` },
      { role: 'user', content: 'My name is John Everyman' },
      { role: 'assistant', content: '{ "player_name": "John Everyman" }' },
      { role: 'user', content: 'Kai' },
      { role: 'assistant', content: '{ "player_name": "Kai" }' },
      { role: 'user', content: 'None of your fucking business' },
      { role: 'assistant', content: '{ "player_name": "Mysterious Traveler" }' },
      { role: 'user', content: 'Call me Zhao Huang' },
      { role: 'assistant', content: '{ "player_name": "Zhao Huang" }' },
      { role: 'user', content: playerMessage.message },
    ];
    
    const [data, total_tokens] = await _executeOnLLM(messages);
    
    if (data.hasOwnProperty("player_name")) {
      return data["player_name"];
    }
    
  } catch (error) {
    console.error('Error in getPlayerName:', error);
  }
  
  return "Mysterious Traveler";
}


async function getNPCIcon(description) {

  let iconList = selectRandomObjects(characterIcons)
  iconList = iconsTruncated(iconList)
 

  const messages = [
    { role: 'system', content: `The following is a list objects. Each object has a character description parameter. 

    Find me a description that is most similar to the description ${description}. When you find this description, return the objects ID. 
    
    Only respond in the following format: { "iconID": "id" }. Always return JSON. Do not respond with anything else! 
    
    characterIcons:
    
    ${iconList}

    `  
  },
  ];

  const [data, total_tokens] = await _executeOnLLM(messages)
  
  if (data){
    for (let i = 0; i < characterIcons.length; i++) {
      if (String(characterIcons[i].id) === String(data["iconID"])) {
        var iconFile = characterIcons[i].file_name;
        return "media/characters/"+ iconFile
      }
  }
}

}
  
async function getSummary(summary, messages) {
  const messagesToSummarize = JSON.stringify(messages.map(convertToLLMMessage));

  const context = summary ? `Given this context:\n${summary}` : '';

  const llmMessages = [
    {
      role: 'system',
      content: `Very concisely summarize this:\n${messagesToSummarize}\n${context}\nOnly respond in the following format: { "summary": "" }. Always return JSON. Do not respond with anything else! 
      `,
    },
  ];

  const [data, total_tokens] = await _executeOnLLM(llmMessages);
  const newSummary = data['summary'];

  if (newSummary){
    return newSummary
  }
  else {
    console.error('Summary failed.')
  }
}

async function getDeathRecap(summary, messages) {
  const messagesToSummarize = JSON.stringify(messages.map(convertToLLMMessage));

  const context = summary ? `Given this context:\n${summary}` : '';

  const llmMessages = [
    {
      role: 'system',
      content: `In the style of Terry Pratchett, give a funny recap of how the player died:\n${messagesToSummarize}\n${context}\nOnly respond in the following format: { "recap": "" }. Always return JSON. Do not respond with anything else! 
      `,
    },
  ];

  const [data, total_tokens] = await _executeOnLLM(llmMessages);
  const recap = data['recap'];

  if (recap){
    return recap
  }
  else {
    console.error('End game recap failed.')
  }
}
  
function iconsTruncated(list) {
  let result = "";
  for (const item of list) {
    result += `${item.id}:${item.description}\n`;
  }
  return result.trim();
}

function selectRandomObjects(list) {
  if (list.length <= 100) {
    return list; // return the whole list if it has 100 or fewer items
  } else {
    const selectedObjects = [];
    while (selectedObjects.length < 100) {
      const randomIndex = Math.floor(Math.random() * list.length); // generate a random index
      const randomObject = list[randomIndex]; // select the object at that index
      if (!selectedObjects.includes(randomObject)) {
        selectedObjects.push(randomObject); // add the object to the selected objects list if it isn't already in there
      }
    }
    return selectedObjects;
  }
}


function convertToLLMMessage(message) {
  let llmMessage = {};

  if (message.type === 'player') {
    llmMessage = {
      role: 'user',
      content: JSON.stringify({
        type: message.type,
        message: message.message,
        action: message.action,
        triggers: message.triggers,
      })
    };
  } else if (message.type === 'game') {
    llmMessage = {
      role: 'assistant',
      content: JSON.stringify({
        type: message.type,
        message: message.message,
        triggers: message.triggers
      })
    };
  } else if (message.type === 'character') {
    llmMessage = {
      role: 'assistant',
      content: JSON.stringify({
        type: message.type,
        character: message.character,
        message: message.message,
        action: message.action,
        triggers: message.triggers,
      })
    };
  } else if (message.type === 'system') {
    llmMessage = {
      role: 'system',
      content: message.message,
    };
  }

  return llmMessage;
}

async function checkIfCharacterNeedsRename(messages) {
  const relevantMessages = JSON.stringify(messages.map(convertToLLMMessage));

  //console.log(relevantMessages)

  const content = `
  Given messages return needsRename=true if a character has had a name change and needsRename=false if not. If needsRename=true also return oldName.
  Only return data in the JSON format {"needsRename":true, "oldName":""}

  Examples:

  [{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Rick Sanchez\",\"message\":\"(Burp) Don't worry about it, kid. You wouldn't understand.\"}"},{"role":"user","content":"{\"type\":\"player\",\"message\":\"I hear a prisoner in the cell next door\"}"},{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Prisoner\",\"message\":\"Hey, you two! You look like a couple of tough guys. Think you could do me a favor? I'll make it worth your while.\"}"}]
  {"oldName":"", "newName":"Prisoner", "needsRename":false}

  [{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Prisoner\",\"message\":\"Name's Jack. What do you say, tough guys? You gonna help me out?\"}"},{"role":"user","content":"{\"type\":\"player\",\"message\":\"Sure what can we do?\"}"},{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Jack\",\"message\":\"I need you to grab the key from the guard and unlock my cell. I've got a way out of this place, but I need your help to get started.\"}"}]
  {"oldName":"Prisoner", "newName":"Jack", "needsRename":true}

  [{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Occidarian Guard\",\"message\":\"My name is Captain Eddard. Why are you bothering me, John?\"}"},{"role":"user","content":"{\"type\":\"player\",\"message\":\"I'm volunteering for cleanup duty\"}"},{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Captain Eddard\",\"message\":\"Cleanup duty? We don't have any prisoners assigned to cleanup duty. What are you really up to, John?\"}"}]
  {"oldName":"Occidarian Guard", "newName":"Captain Eddard", "needsRename":true}

  [{"role":"assistant","content":"{\"type\":\"game\",\"message\":\"You successfully make it to the kitchen without being detected\",\"triggers\":[{\"set_location\":\"Occidarian Capital City Kitchen\"},{"role":"user","content":"{\"type\":\"player\",\"message\":\"Oh no the cook\"}"},{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Cook\",\"message\":\"What are you doing here? This is the kitchen. Outsiders aren't allowed in here. Guards!\"}"}]
  {"oldName":"", "newName":"Cook", "needsRename":false}

  [{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Occidarian Guard\",\"message\":\"Silence, prisoner! You will be held here until further notice.\"}"},{"role":"user","content":"{\"type\":\"player\",\"message\":\"Warden!\"}"},{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Warden\",\"message\":\"What do you want?\"}"}]
  {"oldName":"", "newName":"Warden", "needsRename":false}

  [{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Eldric\",\"message\":\"Well, Cheese Wizard, that was quite the adventure! Thank you for rescuing me back there. I owe you one.\"}"},{"role":"user","content":"{\"type\":\"player\",\"message\":\"Lets go check out the inn\"}"},{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Innkeeper\",\"message\":\"Greetings, travelers! Welcome to The Drunken Dragon Inn! What can I do for you today?\"}"}]
  {"oldName":"", "newName":"Innkeeper", "needsRename":false}

  [{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Innkeeper\",\"message\":\"My name is Gwendolyn, pleased to make your acquaintance.\"}"},{"role":"user","content":"{\"type\":\"player\",\"message\":\"Do you serve Cheese here?\"}"},{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Gwendolyn\",\"message\":\"Of course, we have a variety of cheeses available. Would you like a platter of cheese to go along with your drinks?\"}"}]
  {"oldName":"Innkeeper", "newName":"Gwendolyn", "needsRename":true}

  [{"role":"assistant","content":"{\"type\":\"game\",\"message\":\"You and Eldric flee the jail and find yourselves in the Occidarian Capital City's bustling marketplace.\",\"triggers\":[{\"set_location\":\"Occidarian Capital City Marketplace\"},{\"locate_characters\":[\"Eldric the bard\"]},{"role":"user","content":"{\"type\":\"player\",\"message\":\"Are there any herb merchants here?\"}"},{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Herb Merchant\",\"message\":\"Greetings, traveler. I am a humble herb merchant. What can I help you with today?\"}"}]
  {"oldName":"", "newName":"Herb Merchant", "needsRename":false}

  [{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Herb Merchant\",\"message\":\"My name is Cedric, Hulk. Strong herbs, you say? I have just the thing. These herbs will grant you immense strength, but be warned, they can also have serious side effects. Are you sure you want to take that risk?\"}"},{"role":"user","content":"{\"type\":\"player\",\"message\":\"Yes, I'm very experienced\"}"},{"role":"assistant","content":"{\"type\":\"character\",\"character\":\"Cedric the Herb Merchant\",\"message\":\"Very well, Hulk. Here you go, but be sure to use them wisely.\"}"}]
  {"oldName":"Herb Merchant", "newName":"Cedric the Herb Merchant", "needsRename":true}


  Messages:
  ${relevantMessages}
  `;

  const llmMessages = [
    { role: 'system', content: content
  },
  ];

  const [data, total_tokens] = await _executeOnLLM(llmMessages);
  return [data["needsRename"], data["oldName"]];
}
