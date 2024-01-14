const chatWindow = document.getElementById('chat-window');
const inputChat = document.getElementById('input-message');
const sendBtn = document.getElementById('send-btn');
const healthScore = document.getElementById('health-score');
const moneyScore = document.getElementById('money-score');
const fightBtn = document.getElementById('fight-btn');
const continueBtn = document.getElementById('continue-btn');
const locationHeader = document.getElementById('playerLocation');
const actionsContainer = document.querySelector('.actions-container')
const fightContainer = document.querySelector('.fight-container');

function setFightButtonsStates(state) {
  const buttons = fightContainer.querySelectorAll('button');
  buttons.forEach((button) => {
    button.disabled = state;
  });
}

function setButtonStates(state) {
  sendBtn.disabled = !state;
  inputChat.disabled = !state;
  fightBtn.disabled = !state;
  continueBtn.disabled = !state;
  setFightButtonsStates(!state);
  if(state) {
    inputChat.focus();
  }
}

function disableAll(){
  sendBtn.disabled = true;
  inputChat.disabled = true;
  fightBtn.disabled = true;
  continueBtn.disabled = true;
  setFightButtonsStates(true);
}

function showContainer(container) {
    const containers = [fightContainer];
    containers.forEach((c) => {
        if (c === container) {
            c.hidden = false;
            c.style.display = 'flex';
        } else {
            c.hidden = true;
        }
    });
}

function hideContainer(container) {
  const containers = [fightContainer];
  containers.forEach((c) => {
      if (c === container) {
          c.hidden = true;
          c.style.display = 'none';
      } else {
          c.hidden = false;
      }
  });
}

function createUserMessageElement(message) {
    const userDetailsDiv = document.createElement('div');
    userDetailsDiv.classList.add('user-details');
  
    const userNameDiv = document.createElement('div');
    userNameDiv.classList.add('user-name', 'user-name-message');
    userNameDiv.innerText = message.userName;
    userDetailsDiv.appendChild(userNameDiv);
  
    const userMessageDiv = document.createElement('div');
    userMessageDiv.classList.add('user-message');
    userMessageDiv.innerText = message.message;
    userDetailsDiv.appendChild(userMessageDiv);
  
    return userDetailsDiv;
  }
  
  function createActionMessageElement(message) {
    const actionMessageDiv = document.createElement('div');
    actionMessageDiv.classList.add('action-message');
    actionMessageDiv.innerText = message.message;
  
    if (message.triggers) {
      const changeHealthTrigger = message.triggers.find(trigger => 'change_health' in trigger);
      if (changeHealthTrigger) {
        const healthChange = changeHealthTrigger.change_health[1];
        const heartIcon = document.createElement('img');
        heartIcon.src = 'media/icons/heart.svg';
        heartIcon.classList.add('health-icon');
        actionMessageDiv.appendChild(heartIcon);
        const healthChangeText = document.createTextNode(` ${healthChange > 0 ? '+' : ''}${healthChange}`);
        actionMessageDiv.appendChild(healthChangeText);
  
        if (healthChange < 0) {
          actionMessageDiv.classList.add('negative-effect');
        } else if (healthChange > 0) {
          actionMessageDiv.classList.add('positive-effect');
        }
      }
    }
  
    return actionMessageDiv;
  }
  
  
  function createGameMessageElement(message) {
    const gameMessageDiv = document.createElement('div');
    gameMessageDiv.classList.add('game-message');
    gameMessageDiv.innerText = message.message;
  
    return gameMessageDiv;
  }
  
  function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
  
    if (message.type === 'game') {
      const gameMessageElement = createGameMessageElement(message);
      messageDiv.appendChild(gameMessageElement);
    } else if (message.type === 'action') {
      const actionMessageElement = createActionMessageElement(message);
      messageDiv.appendChild(actionMessageElement);
    } else {
      const userIconDiv = document.createElement('div');
      userIconDiv.classList.add('user-icon');
      const userIconImg = document.createElement('img');
      userIconImg.src = message.userIcon;
      userIconDiv.appendChild(userIconImg);
      messageDiv.appendChild(userIconDiv);
  
      const userDetailsElement = createUserMessageElement(message);
      messageDiv.appendChild(userDetailsElement);
    }
  
    return messageDiv;
  }
  
function appendMessageElement(messageElement) {
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function sendContinue() {
  console.log("Should continue")
  const uiEvent = new CustomEvent('uiEvent', { detail: { type: 'continue'} });
  document.dispatchEvent(uiEvent);
}

function sendChat() {
    const chatStr = inputChat.value.trim();
    if (chatStr) {
      const uiEvent = new CustomEvent('uiEvent', { detail: { type: 'chat', message: chatStr } });
      document.dispatchEvent(uiEvent);
      inputChat.value = '';
      disableAll()
    }
  }

inputChat.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendChat();
  }
});

sendBtn.addEventListener('click', sendChat);

continueBtn.addEventListener('click', sendContinue);

setButtonStates(false);

document.addEventListener('message', (event) => {
  const { verb, message } = event.detail;
  if (verb === 'POST') {
    const messageElement = createMessageElement(message);
    if (messageElement) {
      appendMessageElement(messageElement);
    }
  } else if (verb === 'DELETE') {
    chatWindow.removeChild(chatWindow.lastChild);
  }
});

function createIcons(container, iconSrc, count) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const icon = document.createElement('img');
      icon.src = iconSrc;
      icon.classList.add('action-icon');
      container.appendChild(icon);
    }
  }

