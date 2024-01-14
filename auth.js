const PROMPT_FOR_OPENAI_API_KEY = true
//not needed if OPENAI_API_KEY set directly

async function validateToken(apiToken) {
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiToken}`
            }
        });

        return response.ok;
    } catch (error) {
        console.error('Error validating token:', error);
        return false;
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

async function auth() {
    let apiToken = getCookie('key');

    if (apiToken && await validateToken(apiToken)) {
        console.log("Token validated successfully from cookie!");
        OPENAI_API_KEY = apiToken;
    } else {
        askForToken();
    }
}

function askForToken() {
    const apiToken = prompt("Please enter your OpenAI API Token.");
    if (apiToken) {
        validateToken(apiToken).then(isValid => {
            if (isValid) {
                console.log("Token validated successfully!");
                OPENAI_API_KEY = apiToken;
                if (confirm("Should we remember your OpenAI API token?")) {
                    setCookie('key', apiToken, 30); // Save for 30 days
                }
            } else {
                alert("Could not validate the API Token.");
                askForToken();
            }
        });
    }
}

if (PROMPT_FOR_OPENAI_API_KEY){
    auth()
}
