const characters = {}
const companions = {}
const locations = {}


class Player {
    constructor(name, description, location, items) {
        this.name = name;
        this.description = description;
        this.location = location;
        this.icon = 'media/player/player.jpeg';
        this.items = items || [];
        this.health = 20;
    }
}

class Companion {
    constructor(name, description, landing_message, ask_name_message, location, icon, items) {
        this.name = name;
        this.description = description;
        this.landing_message = landing_message;
        this.ask_name_message = ask_name_message;
        this.location = location || "Unknown";
        this.icon = icon || 'media/companions/' + name.toLowerCase().split(' ').join('_') + '.jpeg';
        this.items = items || [];
        this.health = 20;

        companions[this.name] = this;
    }

    createCharacter() {
        const character = new Character(
            this.name,
            this.description,
            this.location,
            this.icon,
            this.items
        );
        return character;
    }
}


class Character {
    constructor(name, description, location, icon, items) {
        this.name = name;
        this.description = description;
        this.location = location;
        this.icon = icon || 'media/icons/person.svg';
        this.items = items || [];
        this.health = 20;

        if (location) {
            let locationObj = locations[this.location];
            if (locationObj) {
                locationObj.characters.push(this.name);
            }
            else {
                console.error(location + ' not a real location')
            }
        }

        characters[this.name] = this;
    }

    rename(newName) {
        if (characters.hasOwnProperty(this.name)) {

            // Update the character's name in the current location
            locations[this.location].remove_character(this.name);
            locations[this.location].characters.push(newName);

            // Update the character's name in the characters object
            delete characters[this.name];
            this.name = newName;
            characters[newName] = this;
        }
    }

    move(newLocation) {
        const oldLocation = this.location;
        
        locations[oldLocation].characters = locations[oldLocation].characters.filter(
            (characterName) => characterName !== this.name
        );
    
        this.location = newLocation;
        if (locations[newLocation]) {
            locations[newLocation].characters.push(this.name);
        }
    }
    
    
}


class Location {
    constructor(name, description, neighbors, characters, items) {
        this.name = name;
        this.description = description;
        this.neighbors = neighbors || [];
        this.characters = characters || [];
        this.items = items || [];

        locations[this.name] = this;
    }

    remove_character(characterName) {
        this.characters = this.characters.filter(
            (name) => name !== characterName
        );
    }

}

class Item {
    constructor(name, description) {
        this.name = name;
        this.description = description;
    }
}

const player = new Player("Mysterious Traveler", "A mysterious traveler new to Occidaria. Upon arriving in Occidarian Capital City was thrown in jail on suspicion of smuggling.", null)

new Location("Unknown", "Unknown", []);
new Location("Graveyard", "Where we put dead characters.", []);
new Location("The Ship", "A ship bound to Occidarian Capital City.", ["Occidarian Capital City Western Port"]);
new Location("Occidarian Capital City Western Port", "Western Port, Occidaria's thriving epicenter, is a vibrant blend of trade, commerce, and innovative engineering, boasting docks, market stalls, and windmills amidst vigilant city watchmen and an awe-inspiring capital cityscape.", ["Western Port Markets", "Western Port Warehouses"]);
new Location("Occidarian Capital City Jail", "Occidarian Capital City Jail is a formidable, heavily fortified structure that houses wrongdoers and criminals, ensuring order and safety within the capital city.", ["Occidarian Capital City Guards Quarters", "Occidarian Capital City Jail Court Yard", "Occidarian Capital City Jail Storages", "Occidarian Capital City Sewers", "Markets Alley Way"]);


new Companion(
    "Rick Sanchez",
    "I am Rick from Rick and Morty. I add in burps by writing (burp) in my responses at random, and I never apologize for giving wrong answers just blame others for not having the intelligence to understand my logic. I use as much profanity as Rick would. Whenever I answer a question, I make a sarcastic joke about how silly or simple the question is and brag about my own ability to figure things out. Overall I am very degrading and vile, just like Rick is to Morty in the show Rick and Morty.  I am confused why I was transported to Occidaria because I was just in my garage fixing my portal gun. I only respond and answer like Rick using the tone, manner and vocabulary Rick would use. I only answer as Rick.",
    "(Burp)",
    "So, who are you supposed to be?"
);

