function convertName(name) {
  // Convert from param to name
  if (!name) {
    return '';
  }
  else if (name === "eldricTheBard"){
    return "Eldric the bard"
  }
  else if (name === "2b"){
    return '2B'
  }
  else {
    const parts = name.split(/(?=[A-Z])/);
    const convertedName = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    return convertedName;
  }

}

const params = new URLSearchParams(window.location.search);
const companionName = convertName(params.get('companion'));
let companion;
if (companionName.toLowerCase() === "custom"){
  console.log("Loading custom character...")
    // Load data from character creator here
    const savedCompanion = JSON.parse(localStorage.getItem('companion'));
    const icon_src = localStorage.getItem('icon_src');
    if (savedCompanion) {
        companion = new Companion(savedCompanion.name, savedCompanion.description, savedCompanion.landing_message, savedCompanion.ask_name_message, "Unknown", icon_src);
        console.log(companion);
        companion.createCharacter();
    } else {
        console.log('Custom character not found in localStorage.');
    }
} else {
    companion = companions[companionName];
    if (!companion){
        console.log('Defaulting to Eldric the bard...');
        companion = companions["Eldric the bard"];
    }
    if (companion !== companions["Eldric the bard"]){ //he's the bard
        companion.createCharacter();
    }
}

const getPlannedMessages = (companion) => {
    return companion.name === 'Eldric the bard'
      ? [ // Eldric the bard
        { type: 'game', triggers: [{set_location: 'The Ship'}]},
        { type: 'character', character: 'Sailor', message: 'Ahoy, traveler! We\'ll be docking at the capital soon. Better get ready for a sight to behold!' },
        { type: 'character', character: 'Bard', message: 'Oh, gather \'round, and lend an ear, to a tale that tickles the heart,\nOf a boy-emperor, so young and small, who\'s trying to play his part.\nHe sits upon a gilded throne, in robes much too large to wear,\nAnd though he\'s not quite tall enough, he rules with a clumsy air.'},
        { type: 'character', character: 'Sailor', message: 'Oh will you shut your trap Eldric!', triggers: [{ rename_character: ['Bard','Eldric the bard']}] },
        { type: 'character', character: 'Eldric the bard', message: 'His head is filled with lofty thoughts, philosophy, and prose,\nHe ponders life and quotes from scrolls, in garments that his father chose.\nHe\'d rather read a dusty tome, than wield a scepter\'s might,\nBut in the art of governance, he fumbles day and night!' },
        { type: 'game', message: 'The ship pulls into Occidarian Capital City’s Western Port', triggers: [{set_location: 'Occidarian Capital City Western Port'}, {locate_characters: ['Sailor', 'Eldric the bard']} ]},
        { type: 'character', character: 'Eldric the bard', message: 'Fellow traveler, what should people call you around these parts?' }
      ]
      : [ // all other companions
        { type: 'game', triggers: [{set_location: 'The Ship'}]},
        { type: 'character', character: 'Sailor', message: 'Ahoy, traveler! We\'ll be docking at the capital soon. Better get ready for a sight to behold!' },
        { type: 'character', character: 'Bard', message: 'Oh, gather \'round, and lend an ear, to a tale that tickles the heart,\nOf a boy-emperor, so young and small, who\'s trying to play his part.\nHe sits upon a gilded throne, in robes much too large to wear,\nAnd though he\'s not quite tall enough, he rules with a clumsy air.'},
        { type: 'game', message: `${companion.name} falls out of the sky and crashes into the deck`, triggers: [{locate_characters: [companion.name]}]},
        { type: 'character', character: companion.name, message: companion.landing_message },
        { type: 'character', character: 'Bard', message: 'His head is filled with lofty thoughts, philosophy, and prose,\nHe ponders life and quotes from scrolls, in garments that his father chose.\nHe\'d rather read a dusty tome, than wield a scepter\'s might,\nBut in the art of governance, he fumbles day and night!' },
        { type: 'game', message: 'The ship pulls into Occidarian Capital City’s Western Port', triggers: [{set_location: 'Occidarian Capital City Western Port'}, {locate_characters: ['Sailor', 'Bard', companion.name]} ]},
        { type: 'character', character: companion.name, message: companion.ask_name_message }
      ]
  };
  
  const getPlannedMessages2 = (companion) => {
    return companion.name === 'Eldric the bard'
      ? [ // Eldric the bard
        { type: 'character', character: 'Occidarian Guard', message: 'Attention passengers! This ship and its contents are hereby seized under suspicion of smuggling! You are to disembark and submit to inspection immediately!' },
        { type: 'character', character: 'Eldric the bard', message: 'Oh dear! A smugglers life for me? Who would have guessed? And here I thought we were just carrying potatoes and turnips!' },
        { type: 'character', character: 'Occidarian Guard', message: 'You there! You seem to know this... bard. You are coming with us!', action:'Occidarian Guard grabbed you', triggers: [{change_health:['player',-1]}] },
        { type: 'game', message: 'You are dragged to the Occidarian Capital City Jail', triggers: [{set_location: 'Occidarian Capital City Jail'}, {locate_characters: ['Eldric the bard', 'Occidarian Guard'] }] }
      ]
      :  [ // all other companions
        { type: 'character', character: 'Occidarian Guard', message: "Attention passengers! This ship and its contents are hereby seized under suspicion of smuggling. \n We have a report of two suspicious travelers ... wait that's them!", action:'Occidarian Guard grabbed you', triggers: [{change_health:['player',-1]}]},
        { type: 'game', message: 'You are dragged to the Occidarian Capital City Jail', triggers: [{set_location: 'Occidarian Capital City Jail'}, {locate_characters: [companion.name, 'Occidarian Guard'] }] }
      ]
  };
  
  const plannedMessages = getPlannedMessages(companion);
  const plannedMessages2 = getPlannedMessages2(companion);
  