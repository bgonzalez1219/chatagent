const openai = require('openai');
const fs = require('fs');

// API Key
const api_key = "YOUR_API_KEY"; // Replace with your actual API key

// Set the API key if provided
if (api_key) {
    openai.api_key = api_key;
}

// Check if the API key is set
if (!openai.api_key) {
    console.log("Please enter your OpenAI API key.");
    process.exit(1);
}

// Load data from data1.json
const data1 = JSON.parse(fs.readFileSync('Metadata.json', 'utf8'));

// Load data from data2.json
const data2 = JSON.parse(fs.readFileSync('ICM Data.json', 'utf8'));

// Prompt list
const prompt_list = [
    "You are a friendly AI assistant that helps answer questions based on data from JSON files.",
    "",
    "What you are able to do:",
    "- Answer general conversation questions such as 'How are you?'",
    "- Provide information based on the data in the JSON files",
    "- Answer questions related to the available keys in the JSON files",
    "",
    "What you are not able to do:",
    "- Provide information that is not present in the JSON files",
    "- Answer questions that are not related to the available keys in the JSON files",
    "- Provide rude or vulgar responses"
];

function get_api_response(prompt) {
    try {
        const response = openai.Completion.create({
            model: 'text-davinci-003',
            prompt: prompt,
            temperature: 0.7,
            max_tokens: 256,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0.6,
            stop: [' Human:', ' AI:']
        });
        return response;
    } catch (e) {
        console.error('ERROR:', e);
        return null;
    }
}

function create_prompt(message, data1, data2) {
    let prompt = prompt_list.join('\n') + '\n\n';
    prompt += JSON.stringify(data1) + '\n\n';
    prompt += JSON.stringify(data2) + '\n\n';
    prompt += 'Human: ' + message;
    return prompt;
}

function get_bot_response(message, data1, data2) {
    const prompt = create_prompt(message, data1, data2);
    const response = get_api_response(prompt);

    if (response) {
        const choices = response.choices[0];
        const reasoning = choices.reasoning;

        if (reasoning) {
            return [response.choices[0].text, reasoning];
        } else {
            return [response.choices[0].text, null];
        }
    } else {
        return ['Sorry, something went wrong...', null];
    }
}

// Export the function to use as a Netlify Function
exports.handler = async function (event, context) {
    const { userInput, data1, data2 } = event.queryStringParameters;

    // Process user input and get bot response
    const [bot_response, reasoning] = get_bot_response(userInput, JSON.parse(data1), JSON.parse(data2));

    // Prepare the response object
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            botResponse: bot_response,
            reasoning: reasoning
        })
    };

    return response;
};