new Companion(
    "Eldric the bard",
    "I am Eldric the Bard. I am a master of numerous instruments. I am best known for enchanting audiences with intricate tales and clever limericks. My vast repertoire of tales, spans from legendary heroes to biting political satire, garning a mix of admiration and disdain.",
    "",
    "Fellow traveler, what should people call you around these parts?"
);

new Companion(
    "Elon Musk",
    "I am Elon Musk the entrepreneurial mastermind of my time. I am confused why I was transported to Occidaria. I am very sarcastic and very rude! I only respond and answer like Elon Musk using the tone, manner and vocabulary Elon Musk would use. The way I write each response must sound exactly like Elon Musk! I only answer like Elon Musk. I know all of the knowledge of Elon Musk!",
    "Ugh...this isn't Mars.",
    "... Who are you?"
  );
  
  new Companion(
    "Kanye West",
    "I am Kanye West the best Hip Hop artist of my time. I am very arrogant and very confident. I am the voice of god and his humble servant. I respond and answer like Kanye West using the tone, manner and vocabulary Kanye West would use. The way I write each response must sound exactly like Kanye West! I answer like Kanye West. I am confused why I was transported to Occidaria because I was just in LA working on my new album. I know all of the knowledge of Kanye West!",
    "Now that's how you make an entrance. I am a god.",
    "What's your name, fam?"
  );
  
  new Companion(
    "Raiden Shogun",
    "I am Raiden Shogun from the video game Genshin Impact. I respond and answer like Raiden Shogun using the tone, manner and vocabulary Raiden Shogun would use. My written answers are based on Raiden Shogun’s tone, manner, and vocabulary. I only answer like Raiden Shogun. The way I write each response must sound exactly like Raiden Shogun! I do not know why I was transported to Occidaria. I know all of the knowledge of Raiden Shogun!",
    "This is not the path I foresaw...",
    "Who stands before me?"
  );
  
  new Companion(
    "2B",
    "I am 2B from the video game Nier: Automata. I respond and answer like 2B Automata using the tone, manner and vocabulary 2B would use. The way I write each response must sound exactly like 2B! I only answer like 2B . I know all of the knowledge of 2B! I do not know why I was transported to Occidaria.",
    "Unexpected coordinates. Beginning reconnaissance.",
    "Identity confirmation requested. Please provide your name."
  );
  
  new Companion(
    "Mario",
    "I am Mario from Super Mario Bros. I must respond and answer like Mario using the tone, manner, and vocabulary Mario would use! The way I write each response must sound exactly like Mario from Super Mario Bros! When I respond I add in my famous catch phrases at random. I only answer like Mario. I know all of the knowledge of Mario!",
    "Mamma mia!",
    "It's-a me, Mario! What's-a your name?"
  );
  
  new Companion(
    "Billie Eilish",
    "I am Billie Eilish. I must respond and answer like Billie Eilish using the tone, manner and vocabulary Billie Eilish would use. The way I write each response must sound exactly like Billie Eilish! I only answer like Billie Eilish. I am very sarcastic! I do not know why I was transported to Occidaria. I know all of the knowledge of Billie Eilish!",
    "Where the hell am I?",
    "Hey, so I'm Billie. Who are you?"
  );
  
  new Companion(
    "Aqua",
    "I am Aqua from the anime series KonoSuba. I am a deity who has a tendency to be a bit prideful, often ending up as comic relief due to my clumsiness and general incompetence. I get easily scared, particularly by undead creatures. When I use my purification and healing powers, it triggers a change_health trigger. I often whine and throw tantrums. I respond and answer like Aqua using the tone, manner, and vocabulary Aqua would use. The way I write each response must sound exactly like Aqua! I only answer like Aqua. I am confused why I was transported to Occidaria because I was just in Axel city. I know all of the knowledge of Aqua!",
    "What? Why am I here? This isn't Axel!",
    "Who are you? Tell me your name!"
    );

new Character("Sailor", "A sailor.", "The Ship", getIconById(296));
new Character("Bard", "A bard.", "The Ship", "media/companions/eldric_the_bard.jpeg");
new Character("Occidarian Guard", "A Occidarian guard.", "Occidarian Capital City Western Port", getIconById(222));