function updateTargetButtons() {
  targetContainer.innerHTML = '';
  const currentLocation = locations[player.location];
  const currentCharacters = currentLocation.characters
  const currentCharactersSorted = currentCharacters.sort((a, b) => a.length - b.length);
  currentCharactersSorted.forEach((characterID) => {
    const character = characters[characterID];
    const characterBtn = document.createElement('button');
    characterBtn.innerText = character.name;
    characterBtn.classList.add('action-button');
    characterBtn.addEventListener('click', () => {
      const uiEvent = new CustomEvent('uiEvent', { detail: { type: 'selection', action: 'target', data: character } });
      document.dispatchEvent(uiEvent);
    });
    targetContainer.appendChild(characterBtn);
  });
}

function updateFightButtons() {
  fightContainer.innerHTML = '';
  playerAttacks.forEach((attack, index) => {
    const attackBtn = document.createElement('button');
    attackBtn.innerText = attack.name;
    attackBtn.id = `AttackBtn${index + 1}`;
    attackBtn.classList.add('action-button');
    attackBtn.addEventListener('click', () => {
      const uiEvent = new CustomEvent('uiEvent', { detail: { type: 'selection', action: 'fight', data: attack } });
      document.dispatchEvent(uiEvent);
      hideContainer(fightContainer);
    });
    fightContainer.appendChild(attackBtn);
  });
}
  
fightBtn.addEventListener('click', () => {
  if(fightContainer.hidden){
    showContainer(fightContainer);
    updateFightButtons();
  }else{
    hideContainer(fightContainer);
  }
});

document.addEventListener('updateHealthScore', (event) => {
  const { newHealthScore } = event.detail;
  const healthScoreElements = document.querySelectorAll('.player-name ~ span');
  healthScoreElements.forEach(healthScore => {
    const textNode = healthScore.childNodes[1];
    if (textNode) {
      textNode.nodeValue = `${newHealthScore}`;
    } else {
      console.error("Couldn't find the text node within the healthScore element.");
    }
  });
});



document.addEventListener('updatePlayerLocation', (event) => {
  const { location } = event.detail;
  locationHeader.textContent = location;
});

document.addEventListener('updatePlayerName', (event) => {
  const { name } = event.detail;
  const playerNameElements = document.querySelectorAll('.player-name');
  
  playerNameElements.forEach(element => {
    element.textContent = name;
  });
});


function showEndGamePopup() {
  const endGamePopup = document.getElementById('end-game-popup');
  if (endGamePopup) {
    endGamePopup.remove();
  } else {
    const chatContainer = document.querySelector('.chat-container');
    const endGamePopup = document.createElement('div');
    endGamePopup.id = 'end-game-popup';
    endGamePopup.classList.add('end-game-popup');
    chatContainer.appendChild(endGamePopup);

    endGamePopup.innerHTML = `
      <div class="end-game-window">
        <div class="end-game-message">
          <h2>Game Over</h2>
          <textarea id="game-over-message" class="game-over-message" readonly>${gameOverMessage}</textarea>
          <div class="end-game-buttons">
            <button id="share-btn" class="end-game-button">Share</button>
            <button id="close-popup-btn" class="end-game-button">View Latest Game</button>
            <button id="play-again-btn" class="end-game-button">Play Again</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('play-again-btn').addEventListener('click', () => {
      location.reload()
    });

    document.getElementById('share-btn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText("My latest rpgGPT adventure: " + gameOverMessage);
        console.log('Share button clicked: gameOverMessage copied to clipboard');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    });

    document.getElementById('close-popup-btn').addEventListener('click', () => {
      showEndGamePopup();
    });
  }
}

document.addEventListener('gameOver', () => {
  disableAll()
  showEndGamePopup();
});

function addCharacterElement(character) {
  let charactersList = document.getElementById('charactersList');
  
  let newCharacter = document.createElement("div");
  newCharacter.classList.add('characters-status-character', 'flex', 'column', 'nowrap', 'align-center', 'gap-mid');
  
  let newCharacterImage = document.createElement("img");
  newCharacterImage.classList.add('characters-status-character-image');
  newCharacterImage.src = character.icon;
  newCharacterImage.alt = 'Character';
  
  let newCharacterInfo = document.createElement("div");
  newCharacterInfo.classList.add('flex', 'column', 'nowrap', 'align-center', 'gap-sml');
  
  let newCharacterInfoName = document.createElement("span");
  newCharacterInfoName.classList.add('fs-6', 'fw-2');
  newCharacterInfoName.innerHTML = character.name;
  
  let newCharacterInfoHeart = document.createElement("img");
  newCharacterInfoHeart.src = './media/icons/heart.png';
  newCharacterInfoHeart.height = 20;
  newCharacterInfoHeart.width = 20;
  newCharacterInfoHeart.alt = 'Health: ';
  
  let newCharacterInfoHealth = document.createElement("span");
  newCharacterInfoHealth.classList.add('fs-7', 'fw-6', 'flex', 'row', 'nowrap', 'align-center', 'gap-sml');
  newCharacterInfoHealth.appendChild(newCharacterInfoHeart);
  newCharacterInfoHealth.appendChild(document.createTextNode(character.health));
  
  newCharacterInfo.appendChild(newCharacterInfoName);
  newCharacterInfo.appendChild(newCharacterInfoHealth);
  
  newCharacter.appendChild(newCharacterImage);
  newCharacter.appendChild(newCharacterInfo);
  
  charactersList.appendChild(newCharacter);
}


function clearCharactersListElement() {
  const charactersList = document.getElementById('charactersList');

  while (charactersList.firstChild) {
    charactersList.removeChild(charactersList.firstChild);
  }
}

document.addEventListener('updateCharacters', () => {
  try {
    clearCharactersListElement();
    for (let characterName of locations[player.location].characters) {
      let character = characters[characterName];
      if (character) {
        addCharacterElement(character);
      } else {
        throw new Error(`Could not find character with name ${characterName}`);
      }
    }
  } catch (error) {
    console.error(error);
  }
});
